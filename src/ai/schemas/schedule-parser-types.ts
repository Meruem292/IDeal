/**
 * @fileOverview Types and Zod schemas for the schedule parser flow.
 */
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
