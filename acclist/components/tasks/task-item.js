"use client";

import { useState } from "react";
import Button, { LoadingSpinner } from "@/components/ui/button";

export default function TaskItem({ task, onUpdate, onDelete }) {
  const [loading, setLoading] = useState(false);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getTimeUntilDue = (dueDateString) => {
    const dueDate = new Date(dueDateString);
    const now = new Date();
    const diffTime = dueDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)} days overdue`, isOverdue: true };
    } else if (diffDays === 0) {
      return { text: "Due today", isDueToday: true };
    } else if (diffDays === 1) {
      return { text: "Due tomorrow", isDueSoon: true };
    } else if (diffDays <= 3) {
      return { text: `Due in ${diffDays} days`, isDueSoon: true };
    } else {
      return { text: `Due in ${diffDays} days`, isNormal: true };
    }
  };

  const handleStatusToggle = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const newStatus = task.status === "completed" ? "pending" : "completed";

      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update task");
      }

      onUpdate(result.task);
    } catch (error) {
      console.error("Failed to update task:", error);
      // TODO: Show toast notification
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (loading) return;
    if (!confirm("Are you sure you want to delete this task?")) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to delete task");
      }

      onDelete(task.id);
    } catch (error) {
      console.error("Failed to delete task:", error);
      // TODO: Show toast notification
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-100";
      case "medium":
        return "text-amber-600 bg-amber-100";
      case "low":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "high":
        return "🔴";
      case "medium":
        return "🟡";
      case "low":
        return "🟢";
      default:
        return "⚪";
    }
  };

  const timeInfo = getTimeUntilDue(task.due_date);
  const isCompleted = task.status === "completed";

  return (
    <div
      className={`border rounded-lg p-4 transition-all hover:shadow-sm ${
        isCompleted ? "bg-green-50 border-green-200"
        : timeInfo.isOverdue ? "bg-red-50 border-red-200"
        : timeInfo.isDueToday ? "bg-amber-50 border-amber-200"
        : "bg-white border-gray-200"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {/* Task Title */}
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={handleStatusToggle}
              disabled={loading}
              className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                isCompleted ?
                  "bg-green-500 border-green-500 text-white"
                : "border-gray-300 hover:border-green-500"
              }`}
            >
              {loading ?
                <LoadingSpinner size="sm" />
              : isCompleted ?
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              : null}
            </button>

            <h3
              className={`text-lg font-semibold ${isCompleted ? "line-through text-muted-foreground" : ""}`}
            >
              {task.title}
            </h3>

            <span
              className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}`}
            >
              {getPriorityIcon(task.priority)} {task.priority.toUpperCase()}
            </span>
          </div>

          {/* Description */}
          {task.description && (
            <p
              className={`text-sm mb-3 ${isCompleted ? "line-through text-muted-foreground" : "text-gray-600"}`}
            >
              {task.description}
            </p>
          )}

          {/* Due Date Info */}
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">
              Due: {formatDate(task.due_date)}
            </span>
            <span
              className={`font-medium ${
                timeInfo.isOverdue ? "text-red-600"
                : timeInfo.isDueToday ? "text-amber-600"
                : timeInfo.isDueSoon ? "text-orange-600"
                : "text-muted-foreground"
              }`}
            >
              {timeInfo.text}
            </span>
          </div>

          {/* Completion Date */}
          {isCompleted && task.completed_at && (
            <div className="text-sm text-green-600 mt-2">
              ✅ Completed {formatDate(task.completed_at)}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (window.location.href = `/tasks/${task.id}/edit`)}
            disabled={loading}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={loading}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
