"use client";

import { useState } from "react";
import Button from "./button";
import { Card, CardContent } from "./card";

export function ShareCard({
  title,
  description,
  stats,
  gradient = "from-blue-500 to-purple-600",
  emoji = "⚡",
  shareText = "Check out my accountability stats!",
  children,
}) {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    try {
      setIsSharing(true);

      if (navigator.share) {
        await navigator.share({
          title: "AccountaList",
          text: shareText,
          url: window.location.origin,
        });
      } else {
        // Fallback: copy to clipboard
        const text = `${shareText}\n\n${window.location.origin}`;
        await navigator.clipboard.writeText(text);

        // Show a temporary success message
        const button = document.getElementById("share-button");
        if (button) {
          const originalText = button.textContent;
          button.textContent = "Copied to clipboard! 📋";
          setTimeout(() => {
            button.textContent = originalText;
          }, 2000);
        }
      }
    } catch (error) {
      console.error("Error sharing:", error);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-white to-gray-50 shadow-lg max-w-sm mx-auto">
      {/* Background pattern for visual interest */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0 bg-gradient-to-br opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), 
                           radial-gradient(circle at 75% 75%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)`,
          }}
        />
      </div>

      <CardContent className="relative p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="text-2xl sm:text-3xl flex-shrink-0">{emoji}</div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold truncate">{title}</h2>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {description}
              </p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground font-mono flex-shrink-0 ml-2">
            ACCOUNTALIST
          </div>
        </div>

        {/* Content */}
        <div className="mb-6">{children}</div>

        {/* Stats grid if provided */}
        {stats && (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="text-center p-2 sm:p-3 bg-white/80 rounded-lg border"
              >
                <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Share button */}
        <div className="flex justify-center">
          <Button
            id="share-button"
            onClick={handleShare}
            disabled={isSharing}
            className={`bg-gradient-to-r ${gradient} hover:opacity-90 text-white shadow-lg`}
            size="sm"
          >
            {isSharing ? "Sharing..." : "Share This 📤"}
          </Button>
        </div>

        {/* Subtle branding */}
        <div className="text-center mt-4">
          <div className="text-xs text-muted-foreground">
            Join the social accountability revolution at{" "}
            <strong>AccountaList</strong>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TaskCompletionShare({ task, completionRate }) {
  const stats = [
    { value: "✅", label: "COMPLETED" },
    { value: `${completionRate}%`, label: "SUCCESS RATE" },
  ];

  return (
    <ShareCard
      title="Task Completed!"
      description={`"${task.title}"`}
      stats={stats}
      gradient="from-green-500 to-emerald-600"
      emoji="🎉"
      shareText={`Just completed "${task.title}" on AccountaList! Social accountability works! 💪`}
    >
      <div className="text-center py-4">
        <div className="text-4xl mb-2">🏆</div>
        <p className="text-green-700 font-medium">
          Another goal conquered with social accountability!
        </p>
      </div>
    </ShareCard>
  );
}

export function EscalationShare({ escalationCount, taskTitle }) {
  const stats = [
    { value: escalationCount, label: "ESCALATIONS" },
    { value: "😱", label: "SHAME LEVEL" },
  ];

  return (
    <ShareCard
      title="Accountability In Action"
      description="When you miss deadlines..."
      stats={stats}
      gradient="from-red-500 to-pink-600"
      emoji="📧"
      shareText={`My accountability contacts are getting notified about "${taskTitle}" - this is why AccountaList works! 😅`}
    >
      <div className="text-center py-4">
        <div className="text-4xl mb-2">📮</div>
        <p className="text-red-700 font-medium">
          Real consequences = Real results
        </p>
      </div>
    </ShareCard>
  );
}

export function StreakShare({ streakDays, completedTasks }) {
  const stats = [
    { value: streakDays, label: "DAY STREAK" },
    { value: completedTasks, label: "TASKS DONE" },
  ];

  return (
    <ShareCard
      title="On Fire!"
      description="Consistency powered by accountability"
      stats={stats}
      gradient="from-orange-500 to-red-600"
      emoji="🔥"
      shareText={`${streakDays} day streak on AccountaList! Social pressure keeps me consistent 🔥`}
    >
      <div className="text-center py-4">
        <div className="text-4xl mb-2">⚡</div>
        <p className="text-orange-700 font-medium">Streak mode: ACTIVATED</p>
      </div>
    </ShareCard>
  );
}
