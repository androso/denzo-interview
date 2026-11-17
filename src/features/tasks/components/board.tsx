"use client";

import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";

import { updateTask } from "@/features/tasks/actions";
import { BoardColumn } from "@/features/tasks/components/board-column";
import { TaskDialog } from "@/features/tasks/components/task-dialog";
import type { Task } from "@/db/schema";
import type { ListWithCount } from "@/features/lists/models";
import { TASK_STATUSES, type TaskStatus } from "@/features/tasks/models";

export function Board({
  list,
  tasks,
  lists,
}: {
  list: ListWithCount;
  tasks: Task[];
  lists: ListWithCount[];
}) {
  const [optimisticTasks, setOptimisticStatus] = useOptimistic(
    tasks,
    (current, next: { id: string; status: TaskStatus }) =>
      current.map((task) =>
        task.id === next.id ? { ...task, status: next.status } : task,
      ),
  );
  const [, startTransition] = useTransition();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  function changeStatus(task: Task, status: TaskStatus) {
    if (task.status === status) return;

    startTransition(async () => {
      setOptimisticStatus({ id: task.id, status });
      const result = await updateTask(task.id, { status });
      if (!result.ok) {
        toast.error(result.error);
      }
    });
  }

  return (
    <section className="min-w-0 flex-1 overflow-auto p-4 md:p-6">
      <h2 className="mb-4 text-lg font-medium">{list.name}</h2>
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        {TASK_STATUSES.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            listId={list.id}
            tasks={optimisticTasks.filter((task) => task.status === status)}
            onOpenTask={setSelectedTask}
            onStatusChange={changeStatus}
          />
        ))}
      </div>
      <TaskDialog
        task={selectedTask}
        lists={lists}
        open={selectedTask !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedTask(null);
        }}
      />
    </section>
  );
}
