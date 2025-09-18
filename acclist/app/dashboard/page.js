"use client";

import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

export default function DashboardPage() {
  const { user, isLoading, signOut } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">
            You need to be signed in to view this page
          </p>
          <Link
            href="/login"
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <button
            onClick={() => signOut()}
            className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground"
          >
            Sign Out
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">Tasks</h2>
            <p className="text-muted-foreground mb-4">
              You have no tasks yet. Create your first task to get started.
            </p>
            <button className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium">
              Create Task
            </button>
          </div>

          <div className="bg-card p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">Contacts</h2>
            <p className="text-muted-foreground mb-4">
              Add accountability contacts who will be notified if you miss
              deadlines.
            </p>
            <button className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium">
              Add Contact
            </button>
          </div>

          <div className="bg-card p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">Receipts</h2>
            <p className="text-muted-foreground mb-4">
              View your escalation history and delivery confirmations.
            </p>
            <button className="w-full bg-secondary text-secondary-foreground py-2 rounded-md font-medium">
              View Receipts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
