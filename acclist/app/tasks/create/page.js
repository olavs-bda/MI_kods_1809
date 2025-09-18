"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/button";
import TaskForm from "@/components/tasks/task-form";

export default function CreateTaskPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Access Required</h2>
          <p className="text-lg text-muted-foreground">
            You need to be signed in to create tasks
          </p>
          <Button asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleSuccess = (task) => {
    // Navigate back to dashboard with success message
    router.push("/dashboard?created=true");
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            asChild
          >
            <Link href="/dashboard">← Back to Dashboard</Link>
          </Button>
        </div>

        <div className="text-center max-w-2xl mx-auto mb-8">
          <h1 className="text-3xl font-bold mb-4">Create New Task</h1>
          <p className="text-lg text-muted-foreground">
            Add social accountability to your goals. Set a deadline, and we'll
            make sure you stay committed with escalating notifications to your
            chosen contacts.
          </p>
        </div>
      </div>

      <TaskForm
        onSuccess={handleSuccess}
        onCancel={() => router.push("/dashboard")}
      />

      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-blue-600 text-xl">💡</div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">
                Pro Tips for Effective Tasks
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Make your title specific and actionable</li>
                <li>• Set realistic but challenging deadlines</li>
                <li>
                  • Choose the right priority level - it affects escalation
                  intensity
                </li>
                <li>• Add accountability contacts after creating your task</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
