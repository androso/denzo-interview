import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";
import type { StoredUser, UserDto } from "./profile";

export async function getUser(userId: string): Promise<UserDto | null> {
  const [user] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, userId));
  return user ?? null;
}

export async function ensureUser(userId: string, name: string): Promise<void> {
  await db.insert(users).values({ id: userId, name }).onConflictDoNothing();
}

export async function upsertStoredUser(user: StoredUser): Promise<void> {
  await db
    .insert(users)
    .values(user)
    .onConflictDoUpdate({
      target: users.id,
      set: {
        name: user.name,
        email: user.email,
        profile: user.profile,
      },
    });
}

export async function deleteUser(userId: string): Promise<void> {
  await db.delete(users).where(eq(users.id, userId));
}
