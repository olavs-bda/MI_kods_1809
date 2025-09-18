"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button, { LoadingSpinner } from "@/components/ui/button";
import { Input, FormField, Select, Textarea } from "@/components/ui/form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function TaskForm({
  task = null,
  onSuccess = null,
  onCancel = null,
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    title: task?.title || "",
    description: task?.description || "",
    due_date:
      task?.due_date ? new Date(task.due_date).toISOString().split("T")[0] : "",
    priority: task?.priority || "medium",
  });

  const isEditing = !!task;

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate form
      if (!formData.title.trim()) {
        throw new Error("Title is required");
      }
      if (!formData.due_date) {
        throw new Error("Due date is required");
      }

      // Prepare data
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        due_date: new Date(formData.due_date + "T23:59:59").toISOString(),
        priority: formData.priority,
      };

      const url = isEditing ? `/api/tasks/${task.id}` : "/api/tasks";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(taskData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || `Failed to ${isEditing ? "update" : "create"} task`
        );
      }

      // Success
      if (onSuccess) {
        onSuccess(result.task);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const priorityOptions = [
    {
      value: "low",
      label: "🟢 Low Priority",
      description: "Nice to have, no rush",
    },
    {
      value: "medium",
      label: "🟡 Medium Priority",
      description: "Important but flexible",
    },
    {
      value: "high",
      label: "🔴 High Priority",
      description: "Critical, must be done!",
    },
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Task" : "Create New Task"}</CardTitle>
      </CardHeader>

      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {error && (
            <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20">
              {error}
            </div>
          )}

          <FormField
            label="Task Title"
            required
          >
            <Input
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="What do you need to get done?"
              maxLength={200}
              required
            />
          </FormField>

          <FormField label="Description">
            <Textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Add details about this task (optional)"
              rows={3}
              maxLength={1000}
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Due Date"
              required
            >
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => handleInputChange("due_date", e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                required
              />
            </FormField>

            <FormField label="Priority Level">
              <Select
                value={formData.priority}
                onChange={(e) => handleInputChange("priority", e.target.value)}
              >
                {priorityOptions.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          {/* Priority explanation */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Priority levels affect escalation intensity:</strong>
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              {priorityOptions.map((option) => (
                <li
                  key={option.value}
                  className={
                    formData.priority === option.value ?
                      "font-medium text-foreground"
                    : ""
                  }
                >
                  {option.label}: {option.description}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading && (
                <LoadingSpinner
                  size="sm"
                  className="mr-2"
                />
              )}
              {loading ?
                isEditing ?
                  "Updating..."
                : "Creating..."
              : isEditing ?
                "Update Task"
              : "Create Task"}
            </Button>

            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
