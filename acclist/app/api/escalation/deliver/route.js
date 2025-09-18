import { NextResponse } from "next/server";
import { render } from "@react-email/render";
import { supabase } from "@/lib/supabase";
import { resend } from "@/lib/email";
import EscalationEmail from "@/emails/templates/escalation-email";
import {
  EscalationStateManager,
  FAILURE_REASONS,
} from "@/lib/escalation-state";
import { generateShameMessage } from "@/emails/templates/shame-messages";

/**
 * Task 3.2: Escalation Delivery Worker
 *
 * Processes scheduled escalations and delivers them via Resend with retry logic.
 * Implements idempotent delivery to prevent duplicate sends.
 *
 * POST /api/escalation/deliver - Process and deliver pending escalations
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
    const deliveryResults = [];
    const errors = [];

    // Find all pending escalations that should be delivered now
    const { data: pendingEscalations, error: escalationsError } = await supabase
      .from("escalations")
      .select(
        `
        *,
        escalation_policies!inner (
          id,
          level,
          contact_id,
          task_id,
          message_template,
          contacts!inner (
            id,
            name,
            email,
            verified
          ),
          tasks!inner (
            id,
            title,
            description,
            due_date,
            status,
            user_id,
            profiles:user_id (
              email,
              full_name
            )
          )
        )
      `
      )
      .eq("status", "pending")
      .lte("scheduled_for", now.toISOString())
      .order("scheduled_for", { ascending: true });

    if (escalationsError) {
      console.error("Failed to fetch pending escalations:", escalationsError);
      return NextResponse.json(
        {
          error: "Failed to fetch pending escalations",
          details: escalationsError.message,
        },
        { status: 500 }
      );
    }

    console.log(
      `Found ${pendingEscalations?.length || 0} pending escalations to deliver`
    );

    // Process each pending escalation
    for (const escalation of pendingEscalations || []) {
      try {
        const policy = escalation.escalation_policies;
        const contact = policy.contacts;
        const task = policy.tasks;
        const profile = task.profiles;

        // Skip if task is already completed
        if (task.status === "completed") {
          await EscalationStateManager.cancelEscalation(
            escalation.id,
            "task_completed",
            { completed_at: task.completed_at }
          );

          deliveryResults.push({
            escalationId: escalation.id,
            status: "cancelled",
            reason: "Task was completed before escalation could be delivered",
          });
          continue;
        }

        // Skip if contact is not verified
        if (!contact.verified) {
          await EscalationStateManager.handleFailure(
            escalation.id,
            FAILURE_REASONS.CONTACT_NOT_VERIFIED,
            { contact_id: contact.id, failed_at: now.toISOString() }
          );

          errors.push({
            escalationId: escalation.id,
            error: "Contact not verified",
          });
          continue;
        }

        // Attempt to deliver the escalation
        const deliveryResult = await deliverEscalation({
          escalation,
          policy,
          contact,
          task,
          profile,
        });

        if (deliveryResult.success) {
          // Update escalation status to sent using state manager
          await EscalationStateManager.markSent(escalation.id, {
            delivery_receipt: deliveryResult.data,
            message_id: deliveryResult.data?.id,
            provider: "resend",
            sent_at: now.toISOString(),
          });

          deliveryResults.push({
            escalationId: escalation.id,
            status: "sent",
            contactEmail: contact.email,
            messageId: deliveryResult.data?.id,
            level: policy.level,
            taskTitle: task.title,
          });

          console.log(
            `Delivered escalation ${escalation.id} to ${contact.email}`
          );
        } else {
          // Handle delivery failure with enhanced state management
          const failureReason = classifyFailureReason(deliveryResult.error);
          const retryResult = await EscalationStateManager.handleFailure(
            escalation.id,
            failureReason,
            {
              message: deliveryResult.error,
              provider: "resend",
              failed_at: now.toISOString(),
            }
          );

          deliveryResults.push({
            escalationId: escalation.id,
            status: retryResult.willRetry ? "retrying" : "failed",
            error: deliveryResult.error,
            willRetry: retryResult.willRetry,
            nextRetryAt: retryResult.nextRetryAt,
            retryCount: retryResult.retryCount,
          });

          if (!retryResult.willRetry) {
            errors.push({
              escalationId: escalation.id,
              error: deliveryResult.error,
              finalFailure: true,
            });
          }
        }
      } catch (error) {
        console.error(`Error processing escalation ${escalation.id}:`, error);

        // Mark as failed using state manager
        await EscalationStateManager.handleFailure(
          escalation.id,
          FAILURE_REASONS.UNKNOWN_ERROR,
          {
            message: error.message,
            failed_at: now.toISOString(),
          }
        );

        errors.push({
          escalationId: escalation.id,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        pendingEscalationsProcessed: pendingEscalations?.length || 0,
        delivered: deliveryResults.filter((r) => r.status === "sent").length,
        cancelled: deliveryResults.filter((r) => r.status === "cancelled")
          .length,
        failed: errors.filter((e) => e.finalFailure).length,
        retrying: deliveryResults.filter((r) => r.willRetry).length,
      },
      deliveryResults,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Error in escalation delivery worker:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Deliver a single escalation via email
 */
