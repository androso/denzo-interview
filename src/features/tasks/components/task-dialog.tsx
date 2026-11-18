"use client";

import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";

import { deleteTask, updateTask } from "@/features/tasks/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ListDto } from "@/features/lists/models";
import {
  TASK_DETAILS_MAX,
  isTaskStatus,
  TASK_STATUS_LABELS,
  TASK_STATUSES,
  TASK_TITLE_MAX,
  type TaskDto,
  type TaskStatus,
  type TaskUpdate,
} from "@/features/tasks/models";

export function TaskDialog({
  task,
  lists,
  open,
  onOpenChange,
}: {
  task: TaskDto | null;
  lists: ListDto[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {task ? (
        <TaskDialogForm
          key={task.id}
          task={task}
          lists={lists}
          onClose={() => onOpenChange(false)}
        />
      ) : null}
    </Dialog>
  );
}

function TaskDialogForm({
  task,
  lists,
  onClose,
}: {
  task: TaskDto;
  lists: ListDto[];
  onClose: () => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [details, setDetails] = useState(task.details ?? "");
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [listId, setListId] = useState(task.listId);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const nextTitle = title.trim();
    const nextDetails = details.trim() ? details.trim() : null;
    const update: TaskUpdate = {};

    if (nextTitle !== task.title) update.title = nextTitle;
    if (nextDetails !== (task.details ?? null)) update.details = nextDetails;
    if (status !== task.status) update.status = status;
    if (listId !== task.listId) update.listId = listId;

    if (Object.keys(update).length === 0) {
      onClose();
      return;
    }

    startTransition(async () => {
      const result = await updateTask(task.id, update);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      onClose();
    });
  }

  function onDelete() {
    if (pending) return;

    startTransition(async () => {
      const result = await deleteTask(task.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setConfirmDelete(false);
      onClose();
    });
  }

  return (
    <>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <form onSubmit={onSave} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Edit task</DialogTitle>
          </DialogHeader>
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Title</span>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={TASK_TITLE_MAX}
              required
              disabled={pending}
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Details</span>
            <Textarea
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              maxLength={TASK_DETAILS_MAX}
              disabled={pending}
              rows={5}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Status</span>
              <Select
                value={status}
                onValueChange={(value) => {
                  if (!isTaskStatus(value)) return;
                  setStatus(value);
                }}
                disabled={pending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {TASK_STATUS_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">List</span>
              <Select
                value={listId}
                onValueChange={setListId}
                disabled={pending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {lists.map((list) => (
                    <SelectItem key={list.id} value={list.id}>
                      {list.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </Button>
            <Button type="submit" disabled={pending || !title.trim()}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete “{task.title}”.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={(event) => {
                event.preventDefault();
                onDelete();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
