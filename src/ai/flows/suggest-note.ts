'use server';

/**
 * @fileOverview Agente de IA que sugere anotações para um registro de serviço.
 *
 * - suggestNote - Uma função que sugere anotações para um registro de serviço.
 * - SuggestNoteInput - O tipo de entrada para a função suggestNote.
 * - SuggestNoteOutput - O tipo de retorno para a função suggestNote.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestNoteInputSchema = z.object({
  serviceRecordDetails: z
    .string()
    .describe('Detalhes do registro de serviço para o qual as anotações devem ser sugeridas.'),
});
export type SuggestNoteInput = z.infer<typeof SuggestNoteInputSchema>;

const SuggestNoteOutputSchema = z.object({
  suggestedNotes: z
    .array(z.string())
    .describe('Um array de anotações sugeridas para o registro de serviço.'),
});
export type SuggestNoteOutput = z.infer<typeof SuggestNoteOutputSchema>;

export async function suggestNote(input: SuggestNoteInput): Promise<SuggestNoteOutput> {
  return suggestNoteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestNotePrompt',
  input: {schema: SuggestNoteInputSchema},
  output: {schema: SuggestNoteOutputSchema},
  prompt: `Você é um assistente de IA especializado em sugerir anotações úteis para registros de serviço.

  Com base nos seguintes detalhes do registro de serviço, sugira algumas anotações concisas e relevantes que seriam úteis para documentar detalhes importantes. Retorne as anotações como um array JSON.

  Detalhes do Registro de Serviço: {{{serviceRecordDetails}}}

  Anotações Sugeridas:`,
});

const suggestNoteFlow = ai.defineFlow(
  {
    name: 'suggestNoteFlow',
    inputSchema: SuggestNoteInputSchema,
    outputSchema: SuggestNoteOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
