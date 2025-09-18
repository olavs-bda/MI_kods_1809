import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/supabase";

/**
 * Task 3.5: Receipts Recording System - Receipts Dashboard API
 *
 * Provides comprehensive delivery confirmation and escalation history tracking.
 * Shows complete transparency of all escalation attempts and their outcomes.
 *
 * GET /api/receipts - Fetch user's escalation receipts and delivery history
 */
export async function GET(request) {
  try {
    const { user } = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const taskId = url.searchParams.get("task_id");
    const status = url.searchParams.get("status");
    const limit = parseInt(url.searchParams.get("limit")) || 50;
    const offset = parseInt(url.searchParams.get("offset")) || 0;

    // Build query to fetch escalations with full context
    let query = supabase
      .from("escalations")
      .select(
        `
        *,
        escalation_policies!inner (
          id,
          level,
          minutes_after_due,
          message_template,
          contact_id,
          task_id,
          contacts!inner (
            id,
            name,
            email,
            relationship,
            verified
          ),
          tasks!inner (
            id,
            title,
            description,
            due_date,
            priority,
            status,
            user_id,
            profiles:user_id!inner (
              email,
              full_name
            )
          )
        )
      `
      )
      .eq("escalation_policies.tasks.user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (taskId) {
      query = query.eq("escalation_policies.task_id", taskId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data: escalations, error } = await query;

    if (error) {
      console.error("Failed to fetch receipts:", error);
      return NextResponse.json(
        { error: "Failed to fetch receipts", details: error.message },
        { status: 500 }
      );
    }

    // Transform data for receipts dashboard
    const receipts = escalations.map((escalation) => {
      const policy = escalation.escalation_policies;
      const contact = policy.contacts;
      const task = policy.tasks;
      const profile = task.profiles;

      return {
        id: escalation.id,
        createdAt: escalation.created_at,
        updatedAt: escalation.updated_at,
        status: escalation.status,
        scheduledFor: escalation.scheduled_for,
        sentAt: escalation.sent_at,

        // Task details
        task: {
          id: task.id,
          title: task.title,
          description: task.description,
          dueDate: task.due_date,
          priority: task.priority,
          status: task.status,
        },

        // Escalation details
        escalation: {
          level: policy.level,
          minutesAfterDue: policy.minutes_after_due,
          messageContent: escalation.message_content,
        },

        // Contact details
        contact: {
          id: contact.id,
          name: contact.name,
          email: contact.email,
          relationship: contact.relationship,
          verified: contact.verified,
        },

        // Owner details
        owner: {
          email: profile.email,
          fullName: profile.full_name,
        },

        // Delivery details
        delivery: {
          receipt: escalation.delivery_receipt || {},
          messageId: escalation.delivery_receipt?.id,
          deliveryConfirmed:
            escalation.delivery_receipt?.delivery_confirmed || false,
          deliveredAt: escalation.delivery_receipt?.delivered_at,
          openedAt: escalation.delivery_receipt?.opened_at,
          clickedAt: escalation.delivery_receipt?.clicked_at,
          bounced:
            escalation.delivery_receipt?.webhook_type === "email.bounced",
          complained:
            escalation.delivery_receipt?.webhook_type === "email.complained",
          failureReason: escalation.delivery_receipt?.failure_reason,
          retries: escalation.delivery_receipt?.retries || 0,
          nextRetryAt: escalation.delivery_receipt?.next_retry_at,
        },
      };
    });

    // Get summary statistics
    const stats = await getReceiptsStats(user.id, taskId);

    return NextResponse.json({
      receipts,
      pagination: {
        offset,
        limit,
        hasMore: escalations.length === limit,
      },
      summary: stats.data || {},
    });
  } catch (error) {
    console.error("Error in GET /api/receipts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Get receipts statistics for dashboard summary
 */
async function getReceiptsStats(userId, taskId = null) {
  try {
    // Base query for user's escalations
    let query = supabase
      .from("escalations")
      .select(
        `
        status,
        delivery_receipt,
        escalation_policies!inner (
          tasks!inner (
            user_id
          )
        )
      `
      )
      .eq("escalation_policies.tasks.user_id", userId);

    // Filter by task if specified
    if (taskId) {
      query = query.eq("escalation_policies.tasks.id", taskId);
    }

    // Get recent escalations (last 30 days)
    const thirtyDaysAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    ).toISOString();
    query = query.gte("created_at", thirtyDaysAgo);

    const { data: escalations, error } = await query;

    if (error) {
      console.error("Failed to fetch receipts stats:", error);
      return { success: false, error: error.message };
    }

    // Calculate statistics
    const totalEscalations = escalations.length;
    const statusCounts = escalations.reduce((acc, escalation) => {
      acc[escalation.status] = (acc[escalation.status] || 0) + 1;
      return acc;
    }, {});

    const deliveredCount = escalations.filter(
      (e) => e.delivery_receipt?.delivery_confirmed === true
    ).length;

    const bouncedCount = escalations.filter(
      (e) => e.delivery_receipt?.webhook_type === "email.bounced"
    ).length;

    const openedCount = escalations.filter(
      (e) => e.delivery_receipt?.opened_at
    ).length;

    const clickedCount = escalations.filter(
      (e) => e.delivery_receipt?.clicked_at
    ).length;

    const retryCount = escalations.filter(
      (e) => (e.delivery_receipt?.retries || 0) > 0
    ).length;

    // Calculate rates
    const deliveryRate =
      totalEscalations > 0 ?
        ((deliveredCount / totalEscalations) * 100).toFixed(1)
      : 0;

    const openRate =
      deliveredCount > 0 ?
        ((openedCount / deliveredCount) * 100).toFixed(1)
      : 0;

    const clickRate =
      deliveredCount > 0 ?
        ((clickedCount / deliveredCount) * 100).toFixed(1)
      : 0;

    return {
      success: true,
      data: {
        total: totalEscalations,
        statusBreakdown: statusCounts,
        delivery: {
          delivered: deliveredCount,
          bounced: bouncedCount,
          rate: parseFloat(deliveryRate),
        },
        engagement: {
          opened: openedCount,
          clicked: clickedCount,
          openRate: parseFloat(openRate),
          clickRate: parseFloat(clickRate),
        },
        reliability: {
          retried: retryCount,
          retryRate:
            totalEscalations > 0 ?
              ((retryCount / totalEscalations) * 100).toFixed(1)
            : 0,
        },
        timeframe: "30 days",
        generatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("Error calculating receipts stats:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get detailed receipt for a specific escalation
 * GET /api/receipts/[escalationId] - Get detailed receipt for specific escalation
 */
export async function getEscalationReceipt(escalationId, userId) {
  try {
    const { data: escalation, error } = await supabase
      .from("escalations")
      .select(
        `
        *,
        escalation_policies!inner (
          *,
          contacts!inner (*),
          tasks!inner (
            *,
            profiles:user_id!inner (*)
          )
        )
      `
      )
      .eq("id", escalationId)
      .eq("escalation_policies.tasks.user_id", userId)
      .single();

    if (error || !escalation) {
      return { success: false, error: "Receipt not found" };
    }

    // Return detailed receipt information
    return {
      success: true,
      data: {
        escalationId: escalation.id,
        status: escalation.status,
        timeline: {
          created: escalation.created_at,
          scheduled: escalation.scheduled_for,
          sent: escalation.sent_at,
          delivered: escalation.delivery_receipt?.delivered_at,
          opened: escalation.delivery_receipt?.opened_at,
          clicked: escalation.delivery_receipt?.clicked_at,
        },
        delivery: escalation.delivery_receipt || {},
        messageContent: escalation.message_content,
        policy: escalation.escalation_policies,
      },
    };
  } catch (error) {
    console.error(
      `Error fetching receipt for escalation ${escalationId}:`,
      error
    );
    return { success: false, error: error.message };
  }
}
