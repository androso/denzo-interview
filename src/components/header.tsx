import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Suspense } from "react";

import { getCurrentUser } from "@/lib/data";

export function Header() {
  return (
    <header className="flex items-center justify-between border-b px-6 py-4">
      <p className="font-medium">Denzo</p>
      <Suspense fallback={null}>
        <HeaderUser />
      </Suspense>
    </header>
  );
}

async function HeaderUser() {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  const user = await getCurrentUser();

  return (
    <div className="flex items-center gap-3">
      {user ? <p className="text-sm">{user.name}</p> : null}
      <UserButton />
    </div>
  );
}
