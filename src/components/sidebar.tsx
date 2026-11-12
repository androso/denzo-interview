"use client";

import { MenuIcon } from "lucide-react";
import { useState } from "react";

import { SidebarNav } from "@/components/sidebar-nav";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { ListWithCount } from "@/lib/data";

export function Sidebar({
  lists,
  selectedListId,
}: {
  lists: ListWithCount[];
  selectedListId: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex shrink-0 items-start border-r p-2 md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Open lists"
            >
              <MenuIcon />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <SheetHeader>
              <SheetTitle>Lists</SheetTitle>
            </SheetHeader>
            <SidebarNav
              lists={lists}
              selectedListId={selectedListId}
              onNavigate={() => setOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>
      <aside className="hidden w-64 shrink-0 flex-col border-r md:flex">
        <SidebarNav lists={lists} selectedListId={selectedListId} />
      </aside>
    </>
  );
}
