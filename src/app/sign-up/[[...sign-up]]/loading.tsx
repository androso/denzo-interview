import { AuthSkeleton } from "@/components/auth-skeleton";

export default function SignUpLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <AuthSkeleton label="Loading sign up" />
    </div>
  );
}
