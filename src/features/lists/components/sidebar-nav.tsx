"use client";

import { NewListForm } from "@/features/lists/components/new-list-form";
import { SidebarListItem } from "@/features/lists/components/sidebar-list-item";
import type { ListWithCount } from "@/features/lists/models";

export function SidebarNav({
  lists,
  selectedListId,
  onNavigate,
}: {
  lists: ListWithCount[];
  selectedListId: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex min-h-0 flex-1 flex-col gap-3 p-3" aria-label="Lists">
      <ul className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
        {lists.map((list) => (
          <li key={list.id}>
            <SidebarListItem
              list={list}
              selected={list.id === selectedListId}
              onNavigate={onNavigate}
            />
          </li>
        ))}
      </ul>
      <NewListForm onNavigate={onNavigate} />
    </nav>
  );
}
