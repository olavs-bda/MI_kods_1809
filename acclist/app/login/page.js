import AuthForm from "@/components/auth/auth-form";

export const metadata = {
  title: "Login | AccountaList",
  description: "Sign in to your AccountaList account",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight">
            Welcome to AccountaList
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The social accountability app that helps you get things done
          </p>
        </div>
        <AuthForm />
      </div>
    </div>
  );
}
