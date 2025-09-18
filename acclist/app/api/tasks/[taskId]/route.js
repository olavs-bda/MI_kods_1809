import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/supabase";

// GET /api/tasks/[taskId] - Fetch specific task
export async function GET(request, { params }) {
  try {
    const { user } = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = params;

    const { data: task, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("Failed to fetch task:", error);
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Error in GET /api/tasks/[taskId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/tasks/[taskId] - Update specific task
export async function PUT(request, { params }) {
  try {
    const { user } = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = params;
    const body = await request.json();
    const { title, description, due_date, priority, status } = body;

    // Build update object with only provided fields
    const updateData = {};

    if (title !== undefined) {
      if (!title.trim()) {
        return NextResponse.json(
          { error: "Title cannot be empty" },
          { status: 400 }
        );
      }
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (due_date !== undefined) {
      const dueDate = new Date(due_date);
      if (isNaN(dueDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid due_date format" },
          { status: 400 }
        );
      }
      updateData.due_date = dueDate.toISOString();
    }

    if (priority !== undefined) {
      if (!["low", "medium", "high"].includes(priority)) {
        return NextResponse.json(
          { error: "Priority must be one of: low, medium, high" },
          { status: 400 }
        );
      }
      updateData.priority = priority;
    }

    if (status !== undefined) {
      if (!["pending", "completed", "failed"].includes(status)) {
        return NextResponse.json(
          { error: "Status must be one of: pending, completed, failed" },
          { status: 400 }
        );
      }
      updateData.status = status;

      // Set completed_at timestamp when marking as completed
      if (status === "completed") {
        updateData.completed_at = new Date().toISOString();
      } else {
        updateData.completed_at = null;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const { data: task, error } = await supabase
      .from("tasks")
      .update(updateData)
      .eq("id", taskId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Failed to update task:", error);
      return NextResponse.json(
        { error: "Failed to update task", details: error.message },
        { status: 500 }
      );
    }

    // Cancel pending escalations when task is completed
    if (status === "completed") {
      try {
        // First get escalation policy IDs for this task
        const { data: policies } = await supabase
          .from("escalation_policies")
          .select("id")
          .eq("task_id", taskId);

        if (policies && policies.length > 0) {
          const policyIds = policies.map((p) => p.id);
          const { error: escalationError } = await supabase
            .from("escalations")
            .update({ status: "cancelled" })
            .in("policy_id", policyIds)
            .eq("status", "pending");

          if (escalationError) {
            console.error("Failed to cancel escalations:", escalationError);
          }
        }
      } catch (escalationCancelError) {
        console.error("Error cancelling escalations:", escalationCancelError);
        // Don't fail the request if escalation cancellation fails
      }
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Error in PUT /api/tasks/[taskId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[taskId] - Delete specific task
export async function DELETE(request, { params }) {
  try {
    const { user } = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = params;

    // First check if task exists and belongs to user
    const { data: existingTask, error: checkError } = await supabase
      .from("tasks")
      .select("id")
      .eq("id", taskId)
      .eq("user_id", user.id)
      .single();

    if (checkError || !existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Cancel any pending escalations for this task
    try {
      // First get escalation policy IDs for this task
      const { data: policies } = await supabase
        .from("escalation_policies")
        .select("id")
        .eq("task_id", taskId);

      if (policies && policies.length > 0) {
        const policyIds = policies.map((p) => p.id);
        const { error: escalationError } = await supabase
          .from("escalations")
          .update({ status: "cancelled" })
          .in("policy_id", policyIds)
          .eq("status", "pending");

        if (escalationError) {
          console.error(
            "Failed to cancel escalations before delete:",
            escalationError
          );
        }
      }
    } catch (escalationCancelError) {
      console.error(
        "Error cancelling escalations before delete:",
        escalationCancelError
      );
      // Don't fail the request if escalation cancellation fails
    }

    // Delete the task
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", taskId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Failed to delete task:", error);
      return NextResponse.json(
        { error: "Failed to delete task", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Task deleted successfully",
      taskId,
    });
  } catch (error) {
    console.error("Error in DELETE /api/tasks/[taskId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
