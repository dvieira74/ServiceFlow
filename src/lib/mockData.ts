
import type { ServiceCommission, Annotation, ServiceType, CommissionStatus } from '@/types';

export const mockServiceCommissions: ServiceCommission[] = [
  {
    id: 'SC001',
    date: new Date(2023, 8, 15).toISOString(),
    clientName: 'Carlos Neves',
    serviceType: 'printer' as ServiceType,
    printerModel: 'HP LaserJet Pro M404dn',
    serviceDescription: 'Revisão anual do ar condicionado para Carlos Neves',
    serviceValue: 250.0,
    commissionPercentage: 20, // 20%
    commissionAmount: 50.0, // 250 * 0.20
    status: 'Registered' as CommissionStatus, // Status genérico
  },
  {
    id: 'SC002',
    date: new Date(2023, 9, 5).toISOString(),
    clientName: 'Roberto Construtor',
    serviceType: 'toner' as ServiceType,
    serviceDescription: 'Instalar novo ventilador de teto para Roberto Construtor',
    serviceValue: 150.0,
    commissionPercentage: 15, // 15%
    commissionAmount: 22.50, // 150 * 0.15
    status: 'Registered' as CommissionStatus, // Status genérico
  },
  {
    id: 'SC003',
    date: new Date(2023, 10, 1).toISOString(),
    clientName: 'Loja XYZ',
    serviceType: 'printer' as ServiceType,
    printerModel: 'Epson EcoTank L3150',
    serviceDescription: 'Manutenção corretiva em impressora Epson',
    serviceValue: 180.0,
    commissionPercentage: 10, // 10%
    commissionAmount: 18.0, // 180 * 0.10
    status: 'Registered' as CommissionStatus, // Status genérico
  },
];

export const mockAnnotations: Annotation[] = [
  {
    id: 'AN001',
    serviceId: 'SC001',
    relatedTo: 'commission',
    text: 'Cliente mencionou que o vazamento começou há 2 dias. Prefere agendamento pela manhã.',
    date: new Date(2023, 9, 1, 10, 30).toISOString(),
    author: 'Equipe de Suporte',
  },
  {
    id: 'AN002',
    serviceId: 'SC002',
    relatedTo: 'commission',
    text: 'Técnico precisa de uma escada alta para este trabalho. Confirmar altura do pé direito.',
    date: new Date(2023, 9, 5, 14, 0).toISOString(),
    author: 'Equipe de Despacho',
  },
  {
    id: 'AN003',
    serviceId: 'SC001', // Relacionado a uma comissão
    relatedTo: 'commission',
    text: 'Comissão processada via depósito direto.', // Texto genérico, pois paymentDate não é mais foco
    date: new Date(2023, 8, 20, 11, 0).toISOString(),
    author: 'Departamento Financeiro',
  },
];

