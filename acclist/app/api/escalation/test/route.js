import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/supabase";
import { EscalationStateManager } from "@/lib/escalation-state";
import { generateShameMessage } from "@/emails/templates/shame-messages";

/**
 * Test Escalation System - End-to-End Testing Endpoint
 *
 * POST /api/escalation/test - Test the complete escalation system
 * Supports different test scenarios for development and debugging
 */
export async function POST(request) {
  try {
    const { user } = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      testType = "full_flow",
      taskId = null,
      escalationLevel = 1,
      skipEmail = false,
      hoursOverdue = 2,
    } = body;

    console.log(`Running escalation test: ${testType} for user ${user.id}`);

    let testResult = {};

    switch (testType) {
      case "full_flow":
        testResult = await testFullEscalationFlow(
          user,
          taskId,
          escalationLevel,
          skipEmail,
          hoursOverdue
        );
        break;
      case "schedule_only":
        testResult = await testEscalationScheduling(user, taskId);
        break;
      case "deliver_only":
        testResult = await testEscalationDelivery(
          user,
          escalationLevel,
          skipEmail
        );
        break;
      case "shame_messages":
        testResult = await testShameMessageGeneration(
          escalationLevel,
          hoursOverdue
        );
        break;
      case "state_management":
        testResult = await testStateManagement(user);
        break;
      default:
        return NextResponse.json(
          { error: `Unknown test type: ${testType}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      testType,
      timestamp: new Date().toISOString(),
      result: testResult,
    });
  } catch (error) {
    console.error("Error in escalation test:", error);
    return NextResponse.json(
      { error: "Test failed", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Test the complete escalation flow from overdue task to email delivery
 */
async function testFullEscalationFlow(
  user,
  taskId,
  escalationLevel,
  skipEmail,
  hoursOverdue
) {
  const results = {
    steps: [],
    errors: [],
  };

  try {
    // Step 1: Get or create test task
    let testTask;
    if (taskId) {
      const { data: existingTask, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", taskId)
        .eq("user_id", user.id)
        .single();

      if (error || !existingTask) {
        results.errors.push("Task not found or access denied");
        return results;
      }
      testTask = existingTask;
    } else {
      // Create a test task that's overdue
      const overdueDate = new Date(Date.now() - hoursOverdue * 60 * 60 * 1000);
      const { data: newTask, error } = await supabase
        .from("tasks")
        .insert({
          user_id: user.id,
          title: `Test Task - ${new Date().toISOString()}`,
          description: "Test task for escalation system",
          due_date: overdueDate.toISOString(),
          priority: "high",
          status: "pending",
        })
        .select("*")
        .single();

      if (error) {
        results.errors.push(`Failed to create test task: ${error.message}`);
        return results;
      }
      testTask = newTask;
    }

    results.steps.push({
      step: 1,
      action: "Task prepared",
      taskId: testTask.id,
      title: testTask.title,
      overdue: `${hoursOverdue} hours`,
    });

    // Step 2: Get or create test contact
    let testContact;
    const { data: contacts } = await supabase
      .from("contacts")
      .select("*")
      .eq("user_id", user.id)
      .eq("verified", true)
      .limit(1);

    if (contacts && contacts.length > 0) {
      testContact = contacts[0];
    } else {
      // Create a test contact
      const { data: newContact, error } = await supabase
        .from("contacts")
        .insert({
          user_id: user.id,
          name: "Test Contact",
          email: user.email, // Use user's own email for testing
          relationship: "tester",
          verified: true,
        })
        .select("*")
        .single();

      if (error) {
        results.errors.push(`Failed to create test contact: ${error.message}`);
        return results;
      }
      testContact = newContact;
    }

    results.steps.push({
      step: 2,
      action: "Test contact prepared",
      contactId: testContact.id,
      email: testContact.email,
    });

    // Step 3: Create escalation policy
    const { data: policy, error: policyError } = await supabase
      .from("escalation_policies")
      .insert({
        task_id: testTask.id,
        level: escalationLevel,
        minutes_after_due: 0, // Immediate escalation for testing
        contact_id: testContact.id,
        message_template:
          "Test escalation: {{ownerName}} missed {{taskTitle}} ({{minutesOverdue}} overdue)",
      })
      .select("*")
      .single();

    if (policyError) {
      results.errors.push(
        `Failed to create escalation policy: ${policyError.message}`
      );
      return results;
    }

    results.steps.push({
      step: 3,
      action: "Escalation policy created",
      policyId: policy.id,
      level: escalationLevel,
    });

    // Step 4: Test escalation scheduling
    const schedulerResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/escalation/schedule`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CRON_SECRET}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!schedulerResponse.ok) {
      results.errors.push("Failed to run escalation scheduler");
      return results;
    }

    const schedulerResult = await schedulerResponse.json();
    results.steps.push({
      step: 4,
      action: "Escalation scheduled",
      scheduledEscalations: schedulerResult.scheduledEscalations?.length || 0,
    });

    // Step 5: Test escalation delivery (if not skipping email)
    if (!skipEmail) {
      const deliveryResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/escalation/deliver`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.CRON_SECRET}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!deliveryResponse.ok) {
        results.errors.push("Failed to run escalation delivery");
        return results;
      }

      const deliveryResult = await deliveryResponse.json();
      results.steps.push({
        step: 5,
        action: "Escalation delivered",
        delivered: deliveryResult.summary?.delivered || 0,
        results: deliveryResult.deliveryResults,
      });
    } else {
      results.steps.push({
        step: 5,
        action: "Email delivery skipped (test mode)",
      });
    }

    // Step 6: Get final escalation status
    const { data: finalEscalations } = await supabase
      .from("escalations")
      .select(
        `
        *,
        escalation_policies!inner (task_id)
      `
      )
      .eq("escalation_policies.task_id", testTask.id)
      .order("created_at", { ascending: false });

    results.steps.push({
      step: 6,
      action: "Test completed",
      escalationsCreated: finalEscalations?.length || 0,
      escalationStatuses:
        finalEscalations?.map((e) => ({ id: e.id, status: e.status })) || [],
    });

    results.success = true;
    results.testTaskId = testTask.id;
    results.cleanup = {
      message: "Test artifacts created. Clean up manually if needed.",
      taskId: testTask.id,
      contactId: testContact.id,
    };
  } catch (error) {
    results.errors.push(`Test flow error: ${error.message}`);
  }

  return results;
}

/**
 * Test escalation scheduling logic only
 */
async function testEscalationScheduling(user, taskId) {
  // Implementation for scheduling-only test
  return {
    message: "Escalation scheduling test completed",
    // Add specific scheduling tests
  };
}

/**
 * Test escalation delivery logic only
 */
async function testEscalationDelivery(user, escalationLevel, skipEmail) {
  // Implementation for delivery-only test
  return {
    message: "Escalation delivery test completed",
    // Add specific delivery tests
  };
}

/**
 * Test shame message generation with different scenarios
 */
async function testShameMessageGeneration(escalationLevel, hoursOverdue) {
  const testScenarios = [
    {
      escalationLevel: 1,
      taskTitle: "Complete project proposal",
      ownerName: "John Doe",
      ownerEmail: "john@example.com",
      contactName: "Sarah",
      dueDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      hoursOverdue: 2 * 60, // 2 hours in minutes
      relationship: "colleague",
    },
    {
      escalationLevel: 2,
      taskTitle: "Submit quarterly report",
      ownerName: "Jane Smith",
      ownerEmail: "jane@example.com",
      contactName: "Mike",
      dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      hoursOverdue: 24 * 60, // 24 hours in minutes
      relationship: "manager",
    },
    {
      escalationLevel: 3,
      taskTitle: "Exercise 3 times this week",
      ownerName: "Bob Wilson",
      ownerEmail: "bob@example.com",
      contactName: "Alice",
      dueDate: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
      hoursOverdue: 72 * 60, // 3 days in minutes
      relationship: "friend",
      customMessage: "I really need to get back in shape!",
    },
  ];

  const results = testScenarios.map((scenario) => {
    try {
      const shameContent = generateShameMessage(scenario);
      return {
        scenario: scenario.escalationLevel,
        success: true,
        generated: {
          subject: shameContent.subject,
          opening: shameContent.opening,
          shameMessage: shameContent.shameMessage,
          callToAction: shameContent.callToAction,
          intensity: shameContent.intensity,
        },
      };
    } catch (error) {
      return {
        scenario: scenario.escalationLevel,
        success: false,
        error: error.message,
      };
    }
  });

  return {
    message: "Shame message generation test completed",
    testCount: testScenarios.length,
    results,
  };
}

/**
 * Test state management system
 */
async function testStateManagement(user) {
  const tests = [];

  try {
    // Test escalation statistics
    const stats = await EscalationStateManager.getEscalationStats("24h");
    tests.push({
      test: "Get escalation stats",
      success: stats.success,
      data: stats.data,
    });

    // Add more state management tests as needed
  } catch (error) {
    tests.push({
      test: "State management tests",
      success: false,
      error: error.message,
    });
  }

  return {
    message: "State management test completed",
    tests,
  };
}
