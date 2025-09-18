import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/supabase";

// GET /api/escalation-policies - Fetch escalation policies
export async function GET(request) {
  try {
    const { user } = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const taskId = url.searchParams.get("task_id");

    let query = supabase
      .from("escalation_policies")
      .select(
        `
        *,
        tasks:task_id (
          id,
          title,
          user_id
        ),
        contacts:contact_id (
          id,
          name,
          email,
          verified
        )
      `
      )
      .order("level", { ascending: true });

    // Filter by task if specified
    if (taskId) {
      query = query.eq("task_id", taskId);
    }

    // Only get policies for user's tasks
    const { data: policies, error } = await query;

    if (error) {
      console.error("Failed to fetch escalation policies:", error);
      return NextResponse.json(
        {
          error: "Failed to fetch escalation policies",
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Filter to only include policies for user's tasks
    const userPolicies = policies.filter(
      (policy) => policy.tasks && policy.tasks.user_id === user.id
    );

    return NextResponse.json({ policies: userPolicies });
  } catch (error) {
    console.error("Error in GET /api/escalation-policies:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/escalation-policies - Create new escalation policy
export async function POST(request) {
  try {
    const { user } = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { task_id, level, minutes_after_due, contact_id, message_template } =
      body;

    // Validate required fields
    if (
      !task_id ||
      !level ||
      !minutes_after_due ||
      !contact_id ||
      !message_template
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: task_id, level, minutes_after_due, contact_id, message_template",
        },
        { status: 400 }
      );
    }

    // Validate level (1-3)
    if (!Number.isInteger(level) || level < 1 || level > 3) {
      return NextResponse.json(
        { error: "Level must be an integer between 1 and 3" },
        { status: 400 }
      );
    }

    // Validate minutes_after_due
    if (!Number.isInteger(minutes_after_due) || minutes_after_due < 0) {
      return NextResponse.json(
        { error: "minutes_after_due must be a non-negative integer" },
        { status: 400 }
      );
    }

    // Verify task belongs to user
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("id, user_id")
      .eq("id", task_id)
      .eq("user_id", user.id)
      .single();

    if (taskError || !task) {
      return NextResponse.json(
        { error: "Task not found or access denied" },
        { status: 404 }
      );
    }

    // Verify contact belongs to user and is verified
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select("id, verified")
      .eq("id", contact_id)
      .eq("user_id", user.id)
      .single();

    if (contactError || !contact) {
      return NextResponse.json(
        { error: "Contact not found or access denied" },
        { status: 404 }
      );
    }

    if (!contact.verified) {
      return NextResponse.json(
        {
          error:
            "Contact must be verified before assigning to escalation policy",
        },
        { status: 400 }
      );
    }

    // Check if policy with same task and level already exists
    const { data: existingPolicy } = await supabase
      .from("escalation_policies")
      .select("id")
      .eq("task_id", task_id)
      .eq("level", level)
      .single();

    if (existingPolicy) {
      return NextResponse.json(
        {
          error: `Escalation policy level ${level} already exists for this task`,
        },
        { status: 409 }
      );
    }

    // Create the escalation policy
    const { data: policy, error } = await supabase
      .from("escalation_policies")
      .insert({
        task_id,
        level,
        minutes_after_due,
        contact_id,
        message_template: message_template.trim(),
      })
      .select(
        `
        *,
        tasks:task_id (
          id,
          title
        ),
        contacts:contact_id (
          id,
          name,
          email
        )
      `
      )
      .single();

    if (error) {
      console.error("Failed to create escalation policy:", error);
      return NextResponse.json(
        { error: "Failed to create escalation policy", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        policy,
        message: "Escalation policy created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/escalation-policies:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
