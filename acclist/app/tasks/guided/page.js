"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button, { LoadingSpinner } from "@/components/ui/button";
import { Input, FormField, Select, Textarea } from "@/components/ui/form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const STEPS = {
  TASK_SETUP: "task_setup",
  STAKES_PREVIEW: "stakes_preview",
  ESCALATION_CONFIG: "escalation_config",
  CONFIRMATION: "confirmation",
};

export default function GuidedTaskCreationPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(STEPS.TASK_SETUP);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(true);

  const [taskData, setTaskData] = useState({
    title: "",
    description: "",
    due_date: "",
    priority: "medium",
  });

  const [escalationConfig, setEscalationConfig] = useState({
    level1: { contact: "", minutes: 60 },
    level2: { contact: "", minutes: 1440 }, // 24 hours
    level3: { contact: "", minutes: 4320 }, // 3 days
  });

  useEffect(() => {
    if (user) {
      fetchContacts();
    }
  }, [user]);

  const fetchContacts = async () => {
    try {
      setContactsLoading(true);
      const response = await fetch("/api/contacts");
      const result = await response.json();

      if (response.ok) {
        setContacts(result.contacts || []);
      }
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
    } finally {
      setContactsLoading(false);
    }
  };

  const handleTaskDataChange = (field, value) => {
    setTaskData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleEscalationChange = (level, field, value) => {
    setEscalationConfig((prev) => ({
      ...prev,
      [level]: { ...prev[level], [field]: value },
    }));
  };

  const validateTaskSetup = () => {
    if (!taskData.title.trim()) {
      setError("Task title is required");
      return false;
    }
    if (!taskData.due_date) {
      setError("Due date is required");
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    switch (currentStep) {
      case STEPS.TASK_SETUP:
        if (validateTaskSetup()) {
          setCurrentStep(STEPS.STAKES_PREVIEW);
        }
        break;
      case STEPS.STAKES_PREVIEW:
        setCurrentStep(STEPS.ESCALATION_CONFIG);
        break;
      case STEPS.ESCALATION_CONFIG:
        setCurrentStep(STEPS.CONFIRMATION);
        break;
    }
  };

  const handlePreviousStep = () => {
    switch (currentStep) {
      case STEPS.STAKES_PREVIEW:
        setCurrentStep(STEPS.TASK_SETUP);
        break;
      case STEPS.ESCALATION_CONFIG:
        setCurrentStep(STEPS.STAKES_PREVIEW);
        break;
      case STEPS.CONFIRMATION:
        setCurrentStep(STEPS.ESCALATION_CONFIG);
        break;
    }
  };

  const createTask = async () => {
    try {
      setLoading(true);
      setError(null);

      // First create the task
      const taskResponse = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskData.title.trim(),
          description: taskData.description.trim() || null,
          due_date: new Date(taskData.due_date + "T23:59:59").toISOString(),
          priority: taskData.priority,
        }),
      });

      const taskResult = await taskResponse.json();
      if (!taskResponse.ok) {
        throw new Error(taskResult.error || "Failed to create task");
      }

      const task = taskResult.task;

      // Create escalation policies
      const escalationPromises = [];
      for (const [level, config] of Object.entries(escalationConfig)) {
        if (config.contact && contacts.find((c) => c.id === config.contact)) {
          const levelNum = parseInt(level.replace("level", ""));

          escalationPromises.push(
            fetch("/api/escalation-policies", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                task_id: task.id,
                level: levelNum,
                minutes_after_due: config.minutes,
                contact_id: config.contact,
                message_template: generateMessageTemplate(
                  levelNum,
                  taskData.title
                ),
              }),
            })
          );
        }
      }

      await Promise.all(escalationPromises);

      // Success! Redirect to dashboard
      router.push("/dashboard?task_created=true");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateMessageTemplate = (level, taskTitle) => {
    const baseMessages = {
      1: `Hey! Just a friendly reminder that {{user_name}} was supposed to complete "{{task_title}}" by {{due_date}}. They might need a gentle nudge! 😊`,
      2: `Hi! {{user_name}} missed their deadline for "{{task_title}}" and it's been a day now. You might want to check in with them about this commitment. 😬`,
      3: `This is getting serious! {{user_name}} committed to "{{task_title}}" but it's been 3 days past their deadline. Time for some real accountability! 😤`,
    };
    return baseMessages[level] || baseMessages[1];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes} minutes`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} hours`;
    return `${Math.floor(minutes / 1440)} days`;
  };

  const getPriorityInfo = (priority) => {
    const info = {
      low: {
        color: "green",
        description: "Light pressure, gentle accountability",
      },
      medium: {
        color: "yellow",
        description: "Moderate pressure, steady reminders",
      },
      high: {
        color: "red",
        description: "High pressure, serious consequences",
      },
    };
    return info[priority] || info.medium;
  };

  if (authLoading || contactsLoading) {
    return (
      <div className="container flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚡</div>
          <p className="text-lg">Setting up your guided experience...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="container max-w-4xl py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            asChild
          >
            <Link href="/dashboard">← Back to Dashboard</Link>
          </Button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Create Your First Accountable Task
          </h1>
          <p className="text-lg text-muted-foreground">
            Let's set up a task with real social stakes to supercharge your
            productivity
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center mb-8 px-4">
          <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto">
            {Object.values(STEPS).map((step, index) => (
              <div
                key={step}
                className="flex items-center flex-shrink-0"
              >
                <div
                  className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium
                  ${
                    Object.values(STEPS).indexOf(currentStep) >= index ?
                      "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {index + 1}
                </div>
                {index < Object.values(STEPS).length - 1 && (
                  <div
                    className={`w-8 sm:w-16 h-0.5 mx-1 sm:mx-2 
                    ${
                      Object.values(STEPS).indexOf(currentStep) > index ?
                        "bg-blue-600"
                      : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step content */}
      <Card>
        <CardContent className="pt-8">
          {error && (
            <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20 mb-6">
              {error}
            </div>
          )}

          {currentStep === STEPS.TASK_SETUP && (
            <div>
              <div className="text-center mb-8">
                <div className="text-5xl mb-3">📝</div>
                <h2 className="text-2xl font-bold mb-2">
                  Step 1: Define Your Goal
                </h2>
                <p className="text-muted-foreground">
                  What do you want to accomplish? Be specific and make it
                  actionable.
                </p>
              </div>

              <div className="max-w-2xl mx-auto space-y-6">
                <FormField
                  label="What do you want to accomplish?"
                  required
                >
                  <Input
                    value={taskData.title}
                    onChange={(e) =>
                      handleTaskDataChange("title", e.target.value)
                    }
                    placeholder="e.g., Finish the quarterly report"
                    maxLength={200}
                    required
                  />
                </FormField>

                <FormField label="Add more details (optional)">
                  <Textarea
                    value={taskData.description}
                    onChange={(e) =>
                      handleTaskDataChange("description", e.target.value)
                    }
                    placeholder="Any additional context or requirements..."
                    rows={3}
                    maxLength={1000}
                  />
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label="When must this be done?"
                    required
                  >
                    <Input
                      type="date"
                      value={taskData.due_date}
                      onChange={(e) =>
                        handleTaskDataChange("due_date", e.target.value)
                      }
                      min={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </FormField>

                  <FormField label="How important is this?">
                    <Select
                      value={taskData.priority}
                      onChange={(e) =>
                        handleTaskDataChange("priority", e.target.value)
                      }
                    >
                      <option value="low">🟢 Low - Nice to have</option>
                      <option value="medium">🟡 Medium - Important</option>
                      <option value="high">🔴 High - Critical!</option>
                    </Select>
                  </FormField>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    💡 Pro Tip
                  </h3>
                  <p className="text-blue-800 text-sm">
                    Make your goal specific and actionable. Instead of "work on
                    project", try "complete the first draft of the marketing
                    proposal". This makes success and failure crystal clear!
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentStep === STEPS.STAKES_PREVIEW && (
            <div>
              <div className="text-center mb-8">
                <div className="text-5xl mb-3">⚡</div>
                <h2 className="text-2xl font-bold mb-2">
                  Step 2: Preview Your Stakes
                </h2>
                <p className="text-muted-foreground">
                  Here's exactly what will happen if you miss your deadline
                </p>
              </div>

              <div className="max-w-3xl mx-auto">
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Your Task Summary
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Task:</strong> {taskData.title}
                      <br />
                      <strong>Due Date:</strong> {formatDate(taskData.due_date)}
                    </div>
                    <div>
                      <strong>Priority:</strong>{" "}
                      {taskData.priority.toUpperCase()}
                      <br />
                      <strong>Stakes Level:</strong>{" "}
                      {getPriorityInfo(taskData.priority).description}
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-amber-900 mb-4">
                    ⚠️ What Happens If You Miss Your Deadline
                  </h3>

                  <div className="space-y-4">
                    <div className="border-l-4 border-yellow-400 pl-4">
                      <h4 className="font-medium">1 hour after deadline</h4>
                      <p className="text-sm text-muted-foreground">
                        Level 1 escalation: A gentle reminder will be sent to
                        your selected contact
                      </p>
                    </div>
                    <div className="border-l-4 border-orange-400 pl-4">
                      <h4 className="font-medium">24 hours after deadline</h4>
                      <p className="text-sm text-muted-foreground">
                        Level 2 escalation: A more serious accountability
                        message
                      </p>
                    </div>
                    <div className="border-l-4 border-red-400 pl-4">
                      <h4 className="font-medium">3 days after deadline</h4>
                      <p className="text-sm text-muted-foreground">
                        Level 3 escalation: Maximum shame mode activated!
                      </p>
                    </div>
                  </div>
                </div>

                {contacts.length === 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                    <h3 className="font-semibold text-red-900 mb-2">
                      ⚠️ No Accountability Contacts
                    </h3>
                    <p className="text-red-800 text-sm mb-3">
                      You need to add accountability contacts before creating
                      tasks with stakes. Without contacts, there's no social
                      pressure!
                    </p>
                    <Button
                      asChild
                      variant="destructive"
                      size="sm"
                    >
                      <Link href="/onboarding">Add Shame Contacts</Link>
                    </Button>
                  </div>
                )}

                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="font-semibold text-green-900 mb-2">
                    ✅ The Good News
                  </h3>
                  <p className="text-green-800 text-sm">
                    Complete your task on time and none of this happens! The
                    accountability system is designed to help you succeed, not
                    to embarrass you. Most users see a 70%+ improvement in
                    completion rates.
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentStep === STEPS.ESCALATION_CONFIG && contacts.length > 0 && (
            <div>
              <div className="text-center mb-8">
                <div className="text-5xl mb-3">👥</div>
                <h2 className="text-2xl font-bold mb-2">
                  Step 3: Choose Your Accountability Contacts
                </h2>
                <p className="text-muted-foreground">
                  Select who gets notified at each escalation level
                </p>
              </div>

              <div className="max-w-2xl mx-auto space-y-6">
                {[
                  {
                    key: "level1",
                    level: 1,
                    title: "Level 1: Gentle Nudge",
                    time: "1 hour",
                    color: "yellow",
                  },
                  {
                    key: "level2",
                    level: 2,
                    title: "Level 2: Serious Check-in",
                    time: "24 hours",
                    color: "orange",
                  },
                  {
                    key: "level3",
                    level: 3,
                    title: "Level 3: Maximum Accountability",
                    time: "3 days",
                    color: "red",
                  },
                ].map(({ key, level, title, time, color }) => (
                  <div
                    key={key}
                    className={`border rounded-lg p-4 bg-${color}-50 border-${color}-200`}
                  >
                    <div className="mb-3">
                      <h3 className="font-semibold">{title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Triggered {time} after your deadline
                      </p>
                    </div>

                    <FormField label="Who should be notified?">
                      <Select
                        value={escalationConfig[key].contact}
                        onChange={(e) =>
                          handleEscalationChange(key, "contact", e.target.value)
                        }
                      >
                        <option value="">Select a contact...</option>
                        {contacts
                          .filter((c) => c.verified)
                          .map((contact) => (
                            <option
                              key={contact.id}
                              value={contact.id}
                            >
                              {contact.name} ({contact.relationship})
                            </option>
                          ))}
                      </Select>
                    </FormField>

                    <div className="mt-2 p-3 bg-white/50 rounded text-sm">
                      <strong>Sample message:</strong>
                      <p className="italic mt-1">
                        {generateMessageTemplate(level, taskData.title)
                          .replace("{{user_name}}", "You")
                          .replace("{{task_title}}", taskData.title)
                          .replace(
                            "{{due_date}}",
                            formatDate(taskData.due_date)
                          )}
                      </p>
                    </div>
                  </div>
                ))}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    💡 Smart Escalation Tips
                  </h3>
                  <ul className="text-blue-800 text-sm space-y-1">
                    <li>• Use different contacts for different levels</li>
                    <li>• Level 1: Close friends who'll be supportive</li>
                    <li>• Level 2: People whose opinion really matters</li>
                    <li>
                      • Level 3: Your boss, mentor, or ultimate accountability
                      partner
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {currentStep === STEPS.CONFIRMATION && (
            <div>
              <div className="text-center mb-8">
                <div className="text-5xl mb-3">🎯</div>
                <h2 className="text-2xl font-bold mb-2">
                  Step 4: Final Confirmation
                </h2>
                <p className="text-muted-foreground">
                  Review your task and escalation setup before creating
                </p>
              </div>

              <div className="max-w-3xl mx-auto space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Task Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p>
                        <strong>Task:</strong> {taskData.title}
                      </p>
                      <p>
                        <strong>Due Date:</strong>{" "}
                        {formatDate(taskData.due_date)}
                      </p>
                      <p>
                        <strong>Priority:</strong>{" "}
                        {taskData.priority.toUpperCase()}
                      </p>
                    </div>
                    <div>
                      {taskData.description && (
                        <p>
                          <strong>Description:</strong> {taskData.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-amber-900 mb-4">
                    Escalation Plan
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(escalationConfig).map(([key, config]) => {
                      const contact = contacts.find(
                        (c) => c.id === config.contact
                      );
                      const level = parseInt(key.replace("level", ""));
                      return contact ?
                          <div
                            key={key}
                            className="flex justify-between items-center p-3 bg-white rounded"
                          >
                            <div>
                              <strong>Level {level}</strong> (
                              {formatTime(config.minutes)} after deadline)
                            </div>
                            <div className="text-right">
                              <strong>{contact.name}</strong>
                              <div className="text-sm text-muted-foreground">
                                {contact.email}
                              </div>
                            </div>
                          </div>
                        : null;
                    })}
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <h3 className="font-semibold text-red-900 mb-2">
                    ⚠️ Final Warning
                  </h3>
                  <p className="text-red-800 text-sm">
                    By creating this task, you're committing to complete "
                    {taskData.title}" by {formatDate(taskData.due_date)}. If you
                    miss this deadline, your selected contacts will be notified
                    according to the escalation plan above.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t">
            <div>
              {currentStep !== STEPS.TASK_SETUP && (
                <Button
                  variant="outline"
                  onClick={handlePreviousStep}
                  disabled={loading}
                >
                  ← Previous
                </Button>
              )}
            </div>

            <div>
              {currentStep !== STEPS.CONFIRMATION ?
                <Button
                  onClick={handleNextStep}
                  disabled={
                    loading ||
                    (currentStep === STEPS.ESCALATION_CONFIG &&
                      contacts.length === 0)
                  }
                >
                  Continue →
                </Button>
              : <Button
                  onClick={createTask}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading && (
                    <LoadingSpinner
                      size="sm"
                      className="mr-2"
                    />
                  )}
                  {loading ?
                    "Creating Task..."
                  : "Create My Accountable Task! 🎯"}
                </Button>
              }
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
