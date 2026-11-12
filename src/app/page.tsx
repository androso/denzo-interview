import { currentUser } from "@clerk/nextjs/server";
import { Suspense } from "react";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Hello world</h1>
      <Suspense>
        <Greeting />
      </Suspense>
    </main>
  );
}

async function Greeting() {
  const user = await currentUser();

  if (!user?.firstName) {
    return null;
  }

  return <p className="text-lg">Hello, {user.firstName}</p>;
}
