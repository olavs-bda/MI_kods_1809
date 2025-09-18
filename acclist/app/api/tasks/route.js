import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/supabase";

// GET /api/tasks - Fetch user's tasks
export async function GET(request) {
  try {
    const { user } = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const priority = url.searchParams.get("priority");
    const limit = parseInt(url.searchParams.get("limit")) || 50;
    const offset = parseInt(url.searchParams.get("offset")) || 0;

    let query = supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("due_date", { ascending: true })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status) {
      query = query.eq("status", status);
    }
    if (priority) {
      query = query.eq("priority", priority);
    }

    const { data: tasks, error } = await query;

    if (error) {
      console.error("Failed to fetch tasks:", error);
      return NextResponse.json(
        { error: "Failed to fetch tasks", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Error in GET /api/tasks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create new task
export async function POST(request) {
  try {
    const { user } = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, due_date, priority = "medium" } = body;

    // Validate required fields
    if (!title || !due_date) {
      return NextResponse.json(
        { error: "Missing required fields: title and due_date" },
        { status: 400 }
      );
    }

    // Validate priority
    if (!["low", "medium", "high"].includes(priority)) {
      return NextResponse.json(
        { error: "Priority must be one of: low, medium, high" },
        { status: 400 }
      );
    }

    // Validate due date
    const dueDate = new Date(due_date);
    if (isNaN(dueDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid due_date format" },
        { status: 400 }
      );
    }

    const { data: task, error } = await supabase
      .from("tasks")
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        due_date: dueDate.toISOString(),
        priority,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create task:", error);
      return NextResponse.json(
        { error: "Failed to create task", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/tasks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
