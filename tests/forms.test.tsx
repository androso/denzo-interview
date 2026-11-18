// @vitest-environment jsdom
import { Component, type ReactNode } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { NewListForm } from "@/features/lists/components/new-list-form";
import { QuickAdd } from "@/features/tasks/components/quick-add";
import { SidebarListItem } from "@/features/lists/components/sidebar-list-item";
import { TaskDialog } from "@/features/tasks/components/task-dialog";
import type { ListDto } from "@/features/lists/models";
import type { TaskDto } from "@/features/tasks/models";

const mocks = vi.hoisted(() => ({
  createList: vi.fn(),
  renameList: vi.fn(),
  deleteList: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
  error: vi.fn(),
}));
vi.mock("@/features/lists/actions", () => mocks);
vi.mock("@/features/tasks/actions", () => mocks);
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, replace: mocks.replace }),
}));
vi.mock("sonner", () => ({ toast: { error: mocks.error } }));

const list: ListDto = {
  id: "list-id",
  name: "Work",
  isDefault: false,
  taskCount: 1,
};
const task: TaskDto = {
  id: "task-id",
  listId: list.id,
  title: "Original",
  details: null,
  status: "todo",
};

beforeEach(() => {
  vi.resetAllMocks();
});
afterEach(cleanup);

function submit(input: HTMLElement) {
  fireEvent.submit(input.closest("form")!);
}

it("keeps quick-add text on a returned failure and clears it after a successful retry", async () => {
  mocks.createTask
    .mockResolvedValueOnce({ ok: false, error: "List not found." })
    .mockResolvedValueOnce({ ok: true, data: task });
  render(<QuickAdd listId={list.id} />);
  const input = screen.getByRole("textbox", {
    name: "Add a task",
  }) as HTMLInputElement;
  fireEvent.change(input, { target: { value: "  Draft  " } });
  submit(input);
  await waitFor(() =>
    expect(mocks.error).toHaveBeenCalledWith("List not found."),
  );
  expect(input.value).toBe("  Draft  ");
  await waitFor(() => expect(input.disabled).toBe(false));
  submit(input);
  await waitFor(() => expect(input.value).toBe(""));
  expect(mocks.createTask).toHaveBeenLastCalledWith(list.id, "Draft");
});

it("keeps a new-list name on server failure and navigates only after success", async () => {
  const onNavigate = vi.fn();
  mocks.createList
    .mockResolvedValueOnce({ ok: false, error: "Server refused the name." })
    .mockResolvedValueOnce({ ok: true, data: list });
  render(<NewListForm onNavigate={onNavigate} />);
  fireEvent.click(screen.getByRole("button", { name: "+ New list" }));
  const input = screen.getByRole("textbox", {
    name: "New list name",
  }) as HTMLInputElement;
  expect(document.activeElement).toBe(input);
  fireEvent.change(input, { target: { value: "  Draft  " } });
  submit(input);
  await waitFor(() =>
    expect(mocks.error).toHaveBeenCalledWith("Server refused the name."),
  );
  expect(input.value).toBe("  Draft  ");
  expect(mocks.push).not.toHaveBeenCalled();
  await waitFor(() => expect(input.disabled).toBe(false));
  submit(input);
  await waitFor(() =>
    expect(mocks.push).toHaveBeenCalledWith(`/?list=${list.id}`),
  );
  expect(onNavigate).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("textbox")).toBeNull();
});

it("prevents duplicate new-list submissions while a request is pending", async () => {
  let resolve!: (result: unknown) => void;
  mocks.createList.mockReturnValue(
    new Promise((result) => {
      resolve = result;
    }),
  );
  render(<NewListForm />);
  fireEvent.click(screen.getByRole("button", { name: "+ New list" }));
  const input = screen.getByRole("textbox");
  fireEvent.change(input, { target: { value: "Draft" } });
  submit(input);
  submit(input);
  expect(mocks.createList).toHaveBeenCalledTimes(1);
  await act(async () => {
    resolve({ ok: false, error: "Try again." });
  });
});

it("cancels new-list input with Escape without sending a request", () => {
  render(<NewListForm />);
  fireEvent.click(screen.getByRole("button", { name: "+ New list" }));
  const input = screen.getByRole("textbox");
  fireEvent.change(input, { target: { value: "Draft" } });
  fireEvent.keyDown(input, { key: "Escape" });
  expect(screen.queryByRole("textbox")).toBeNull();
  expect(mocks.createList).not.toHaveBeenCalled();
});

it("releases the rename guard after a returned server failure", async () => {
  mocks.renameList
    .mockResolvedValueOnce({ ok: false, error: "Rename refused." })
    .mockResolvedValueOnce({ ok: true, data: { ...list, name: "Renamed" } });
  render(<SidebarListItem list={list} selected />);
  fireEvent.keyDown(
    screen.getByRole("button", { name: "List actions for Work" }),
    { key: "Enter" },
  );
  fireEvent.click(await screen.findByRole("menuitem", { name: "Rename" }));
  const input = screen.getByRole("textbox", {
    name: "List name",
  }) as HTMLInputElement;
  fireEvent.change(input, { target: { value: "Renamed" } });
  submit(input);
  await waitFor(() =>
    expect(mocks.error).toHaveBeenCalledWith("Rename refused."),
  );
  await waitFor(() => expect(input.disabled).toBe(false));
  expect(input.value).toBe("Renamed");
  submit(input);
  await waitFor(() => expect(screen.queryByRole("textbox")).toBeNull());
  expect(mocks.renameList).toHaveBeenCalledTimes(2);
});

it("preserves unsaved task edits after a returned server failure", async () => {
  mocks.updateTask.mockResolvedValue({ ok: false, error: "Save refused." });
  const onOpenChange = vi.fn();
  render(
    <TaskDialog task={task} lists={[list]} open onOpenChange={onOpenChange} />,
  );
  const title = screen.getByRole("textbox", {
    name: "Title",
  }) as HTMLInputElement;
  fireEvent.change(title, { target: { value: "Unsaved title" } });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() =>
    expect(mocks.error).toHaveBeenCalledWith("Save refused."),
  );
  expect(title.value).toBe("Unsaved title");
  expect(onOpenChange).not.toHaveBeenCalled();
});

class ErrorBoundary extends Component<
  { children: ReactNode; onError: (error: Error) => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    this.props.onError(error);
  }
  render() {
    return this.state.failed ? <p>Request failed</p> : this.props.children;
  }
}

it("preserves the existing error-boundary behavior for a rejected request", async () => {
  const error = new Error("Connection lost");
  const onError = vi.fn();
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  mocks.createList.mockRejectedValue(error);
  try {
    render(
      <ErrorBoundary onError={onError}>
        <NewListForm />
      </ErrorBoundary>,
    );
    fireEvent.click(screen.getByRole("button", { name: "+ New list" }));
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Draft" } });
    submit(input);
    await screen.findByText("Request failed");
    expect(onError).toHaveBeenCalledWith(error);
    expect(mocks.push).not.toHaveBeenCalled();
  } finally {
    consoleError.mockRestore();
  }
});
