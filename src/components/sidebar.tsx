import type { ListWithCount } from "@/lib/data";

export function Sidebar({
  lists,
  selectedListId,
}: {
  lists: ListWithCount[];
  selectedListId: string;
}) {
  void lists;
  void selectedListId;

  return <aside className="w-64 shrink-0 border-r" />;
}
