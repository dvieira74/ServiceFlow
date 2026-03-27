
'use server';
/**
 * @fileOverview Agente de IA para conversar sobre dados do negócio e executar ações.
 *
 * - serviceAgent - O fluxo principal que lida com o chat.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  Timestamp,
  limit,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type {
  ServiceRequest,
  ServiceCommission,
  Annotation,
  ServiceType,
  CommissionStatus,
} from '@/types';

// Esquema para o histórico da conversa
const HistorySchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.array(z.object({ text: z.string() })),
});

// #################################################################
// FERRAMENTA: CONSULTAR DADOS (Ordens de Serviço, Comissões, Anotações)
// #################################################################

const listDataInputSchema = z.object({
  collectionName: z
    .enum(['serviceRequests', 'serviceCommissions', 'annotations'])
    .describe('O nome da coleção para consultar no Firestore.'),
  filter: z
    .string()
    .optional()
    .describe(
      'Um filtro no formato "campo,operador,valor" (ex: "status,==,Pronto").'
    ),
  maxResults: z
    .number()
    .optional()
    .default(10)
    .describe('O número máximo de resultados a serem retornados.'),
});

const listDataTool = ai.defineTool(
  {
    name: 'listData',
    description:
      'Consulta e lista dados de Ordens de Serviço (serviceRequests), Comissões (serviceCommissions) ou Anotações (annotations) do Firestore. Use para responder perguntas sobre itens existentes.',
    inputSchema: listDataInputSchema,
    outputSchema: z.string().describe('Um array JSON dos documentos encontrados.'),
  },
  async (input) => {
    let q = query(
      collection(db, input.collectionName),
      limit(input.maxResults),
      orderBy('date', 'desc')
    );

    if (input.filter) {
      try {
        const [field, op, value] = input.filter.split(',');
        q = query(q, where(field, op as any, value));
      } catch (e) {
        return JSON.stringify({
          error:
            'Formato de filtro inválido. Use "campo,operador,valor".',
        });
      }
    }

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return JSON.stringify([]);
    }

    const data = snapshot.docs.map((doc) => {
        const docData = doc.data();
        // Converte Timestamps para strings ISO para serialização
        const serializedData: { [key: string]: any } = { id: doc.id };
        for (const key in docData) {
            if (docData[key] instanceof Timestamp) {
                serializedData[key] = docData[key].toDate().toISOString();
            } else {
                serializedData[key] = docData[key];
            }
        }
        return serializedData;
    });
    return JSON.stringify(data, null, 2);
  }
);

// #################################################################
// FERRAMENTA: CRIAR ORDEM DE SERVIÇO
// #################################################################

const createServiceRequestInputSchema = z.object({
  cliente: z.string().describe('Nome do cliente.'),
  equipamento: z.string().describe('Descrição do equipamento.'),
  descricao: z.string().describe('Descrição do problema ou serviço solicitado.'),
});

const createServiceRequestTool = ai.defineTool(
  {
    name: 'createServiceRequest',
    description: 'Cria uma nova Ordem de Serviço (OS).',
    inputSchema: createServiceRequestInputSchema,
    outputSchema: z.string().describe('O ID da nova Ordem de Serviço criada.'),
  },
  async (input) => {
    const newServiceRequest: Omit<ServiceRequest, 'id'> = {
      ...input,
      data: new Date().toISOString(),
      status: 'Orçamento',
    };
    const docRef = await addDoc(
      collection(db, 'serviceRequests'),
      {
          ...newServiceRequest,
          data: Timestamp.fromDate(new Date(newServiceRequest.data))
      }
    );
    return docRef.id;
  }
);

// #################################################################
// FERRAMENTA: CRIAR COMISSÃO DE SERVIÇO
// #################################################################

const createServiceCommissionInputSchema = z.object({
  clientName: z.string().describe('Nome do cliente.'),
  serviceType: z.enum(['printer', 'toner']).describe('O tipo de serviço.'),
  serviceValue: z.number().describe('O valor total do serviço cobrado.'),
  commissionPercentage: z
    .number()
    .describe('A porcentagem de comissão (ex: 10 para 10%).'),
  printerModel: z.string().optional().describe('O modelo da impressora, se aplicável.'),
  serviceDescription: z.string().optional().describe('Descrição breve do serviço.'),
});

const createServiceCommissionTool = ai.defineTool(
  {
    name: 'createServiceCommission',
    description: 'Cria um novo registro de comissão de serviço.',
    inputSchema: createServiceCommissionInputSchema,
    outputSchema: z.string().describe('O ID da nova comissão criada.'),
  },
  async (input) => {
    if (input.serviceType === 'printer' && !input.printerModel) {
        throw new Error('O modelo da impressora é obrigatório para serviços de impressora.');
    }

    const commissionAmount = (input.serviceValue * input.commissionPercentage) / 100;
    const newCommission: Omit<ServiceCommission, 'id'> = {
      ...input,
      date: new Date().toISOString(),
      commissionAmount,
      status: 'Registered' as CommissionStatus,
      serviceType: input.serviceType as ServiceType,
    };
    const docRef = await addDoc(collection(db, 'serviceCommissions'), {
        ...newCommission,
        date: Timestamp.fromDate(new Date(newCommission.date))
    });
    return docRef.id;
  }
);


// #################################################################
// FLUXO PRINCIPAL DO AGENTE
// #################################################################

export const serviceAgentFlow = ai.defineFlow(
  {
    name: 'serviceAgentFlow',
    inputSchema: z.object({
      query: z.string(),
      history: z.array(HistorySchema).optional(),
    }),
    outputSchema: z.string(),
  },
  async ({ query, history }) => {
    const systemInstruction = `Você é um assistente de IA para o aplicativo ServiceFlow Control. Sua função é ajudar o usuário a gerenciar Ordens de Serviço (OS), comissões e anotações.

      - Use as ferramentas disponíveis para buscar dados ou criar novos registros.
      - Ao listar dados, formate a resposta de forma clara e concisa para o usuário. Use tabelas em formato markdown quando apropriado.
      - Ao criar algo, sempre confirme a criação para o usuário com os detalhes do que foi criado e o ID do registro.
      - Se você não tiver certeza de uma informação para criar um registro (ex: valor do serviço para uma comissão), peça ao usuário para fornecer os detalhes que faltam.
      - Seja sempre prestativo e amigável.`;

    const result = await ai.generate({
        model: 'googleai/gemini-pro',
        system: systemInstruction,
        prompt: query,
        history: history,
        tools: [listDataTool, createServiceRequestTool, createServiceCommissionTool],
        output: {
            format: 'text'
        }
    });

    return result.text;
  }
);

export async function serviceAgent(
  query: string,
  history: z.infer<typeof HistorySchema>[]
): Promise<string> {
  return serviceAgentFlow({ query, history });
}
