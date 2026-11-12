import type { Task } from "@/db/schema";
import type { ListWithCount } from "@/lib/data";

export function Board({
  list,
  tasks,
  lists,
}: {
  list: ListWithCount;
  tasks: Task[];
  lists: ListWithCount[];
}) {
  void list;
  void tasks;
  void lists;

  return <section className="min-w-0 flex-1" />;
}
