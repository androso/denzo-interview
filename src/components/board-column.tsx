"use client";

import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";

import { createTask } from "@/app/actions";
import { BoardCard } from "@/components/board-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Task } from "@/db/schema";
import {
  TASK_STATUS_LABELS,
  TASK_TITLE_MAX,
  type TaskStatus,
} from "@/lib/models";

export function BoardColumn({
  status,
  listId,
  tasks,
  onOpenTask,
  onStatusChange,
}: {
  status: TaskStatus;
  listId: string;
  tasks: Task[];
  onOpenTask: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
}) {
  const [collapsed, setCollapsed] = useState(status === "done");
  const hideCards = status === "done" && collapsed;

  return (
    <section className="bg-muted/40 flex w-full min-w-0 flex-col gap-2 rounded-xl border p-3 md:w-72 md:shrink-0">
      <header className="flex items-center gap-2">
        {status === "done" ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-w-0 flex-1 justify-start"
            onClick={() => setCollapsed((value) => !value)}
            aria-expanded={!collapsed}
          >
            {collapsed ? <ChevronRightIcon /> : <ChevronDownIcon />}
            <span className="truncate">{TASK_STATUS_LABELS[status]}</span>
            <span className="text-muted-foreground">{tasks.length}</span>
          </Button>
        ) : (
          <div className="flex min-w-0 flex-1 items-center justify-between gap-2 px-1 py-1 text-sm font-medium">
            <span className="truncate">{TASK_STATUS_LABELS[status]}</span>
            <span className="text-muted-foreground">{tasks.length}</span>
          </div>
        )}
      </header>
      {hideCards ? null : (
        <ul className="flex flex-col gap-2">
          {tasks.map((task) => (
            <li key={task.id}>
              <BoardCard
                task={task}
                onOpen={() => onOpenTask(task)}
                onStatusChange={(next) => onStatusChange(task, next)}
              />
            </li>
          ))}
        </ul>
      )}
      {status === "todo" ? <QuickAdd listId={listId} /> : null}
    </section>
  );
}

function QuickAdd({ listId }: { listId: string }) {
  const [title, setTitle] = useState("");
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextTitle = title.trim();
    if (!nextTitle || pending) return;

    startTransition(async () => {
      const result = await createTask(listId, nextTitle);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setTitle("");
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-1">
      <Input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Add a task"
        maxLength={TASK_TITLE_MAX}
        disabled={pending}
        aria-label="Add a task"
        autoComplete="off"
      />
    </form>
  );
}
