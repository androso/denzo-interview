import { Suspense } from "react";

import { Board } from "@/components/board";
import { Sidebar } from "@/components/sidebar";
import { listLists, listTasks } from "@/lib/data";

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <Suspense>
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

  const tasks = await listTasks(selectedList.id);

  return (
    <div className="flex min-h-0 flex-1">
      <Sidebar lists={lists} selectedListId={selectedList.id} />
      <Board list={selectedList} tasks={tasks} lists={lists} />
    </div>
  );
}
