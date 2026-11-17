import { readdir, readFile } from "node:fs/promises";
import { NextRequest } from "next/server";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { eq } from "drizzle-orm";

import { POST as clerkWebhook } from "@/app/api/webhooks/clerk/route";
import { lists, tasks, users } from "@/db/schema";
import {
  createListForUser,
  deleteListForUser,
  listListsForUser,
  renameListForUser,
} from "@/features/lists/data";
import { listLists } from "@/features/lists/queries";
import {
  createTaskForUser,
  deleteTaskForUser,
  listTasksForUser,
  updateTaskForUser,
} from "@/features/tasks/data";
import { createList, deleteList, renameList } from "@/features/lists/actions";
import { createTask, deleteTask, updateTask } from "@/features/tasks/actions";
import { listTasks } from "@/features/tasks/queries";
import { client, testDb } from "./support/database";

const session = vi.hoisted(() => ({
  userId: "alice" as string | null,
  clerkUser: { fullName: "Alice" } as {
    fullName?: string | null;
    username?: string | null;
    primaryEmailAddress?: { emailAddress: string } | null;
    raw?: unknown;
  } | null,
}));
const webhook = vi.hoisted(() => ({
  event: null as { type: string; data: unknown } | null,
}));
const refresh = vi.hoisted(() => vi.fn());
vi.mock("@/db", async () => ({
  db: (await import("./support/database")).testDb,
}));
vi.mock("next/cache", () => ({ refresh }));
vi.mock("@clerk/nextjs/server", () => ({
  auth: Object.assign(async () => ({ userId: session.userId }), {
    protect: async () => {
      if (!session.userId) throw new Error("Unauthenticated");
      return { userId: session.userId };
    },
  }),
  currentUser: async () => session.clerkUser,
}));
vi.mock("@clerk/nextjs/webhooks", () => ({
  verifyWebhook: async () => {
    if (!webhook.event) throw new Error("unsigned");
    return webhook.event;
  },
}));

const aliceList = "11111111-1111-4111-8111-111111111111";
const bobList = "22222222-2222-4222-8222-222222222222";
const aliceTask = "33333333-3333-4333-8333-333333333333";
const bobTask = "44444444-4444-4444-8444-444444444444";

beforeAll(async () => {
  const files = (await readdir("drizzle"))
    .filter((file) => file.endsWith(".sql"))
    .sort();
  for (const file of files) {
    await client.exec(await readFile(`drizzle/${file}`, "utf8"));
  }
}, 30_000);
afterAll(async () => {
  await client.close();
});
beforeEach(async () => {
  vi.clearAllMocks();
  session.userId = "alice";
  session.clerkUser = { fullName: "Alice" };
  webhook.event = null;
  await client.exec("TRUNCATE users CASCADE");
  await testDb.insert(users).values([
    { id: "alice", name: "Alice" },
    { id: "bob", name: "Bob" },
  ]);
  await testDb.insert(lists).values([
    { id: aliceList, userId: "alice", name: "Alice's list" },
    { id: bobList, userId: "bob", name: "Bob's list" },
  ]);
  await testDb.insert(tasks).values([
    {
      id: aliceTask,
      userId: "alice",
      listId: aliceList,
      title: "Alice's task",
    },
    { id: bobTask, userId: "bob", listId: bobList, title: "Bob's task" },
  ]);
});

