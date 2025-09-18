import { NextResponse } from "next/server";
import { render } from "@react-email/render";
import { resend } from "@/lib/email";
import EscalationEmail from "@/emails/templates/escalation-email";

export async function POST(request) {
  try {
    const { to = "test@example.com" } = await request.json();

    // Render test escalation email
    const emailHtml = render(
      EscalationEmail({
        taskTitle: "Complete the quarterly review",
        ownerEmail: "john.doe@example.com",
        ownerName: "John Doe",
        escalationLevel: 2,
        dueDate: new Date().toISOString(),
        contactName: "Sarah",
        customMessage:
          "Please help me stay accountable! I really need to finish this.",
      })
    );

    // Send test email
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "AccountaList <noreply@accountalist.com>",
      to,
      subject: "🧪 AccountaList Test Email",
      html: emailHtml,
      tags: [
        { name: "type", value: "test" },
        { name: "environment", value: process.env.NODE_ENV || "development" },
      ],
    });

    if (error) {
      console.error("Test email failed:", error);
      return NextResponse.json(
        { error: "Failed to send test email", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Test email sent successfully",
      emailId: data.id,
      sentTo: to,
    });
  } catch (error) {
    console.error("Error in test email API:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Email test endpoint ready",
    instructions:
      'Send a POST request with {"to": "your-email@example.com"} to test email functionality',
    requirements: [
      "RESEND_API_KEY must be set in environment variables",
      "EMAIL_FROM should be configured with your sending domain",
    ],
  });
}
