import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/supabase";
import { sendContactVerificationEmail } from "@/lib/email";

// GET /api/contacts/[contactId] - Fetch specific contact
export async function GET(request, { params }) {
  try {
    const { user } = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { contactId } = params;

    const { data: contact, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", contactId)
      .eq("user_id", user.id)
      .single();

    if (error || !contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    return NextResponse.json({ contact });
  } catch (error) {
    console.error("Error in GET /api/contacts/[contactId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/contacts/[contactId] - Update specific contact
export async function PUT(request, { params }) {
  try {
    const { user } = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { contactId } = params;
    const body = await request.json();
    const { name, email, relationship } = body;

    // Build update object with only provided fields
    const updateData = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json(
          { error: "Name cannot be empty" },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 }
        );
      }

      // Check if email is already used by another contact
      const { data: existingContact } = await supabase
        .from("contacts")
        .select("id")
        .eq("user_id", user.id)
        .eq("email", email.toLowerCase())
        .neq("id", contactId)
        .single();

      if (existingContact) {
        return NextResponse.json(
          { error: "Another contact already uses this email" },
          { status: 409 }
        );
      }

      updateData.email = email.toLowerCase().trim();
      updateData.verified = false; // Reset verification if email changes
      updateData.verification_token = crypto.randomUUID(); // Generate new token
    }

    if (relationship !== undefined) {
      const validRelationships = [
        "friend",
        "family",
        "colleague",
        "mentor",
        "partner",
        "other",
      ];
      if (!validRelationships.includes(relationship)) {
        return NextResponse.json(
          {
            error: `Relationship must be one of: ${validRelationships.join(", ")}`,
          },
          { status: 400 }
        );
      }
      updateData.relationship = relationship;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const { data: contact, error } = await supabase
      .from("contacts")
      .update(updateData)
      .eq("id", contactId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Failed to update contact:", error);
      return NextResponse.json(
        { error: "Failed to update contact", details: error.message },
        { status: 500 }
      );
    }

    // If email was changed, send new verification email
    if (updateData.email) {
      try {
        const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-contact?token=${contact.verification_token}`;

        await sendContactVerificationEmail({
          to: contact.email,
          contactName: contact.name,
          ownerEmail: user.email,
          verificationToken: contact.verification_token,
          verificationUrl,
        });
      } catch (emailError) {
        console.error("Error sending verification email:", emailError);
        // Don't fail the request if email sending fails
      }
    }

    return NextResponse.json({ contact });
  } catch (error) {
    console.error("Error in PUT /api/contacts/[contactId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/contacts/[contactId] - Delete specific contact
export async function DELETE(request, { params }) {
  try {
    const { user } = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { contactId } = params;

    // First check if contact exists and belongs to user
    const { data: existingContact, error: checkError } = await supabase
      .from("contacts")
      .select("id")
      .eq("id", contactId)
      .eq("user_id", user.id)
      .single();

    if (checkError || !existingContact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // TODO: Check if contact is used in any active escalation policies
    // For now, we'll allow deletion but should handle this gracefully

    // Delete the contact
    const { error } = await supabase
      .from("contacts")
      .delete()
      .eq("id", contactId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Failed to delete contact:", error);
      return NextResponse.json(
        { error: "Failed to delete contact", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Contact deleted successfully",
      contactId,
    });
  } catch (error) {
    console.error("Error in DELETE /api/contacts/[contactId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/contacts/[contactId] - Resend verification email
export async function POST(request, { params }) {
  try {
    const { user } = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { contactId } = params;
    const body = await request.json();
    const { action } = body;

    if (action !== "resend_verification") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const { data: contact, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", contactId)
      .eq("user_id", user.id)
      .single();

    if (error || !contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    if (contact.verified) {
      return NextResponse.json(
        { error: "Contact is already verified" },
        { status: 400 }
      );
    }

    // Generate new verification token
    const newToken = crypto.randomUUID();

    const { error: updateError } = await supabase
      .from("contacts")
      .update({ verification_token: newToken })
      .eq("id", contactId);

    if (updateError) {
      throw updateError;
    }

    // Send verification email
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-contact?token=${newToken}`;

    const emailResult = await sendContactVerificationEmail({
      to: contact.email,
      contactName: contact.name,
      ownerEmail: user.email,
      verificationToken: newToken,
      verificationUrl,
    });

    if (!emailResult.success) {
      throw new Error("Failed to send verification email");
    }

    return NextResponse.json({
      message: "Verification email sent successfully",
    });
  } catch (error) {
    console.error("Error resending verification email:", error);
    return NextResponse.json(
      { error: "Failed to resend verification email" },
      { status: 500 }
    );
  }
}
