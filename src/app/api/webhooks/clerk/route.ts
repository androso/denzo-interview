import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest } from "next/server";

import { deleteUser, upsertStoredUser } from "@/features/users/data";
import { clerkUserRecord } from "@/features/users/profile";

export async function POST(request: NextRequest) {
  let event: Awaited<ReturnType<typeof verifyWebhook>>;
  try {
    event = await verifyWebhook(request);
  } catch {
    return new Response("Webhook verification failed", { status: 400 });
  }

  if (event.type === "user.created" || event.type === "user.updated") {
    await upsertStoredUser(clerkUserRecord(event.data));
    return new Response("OK", { status: 200 });
  }

  if (event.type === "user.deleted") {
    if (event.data.id) await deleteUser(event.data.id);
    return new Response("OK", { status: 200 });
  }

  return new Response("OK", { status: 200 });
}
