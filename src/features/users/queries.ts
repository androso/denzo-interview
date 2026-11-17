import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";

import { ensureUser, getUser, upsertStoredUser } from "./data";
import { clerkUserRecord } from "./profile";

export async function syncCurrentUser(userId: string): Promise<void> {
  const clerkUser = await currentUser();
  if (clerkUser?.raw) {
    const record = clerkUserRecord(clerkUser.raw);
    await upsertStoredUser({ ...record, id: userId });
    return;
  }

  const name =
    clerkUser?.fullName ||
    clerkUser?.username ||
    clerkUser?.primaryEmailAddress?.emailAddress ||
    "User";
  await ensureUser(userId, name);
}

export async function getCurrentUser() {
  const { userId } = await auth.protect();
  await syncCurrentUser(userId);
  return getUser(userId);
}
