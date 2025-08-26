'use server';
/**
 * @fileOverview An AI flow to parse class schedules from an image.
 *
 * - parseSchedule - A function that handles parsing the schedule image.
 * - ParseScheduleInput - The input type for the parseSchedule function.
 * - ParseScheduleOutput - The return type for the parseSchedule function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const ParseScheduleInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a class schedule, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ParseScheduleInput = z.infer<typeof ParseScheduleInputSchema>;

export const ScheduleEntrySchema = z.object({
    subject: z.string().describe('The name of the subject or class.'),
    startTime: z.string().describe('The start time of the class in HH:mm format (e.g., "09:00").'),
    endTime: z.string().describe('The end time of the class in HH:mm format (e.g., "10:30").'),
});

export const ParseScheduleOutputSchema = z.object({
    dayOfWeek: z.string().describe('The day of the week for these schedules (e.g., "Monday", "Tuesday").'),
    schedules: z.array(ScheduleEntrySchema).describe('An array of all schedules found for that day.'),
});
export type ParseScheduleOutput = z.infer<typeof ParseScheduleOutputSchema>;


export async function parseSchedule(input: ParseScheduleInput): Promise<ParseScheduleOutput> {
  return parseScheduleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'parseSchedulePrompt',
  input: { schema: ParseScheduleInputSchema },
  output: { schema: ParseScheduleOutputSchema },
  prompt: `You are an expert schedule parser. Analyze the provided image of a class schedule.

Your task is to extract all class entries for a single day of the week. Identify the day of the week the schedule belongs to.

For each class, identify the subject name, the start time, and the end time.
Format the times in a 24-hour HH:mm format.
Return the data as a JSON object matching the provided schema.

Do not include faculty names or any other information. Only extract the subject, start time, and end time for each class on a specific day. If multiple days are present, pick one and return all schedules for that day.

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