describe("feature operations enforce ownership without action prechecks", () => {
  it("rejects foreign list renames, deletes, and task insertion", async () => {
    expect(await renameListForUser("alice", bobList, "Changed")).toEqual({
      ok: false,
      error: "List not found.",
    });
    expect(await deleteListForUser("alice", bobList)).toEqual({
      ok: false,
      error: "List not found.",
    });
    expect(await createTaskForUser("alice", bobList, "Intruder")).toEqual({
      ok: false,
      error: "List not found.",
    });
    const [bob] = await listListsForUser("bob");
    expect(bob).toMatchObject({
      id: bobList,
      name: "Bob's list",
      taskCount: 1,
    });
  });

  it("rejects foreign task updates, moves, reads, and deletes", async () => {
    expect(
      await updateTaskForUser("alice", bobTask, { title: "Changed" }),
    ).toEqual({ ok: false, error: "Task not found." });
    expect(
      await updateTaskForUser("alice", bobTask, { listId: aliceList }),
    ).toEqual({ ok: false, error: "Task not found." });
    expect(
      await updateTaskForUser("alice", aliceTask, { listId: bobList }),
    ).toEqual({ ok: false, error: "List not found." });
    expect(await deleteTaskForUser("alice", bobTask)).toEqual({
      ok: false,
      error: "Task not found.",
    });
    expect(await listTasksForUser("alice", bobList)).toEqual([]);
    expect(await listTasksForUser("bob", bobList)).toMatchObject([
      { title: "Bob's task", listId: bobList },
    ]);
  });

  it("prevents default-list deletion for its owner", async () => {
    await client.exec(
      `UPDATE lists SET is_default = true WHERE id = '${aliceList}'`,
    );
    expect(await deleteListForUser("alice", aliceList)).toEqual({
      ok: false,
      error: "The default list can't be deleted.",
    });
    expect(await listTasksForUser("alice", aliceList)).toHaveLength(1);
  });

  it("allows owned writes, moves, and cascading list deletion", async () => {
    const created = await createListForUser("alice", "Destination");
    if (!created.ok) throw new Error(created.error);
    expect(
      await renameListForUser("alice", created.data.id, "Renamed"),
    ).toMatchObject({ ok: true, data: { name: "Renamed" } });
    expect(
      await createTaskForUser("alice", created.data.id, "New task"),
    ).toMatchObject({ ok: true });
    expect(
      await updateTaskForUser("alice", aliceTask, {
        listId: created.data.id,
        status: "done",
      }),
    ).toMatchObject({ ok: true, data: { status: "done" } });
    expect(await deleteTaskForUser("alice", aliceTask)).toEqual({
      ok: true,
      data: undefined,
    });
    expect(await deleteListForUser("alice", created.data.id)).toEqual({
      ok: true,
      data: undefined,
    });
    expect(await listTasksForUser("alice", created.data.id)).toEqual([]);
  });
});

