// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { Board } from "@/features/tasks/components/board";
import type { Task } from "@/db/schema";
import type { ListWithCount } from "@/features/lists/models";
import type { TaskStatus } from "@/features/tasks/models";
import type { ActionResult } from "@/lib/action-result";

const mocks = vi.hoisted(() => ({ updateTask: vi.fn(), error: vi.fn() }));
vi.mock("@/features/tasks/actions", () => ({ updateTask: mocks.updateTask }));
vi.mock("sonner", () => ({ toast: { error: mocks.error } }));
vi.mock("@/features/tasks/components/task-dialog", () => ({
  TaskDialog: () => null,
}));
// Keep the real Board and React optimistic state; replace only the column UI.
vi.mock("@/features/tasks/components/board-column", () => ({
  BoardColumn: ({
    status,
    tasks,
    onStatusChange,
  }: {
    status: TaskStatus;
    tasks: Task[];
    onStatusChange: (task: Task, status: TaskStatus) => void;
  }) => (
    <section aria-label={status}>
      {tasks.map((task) => (
        <div key={task.id} data-testid="task" data-status={task.status}>
          {task.title}
          <button onClick={() => onStatusChange(task, "in_progress")}>
            Start
          </button>
          <button onClick={() => onStatusChange(task, "done")}>Finish</button>
        </div>
      ))}
    </section>
  ),
}));

const list: ListWithCount = {
  id: "list-id",
  userId: "alice",
  name: "Work",
  isDefault: false,
  createdAt: new Date(),
  taskCount: 1,
};
const task: Task = {
  id: "task-id",
  userId: "alice",
  listId: list.id,
  title: "Draft",
  details: null,
  status: "todo",
  createdAt: new Date(),
  updatedAt: new Date(),
};
function deferred() {
  let resolve!: (result: ActionResult<Task>) => void;
  const promise = new Promise<ActionResult<Task>>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function currentStatus() {
  return screen.getByTestId("task").getAttribute("data-status");
}
beforeEach(() => {
  vi.resetAllMocks();
});
afterEach(cleanup);

it("rolls back a failed optimistic status change and permits a retry", async () => {
  const request = deferred();
  mocks.updateTask
    .mockReturnValueOnce(request.promise)
    .mockResolvedValueOnce({ ok: false, error: "Retry refused." });
  render(<Board list={list} lists={[list]} tasks={[task]} />);
  fireEvent.click(screen.getByRole("button", { name: "Start" }));
  expect(currentStatus()).toBe("in_progress");
  await act(async () => {
    request.resolve({ ok: false, error: "Update refused." });
  });
  await waitFor(() => expect(currentStatus()).toBe("todo"));
  expect(mocks.error).toHaveBeenCalledWith("Update refused.");
  fireEvent.click(screen.getByRole("button", { name: "Start" }));
  await waitFor(() => expect(mocks.updateTask).toHaveBeenCalledTimes(2));
});

it("keeps rapid successive optimistic changes until both requests settle", async () => {
  const first = deferred();
  const second = deferred();
  mocks.updateTask
    .mockReturnValueOnce(first.promise)
    .mockReturnValueOnce(second.promise);
  render(<Board list={list} lists={[list]} tasks={[task]} />);
  fireEvent.click(screen.getByRole("button", { name: "Start" }));
  fireEvent.click(screen.getByRole("button", { name: "Finish" }));
  expect(currentStatus()).toBe("done");
  expect(mocks.updateTask.mock.calls).toEqual([
    [task.id, { status: "in_progress" }],
    [task.id, { status: "done" }],
  ]);
  await act(async () => {
    second.resolve({ ok: false, error: "Second refused." });
  });
  expect(currentStatus()).toBe("done");
  await act(async () => {
    first.resolve({ ok: false, error: "First refused." });
  });
  await waitFor(() => expect(currentStatus()).toBe("todo"));
  expect(mocks.error).toHaveBeenCalledWith("First refused.");
  expect(mocks.error).toHaveBeenCalledWith("Second refused.");
});

it("uses refreshed server data after a successful optimistic change", async () => {
  const request = deferred();
  mocks.updateTask.mockReturnValue(request.promise);
  const { rerender } = render(
    <Board list={list} lists={[list]} tasks={[task]} />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Finish" }));
  const updated: Task = { ...task, status: "done" };
  rerender(<Board list={list} lists={[list]} tasks={[updated]} />);
  await act(async () => {
    request.resolve({ ok: true, data: updated });
  });
  expect(currentStatus()).toBe("done");
  expect(mocks.error).not.toHaveBeenCalled();
});