async function deliverEscalation({
  escalation,
  policy,
  contact,
  task,
  profile,
}) {
  try {
    // Calculate how overdue the task is
    const dueDate = new Date(task.due_date);
    const now = new Date();
    const minutesOverdue = Math.floor((now - dueDate) / (1000 * 60));

    // Generate enhanced shame message content
    const shameContent = generateShameMessage({
      escalationLevel: policy.level,
      taskTitle: task.title,
      ownerName: profile.full_name || profile.email,
      ownerEmail: profile.email,
      contactName: contact.name,
      dueDate: task.due_date,
      hoursOverdue: minutesOverdue,
      relationship: contact.relationship || "contact",
      customMessage: escalation.message_content || "",
    });

    // Generate the email HTML using enhanced React Email template
    const emailHtml = render(
      EscalationEmail({
        taskTitle: task.title,
        ownerEmail: profile.email,
        ownerName: profile.full_name || profile.email,
        escalationLevel: policy.level,
        dueDate: task.due_date,
        contactName: contact.name,
        customMessage: escalation.message_content || "",
        hoursOverdue: minutesOverdue,
        relationship: contact.relationship || "contact",
      })
    );

    const subject = shameContent.subject;

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "AccountaList <noreply@accountalist.com>",
      to: contact.email,
      subject,
      html: emailHtml,
      tags: [
        { name: "type", value: "escalation" },
        { name: "level", value: policy.level.toString() },
        { name: "task_id", value: task.id },
        { name: "escalation_id", value: escalation.id },
        { name: "user_id", value: task.user_id },
      ],
    });

    if (error) {
      console.error("Resend API error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error delivering escalation:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Classify failure reason for appropriate retry handling
 */
function classifyFailureReason(errorMessage) {
  const message = errorMessage.toLowerCase();

  if (message.includes("invalid email") || message.includes("bad email")) {
    return FAILURE_REASONS.EMAIL_INVALID;
  }

  if (message.includes("rate limit") || message.includes("too many requests")) {
    return FAILURE_REASONS.RATE_LIMITED;
  }

  if (message.includes("quota") || message.includes("limit exceeded")) {
    return FAILURE_REASONS.QUOTA_EXCEEDED;
  }

  if (message.includes("network") || message.includes("connection")) {
    return FAILURE_REASONS.NETWORK_ERROR;
  }

  if (message.includes("api") || message.includes("server error")) {
    return FAILURE_REASONS.RESEND_API_ERROR;
  }

  return FAILURE_REASONS.UNKNOWN_ERROR;
}
