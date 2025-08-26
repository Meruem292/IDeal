'use server';
/**
 * @fileOverview An AI flow to parse class schedules from an image.
 *
 * - parseSchedule - A function that handles parsing the schedule image.
 */

import { ai } from '@/ai/genkit';
import { 
  ParseScheduleInputSchema,
  ParseScheduleOutputSchema,
  ParseScheduleInput,
  ParseScheduleOutput
} from '@/ai/schemas/schedule-parser-types';


export async function parseSchedule(input: ParseScheduleInput): Promise<ParseScheduleOutput> {
  return parseScheduleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'parseSchedulePrompt',
  input: { schema: ParseScheduleInputSchema },
  output: { schema: ParseScheduleOutputSchema },
  prompt: `You are an expert schedule parser. Analyze the provided image of a class schedule.

Your task is to extract all class entries from the schedule.

For each class, identify the subject name, the start time, and the end time.
Format the times in a 24-hour HH:mm format.
Return the data as a JSON object matching the provided schema.

Do not include faculty names, days of the week, or any other information. Only extract the subject, start time, and end time for each class.

Image: {{media url=photoDataUri}}`,
});

const parseScheduleFlow = ai.defineFlow(
  {
    name: 'parseScheduleFlow',
    inputSchema: ParseScheduleInputSchema,
    outputSchema: ParseScheduleOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("Failed to get a response from the AI model.");
    }
    return output;
  }
);
