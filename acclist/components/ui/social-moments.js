"use client";

import { useState } from "react";
import { Card, CardContent } from "./card";
import Button from "./button";
import {
  ShareCard,
  TaskCompletionShare,
  EscalationShare,
  StreakShare,
} from "./share-card";

export function SocialMomentsPanel({ user, stats }) {
  const [selectedMoment, setSelectedMoment] = useState(null);

  const moments = [
    {
      id: "completion_rate",
      title: "My Success Rate",
      description: "Social accountability is working!",
      condition: stats?.completionRate >= 50,
      component: () => (
        <ShareCard
          title="Success Rate"
          description="Social accountability is working!"
          stats={[
            {
              value: `${stats?.completionRate || 0}%`,
              label: "COMPLETION RATE",
            },
            { value: stats?.totalTasks || 0, label: "TASKS CREATED" },
          ]}
          gradient="from-blue-500 to-purple-600"
          emoji="📈"
          shareText={`My task completion rate is ${stats?.completionRate || 0}% thanks to AccountaList's social accountability! 🎯`}
        >
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground">
              Real social pressure = Real results
            </p>
          </div>
        </ShareCard>
      ),
    },
    {
      id: "accountability_network",
      title: "My Accountability Network",
      description: "The people keeping me honest",
      condition: stats?.verifiedContacts > 0,
      component: () => (
        <ShareCard
          title="Accountability Network"
          description="The people keeping me honest"
          stats={[
            { value: stats?.verifiedContacts || 0, label: "CONTACTS" },
            { value: "💪", label: "ACCOUNTABILITY" },
          ]}
          gradient="from-purple-500 to-pink-600"
          emoji="👥"
          shareText={`I've got ${stats?.verifiedContacts || 0} people keeping me accountable on AccountaList! Who's watching you? 👀`}
        >
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground">
              Social pressure = Productivity boost
            </p>
          </div>
        </ShareCard>
      ),
    },
    {
      id: "join_movement",
      title: "Join the Movement",
      description: "Social accountability revolution",
      condition: true,
      component: () => (
        <ShareCard
          title="Join the Revolution"
          description="Social accountability > Self-discipline"
          stats={[
            { value: "⚡", label: "POWERED BY" },
            { value: "🔥", label: "SOCIAL PRESSURE" },
          ]}
          gradient="from-orange-500 to-red-600"
          emoji="🚀"
          shareText="Stop relying on willpower alone! AccountaList adds real social stakes to your goals. Get stuff done with social accountability! 💪"
        >
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground">
              Real consequences = Real results
            </p>
          </div>
        </ShareCard>
      ),
    },
  ];

  const availableMoments = moments.filter((moment) => moment.condition);

  if (availableMoments.length === 0) {
    return null;
  }

  return (
    <div>
      {selectedMoment ?
        <div className="space-y-4">
          {availableMoments.find((m) => m.id === selectedMoment)?.component()}
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => setSelectedMoment(null)}
              size="sm"
            >
              ← Back to Moments
            </Button>
          </div>
        </div>
      : <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-2xl">📸</div>
              <div>
                <h3 className="font-semibold">Share Your Success</h3>
                <p className="text-sm text-muted-foreground">
                  Create shareable moments from your productivity wins
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              {availableMoments.map((moment) => (
                <button
                  key={moment.id}
                  onClick={() => setSelectedMoment(moment.id)}
                  className="flex items-center justify-between p-3 text-left bg-gradient-to-r from-gray-50 to-blue-50 hover:from-blue-50 hover:to-purple-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all"
                >
                  <div>
                    <div className="font-medium text-sm">{moment.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {moment.description}
                    </div>
                  </div>
                  <div className="text-lg">📤</div>
                </button>
              ))}
            </div>

            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="text-yellow-600">💡</div>
                <div className="text-xs text-yellow-800">
                  <strong>Tip:</strong> Sharing your accountability journey
                  helps others discover the power of social pressure and creates
                  viral growth!
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      }
    </div>
  );
}

export function QuickShareButton({
  text,
  url = "",
  className = "",
  variant = "outline",
  size = "sm",
}) {
  const [isSharing, setIsSharing] = useState(false);

  const handleQuickShare = async () => {
    try {
      setIsSharing(true);

      const shareData = {
        title: "AccountaList",
        text: text,
        url: url || window.location.origin,
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        const shareText = `${text}\n\n${url || window.location.origin}`;
        await navigator.clipboard.writeText(shareText);

        // Brief success feedback
        setTimeout(() => setIsSharing(false), 1000);
        return;
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }

    setIsSharing(false);
  };

  return (
    <Button
      onClick={handleQuickShare}
      disabled={isSharing}
      variant={variant}
      size={size}
      className={`${className} ${isSharing ? "opacity-50" : ""}`}
    >
      {isSharing ? "📋 Copied!" : "Share 📤"}
    </Button>
  );
}
