
// CommissionStatus pode ser simplificado ou usado de forma mais genérica
export type CommissionStatus = 'Pending' | 'Paid' | 'Registered'; // Adicionando 'Registered' como exemplo

export type ServiceType = 'printer' | 'toner' | 'notebook';

export type ServiceCommission = {
  id: string;
  date: string; // Data do serviço comissionado (ISO string)
  clientName: string;
  serviceType: ServiceType;
  printerModel?: string; // Obrigatório se serviceType for 'printer' ou 'notebook'
  serviceDescription?: string; // Descrição geral do que foi feito
  serviceValue: number; // Valor total do serviço cobrado
  commissionPercentage: number; // Porcentagem da comissão (ex: 10 para 10%)
  commissionAmount: number; // Valor calculado da comissão (serviceValue * commissionPercentage / 100)
  status: CommissionStatus; // Pode ser usado internamente, mas não para distinção Pago/Pendente na UI principal
  paymentDate?: string; // ISO string format, agora menos relevante para a UI principal
};

export type Annotation = {
  id: string;
  serviceId: string; // Can be linked to a specific service
  relatedTo?: 'service' | 'commission'; // To specify context if needed
  text: string;
  date: string; // ISO string format
  author: string; // Or userId/userName
};
