"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/form";
import ContactItem from "./contact-item";

export default function ContactList() {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    relationship: "all",
    verified: "all",
  });

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [contacts, filters]);

  const applyFilters = () => {
    let filtered = [...contacts];

    // Filter by relationship
    if (filters.relationship !== "all") {
      filtered = filtered.filter(
        (contact) => contact.relationship === filters.relationship
      );
    }

    // Filter by verification status
    if (filters.verified !== "all") {
      filtered = filtered.filter(
        (contact) => contact.verified === (filters.verified === "verified")
      );
    }

    setFilteredContacts(filtered);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({ ...prev, [filterType]: value }));
  };

  const fetchContacts = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/contacts");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch contacts");
      }

      setContacts(result.contacts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleContactUpdate = (updatedContact) => {
    setContacts((prev) =>
      prev.map((contact) =>
        contact.id === updatedContact.id ? updatedContact : contact
      )
    );
  };

  const handleContactDelete = (contactId) => {
    setContacts((prev) => prev.filter((contact) => contact.id !== contactId));
  };

  const getContactStats = () => {
    const total = contacts.length;
    const verified = contacts.filter((c) => c.verified).length;
    const pending = contacts.filter((c) => !c.verified).length;
    const filtered = filteredContacts.length;

    return { total, verified, pending, filtered };
  };

  const stats = getContactStats();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 bg-muted rounded"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={fetchContacts}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-600">Total Contacts</p>
          <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-green-600">Verified</p>
          <p className="text-2xl font-bold text-green-700">{stats.verified}</p>
        </div>
        <div className="bg-amber-50 rounded-lg p-4">
          <p className="text-sm text-amber-600">Pending Verification</p>
          <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
        </div>
      </div>

      {/* Contact List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Accountability Contacts</span>
            <div className="flex gap-3">
              <Select
                value={filters.relationship}
                onChange={(e) =>
                  handleFilterChange("relationship", e.target.value)
                }
                className="w-auto"
              >
                <option value="all">All Relationships</option>
                <option value="friend">Friend</option>
                <option value="family">Family</option>
                <option value="colleague">Colleague</option>
                <option value="mentor">Mentor</option>
                <option value="partner">Partner</option>
                <option value="other">Other</option>
              </Select>
              <Select
                value={filters.verified}
                onChange={(e) => handleFilterChange("verified", e.target.value)}
                className="w-auto"
              >
                <option value="all">All Status</option>
                <option value="verified">Verified Only</option>
                <option value="pending">Pending Only</option>
              </Select>
              <Button onClick={() => (window.location.href = "/contacts/add")}>
                Add Contact
              </Button>
            </div>
          </CardTitle>
          {(filters.relationship !== "all" || filters.verified !== "all") && (
            <p className="text-sm text-muted-foreground">
              Showing {stats.filtered} of {stats.total} contacts
            </p>
          )}
        </CardHeader>

        <CardContent>
          {contacts.length === 0 ?
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-lg font-semibold mb-2">No contacts yet</h3>
              <p className="text-muted-foreground mb-4">
                Add accountability contacts to help you stay committed to your
                goals.
              </p>
              <Button onClick={() => (window.location.href = "/contacts/add")}>
                Add Your First Contact
              </Button>
            </div>
          : filteredContacts.length === 0 ?
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold mb-2">
                No contacts match filters
              </h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or add a contact that matches your
                criteria.
              </p>
              <Button
                variant="outline"
                onClick={() =>
                  setFilters({ relationship: "all", verified: "all" })
                }
              >
                Clear Filters
              </Button>
            </div>
          : <div className="space-y-4">
              {filteredContacts.map((contact) => (
                <ContactItem
                  key={contact.id}
                  contact={contact}
                  onUpdate={handleContactUpdate}
                  onDelete={handleContactDelete}
                />
              ))}
            </div>
          }
        </CardContent>
      </Card>

      {/* Help text */}
      {contacts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-blue-600 text-xl">💡</div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">
                Tips for Great Accountability
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>
                  • Choose contacts who will actually follow through with
                  accountability
                </li>
                <li>
                  • Mix relationship types (friends, family, colleagues) for
                  balanced pressure
                </li>
                <li>
                  • Make sure contacts understand they're helping you achieve
                  your goals
                </li>
                <li>
                  • Different escalation levels can use different contacts
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
