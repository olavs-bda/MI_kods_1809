"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/form";

export default function ReceiptsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [receipts, setReceipts] = useState([]);
  const [filteredReceipts, setFilteredReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: "all",
    timeRange: "all",
  });
  const [stats, setStats] = useState({
    totalEscalations: 0,
    successfulDeliveries: 0,
    failedDeliveries: 0,
    pendingEscalations: 0,
  });
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (user) {
      fetchReceipts();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
    calculateStats();
  }, [receipts, filters, summary]);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/receipts");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch receipts");
      }

      setReceipts(result.receipts || []);
      setSummary(result.summary || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...receipts];

    // Filter by status
    if (filters.status !== "all") {
      filtered = filtered.filter(
        (receipt) => receipt.status === filters.status
      );
    }

    // Filter by time range
    if (filters.timeRange !== "all") {
      const now = new Date();
      let cutoffDate = new Date();

      switch (filters.timeRange) {
        case "today":
          cutoffDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case "month":
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
      }

      filtered = filtered.filter(
        (receipt) => new Date(receipt.createdAt) >= cutoffDate
      );
    }

    setFilteredReceipts(filtered);
  };

  const calculateStats = () => {
    if (summary) {
      setStats({
        totalEscalations: summary.total || 0,
        successfulDeliveries: summary.statusBreakdown?.sent || 0,
        failedDeliveries: summary.statusBreakdown?.failed || 0,
        pendingEscalations: summary.statusBreakdown?.pending || 0,
      });
    } else {
      // Fallback calculation from filtered data
      const total = receipts.length;
      const successful = receipts.filter((r) => r.status === "sent").length;
      const failed = receipts.filter((r) => r.status === "failed").length;
      const pending = receipts.filter((r) => r.status === "pending").length;

      setStats({
        totalEscalations: total,
        successfulDeliveries: successful,
        failedDeliveries: failed,
        pendingEscalations: pending,
      });
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({ ...prev, [filterType]: value }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "sent":
        return "✅";
      case "failed":
        return "❌";
      case "pending":
        return "⏳";
      case "cancelled":
        return "🚫";
      default:
        return "❓";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "sent":
        return "text-green-600 bg-green-50 border-green-200";
      case "failed":
        return "text-red-600 bg-red-50 border-red-200";
      case "pending":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "cancelled":
        return "text-gray-600 bg-gray-50 border-gray-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  if (isLoading) {
    return (
      <div className="container flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-lg">Loading your receipts...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Access Required</h2>
          <p className="text-lg text-muted-foreground">
            You need to be signed in to view receipts
          </p>
          <Button asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
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

        <div className="text-center max-w-3xl mx-auto mb-8">
          <h1 className="text-3xl font-bold mb-4 flex items-center justify-center gap-3">
            <span className="text-4xl">📊</span>
            Accountability Receipts
          </h1>
          <p className="text-lg text-muted-foreground">
            Complete transparency into your escalation history. See exactly when
            notifications were sent, delivered, or failed.
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-2">📧</div>
            <div className="text-2xl font-bold">{stats.totalEscalations}</div>
            <div className="text-sm text-muted-foreground">
              Total Escalations
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-2">✅</div>
            <div className="text-2xl font-bold text-green-600">
              {stats.successfulDeliveries}
            </div>
            <div className="text-sm text-muted-foreground">
              Successfully Sent
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-2">❌</div>
            <div className="text-2xl font-bold text-red-600">
              {stats.failedDeliveries}
            </div>
            <div className="text-sm text-muted-foreground">
              Failed Deliveries
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-2">⏳</div>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pendingEscalations}
            </div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Receipt List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Escalation History</CardTitle>
            <div className="flex gap-3">
              <Select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-auto"
              >
                <option value="all">All Status</option>
                <option value="sent">✅ Sent</option>
                <option value="failed">❌ Failed</option>
                <option value="pending">⏳ Pending</option>
                <option value="cancelled">🚫 Cancelled</option>
              </Select>
              <Select
                value={filters.timeRange}
                onChange={(e) =>
                  handleFilterChange("timeRange", e.target.value)
                }
                className="w-auto"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Past Week</option>
                <option value="month">Past Month</option>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                {error}
              </div>
              <Button
                onClick={fetchReceipts}
                className="mt-2"
                size="sm"
              >
                Try Again
              </Button>
            </div>
          )}

          {loading ?
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse"
                >
                  <div className="h-20 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          : receipts.length === 0 ?
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-lg font-semibold mb-2">No Escalations Yet</h3>
              <p className="text-muted-foreground mb-4">
                Your escalation receipts will appear here once you create tasks
                with accountability contacts and miss deadlines.
              </p>
              <Button asChild>
                <Link href="/tasks/create">Create Your First Task</Link>
              </Button>
            </div>
          : filteredReceipts.length === 0 ?
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold mb-2">
                No Matching Receipts
              </h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters to see more results.
              </p>
              <Button
                variant="outline"
                onClick={() => setFilters({ status: "all", timeRange: "all" })}
              >
                Clear Filters
              </Button>
            </div>
          : <div className="space-y-4">
              {filteredReceipts.map((receipt) => (
                <div
                  key={receipt.id}
                  className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xl">
                          {getStatusIcon(receipt.status)}
                        </span>
                        <h3 className="font-medium">
                          {receipt.task?.title || "Unknown Task"}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(receipt.status)}`}
                        >
                          {receipt.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-muted-foreground">
                        <div>
                          <strong>Contact:</strong> {receipt.contact?.name}
                          <br />
                          <span className="text-xs">
                            {receipt.contact?.email}
                          </span>
                        </div>
                        <div>
                          <strong>Escalation Level:</strong> Level{" "}
                          {receipt.escalation?.level}
                          <br />
                          <strong>Scheduled:</strong>{" "}
                          {formatDate(receipt.scheduledFor)}
                        </div>
                        <div>
                          {receipt.sentAt && (
                            <>
                              <strong>Delivered:</strong>{" "}
                              {formatDate(receipt.sentAt)}
                              <br />
                            </>
                          )}
                          {receipt.delivery?.deliveryConfirmed && (
                            <span className="text-xs text-green-600">
                              ✓ Delivery confirmed
                            </span>
                          )}
                        </div>
                      </div>

                      {receipt.escalation?.messageContent && (
                        <div className="mt-3 p-3 bg-muted/50 rounded text-sm">
                          <strong>Message Preview:</strong>
                          <p className="mt-1 italic">
                            "
                            {receipt.escalation.messageContent.substring(
                              0,
                              150
                            )}
                            ..."
                          </p>
                        </div>
                      )}

                      {receipt.delivery?.failureReason && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm">
                          <strong className="text-red-800">
                            Failure Reason:
                          </strong>
                          <p className="mt-1 text-red-700">
                            {receipt.delivery.failureReason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          }
        </CardContent>
      </Card>

      {/* Help text */}
      {receipts.length > 0 && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="text-blue-600 text-xl">💡</div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">
                Understanding Your Receipts
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>
                  • <strong>Sent (✅):</strong> Email successfully delivered to
                  your contact
                </li>
                <li>
                  • <strong>Failed (❌):</strong> Delivery failed (invalid
                  email, bounced, etc.)
                </li>
                <li>
                  • <strong>Pending (⏳):</strong> Scheduled but not yet sent
                </li>
                <li>
                  • <strong>Cancelled (🚫):</strong> You completed the task
                  before escalation
                </li>
                <li>
                  • All escalation times are based on your task's due date and
                  priority level
                </li>
                <li>
                  • Higher priority tasks trigger more intense escalation
                  sequences
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
