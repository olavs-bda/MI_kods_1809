import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/supabase";
import { sendContactVerificationEmail } from "@/lib/email";

// GET /api/contacts - Fetch user's contacts
export async function GET(request) {
  try {
    const { user } = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const verified = url.searchParams.get("verified");

    let query = supabase
      .from("contacts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Filter by verification status if specified
    if (verified !== null) {
      query = query.eq("verified", verified === "true");
    }

    const { data: contacts, error } = await query;

    if (error) {
      console.error("Failed to fetch contacts:", error);
      return NextResponse.json(
        { error: "Failed to fetch contacts", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ contacts });
  } catch (error) {
    console.error("Error in GET /api/contacts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/contacts - Create new contact
export async function POST(request) {
  try {
    const { user } = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, relationship } = body;

    // Validate required fields
    if (!name || !email || !relationship) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, and relationship" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate relationship type
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

    // Check if contact already exists for this user
    const { data: existingContact } = await supabase
      .from("contacts")
      .select("id")
      .eq("user_id", user.id)
      .eq("email", email.toLowerCase())
      .single();

    if (existingContact) {
      return NextResponse.json(
        { error: "A contact with this email already exists" },
        { status: 409 }
      );
    }

    // Create the contact
    const { data: contact, error } = await supabase
      .from("contacts")
      .insert({
        user_id: user.id,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        relationship,
        verified: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create contact:", error);
      return NextResponse.json(
        { error: "Failed to create contact", details: error.message },
        { status: 500 }
      );
    }

    // Send verification email
    try {
      const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-contact?token=${contact.verification_token}`;

      const emailResult = await sendContactVerificationEmail({
        to: contact.email,
        contactName: contact.name,
        ownerEmail: user.email,
        verificationToken: contact.verification_token,
        verificationUrl,
      });

      if (!emailResult.success) {
        console.error("Failed to send verification email:", emailResult.error);
        // Don't fail the request if email sending fails
      }
    } catch (emailError) {
      console.error("Error sending verification email:", emailError);
      // Don't fail the request if email sending fails
    }

    return NextResponse.json(
      {
        contact,
        message: "Contact created successfully. Verification email sent.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/contacts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
