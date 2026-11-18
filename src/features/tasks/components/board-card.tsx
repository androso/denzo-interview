"use client";

import { AlignLeftIcon, EllipsisVerticalIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  isTaskStatus,
  TASK_STATUS_LABELS,
  TASK_STATUSES,
  type TaskDto,
  type TaskStatus,
} from "@/features/tasks/models";

export function BoardCard({
  task,
  onOpen,
  onStatusChange,
}: {
  task: TaskDto;
  onOpen: () => void;
  onStatusChange: (status: TaskStatus) => void;
}) {
  return (
    <div className="bg-background flex items-start gap-1 rounded-lg border p-1 shadow-xs">
      <button
        type="button"
        className="hover:bg-muted/60 flex min-w-0 flex-1 items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm"
        onClick={onOpen}
      >
        <span className="min-w-0 flex-1 wrap-break-word">{task.title}</span>
        {task.details ? (
          <AlignLeftIcon
            className="text-muted-foreground mt-0.5 size-3.5 shrink-0"
            aria-label="Has details"
          />
        ) : null}
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Change status"
          >
            <EllipsisVerticalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-40">
          <DropdownMenuRadioGroup
            value={task.status}
            onValueChange={(value) => {
              if (!isTaskStatus(value)) return;
              onStatusChange(value);
            }}
          >
            {TASK_STATUSES.map((status) => (
              <DropdownMenuRadioItem key={status} value={status}>
                {TASK_STATUS_LABELS[status]}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
