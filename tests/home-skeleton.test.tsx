// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";

import Loading from "@/app/loading";
import SignInLoading from "@/app/sign-in/[[...sign-in]]/loading";
import SignUpLoading from "@/app/sign-up/[[...sign-up]]/loading";
import { AuthSkeleton } from "@/components/auth-skeleton";
import { BoardSkeleton, HomeSkeleton } from "@/components/home-skeleton";

afterEach(() => {
  cleanup();
});

it("shows a board skeleton with three columns", () => {
  const { container } = render(<HomeSkeleton />);

  expect(screen.getByRole("status", { name: "Loading board" })).toBeTruthy();
  expect(
    container.querySelectorAll("section > div:last-child > div"),
  ).toHaveLength(3);
});

it("shows a board-only skeleton for list switches", () => {
  const { container } = render(<BoardSkeleton />);

  expect(screen.getByRole("status", { name: "Loading board" })).toBeTruthy();
  expect(container.querySelector("aside")).toBeNull();
  expect(
    container.querySelectorAll("section > div:last-child > div"),
  ).toHaveLength(3);
});

it("shows the home skeleton from root loading.tsx", () => {
  const { container } = render(<Loading />);

  expect(screen.getByRole("status", { name: "Loading board" })).toBeTruthy();
  expect(container.querySelector("aside")).toBeTruthy();
});

it("shows auth skeletons for sign-in and sign-up", () => {
  render(<AuthSkeleton />);
  expect(
    screen.getByRole("status", { name: "Loading authentication" }),
  ).toBeTruthy();

  cleanup();
  render(<SignInLoading />);
  expect(screen.getByRole("status", { name: "Loading sign in" })).toBeTruthy();

  cleanup();
  render(<SignUpLoading />);
  expect(screen.getByRole("status", { name: "Loading sign up" })).toBeTruthy();
});
