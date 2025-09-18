import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * Task 3.1: Escalation Scheduler System
 *
 * This endpoint detects overdue tasks and schedules escalation jobs.
 * Called by Vercel cron job or external scheduler (future: Inngest migration)
 *
 * POST /api/escalation/schedule - Schedule escalations for overdue tasks
 */
export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Validate cron secret for security
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid cron secret" },
        { status: 401 }
      );
    }

    const now = new Date();
    const scheduledEscalations = [];
    const errors = [];

    // Find all overdue tasks that haven't been completed
    const { data: overdueTasks, error: tasksError } = await supabase
      .from("tasks")
      .select(
        `
        *,
        escalation_policies (
          id,
          level,
          minutes_after_due,
          contact_id,
          message_template,
          contacts:contact_id (
            id,
            name,
            email,
            verified
          )
        ),
        profiles:user_id (
          email,
          full_name
        )
      `
      )
      .eq("status", "pending")
      .lt("due_date", now.toISOString())
      .order("due_date", { ascending: true });

    if (tasksError) {
      console.error("Failed to fetch overdue tasks:", tasksError);
      return NextResponse.json(
        { error: "Failed to fetch overdue tasks", details: tasksError.message },
        { status: 500 }
      );
    }

    console.log(`Found ${overdueTasks?.length || 0} overdue tasks`);

    // Process each overdue task
    for (const task of overdueTasks || []) {
      try {
        const dueDate = new Date(task.due_date);
        const minutesOverdue = Math.floor((now - dueDate) / (1000 * 60));

        // Process each escalation policy for this task
        for (const policy of task.escalation_policies || []) {
          // Skip if contact is not verified
          if (!policy.contacts?.verified) {
            console.log(`Skipping policy ${policy.id} - contact not verified`);
            continue;
          }

          // Check if enough time has passed for this escalation level
          if (minutesOverdue >= policy.minutes_after_due) {
            const scheduledFor = new Date(
              dueDate.getTime() + policy.minutes_after_due * 60 * 1000
            );

            // Check if this escalation has already been scheduled/sent
            const { data: existingEscalation } = await supabase
              .from("escalations")
              .select("id, status")
              .eq("policy_id", policy.id)
              .single();

            if (existingEscalation) {
              console.log(
                `Escalation already exists for policy ${policy.id}, status: ${existingEscalation.status}`
              );
              continue;
            }

            // Generate message content based on template and task data
            const messageContent = generateEscalationMessage({
              template: policy.message_template,
              taskTitle: task.title,
              ownerName:
                task.profiles?.full_name || task.profiles?.email || "User",
              ownerEmail: task.profiles?.email,
              contactName: policy.contacts.name,
              escalationLevel: policy.level,
              dueDate: task.due_date,
              minutesOverdue,
            });

            // Schedule the escalation
            const { data: escalation, error: scheduleError } = await supabase
              .from("escalations")
              .insert({
                policy_id: policy.id,
                status: "pending",
                scheduled_for: scheduledFor.toISOString(),
                message_content: messageContent,
              })
              .select("*")
              .single();

            if (scheduleError) {
              console.error(
                `Failed to schedule escalation for policy ${policy.id}:`,
                scheduleError
              );
              errors.push({
                taskId: task.id,
                policyId: policy.id,
                error: scheduleError.message,
              });
              continue;
            }

            scheduledEscalations.push({
              id: escalation.id,
              taskId: task.id,
              policyId: policy.id,
              level: policy.level,
              contactEmail: policy.contacts.email,
              scheduledFor: scheduledFor.toISOString(),
              minutesOverdue,
            });

            console.log(
              `Scheduled escalation ${escalation.id} for task ${task.title} (level ${policy.level})`
            );
          }
        }
      } catch (error) {
        console.error(`Error processing task ${task.id}:`, error);
        errors.push({
          taskId: task.id,
          error: error.message,
        });
      }
    }

    // Return results summary
    return NextResponse.json({
      success: true,
      summary: {
        overdueTasksChecked: overdueTasks?.length || 0,
        escalationsScheduled: scheduledEscalations.length,
        errors: errors.length,
      },
      scheduledEscalations,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Error in escalation scheduler:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Generate escalation message content based on template and task data
 */
function generateEscalationMessage({
  template,
  taskTitle,
  ownerName,
  ownerEmail,
  contactName,
  escalationLevel,
  dueDate,
  minutesOverdue,
}) {
  // Default templates if none provided
  const defaultTemplates = {
    1: `Hi {{contactName}}, {{ownerName}} missed their deadline for "{{taskTitle}}" which was due {{dueDate}}. They've been overdue for {{minutesOverdue}} minutes. As their accountability contact, please check in with them!`,
    2: `{{contactName}}, this is the second escalation! {{ownerName}} still hasn't completed "{{taskTitle}}" ({{minutesOverdue}} minutes overdue). Time for stronger encouragement!`,
    3: `FINAL ESCALATION: {{contactName}}, {{ownerName}} has officially failed their commitment to complete "{{taskTitle}}". Maximum shame mode activated! {{minutesOverdue}} minutes overdue.`,
  };

  const messageTemplate =
    template || defaultTemplates[escalationLevel] || defaultTemplates[1];

  // Replace template variables
  return messageTemplate
    .replace(/\{\{contactName\}\}/g, contactName)
    .replace(/\{\{ownerName\}\}/g, ownerName)
    .replace(/\{\{ownerEmail\}\}/g, ownerEmail)
    .replace(/\{\{taskTitle\}\}/g, taskTitle)
    .replace(/\{\{escalationLevel\}\}/g, escalationLevel.toString())
    .replace(/\{\{dueDate\}\}/g, new Date(dueDate).toLocaleDateString())
    .replace(/\{\{minutesOverdue\}\}/g, minutesOverdue.toString());
}
