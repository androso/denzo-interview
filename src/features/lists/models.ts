import { z } from "zod";

import type { List } from "@/db/schema";

export type ListWithCount = List & { taskCount: number };

export const LIST_NAME_MAX = 50;
export const listNameSchema = z.string().trim().min(1).max(LIST_NAME_MAX);
