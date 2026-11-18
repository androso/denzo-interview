"use client";

import { MoreHorizontalIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteList, renameList } from "@/features/lists/actions";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { ListDto } from "@/features/lists/models";
import { LIST_NAME_MAX, listNameSchema } from "@/features/lists/models";
import { cn } from "@/lib/utils";

export function SidebarListItem({
  list,
  selected,
  onNavigate,
}: {
  list: ListDto;
  selected: boolean;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const renameId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const busyRef = useRef(false);
  const skipBlurRef = useRef(false);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(list.name);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!renaming) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [renaming]);

  function startRename() {
    setName(list.name);
    setRenaming(true);
  }

  function cancelRename() {
    skipBlurRef.current = true;
    setName(list.name);
    setRenaming(false);
  }

  function submitRename() {
    if (skipBlurRef.current) {
      skipBlurRef.current = false;
      return;
    }
    if (busyRef.current) return;

    const parsed = listNameSchema.safeParse(name);
    if (!parsed.success) {
      toast.error("Enter a list name.");
      return;
    }
    if (parsed.data === list.name) {
      setRenaming(false);
      return;
    }

    busyRef.current = true;
    startTransition(async () => {
      const result = await renameList(list.id, parsed.data);
      busyRef.current = false;
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setRenaming(false);
    });
  }

  function confirmDelete() {
    startTransition(async () => {
      const result = await deleteList(list.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setDeleteOpen(false);
      if (selected) {
        router.replace("/");
      }
    });
  }

  const href = `/?list=${list.id}`;
  const taskLabel = list.taskCount === 1 ? "1 task" : `${list.taskCount} tasks`;

  if (renaming) {
    return (
      <form
        className="px-2"
        onSubmit={(event) => {
          event.preventDefault();
          submitRename();
        }}
      >
        <label className="sr-only" htmlFor={renameId}>
          List name
        </label>
        <Input
          ref={inputRef}
          id={renameId}
          value={name}
          maxLength={LIST_NAME_MAX}
          disabled={pending}
          onChange={(event) => setName(event.target.value)}
          onBlur={submitRename}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              cancelRename();
            }
          }}
        />
      </form>
    );
  }

  return (
    <div
      className={cn(
        "group flex items-center gap-0.5 rounded-lg px-1",
        selected && "bg-muted",
      )}
    >
      <Link
        href={href}
        aria-current={selected ? "page" : undefined}
        onClick={onNavigate}
        className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-sm"
      >
        <span className="truncate font-medium">{list.name}</span>
        <span className="text-muted-foreground ml-auto tabular-nums">
          {list.taskCount}
        </span>
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100"
            aria-label={`List actions for ${list.name}`}
          >
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={startRename}>Rename</DropdownMenuItem>
          {list.isDefault ? null : (
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setDeleteOpen(true)}
            >
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {list.isDefault ? null : (
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {list.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the list and its {taskLabel}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
              <Button
                type="button"
                variant="destructive"
                disabled={pending}
                onClick={confirmDelete}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
