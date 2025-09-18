/**
 * Task 3.4: Escalation State Management
 *
 * Comprehensive system for tracking escalation status, handling failures,
 * and managing retry backoff logic with detailed state transitions.
 */

import { supabase } from "./supabase";

// Escalation status constants
export const ESCALATION_STATUSES = {
  PENDING: "pending",
  SENT: "sent",
  FAILED: "failed",
  CANCELLED: "cancelled",
  RETRYING: "retrying",
};

// Escalation failure reasons
export const FAILURE_REASONS = {
  EMAIL_INVALID: "email_invalid",
  CONTACT_NOT_VERIFIED: "contact_not_verified",
  TASK_COMPLETED: "task_completed",
  RESEND_API_ERROR: "resend_api_error",
  NETWORK_ERROR: "network_error",
  RATE_LIMITED: "rate_limited",
  QUOTA_EXCEEDED: "quota_exceeded",
  UNKNOWN_ERROR: "unknown_error",
};

// Retry configuration
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  BASE_DELAY_MINUTES: 5, // Start with 5 minutes
  EXPONENTIAL_BASE: 3, // 5min, 15min, 45min
  MAX_DELAY_HOURS: 24, // Maximum delay cap
};

/**
 * Escalation State Manager Class
 * Handles all state transitions and business logic for escalations
 */
