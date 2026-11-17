import { AuthSkeleton } from "@/components/auth-skeleton";

export default function SignInLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <AuthSkeleton label="Loading sign in" />
    </div>
  );
}
