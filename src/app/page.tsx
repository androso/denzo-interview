import { auth } from "@clerk/nextjs/server";
import { Suspense } from "react";

import { BoardSkeleton, HomeSkeleton } from "@/components/home-skeleton";
import type { ListWithCount } from "@/features/lists/models";
import { Sidebar } from "@/features/lists/components/sidebar";
import { listLists } from "@/features/lists/queries";
import { Board } from "@/features/tasks/components/board";
import { listTasks } from "@/features/tasks/queries";

export default async function Home({ searchParams }: PageProps<"/">) {
  await auth.protect();

  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeContent searchParams={searchParams} />
    </Suspense>
  );
}

async function HomeContent({
  searchParams,
}: {
  searchParams: PageProps<"/">["searchParams"];
}) {
  const { list: listParam } = await searchParams;
  const listId = typeof listParam === "string" ? listParam : undefined;

  const lists = await listLists();
  const selectedList =
    lists.find((list) => list.id === listId) ??
    lists.find((list) => list.isDefault) ??
    lists[0];

  if (!selectedList) {
    return null;
  }

  return (
    <div className="flex min-h-0 flex-1">
      <Sidebar lists={lists} selectedListId={selectedList.id} />
      <Suspense key={selectedList.id} fallback={<BoardSkeleton />}>
        <BoardContent list={selectedList} lists={lists} />
      </Suspense>
    </div>
  );
}

async function BoardContent({
  list,
  lists,
}: {
  list: ListWithCount;
  lists: ListWithCount[];
}) {
  const tasks = await listTasks(list.id);

  return <Board list={list} tasks={tasks} lists={lists} />;
}