describe("authenticated action boundary", () => {
  it("rejects every mutation without a signed-in user", async () => {
    session.userId = null;
    const results = await Promise.allSettled([
      createList("New"),
      renameList(aliceList, "New"),
      deleteList(aliceList),
      createTask(aliceList, "New"),
      updateTask(aliceTask, { status: "done" }),
      deleteTask(aliceTask),
    ]);
    expect(
      results.every(
        (result) =>
          result.status === "rejected" &&
          result.reason instanceof Error &&
          result.reason.message === "Unauthenticated",
      ),
    ).toBe(true);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("rejects invalid IDs, whitespace names, empty updates, and invalid statuses", async () => {
    const results = await Promise.all([
      createList(" "),
      renameList(aliceList, " "),
      deleteList("bad"),
      createTask("bad", "New"),
      createTask(aliceList, " "),
      updateTask(aliceTask, {}),
      updateTask(aliceTask, { status: "bad" } as never),
      deleteTask("bad"),
    ]);
    expect(
      results.every(
        (result) => !result.ok && result.error === "Invalid input.",
      ),
    ).toBe(true);
    expect(await listTasks("bad")).toEqual([]);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("returns expected server failures without refresh", async () => {
    expect(await createTask(bobList, "New")).toEqual({
      ok: false,
      error: "List not found.",
    });
    expect(await updateTask(bobTask, { status: "done" })).toEqual({
      ok: false,
      error: "Task not found.",
    });
    expect(refresh).not.toHaveBeenCalled();
  });

  it("normalizes input and refreshes after successful writes", async () => {
    expect(await createTask(aliceList, "  New task  ")).toMatchObject({
      ok: true,
      data: { title: "New task" },
    });
    expect(await updateTask(aliceTask, { details: "  " })).toMatchObject({
      ok: true,
      data: { details: null },
    });
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it("preserves unexpected database exceptions instead of claiming success", async () => {
    session.userId = "missing-user";
    await expect(createList("Fails the user foreign key")).rejects.toThrow();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("creates one user and default list during concurrent first reads", async () => {
    session.userId = "new-user";
    const results = await Promise.all([listLists(), listLists(), listLists()]);
    for (const rows of results) {
      expect(rows).toMatchObject([
        { userId: "new-user", name: "My Tasks", isDefault: true, taskCount: 0 },
      ]);
      expect(rows).toHaveLength(1);
    }
    expect(new Set(results.map((rows) => rows[0].id)).size).toBe(1);
  });

  it("stores the Clerk user and drops phone backup codes", async () => {
    session.userId = "new-user";
    session.clerkUser = {
      raw: {
        id: "new-user",
        first_name: "Ada",
        last_name: "Lovelace",
        username: "ada",
        image_url: "https://img.example/ada.png",
        primary_email_address_id: "email_1",
        email_addresses: [
          {
            id: "email_1",
            email_address: "ada@example.com",
            verification: { status: "verified" },
          },
        ],
        phone_numbers: [
          {
            id: "phone_1",
            phone_number: "+15555550100",
            backup_codes: ["secret-code"],
          },
        ],
        private_metadata: { plan: "pro" },
        password_enabled: true,
      },
    };

    await listLists();

    const [user] = await testDb
      .select()
      .from(users)
      .where(eq(users.id, "new-user"));
    expect(user).toMatchObject({
      name: "Ada Lovelace",
      email: "ada@example.com",
    });
    expect(user?.profile).toMatchObject({
      image_url: "https://img.example/ada.png",
      private_metadata: { plan: "pro" },
      password_enabled: true,
    });
    expect(user?.profile?.phone_numbers?.[0]).not.toHaveProperty(
      "backup_codes",
    );
    expect(user?.profile?.phone_numbers?.[0]).toMatchObject({
      phone_number: "+15555550100",
    });
  });
});

describe("Clerk user webhook", () => {
  it("rejects an unverified webhook", async () => {
    const response = await clerkWebhook(
      new NextRequest("http://localhost/api/webhooks/clerk", {
        method: "POST",
      }),
    );
    expect(response.status).toBe(400);
  });

  it("updates the stored user and deletes it with owned data", async () => {
    webhook.event = {
      type: "user.updated",
      data: {
        id: "bob",
        first_name: "Robert",
        last_name: null,
        username: null,
        primary_email_address_id: "email_bob",
        email_addresses: [
          { id: "email_bob", email_address: "bob@example.com" },
        ],
      },
    };
    const updated = await clerkWebhook(
      new NextRequest("http://localhost/api/webhooks/clerk", {
        method: "POST",
      }),
    );
    expect(updated.status).toBe(200);
    const [bob] = await testDb.select().from(users).where(eq(users.id, "bob"));
    expect(bob).toMatchObject({ name: "Robert", email: "bob@example.com" });

    webhook.event = {
      type: "user.deleted",
      data: { id: "bob", deleted: true },
    };
    const deleted = await clerkWebhook(
      new NextRequest("http://localhost/api/webhooks/clerk", {
        method: "POST",
      }),
    );
    expect(deleted.status).toBe(200);
    expect(
      await testDb.select().from(users).where(eq(users.id, "bob")),
    ).toEqual([]);
    expect(
      await testDb.select().from(lists).where(eq(lists.userId, "bob")),
    ).toEqual([]);
    expect(
      await testDb.select().from(tasks).where(eq(tasks.userId, "bob")),
    ).toEqual([]);
  });
});
