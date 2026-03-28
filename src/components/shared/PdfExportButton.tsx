
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
  totalNotebookCommissions?: number;
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
      const notebookComms = commissions.filter(c => c.serviceType === 'notebook');

      if (printerComms.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(primaryColorRGB[0], primaryColorRGB[1], primaryColorRGB[2]);
        doc.text('Tabela: Serviços de Impressora', pageMargin, yPos);
        yPos += 6;

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
          headStyles: { fillColor: primaryColorRGB as any, textColor: [255, 255, 255] },
          margin: { left: pageMargin, right: pageMargin },
        });
        yPos = (doc as any).lastAutoTable.finalY + 6;

        const subPrinterComm = printerComms.reduce((acc, curr) => acc + curr.commissionAmount, 0);
        const subPrinterGross = printerComms.reduce((acc, curr) => acc + curr.serviceValue, 0);
        
        doc.setFillColor(245, 245, 250);
        doc.rect(pageMargin, yPos, pageWidth - 2 * pageMargin, 12, 'F');
        doc.setFontSize(10);
        doc.setTextColor(50);
        doc.setFont('helvetica', 'bold');
        doc.text(`Subtotal Impressora:`, pageMargin + 5, yPos + 8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Bruto: R$ ${subPrinterGross.toFixed(2)}  |  Comissão: R$ ${subPrinterComm.toFixed(2)}`, pageMargin + 45, yPos + 8);
        yPos += 20;
      }

      if (tonerComms.length > 0) {
        if (yPos > 240) { doc.addPage(); yPos = 20; }
        doc.setFontSize(14);
        doc.setTextColor(primaryColorRGB[0], primaryColorRGB[1], primaryColorRGB[2]);
        doc.text('Tabela: Serviços de Toner', pageMargin, yPos);
        yPos += 6;

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
          headStyles: { fillColor: primaryColorRGB as any, textColor: [255, 255, 255] },
          margin: { left: pageMargin, right: pageMargin },
        });
        yPos = (doc as any).lastAutoTable.finalY + 6;

        const subTonerComm = tonerComms.reduce((acc, curr) => acc + curr.commissionAmount, 0);
        const subTonerGross = tonerComms.reduce((acc, curr) => acc + curr.serviceValue, 0);
        
        doc.setFillColor(245, 245, 250);
        doc.rect(pageMargin, yPos, pageWidth - 2 * pageMargin, 12, 'F');
        doc.setFontSize(10);
        doc.setTextColor(50);
        doc.setFont('helvetica', 'bold');
        doc.text(`Subtotal Toner:`, pageMargin + 5, yPos + 8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Bruto: R$ ${subTonerGross.toFixed(2)}  |  Comissão: R$ ${subTonerComm.toFixed(2)}`, pageMargin + 45, yPos + 8);
        yPos += 20;
      }

      if (notebookComms.length > 0) {
        if (yPos > 240) { doc.addPage(); yPos = 20; }
        doc.setFontSize(14);
        doc.setTextColor(primaryColorRGB[0], primaryColorRGB[1], primaryColorRGB[2]);
        doc.text('Tabela: Serviços de Notebook', pageMargin, yPos);
        yPos += 6;

        autoTable(doc, {
          startY: yPos,
          head: [['Data', 'Cliente', 'Modelo', 'Valor Serv. (R$)', '%', 'Comissão (R$)']],
          body: notebookComms.map(c => [
            format(parseISO(c.date), 'dd/MM/yy', { locale: ptBR }),
            c.clientName,
            c.printerModel || '-',
            c.serviceValue.toFixed(2),
            `${c.commissionPercentage}%`,
            c.commissionAmount.toFixed(2)
          ]),
          theme: 'striped',
          headStyles: { fillColor: primaryColorRGB as any, textColor: [255, 255, 255] },
          margin: { left: pageMargin, right: pageMargin },
        });
        yPos = (doc as any).lastAutoTable.finalY + 6;

        const subNotebookComm = notebookComms.reduce((acc, curr) => acc + curr.commissionAmount, 0);
        const subNotebookGross = notebookComms.reduce((acc, curr) => acc + curr.serviceValue, 0);
        
        doc.setFillColor(245, 245, 250);
        doc.rect(pageMargin, yPos, pageWidth - 2 * pageMargin, 12, 'F');
        doc.setFontSize(10);
        doc.setTextColor(50);
        doc.setFont('helvetica', 'bold');
        doc.text(`Subtotal Notebook:`, pageMargin + 5, yPos + 8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Bruto: R$ ${subNotebookGross.toFixed(2)}  |  Comissão: R$ ${subNotebookComm.toFixed(2)}`, pageMargin + 45, yPos + 8);
        yPos += 20;
      }

      // Gráfico de Pizza e Totais Finais
      if (yPos > 200) { doc.addPage(); yPos = 20; }
      
      doc.setDrawColor(primaryColorRGB[0], primaryColorRGB[1], primaryColorRGB[2]);
      doc.setLineWidth(1);
      doc.line(pageMargin, yPos, pageWidth - pageMargin, yPos);
      yPos += 15;

      // Desenhar Gráfico de Pizza (Simulado com setores)
      const totalComm = commissions.reduce((acc, curr) => acc + curr.commissionAmount, 0);
      const totalServ = commissions.reduce((acc, curr) => acc + curr.serviceValue, 0);
      
      const pComm = printerComms.reduce((acc, curr) => acc + curr.commissionAmount, 0);
      const tComm = tonerComms.reduce((acc, curr) => acc + curr.commissionAmount, 0);
      const nComm = notebookComms.reduce((acc, curr) => acc + curr.commissionAmount, 0);

      const chartX = pageMargin + 22; // Mais à esquerda
      const chartY = yPos + 25;
      const radius = 20; // Reduzido ligeiramente para dar mais espaço

      doc.setFontSize(14);
      doc.setTextColor(primaryColorRGB[0], primaryColorRGB[1], primaryColorRGB[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumo e Distribuição', pageMargin, yPos);
      yPos += 10;

      // Função para desenhar setores (Approximation com jsPDF compatível)
      const drawSector = (centerX: number, centerY: number, r: number, startAngle: number, endAngle: number, color: number[]) => {
        doc.setFillColor(color[0], color[1], color[2]);
        doc.setDrawColor(color[0], color[1], color[2]);
        doc.setLineWidth(0.1);
        
        const segments = 30;
        const step = (endAngle - startAngle) / segments;
        
        for (let i = 0; i < segments; i++) {
          const a1 = (startAngle + (i * step)) * Math.PI / 180;
          const a2 = (startAngle + ((i + 1) * step)) * Math.PI / 180;
          
          const x1 = centerX + r * Math.cos(a1);
          const y1 = centerY + r * Math.sin(a1);
          const x2 = centerX + r * Math.cos(a2);
          const y2 = centerY + r * Math.sin(a2);
          
          doc.triangle(centerX, centerY, x1, y1, x2, y2, 'FD');
        }
      };

      if (totalComm > 0) {
        let currentAngle = -90;
        const sectors = [
          { val: pComm, color: [0, 188, 212], label: 'Impressora' },
          { val: tComm, color: [255, 179, 0], label: 'Toner' },
          { val: nComm, color: [63, 81, 181], label: 'Notebook' }
        ];

        sectors.forEach((s, i) => {
          if (s.val > 0) {
            const angleExtent = (s.val / totalComm) * 360;
            drawSector(chartX, chartY, radius, currentAngle, currentAngle + angleExtent, s.color);
            
            // Legenda do gráfico - Alinhada verticalmente ao lado do gráfico
            const legendX = chartX + radius + 10;
            const legendYStart = chartY - (sectors.length * 6) / 2; 
            const legendY = legendYStart + (i * 8);
            
            doc.setFillColor(s.color[0], s.color[1], s.color[2]);
            doc.roundedRect(legendX, legendY - 3, 3.5, 3.5, 0.5, 0.5, 'F');
            doc.setFontSize(9);
            doc.setTextColor(100);
            doc.setFont('helvetica', 'normal');
            doc.text(`${s.label}: ${((s.val / totalComm) * 100).toFixed(1)}%`, legendX + 6, legendY);
            
            currentAngle += angleExtent;
          }
        });

        // Donut hole
        doc.setFillColor(255, 255, 255);
        doc.circle(chartX, chartY, radius / 2, 'F');
      }

      // Totais ao lado do gráfico (Mais à direita)
      const summaryBoxWidth = 75;
      const summaryBoxX = pageWidth - pageMargin - summaryBoxWidth;
      
      // Box de Resumo (Estilo Card)
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(summaryBoxX, yPos - 5, summaryBoxWidth, 60, 3, 3, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(summaryBoxX, yPos - 5, summaryBoxWidth, 60, 3, 3, 'D');

      doc.setFontSize(12);
      doc.setTextColor(primaryColorRGB[0], primaryColorRGB[1], primaryColorRGB[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumo Financeiro', summaryBoxX + 8, yPos + 8);

      // Total Bruto
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.setFont('helvetica', 'normal');
      doc.text('FATURAMENTO BRUTO', summaryBoxX + 8, yPos + 22);
      doc.setFontSize(14);
      doc.setTextColor(primaryColorRGB[0], primaryColorRGB[1], primaryColorRGB[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(`R$ ${totalServ.toFixed(2)}`, summaryBoxX + 8, yPos + 31);

      // Total Comissões
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.setFont('helvetica', 'normal');
      doc.text('TOTAL DE COMISSÕES', summaryBoxX + 8, yPos + 44);
      doc.setFontSize(14);
      doc.setTextColor(34, 197, 94); // Green 500
      doc.setFont('helvetica', 'bold');
      doc.text(`R$ ${totalComm.toFixed(2)}`, summaryBoxX + 8, yPos + 53);

      yPos += 75;

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
        headStyles: { fillColor: primaryColorRGB as any, textColor: [255, 255, 255] },
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
