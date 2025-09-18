"use client";

import { useState } from "react";
import Button, { LoadingSpinner } from "@/components/ui/button";
import { Input, FormField, Select } from "@/components/ui/form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function ContactForm({
  contact = null,
  onSuccess = null,
  onCancel = null,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: contact?.name || "",
    email: contact?.email || "",
    relationship: contact?.relationship || "friend",
  });

  const isEditing = !!contact;

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate form
      if (!formData.name.trim()) {
        throw new Error("Name is required");
      }
      if (!formData.email.trim()) {
        throw new Error("Email is required");
      }

      // Prepare data
      const contactData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        relationship: formData.relationship,
      };

      const url = isEditing ? `/api/contacts/${contact.id}` : "/api/contacts";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contactData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || `Failed to ${isEditing ? "update" : "create"} contact`
        );
      }

      // Success
      if (onSuccess) {
        onSuccess(result.contact);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const relationshipOptions = [
    {
      value: "friend",
      label: "👥 Friend",
      description: "Someone you trust to keep you accountable",
    },
    {
      value: "family",
      label: "👨‍👩‍👧‍👦 Family",
      description: "Family member who cares about your success",
    },
    {
      value: "colleague",
      label: "💼 Colleague",
      description: "Work colleague or professional contact",
    },
    {
      value: "mentor",
      label: "🎯 Mentor",
      description: "Someone who guides and advises you",
    },
    {
      value: "partner",
      label: "💕 Partner",
      description: "Life or business partner",
    },
    {
      value: "other",
      label: "🤝 Other",
      description: "Other trusted relationship",
    },
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {isEditing ? "Edit Contact" : "Add Accountability Contact"}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {error && (
            <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20">
              {error}
            </div>
          )}

          <FormField
            label="Name"
            required
          >
            <Input
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="What should we call them?"
              maxLength={100}
              required
            />
          </FormField>

          <FormField
            label="Email Address"
            required
          >
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="their-email@example.com"
              maxLength={255}
              required
            />
            <p className="text-sm text-muted-foreground mt-1">
              They'll receive a verification email to confirm this
              accountability relationship
            </p>
          </FormField>

          <FormField label="Relationship">
            <Select
              value={formData.relationship}
              onChange={(e) =>
                handleInputChange("relationship", e.target.value)
              }
            >
              {relationshipOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </Select>
          </FormField>

          {/* Relationship explanation */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm font-medium mb-2">
              About Accountability Contacts:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• They'll be notified if you miss task deadlines</li>
              <li>• Higher priority tasks = more intense notifications</li>
              <li>
                • They must verify their email before being added to tasks
              </li>
              <li>
                • You can assign different contacts to different escalation
                levels
              </li>
            </ul>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading && (
                <LoadingSpinner
                  size="sm"
                  className="mr-2"
                />
              )}
              {loading ?
                isEditing ?
                  "Updating..."
                : "Adding..."
              : isEditing ?
                "Update Contact"
              : "Add Contact"}
            </Button>

            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