export class EscalationStateManager {
  /**
   * Create a new escalation record
   */
  static async createEscalation({
    policyId,
    scheduledFor,
    messageContent,
    metadata = {},
  }) {
    try {
      const { data, error } = await supabase
        .from("escalations")
        .insert({
          policy_id: policyId,
          status: ESCALATION_STATUSES.PENDING,
          scheduled_for: scheduledFor,
          message_content: messageContent,
          delivery_receipt: {
            created_at: new Date().toISOString(),
            metadata,
          },
        })
        .select("*")
        .single();

      if (error) {
        console.error("Failed to create escalation:", error);
        return { success: false, error: error.message };
      }

      console.log(`Created escalation ${data.id} for policy ${policyId}`);
      return { success: true, data };
    } catch (error) {
      console.error("Error creating escalation:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update escalation status with comprehensive state tracking
   */
  static async updateStatus(escalationId, newStatus, additionalData = {}) {
    try {
      const now = new Date().toISOString();

      // Validate status transition
      const isValidTransition = await this.validateStatusTransition(
        escalationId,
        newStatus
      );
      if (!isValidTransition.valid) {
        return {
          success: false,
          error: `Invalid status transition: ${isValidTransition.reason}`,
        };
      }

      // Prepare update data based on new status
      const updateData = {
        status: newStatus,
        updated_at: now,
        delivery_receipt: {
          ...additionalData,
          status_updated_at: now,
          previous_status: isValidTransition.currentStatus,
        },
      };

      // Add status-specific fields
      switch (newStatus) {
        case ESCALATION_STATUSES.SENT:
          updateData.sent_at = additionalData.sent_at || now;
          break;
        case ESCALATION_STATUSES.FAILED:
          updateData.delivery_receipt.failed_at = now;
          updateData.delivery_receipt.failure_reason =
            additionalData.failure_reason;
          break;
        case ESCALATION_STATUSES.CANCELLED:
          updateData.delivery_receipt.cancelled_at = now;
          updateData.delivery_receipt.cancellation_reason =
            additionalData.cancellation_reason;
          break;
        case ESCALATION_STATUSES.RETRYING:
          updateData.delivery_receipt.retry_scheduled_at = now;
          updateData.delivery_receipt.next_retry_at =
            additionalData.next_retry_at;
          break;
      }

      const { data, error } = await supabase
        .from("escalations")
        .update(updateData)
        .eq("id", escalationId)
        .select("*")
        .single();

      if (error) {
        console.error(
          `Failed to update escalation ${escalationId} status to ${newStatus}:`,
          error
        );
        return { success: false, error: error.message };
      }

      console.log(
        `Updated escalation ${escalationId} status: ${isValidTransition.currentStatus} → ${newStatus}`
      );

      // Track state transition metrics
      await this.trackStateTransition(
        escalationId,
        isValidTransition.currentStatus,
        newStatus,
        additionalData
      );

      return { success: true, data };
    } catch (error) {
      console.error(`Error updating escalation ${escalationId} status:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle escalation failure with exponential backoff retry logic
   */
  static async handleFailure(escalationId, failureReason, errorDetails = {}) {
    try {
      // Get current escalation data
      const { data: escalation, error } = await supabase
        .from("escalations")
        .select("*, delivery_receipt")
        .eq("id", escalationId)
        .single();

      if (error || !escalation) {
        console.error(
          `Failed to fetch escalation ${escalationId} for failure handling:`,
          error
        );
        return { success: false, error: "Escalation not found" };
      }

      const currentRetries = escalation.delivery_receipt?.retries || 0;
      const newRetryCount = currentRetries + 1;

      // Check if we should retry or mark as permanently failed
      if (this.shouldRetry(failureReason, newRetryCount)) {
        // Calculate next retry time with exponential backoff
        const retryDelayMinutes = this.calculateRetryDelay(newRetryCount);
        const nextRetryAt = new Date(
          Date.now() + retryDelayMinutes * 60 * 1000
        );

        // Update status to retrying and reschedule
        const retryData = {
          failure_reason: failureReason,
          retries: newRetryCount,
          last_error: errorDetails.message || "Unknown error",
          next_retry_at: nextRetryAt.toISOString(),
          retry_delay_minutes: retryDelayMinutes,
          error_details: errorDetails,
        };

        // Update scheduled_for to the retry time
        await supabase
          .from("escalations")
          .update({
            scheduled_for: nextRetryAt.toISOString(),
            status: ESCALATION_STATUSES.RETRYING,
          })
          .eq("id", escalationId);

        const result = await this.updateStatus(
          escalationId,
          ESCALATION_STATUSES.RETRYING,
          retryData
        );

        return {
          success: true,
          willRetry: true,
          nextRetryAt: nextRetryAt.toISOString(),
          retryCount: newRetryCount,
          delayMinutes: retryDelayMinutes,
        };
      } else {
        // Max retries exceeded or non-retryable failure
        const failureData = {
          failure_reason: failureReason,
          retries: newRetryCount,
          final_failure: true,
          error_details: errorDetails,
          max_retries_exceeded: newRetryCount > RETRY_CONFIG.MAX_RETRIES,
        };

        await this.updateStatus(
          escalationId,
          ESCALATION_STATUSES.FAILED,
          failureData
        );

        return {
          success: true,
          willRetry: false,
          finalFailure: true,
          retryCount: newRetryCount,
        };
      }
    } catch (error) {
      console.error(
        `Error handling failure for escalation ${escalationId}:`,
        error
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * Cancel escalation (e.g., when task is completed)
   */
  static async cancelEscalation(
    escalationId,
    cancellationReason,
    metadata = {}
  ) {
    const cancelData = {
      cancellation_reason: cancellationReason,
      cancelled_at: new Date().toISOString(),
      metadata,
    };

    return await this.updateStatus(
      escalationId,
      ESCALATION_STATUSES.CANCELLED,
      cancelData
    );
  }

  /**
   * Mark escalation as successfully sent
   */
  static async markSent(escalationId, deliveryReceipt = {}) {
    const sentData = {
      sent_at: new Date().toISOString(),
      delivery_receipt: deliveryReceipt,
      delivery_confirmed: true,
    };

    return await this.updateStatus(
      escalationId,
      ESCALATION_STATUSES.SENT,
      sentData
    );
  }

  /**
   * Validate if status transition is allowed
   */
  static async validateStatusTransition(escalationId, newStatus) {
    try {
      const { data: escalation, error } = await supabase
        .from("escalations")
        .select("status")
        .eq("id", escalationId)
        .single();

      if (error || !escalation) {
        return { valid: false, reason: "Escalation not found" };
      }

      const currentStatus = escalation.status;

      // Define allowed transitions
      const allowedTransitions = {
        [ESCALATION_STATUSES.PENDING]: [
          ESCALATION_STATUSES.SENT,
          ESCALATION_STATUSES.FAILED,
          ESCALATION_STATUSES.CANCELLED,
          ESCALATION_STATUSES.RETRYING,
        ],
        [ESCALATION_STATUSES.RETRYING]: [
          ESCALATION_STATUSES.SENT,
          ESCALATION_STATUSES.FAILED,
          ESCALATION_STATUSES.CANCELLED,
        ],
        [ESCALATION_STATUSES.SENT]: [ESCALATION_STATUSES.CANCELLED], // Can cancel sent escalations in rare cases
        [ESCALATION_STATUSES.FAILED]: [], // Terminal state
        [ESCALATION_STATUSES.CANCELLED]: [], // Terminal state
      };

      const allowedFromCurrent = allowedTransitions[currentStatus] || [];

      if (!allowedFromCurrent.includes(newStatus)) {
        return {
          valid: false,
          reason: `Cannot transition from ${currentStatus} to ${newStatus}`,
          currentStatus,
        };
      }

      return { valid: true, currentStatus };
    } catch (error) {
      console.error(
        `Error validating status transition for escalation ${escalationId}:`,
        error
      );
      return { valid: false, reason: "Database error" };
    }
  }

  /**
   * Determine if escalation should be retried based on failure reason and retry count
   */
  static shouldRetry(failureReason, retryCount) {
    // Check retry count limit
    if (retryCount > RETRY_CONFIG.MAX_RETRIES) {
      return false;
    }

    // Check if failure reason is retryable
    const nonRetryableReasons = [
      FAILURE_REASONS.EMAIL_INVALID,
      FAILURE_REASONS.CONTACT_NOT_VERIFIED,
      FAILURE_REASONS.TASK_COMPLETED,
    ];

    return !nonRetryableReasons.includes(failureReason);
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  static calculateRetryDelay(retryCount) {
    const delayMinutes =
      RETRY_CONFIG.BASE_DELAY_MINUTES *
      Math.pow(RETRY_CONFIG.EXPONENTIAL_BASE, retryCount - 1);
    const maxDelayMinutes = RETRY_CONFIG.MAX_DELAY_HOURS * 60;

    return Math.min(delayMinutes, maxDelayMinutes);
  }

  /**
   * Track state transition metrics for monitoring and analytics
   */
  static async trackStateTransition(
    escalationId,
    fromStatus,
    toStatus,
    metadata = {}
  ) {
    try {
      // In a production system, you might send this to analytics service
      // For now, just log for monitoring
      console.log(
        `Escalation State Transition: ${escalationId} | ${fromStatus} → ${toStatus}`,
        {
          escalationId,
          fromStatus,
          toStatus,
          timestamp: new Date().toISOString(),
          metadata,
        }
      );

      // Could also store in a separate analytics/metrics table
      // await supabase.from("escalation_metrics").insert({ ... })

      return true;
    } catch (error) {
      console.error("Error tracking state transition:", error);
      return false;
    }
  }

  /**
   * Get escalation statistics for monitoring
   */
  static async getEscalationStats(timeframe = "24h") {
    try {
      const timeframeMappings = {
        "1h": 1,
        "24h": 24,
        "7d": 24 * 7,
        "30d": 24 * 30,
      };

      const hoursBack = timeframeMappings[timeframe] || 24;
      const cutoffTime = new Date(
        Date.now() - hoursBack * 60 * 60 * 1000
      ).toISOString();

      const { data: stats, error } = await supabase
        .from("escalations")
        .select("status")
        .gte("created_at", cutoffTime);

      if (error) {
        console.error("Failed to fetch escalation stats:", error);
        return { success: false, error: error.message };
      }

      // Aggregate stats by status
      const statusCounts = stats.reduce((acc, escalation) => {
        acc[escalation.status] = (acc[escalation.status] || 0) + 1;
        return acc;
      }, {});

      const totalEscalations = stats.length;
      const successRate =
        totalEscalations > 0 ?
          (
            ((statusCounts[ESCALATION_STATUSES.SENT] || 0) / totalEscalations) *
            100
          ).toFixed(2)
        : 0;

      return {
        success: true,
        data: {
          timeframe,
          totalEscalations,
          successRate: parseFloat(successRate),
          statusBreakdown: statusCounts,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error("Error getting escalation stats:", error);
      return { success: false, error: error.message };
    }
  }
}
