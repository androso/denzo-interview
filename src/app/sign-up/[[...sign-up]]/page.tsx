import { SignUp } from "@clerk/nextjs";
import { Suspense } from "react";

import { AuthSkeleton } from "@/components/auth-skeleton";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Suspense fallback={<AuthSkeleton label="Loading sign up" />}>
        <SignUp />
      </Suspense>
    </div>
  );
}
