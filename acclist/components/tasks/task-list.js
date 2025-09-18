"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/form";
import TaskItem from "./task-item";

export default function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
    sortBy: "due_date",
  });

  useEffect(() => {
    fetchTasks();
  }, [filters]);

  const fetchTasks = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (filters.status !== "all") params.append("status", filters.status);
      if (filters.priority !== "all")
        params.append("priority", filters.priority);

      const response = await fetch(`/api/tasks?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch tasks");
      }

      let sortedTasks = result.tasks;

      // Apply client-side sorting
      if (filters.sortBy === "due_date") {
        sortedTasks = sortedTasks.sort(
          (a, b) => new Date(a.due_date) - new Date(b.due_date)
        );
      } else if (filters.sortBy === "priority") {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        sortedTasks = sortedTasks.sort(
          (a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]
        );
      } else if (filters.sortBy === "created") {
        sortedTasks = sortedTasks.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
      }

      setTasks(sortedTasks);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskUpdate = (updatedTask) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    );
  };

  const handleTaskDelete = (taskId) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({ ...prev, [filterType]: value }));
  };

  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    const pending = tasks.filter((t) => t.status === "pending").length;
    const overdue = tasks.filter(
      (t) => t.status === "pending" && new Date(t.due_date) < new Date()
    ).length;

    return { total, completed, pending, overdue };
  };

  const stats = getTaskStats();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 bg-muted rounded"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={fetchTasks}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Tasks</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-green-600">Completed</p>
          <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-600">In Progress</p>
          <p className="text-2xl font-bold text-blue-700">{stats.pending}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-sm text-red-600">Overdue</p>
          <p className="text-2xl font-bold text-red-700">{stats.overdue}</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Your Tasks</span>
            <div className="flex gap-3">
              <Select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-auto"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </Select>
              <Select
                value={filters.priority}
                onChange={(e) => handleFilterChange("priority", e.target.value)}
                className="w-auto"
              >
                <option value="all">All Priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </Select>
              <Select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                className="w-auto"
              >
                <option value="due_date">Sort by Due Date</option>
                <option value="priority">Sort by Priority</option>
                <option value="created">Sort by Created</option>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent>
          {tasks.length === 0 ?
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
              <p className="text-muted-foreground mb-4">
                {filters.status !== "all" || filters.priority !== "all" ?
                  "No tasks match your current filters."
                : "Create your first task to get started with social accountability!"
                }
              </p>
              {filters.status !== "all" || filters.priority !== "all" ?
                <Button
                  variant="outline"
                  onClick={() =>
                    setFilters({
                      status: "all",
                      priority: "all",
                      sortBy: "due_date",
                    })
                  }
                >
                  Clear Filters
                </Button>
              : <Button
                  onClick={() => (window.location.href = "/tasks/create")}
                >
                  Create Your First Task
                </Button>
              }
            </div>
          : <div className="space-y-4">
              {tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onUpdate={handleTaskUpdate}
                  onDelete={handleTaskDelete}
                />
              ))}
            </div>
          }
        </CardContent>
      </Card>
    </div>
  );
}
