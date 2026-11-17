import { z } from "zod";

import { idSchema } from "@/lib/validation";

export const TASK_STATUSES = ["todo", "in_progress", "done"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

export const TASK_TITLE_MAX = 200;
export const TASK_DETAILS_MAX = 5000;

export const taskTitleSchema = z.string().trim().min(1).max(TASK_TITLE_MAX);

export const taskUpdateSchema = z
  .object({
    title: taskTitleSchema,
    details: z
      .string()
      .trim()
      .max(TASK_DETAILS_MAX)
      .transform((value) => value || null)
      .nullable(),
    status: z.enum(TASK_STATUSES),
    listId: idSchema,
  })
  .partial();

export type TaskUpdate = z.input<typeof taskUpdateSchema>;

export function isTaskStatus(value: string): value is TaskStatus {
  return (TASK_STATUSES as readonly string[]).includes(value);
}
