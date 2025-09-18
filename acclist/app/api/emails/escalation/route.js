import { NextResponse } from "next/server";
import { render } from "@react-email/render";
import { resend } from "@/lib/email";
import EscalationEmail from "@/emails/templates/escalation-email";
import { supabase } from "@/lib/supabase";

export async function POST(request) {
  try {
    const {
      taskId,
      contactEmail,
      escalationLevel = 1,
      customMessage = "",
    } = await request.json();

    // Validate required fields
    if (!taskId || !contactEmail) {
      return NextResponse.json(
        { error: "Missing required fields: taskId and contactEmail" },
        { status: 400 }
      );
    }

    // Fetch task and owner information from database
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select(
        `
        *,
        profiles:user_id (
          email,
          full_name
        )
      `
      )
      .eq("id", taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Fetch contact information
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select("*")
      .eq("email", contactEmail)
      .eq("user_id", task.user_id)
      .single();

    if (contactError || !contact) {
      return NextResponse.json(
        { error: "Contact not found or not verified" },
        { status: 404 }
      );
    }

    // Render the email template
    const emailHtml = render(
      EscalationEmail({
        taskTitle: task.title,
        ownerEmail: task.profiles.email,
        ownerName: task.profiles.full_name || task.profiles.email,
        escalationLevel,
        dueDate: task.due_date,
        contactName: contact.name,
        customMessage,
      })
    );

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "AccountaList <noreply@accountalist.com>",
      to: contactEmail,
      subject: `🚨 AccountaList Alert: ${task.profiles.email} missed "${task.title}" deadline`,
      html: emailHtml,
      tags: [
        { name: "type", value: "escalation" },
        { name: "level", value: escalationLevel.toString() },
        { name: "task_id", value: taskId },
      ],
    });

    if (error) {
      console.error("Failed to send escalation email:", error);
      return NextResponse.json(
        { error: "Failed to send email", details: error.message },
        { status: 500 }
      );
    }

    // Log the escalation in the database
    const { error: logError } = await supabase.from("escalations").insert({
      policy_id: null, // This will be set when we implement escalation policies
      status: "sent",
      scheduled_for: new Date().toISOString(),
      sent_at: new Date().toISOString(),
      message_content: emailHtml,
      delivery_receipt: data,
    });

    if (logError) {
      console.error("Failed to log escalation:", logError);
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      success: true,
      message: "Escalation email sent successfully",
      emailId: data.id,
    });
  } catch (error) {
    console.error("Error in escalation email API:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
