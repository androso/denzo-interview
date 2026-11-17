"use client";

import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";

import { createTask } from "@/features/tasks/actions";
import { Input } from "@/components/ui/input";
import { TASK_TITLE_MAX } from "@/features/tasks/models";

export function QuickAdd({ listId }: { listId: string }) {
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
