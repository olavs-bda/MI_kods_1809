"use client";

import { useState } from "react";
import Button, { LoadingSpinner } from "@/components/ui/button";

export default function ContactItem({ contact, onUpdate, onDelete }) {
  const [loading, setLoading] = useState(false);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleResendVerification = async () => {
    if (loading || contact.verified) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/contacts/${contact.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "resend_verification" }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to resend verification");
      }

      // Show success message (in a real app, you'd use a toast)
      alert("Verification email sent successfully!");
    } catch (error) {
      console.error("Failed to resend verification:", error);
      alert("Failed to resend verification email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (loading) return;
    if (
      !confirm(
        "Are you sure you want to delete this contact? They will be removed from any existing escalation policies."
      )
    )
      return;

    setLoading(true);
    try {
      const response = await fetch(`/api/contacts/${contact.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to delete contact");
      }

      onDelete(contact.id);
    } catch (error) {
      console.error("Failed to delete contact:", error);
      alert("Failed to delete contact. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getRelationshipIcon = (relationship) => {
    switch (relationship) {
      case "friend":
        return "👥";
      case "family":
        return "👨‍👩‍👧‍👦";
      case "colleague":
        return "💼";
      case "mentor":
        return "🎯";
      case "partner":
        return "💕";
      case "other":
        return "🤝";
      default:
        return "👤";
    }
  };

  const getRelationshipColor = (relationship) => {
    switch (relationship) {
      case "friend":
        return "text-blue-600 bg-blue-100";
      case "family":
        return "text-green-600 bg-green-100";
      case "colleague":
        return "text-purple-600 bg-purple-100";
      case "mentor":
        return "text-indigo-600 bg-indigo-100";
      case "partner":
        return "text-pink-600 bg-pink-100";
      case "other":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div
      className={`border rounded-lg p-4 transition-all hover:shadow-sm ${
        contact.verified ?
          "bg-green-50 border-green-200"
        : "bg-amber-50 border-amber-200"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {/* Contact Info */}
          <div className="flex items-center gap-3 mb-2">
            <div className="text-2xl">
              {getRelationshipIcon(contact.relationship)}
            </div>
            <div>
              <h3 className="text-lg font-semibold">{contact.name}</h3>
              <p className="text-sm text-muted-foreground">{contact.email}</p>
            </div>

            <span
              className={`px-2 py-1 text-xs rounded-full ${getRelationshipColor(contact.relationship)}`}
            >
              {contact.relationship.toUpperCase()}
            </span>
          </div>

          {/* Status */}
          <div className="flex items-center gap-4 text-sm">
            <div
              className={`flex items-center gap-2 ${
                contact.verified ? "text-green-600" : "text-amber-600"
              }`}
            >
              {contact.verified ?
                <>
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Verified
                </>
              : <>
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Pending verification
                </>
              }
            </div>

            <span className="text-muted-foreground">
              Added {formatDate(contact.created_at)}
            </span>
          </div>

          {/* Verification message */}
          {!contact.verified && (
            <div className="mt-3 p-3 bg-amber-100 text-amber-800 text-sm rounded-md">
              This contact needs to verify their email before they can be
              assigned to escalation policies.
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResendVerification}
                disabled={loading}
                className="ml-2 h-6 px-2 text-amber-700 hover:text-amber-800"
              >
                {loading ?
                  <LoadingSpinner size="sm" />
                : "Resend verification"}
              </Button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              (window.location.href = `/contacts/${contact.id}/edit`)
            }
            disabled={loading}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={loading}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
