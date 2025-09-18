"use client";

import { useAuth } from "@/lib/auth-context";
import { useState, useEffect } from "react";
import Link from "next/link";
import Button from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import TaskList from "@/components/tasks/task-list";
import ContactList from "@/components/contacts/contact-list";
import { SocialMomentsPanel } from "@/components/ui/social-moments";

export default function DashboardPage() {
  const { user, isLoading, signOut } = useAuth();
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    totalContacts: 0,
    verifiedContacts: 0,
    completionRate: 0,
  });
  const [activeTab, setActiveTab] = useState("tasks");
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);

      // Fetch tasks stats
      const tasksResponse = await fetch("/api/tasks");
      const tasksData = await tasksResponse.json();
      const tasks = tasksData.tasks || [];

      // Fetch contacts stats
      const contactsResponse = await fetch("/api/contacts");
      const contactsData = await contactsResponse.json();
      const contacts = contactsData.contacts || [];

      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(
        (t) => t.status === "completed"
      ).length;
      const totalContacts = contacts.length;
      const verifiedContacts = contacts.filter((c) => c.verified).length;
      const completionRate =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      setStats({
        totalTasks,
        completedTasks,
        totalContacts,
        verifiedContacts,
        completionRate,
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Trust middleware - if user reached this page, they're authenticated
  // Only show loading state while auth context is initializing

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back{user?.email ? `, ${user.email}` : "!"}
          </p>
        </div>
        <div className="flex gap-4">
          <Button asChild>
            <Link href="/tasks/guided">Create Task</Link>
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              await signOut();
              // Force reload to clear any cached state
              window.location.href = "/login";
            }}
          >
            Sign Out
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              </div>
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              asChild
              className="w-full"
            >
              <Link href="/tasks/guided">Create Task</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full"
            >
              <Link href="/contacts">Add Contact</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
              </div>
              Accountability
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center">
              <p className="text-2xl font-bold">
                {loadingStats ? "..." : stats.totalContacts}
              </p>
              <p className="text-sm text-muted-foreground">Total Contacts</p>
              <p className="text-xs text-green-600">
                {loadingStats ? "..." : stats.verifiedContacts} verified
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="w-full"
            >
              <Link href="/contacts">Manage Contacts</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center">
              <p className="text-2xl font-bold">
                {loadingStats ? "..." : `${stats.completionRate}%`}
              </p>
              <p className="text-sm text-muted-foreground">Completion Rate</p>
              <p className="text-xs text-muted-foreground">
                {loadingStats ?
                  "..."
                : `${stats.completedTasks}/${stats.totalTasks} tasks`}
              </p>
            </div>
            <Button
              asChild
              variant="secondary"
              className="w-full"
            >
              <Link href="/receipts">View Receipts</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed interface */}
      <div className="space-y-6">
        <div className="border-b">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("tasks")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "tasks" ?
                  "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Tasks
            </button>
            <button
              onClick={() => setActiveTab("contacts")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "contacts" ?
                  "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Contacts
            </button>
            <button
              onClick={() => setActiveTab("share")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "share" ?
                  "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Share
            </button>
          </nav>
        </div>

        {/* Tab content */}
        <div>
          {activeTab === "tasks" && <TaskList />}
          {activeTab === "contacts" && <ContactList />}
          {activeTab === "share" && user && (
            <SocialMomentsPanel
              user={user}
              stats={stats}
            />
          )}
        </div>
      </div>
    </div>
  );
}
