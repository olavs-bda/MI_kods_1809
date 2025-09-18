"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "./card";
import Button from "./button";
import { TaskCompletionShare } from "./share-card";

export default function SuccessCelebration({
  task,
  completionRate = 75,
  onClose,
  show = false,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
    }
  }, [show]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  };

  const handleShare = () => {
    setShowShare(true);
  };

  if (!show && !isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className={`max-w-md mx-4 transition-transform duration-300 ${
          isVisible ? "scale-100" : "scale-95"
        }`}
      >
        {!showShare ?
          <Card className="relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-emerald-50 shadow-2xl border-green-200">
            {/* Celebratory background effect */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 via-transparent to-emerald-400/10" />
              {/* Animated sparkles */}
              <div className="absolute top-4 left-4 text-yellow-400 animate-pulse">
                ✨
              </div>
              <div className="absolute top-8 right-6 text-yellow-400 animate-pulse delay-200">
                ⭐
              </div>
              <div className="absolute bottom-8 left-6 text-yellow-400 animate-pulse delay-500">
                💫
              </div>
              <div className="absolute bottom-4 right-4 text-yellow-400 animate-pulse delay-700">
                ✨
              </div>
            </div>

            <CardContent className="relative p-8 text-center">
              {/* Celebration animation */}
              <div className="mb-6">
                <div className="text-8xl mb-4 animate-bounce">🎉</div>
                <h2 className="text-2xl font-bold text-green-800 mb-2">
                  Task Completed!
                </h2>
                <p className="text-green-700 font-medium text-lg">
                  "{task?.title}"
                </p>
              </div>

              {/* Success message */}
              <div className="mb-6 p-4 bg-green-100 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-800 mb-2">
                  🏆 Social Accountability Works!
                </h3>
                <p className="text-green-700 text-sm">
                  You beat the deadline and avoided the shame! Your
                  accountability contacts won't be getting any embarrassing
                  notifications today.
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 bg-white rounded-lg border">
                  <div className="text-2xl font-bold text-green-600">✅</div>
                  <div className="text-xs text-muted-foreground font-medium">
                    STATUS
                  </div>
                </div>
                <div className="p-3 bg-white rounded-lg border">
                  <div className="text-2xl font-bold text-green-600">
                    {completionRate}%
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">
                    SUCCESS RATE
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleShare}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
                >
                  Share This Win 📤
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="border-green-200 text-green-700 hover:bg-green-50"
                >
                  Continue to Dashboard
                </Button>
              </div>

              {/* Motivational message */}
              <div className="mt-6 text-center">
                <p className="text-sm text-green-600">
                  💪 Keep the momentum going! Social pressure = Real results.
                </p>
              </div>
            </CardContent>
          </Card>
        : <div>
            <TaskCompletionShare
              task={task}
              completionRate={completionRate}
            />
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                onClick={handleClose}
                className="bg-white"
              >
                Done
              </Button>
            </div>
          </div>
        }
      </div>
    </div>
  );
}
