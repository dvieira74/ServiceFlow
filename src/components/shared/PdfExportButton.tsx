'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ServiceCommission } from '@/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ColumnDefinition {
  header: string;
  dataKey: string;
  align?: 'left' | 'center' | 'right';
}

interface PdfExportButtonProps {
  commissions?: ServiceCommission[];
  selectedMonthLabel?: string;
  totalPrinterCommissions?: number;
  totalTonerCommissions?: number;
  overallTotalCommissions?: number;
  overallTotalServiceValue?: number;
  data?: any[];
  columns?: ColumnDefinition[];
  dataLabel?: string;
}

export function PdfExportButton({
  commissions,
  selectedMonthLabel,
  data,
  columns,
  dataLabel,
}: PdfExportButtonProps) {
  const { toast } = useToast();

  const handleExport = () => {
    const doc = new jsPDF();
    const pageMargin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const primaryColorRGB = [100, 181, 246]; // #64B5F6
    let yPos = 20;

    // Remove acentos e espaços para o nome do arquivo
    const sanitizedLabel = selectedMonthLabel 
      ? selectedMonthLabel.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_")
      : (dataLabel || 'servico').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    const fileName = `Relatorio_de_servico_de_${sanitizedLabel}.pdf`;

    if (commissions && commissions.length > 0 && selectedMonthLabel) {
      doc.setFontSize(22);
      doc.setTextColor(primaryColorRGB[0], primaryColorRGB[1], primaryColorRGB[2]);
      doc.text(`Relatório de Comissões - ${selectedMonthLabel}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;

      const printerComms = commissions.filter(c => c.serviceType === 'printer');
      const tonerComms = commissions.filter(c => c.serviceType === 'toner');

      // Seção de Impressoras
      if (printerComms.length > 0) {
        doc.setFontSize(16);
        doc.setTextColor(primaryColorRGB[0], primaryColorRGB[1], primaryColorRGB[2]);
        doc.text('Serviços de Impressora', pageMargin, yPos);
        yPos += 8;

        autoTable(doc, {
          startY: yPos,
          head: [['Data', 'Cliente', 'Modelo', 'Valor Serv. (R$)', '%', 'Comissão (R$)']],
          body: printerComms.map(c => [
            format(parseISO(c.date), 'dd/MM/yy', { locale: ptBR }),
            c.clientName,
            c.printerModel || '-',
            c.serviceValue.toFixed(2),
            `${c.commissionPercentage}%`,
            c.commissionAmount.toFixed(2)
          ]),
          theme: 'striped',
          headStyles: { fillColor: primaryColorRGB, textColor: [255, 255, 255] },
          margin: { left: pageMargin, right: pageMargin },
        });
        yPos = (doc as any).lastAutoTable.finalY + 8;

        const subPrinter = printerComms.reduce((acc, curr) => acc + curr.commissionAmount, 0);
        doc.setFontSize(11);
        doc.setTextColor(50);
        doc.setFont('helvetica', 'bold');
        doc.text(`Total Comissão Impressora: R$ ${subPrinter.toFixed(2)}`, pageMargin, yPos);
        yPos += 15;
      }

      // Seção de Toner
      if (tonerComms.length > 0) {
        doc.setFontSize(16);
        doc.setTextColor(primaryColorRGB[0], primaryColorRGB[1], primaryColorRGB[2]);
        doc.text('Serviços de Toner', pageMargin, yPos);
        yPos += 8;

        autoTable(doc, {
          startY: yPos,
          head: [['Data', 'Cliente', 'Descrição', 'Valor Serv. (R$)', '%', 'Comissão (R$)']],
          body: tonerComms.map(c => [
            format(parseISO(c.date), 'dd/MM/yy', { locale: ptBR }),
            c.clientName,
            c.serviceDescription || '-',
            c.serviceValue.toFixed(2),
            `${c.commissionPercentage}%`,
            c.commissionAmount.toFixed(2)
          ]),
          theme: 'striped',
          headStyles: { fillColor: primaryColorRGB, textColor: [255, 255, 255] },
          margin: { left: pageMargin, right: pageMargin },
        });
        yPos = (doc as any).lastAutoTable.finalY + 8;

        const subToner = tonerComms.reduce((acc, curr) => acc + curr.commissionAmount, 0);
        doc.setFontSize(11);
        doc.setTextColor(50);
        doc.setFont('helvetica', 'bold');
        doc.text(`Total Comissão Toner: R$ ${subToner.toFixed(2)}`, pageMargin, yPos);
        yPos += 15;
      }

      // Rodapé com Totais Gerais
      doc.setDrawColor(200);
      doc.line(pageMargin, yPos - 5, pageWidth - pageMargin, yPos - 5);
      yPos += 5;

      const totalServ = commissions.reduce((acc, curr) => acc + curr.serviceValue, 0);
      const totalComm = commissions.reduce((acc, curr) => acc + curr.commissionAmount, 0);

      doc.setFontSize(13);
      doc.setTextColor(0);
      doc.setFont('helvetica', 'bold');
      doc.text(`Soma Total do Serviço: R$ ${totalServ.toFixed(2)}`, pageMargin, yPos);
      yPos += 8;
      doc.text(`Soma Total das Comissões: R$ ${totalComm.toFixed(2)}`, pageMargin, yPos);

    } else if (data && data.length > 0 && columns && dataLabel) {
      doc.setFontSize(18);
      doc.setTextColor(primaryColorRGB[0], primaryColorRGB[1], primaryColorRGB[2]);
      doc.text(`Relatório de ${dataLabel}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      autoTable(doc, {
        head: [columns.map(col => col.header)],
        body: data.map(row => columns.map(col => {
          const value = row[col.dataKey];
          if (col.dataKey === 'data' && typeof value === 'string') {
            try { return format(parseISO(value), 'dd/MM/yyyy', { locale: ptBR }); } catch { return value; }
          }
          return String(value !== null && value !== undefined ? value : '-');
        })),
        startY: yPos,
        theme: 'striped',
        headStyles: { fillColor: primaryColorRGB, textColor: [255, 255, 255] },
        margin: { left: pageMargin, right: pageMargin },
      });
    }

    doc.save(fileName);
    toast({ title: "Exportação Concluída", description: `O arquivo ${fileName} foi baixado com sucesso.` });
  };

  const isDisabled = (!commissions || commissions.length === 0) && (!data || data.length === 0);

  return (
    <Button onClick={handleExport} variant="success" disabled={isDisabled}>
      <FileText className="mr-2 h-4 w-4" />
      Exportar PDF
    </Button>
  );
}
