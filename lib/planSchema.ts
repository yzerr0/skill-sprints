import { z } from "zod";

export const sprintDaySchema = z.object({
    day: z.number().int().min(1),
    title: z.string().min(1),
    estimatedMins: z.number().int().min(1).max(240),
    instructions: z.array(z.string().min(1)).min(1),
    reflectionQuestion: z.string().min(1),
});

export const planSchema = z.object({
    overview: z.string().min(1),
    days: z.array(sprintDaySchema).min(1),
});

export type PlanJson = z.infer<typeof planSchema>;