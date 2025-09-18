import { Resend } from "resend";

// Initialize Resend client - handle missing key gracefully
let resend = null;

if (
  process.env.RESEND_API_KEY &&
  process.env.RESEND_API_KEY !== "temp-placeholder-key"
) {
  resend = new Resend(process.env.RESEND_API_KEY);
} else {
  console.warn(
    "RESEND_API_KEY not properly configured - email functions will be disabled"
  );
}

export { resend };

// Email sender configuration
export const EMAIL_FROM =
  process.env.EMAIL_FROM || "AccountaList <noreply@accountalist.com>";

/**
 * Send an escalation notification email
 */
export async function sendEscalationEmail({
  to,
  taskTitle,
  ownerEmail,
  escalationLevel,
  dueDate,
  messageTemplate,
}) {
  if (!resend) {
    return { error: { message: "Email service not configured" } };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: `🚨 AccountaList Alert: ${ownerEmail} missed "${taskTitle}" deadline`,
      html: messageTemplate,
      tags: [
        { name: "type", value: "escalation" },
        { name: "level", value: escalationLevel.toString() },
        { name: "task", value: taskTitle },
      ],
    });

    if (error) {
      console.error("Failed to send escalation email:", error);
      return { success: false, error: error.message };
    }

    console.log("Escalation email sent successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Error sending escalation email:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Send a contact verification email
 */
export async function sendContactVerificationEmail({
  to,
  contactName,
  ownerEmail,
  verificationToken,
  verificationUrl,
}) {
  if (!resend) {
    return { error: { message: "Email service not configured" } };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: `AccountaList: ${ownerEmail} wants to add you as an accountability contact`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>You've been invited to be an accountability contact!</h2>
          <p>Hi ${contactName},</p>
          <p>${ownerEmail} has added you as an accountability contact on AccountaList.</p>
          <p>This means they trust you enough to help keep them accountable for their goals and tasks.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>What does this mean?</h3>
            <p>• You'll receive notifications if ${ownerEmail} misses important deadlines</p>
            <p>• You can help motivate them to complete their tasks</p>
            <p>• You're part of their accountability system</p>
          </div>

          <p>Click the link below to verify your email and confirm this relationship:</p>
          <a href="${verificationUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0;">
            Verify & Accept
          </a>
          
          <p>If you don't want to receive these notifications, simply ignore this email.</p>
          <p>Thanks for helping ${ownerEmail} stay accountable!</p>
          <p>- The AccountaList Team</p>
        </div>
      `,
      tags: [
        { name: "type", value: "verification" },
        { name: "owner", value: ownerEmail },
      ],
    });

    if (error) {
      console.error("Failed to send verification email:", error);
      return { success: false, error: error.message };
    }

    console.log("Verification email sent successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Error sending verification email:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Send a welcome email to new users
 */
export async function sendWelcomeEmail({ to, userName }) {
  if (!resend) {
    return { error: { message: "Email service not configured" } };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: "Welcome to AccountaList! 🎯",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #007bff;">Welcome to AccountaList!</h1>
          <p>Hi ${userName || "there"},</p>
          <p>Welcome to AccountaList - the social accountability app that helps you get things done!</p>
          
          <div style="background: linear-gradient(135deg, #007bff, #8b5cf6); color: white; padding: 30px; border-radius: 12px; margin: 20px 0; text-align: center;">
            <h2 style="margin: 0 0 10px 0;">Ready to boost your productivity?</h2>
            <p style="margin: 0; opacity: 0.9;">Add social stakes to your tasks and watch your completion rate soar!</p>
          </div>

          <h3>Here's how to get started:</h3>
          <ol style="line-height: 1.6;">
            <li><strong>Create your first task</strong> with a deadline that matters</li>
            <li><strong>Add accountability contacts</strong> who will be notified if you miss deadlines</li>
            <li><strong>Set escalation levels</strong> - from gentle nudges to maximum shame</li>
            <li><strong>Get things done</strong> or face the social consequences!</li>
          </ol>

          <p>The secret sauce? External accountability is 10x more powerful than self-imposed consequences.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              Go to Dashboard
            </a>
          </div>
          
          <p>Questions? Just reply to this email - we're here to help!</p>
          <p>Happy accountability,<br>The AccountaList Team</p>
        </div>
      `,
      tags: [
        { name: "type", value: "welcome" },
        { name: "user", value: userName || "new-user" },
      ],
    });

    if (error) {
      console.error("Failed to send welcome email:", error);
      return { success: false, error: error.message };
    }

    console.log("Welcome email sent successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return { success: false, error: error.message };
  }
}
