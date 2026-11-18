import { z } from "zod";

export type ListDto = {
  id: string;
  name: string;
  isDefault: boolean;
  taskCount: number;
};

export const LIST_NAME_MAX = 50;
export const listNameSchema = z.string().trim().min(1).max(LIST_NAME_MAX);
