"use server";

import { auth } from "@clerk/nextjs/server";
import { refresh } from "next/cache";

import type { ActionResult } from "@/lib/action-result";
import { idSchema } from "@/lib/validation";
import {
  createTaskForUser,
  updateTaskForUser,
  deleteTaskForUser,
} from "./data";
import {
  taskTitleSchema,
  taskUpdateSchema,
  type TaskDto,
  type TaskUpdate,
} from "./models";

const INVALID_INPUT = { ok: false, error: "Invalid input." } as const;

export async function createTask(
  listId: string,
  title: string,
): Promise<ActionResult<TaskDto>> {
  const { userId } = await auth.protect();

  const id = idSchema.safeParse(listId);
  const parsed = taskTitleSchema.safeParse(title);
  if (!id.success || !parsed.success) return INVALID_INPUT;
  const result = await createTaskForUser(userId, id.data, parsed.data);
  if (result.ok) refresh();
  return result;
}

export async function updateTask(
  taskId: string,
  update: TaskUpdate,
): Promise<ActionResult<TaskDto>> {
  const { userId } = await auth.protect();

  const id = idSchema.safeParse(taskId);
  const parsed = taskUpdateSchema.safeParse(update);
  if (!id.success || !parsed.success) return INVALID_INPUT;
  if (Object.values(parsed.data).every((value) => value === undefined)) {
    return INVALID_INPUT;
  }

  const result = await updateTaskForUser(userId, id.data, parsed.data);
  if (result.ok) refresh();
  return result;
}

export async function deleteTask(taskId: string): Promise<ActionResult> {
  const { userId } = await auth.protect();

  const id = idSchema.safeParse(taskId);
  if (!id.success) return INVALID_INPUT;

  const result = await deleteTaskForUser(userId, id.data);
  if (result.ok) refresh();
  return result;
}
