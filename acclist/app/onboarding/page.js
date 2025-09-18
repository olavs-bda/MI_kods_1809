"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import ContactForm from "@/components/contacts/contact-form";

const ONBOARDING_STEPS = {
  WELCOME: "welcome",
  SHAME_EXPLANATION: "shame_explanation",
  CONTACT_SELECTION: "contact_selection",
  FIRST_CONTACT: "first_contact",
  COMPLETION: "completion",
};

export default function OnboardingPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(ONBOARDING_STEPS.WELCOME);
  const [contacts, setContacts] = useState([]);
  const [showContactForm, setShowContactForm] = useState(false);

  useEffect(() => {
    // Check if user has already completed onboarding
    if (user) {
      checkOnboardingStatus();
    }
  }, [user]);

  const checkOnboardingStatus = async () => {
    try {
      const response = await fetch("/api/contacts");
      const result = await response.json();

      if (response.ok && result.contacts?.length > 0) {
        // User already has contacts, redirect to dashboard
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Failed to check onboarding status:", error);
    }
  };

  const handleContactSuccess = (contact) => {
    setContacts((prev) => [...prev, contact]);
    setShowContactForm(false);
    if (contacts.length === 0) {
      setCurrentStep(ONBOARDING_STEPS.COMPLETION);
    }
  };

  const handleSkipOnboarding = () => {
    router.push("/dashboard");
  };

  const handleFinishOnboarding = () => {
    router.push("/dashboard?onboarded=true");
  };

  if (isLoading) {
    return (
      <div className="container flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-6xl mb-4">⚡</div>
          <p className="text-lg">Setting up your accountability...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="container max-w-4xl py-8">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex justify-center mb-4">
          <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto">
            {Object.values(ONBOARDING_STEPS).map((step, index) => (
              <div
                key={step}
                className="flex items-center flex-shrink-0"
              >
                <div
                  className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium
                  ${
                    (
                      Object.values(ONBOARDING_STEPS).indexOf(currentStep) >=
                      index
                    ) ?
                      "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {index + 1}
                </div>
                {index < Object.values(ONBOARDING_STEPS).length - 1 && (
                  <div
                    className={`w-8 sm:w-12 h-0.5 mx-1 sm:mx-2 
                    ${
                      (
                        Object.values(ONBOARDING_STEPS).indexOf(currentStep) >
                        index
                      ) ?
                        "bg-blue-600"
                      : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
        <p className="text-center text-sm text-muted-foreground px-4">
          Step {Object.values(ONBOARDING_STEPS).indexOf(currentStep) + 1} of{" "}
          {Object.values(ONBOARDING_STEPS).length}
        </p>
      </div>

      {/* Step content */}
      {currentStep === ONBOARDING_STEPS.WELCOME && (
        <Card className="text-center">
          <CardContent className="pt-12 pb-12">
            <div className="text-8xl mb-6">👋</div>
            <h1 className="text-4xl font-bold mb-4">
              Welcome to AccountaList!
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              You're about to join the ranks of people who get stuff done by
              adding real social stakes to their goals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() =>
                  setCurrentStep(ONBOARDING_STEPS.SHAME_EXPLANATION)
                }
              >
                Let's Do This! ⚡
              </Button>
              <Button
                variant="ghost"
                onClick={handleSkipOnboarding}
              >
                Skip Setup (Not Recommended)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === ONBOARDING_STEPS.SHAME_EXPLANATION && (
        <Card>
          <CardContent className="pt-8 pb-8">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">😱</div>
              <h2 className="text-3xl font-bold mb-4">Here's How This Works</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
              <div className="text-center p-4 sm:p-6 bg-blue-50 rounded-lg">
                <div className="text-3xl sm:text-4xl mb-3">📝</div>
                <h3 className="font-semibold mb-2 text-sm sm:text-base">
                  1. Set Your Goals
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Create tasks with real deadlines that matter to you
                </p>
              </div>
              <div className="text-center p-4 sm:p-6 bg-purple-50 rounded-lg">
                <div className="text-3xl sm:text-4xl mb-3">👥</div>
                <h3 className="font-semibold mb-2 text-sm sm:text-base">
                  2. Choose Your Witnesses
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Select people who'll hold you accountable (they'll know if you
                  fail)
                </p>
              </div>
              <div className="text-center p-4 sm:p-6 bg-red-50 rounded-lg sm:col-span-2 lg:col-span-1">
                <div className="text-3xl sm:text-4xl mb-3">📧</div>
                <h3 className="font-semibold mb-2 text-sm sm:text-base">
                  3. Face The Consequences
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Miss your deadline? Your contacts get notified with escalating
                  shame
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                This Isn't Just Another To-Do App
              </h3>
              <p className="text-amber-800 text-sm">
                We're about to add <strong>real social pressure</strong> to your
                goals. Your accountability contacts will receive emails when you
                miss deadlines. This creates genuine stakes and dramatically
                improves completion rates.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() =>
                  setCurrentStep(ONBOARDING_STEPS.CONTACT_SELECTION)
                }
              >
                I'm Ready for Real Accountability 💪
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentStep(ONBOARDING_STEPS.WELCOME)}
              >
                ← Back
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === ONBOARDING_STEPS.CONTACT_SELECTION && (
        <Card>
          <CardContent className="pt-8 pb-8">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🎯</div>
              <h2 className="text-3xl font-bold mb-4">
                Pick Your Shame Contacts
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                These are the people who will receive notifications when you
                miss deadlines. Choose wisely - they'll be your accountability
                partners.
              </p>
            </div>

            <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                <span className="text-xl">🔥</span>
                The Perfect Shame Contact
              </h3>
              <ul className="text-red-800 text-sm space-y-2">
                <li>
                  • <strong>Someone whose opinion you care about</strong>{" "}
                  (friend, family, mentor)
                </li>
                <li>
                  • <strong>Won't just ignore the notification</strong> (they'll
                  actually follow up)
                </li>
                <li>
                  • <strong>Supportive but won't let you off easy</strong>{" "}
                  (loving accountability)
                </li>
                <li>
                  •{" "}
                  <strong>
                    Different relationships for different pressure levels
                  </strong>{" "}
                  (boss for work tasks, friends for personal)
                </li>
              </ul>
            </div>

            {contacts.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3">
                  Your Accountability Squad:
                </h3>
                <div className="space-y-2">
                  {contacts.map((contact, index) => (
                    <div
                      key={contact.id}
                      className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200"
                    >
                      <div className="text-2xl">✅</div>
                      <div className="flex-1">
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {contact.email} • {contact.relationship}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center">
              {!showContactForm ?
                <div className="space-y-4">
                  <Button
                    size="lg"
                    onClick={() => setShowContactForm(true)}
                  >
                    {contacts.length === 0 ?
                      "Add Your First Shame Contact"
                    : "Add Another Contact"}{" "}
                    👥
                  </Button>
                  {contacts.length > 0 && (
                    <div>
                      <Button
                        variant="outline"
                        onClick={() =>
                          setCurrentStep(ONBOARDING_STEPS.COMPLETION)
                        }
                      >
                        Continue with {contacts.length} Contact
                        {contacts.length > 1 ? "s" : ""} →
                      </Button>
                    </div>
                  )}
                </div>
              : <div className="max-w-2xl mx-auto">
                  <ContactForm
                    onSuccess={handleContactSuccess}
                    onCancel={() => setShowContactForm(false)}
                  />
                </div>
              }
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === ONBOARDING_STEPS.COMPLETION && (
        <Card className="text-center">
          <CardContent className="pt-12 pb-12">
            <div className="text-8xl mb-6">🎉</div>
            <h2 className="text-3xl font-bold mb-4">You're All Set!</h2>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              Congratulations! You've added{" "}
              <strong>
                {contacts.length} accountability contact
                {contacts.length > 1 ? "s" : ""}
              </strong>
              . You're now ready to create tasks with real social stakes.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 max-w-2xl mx-auto">
              <h3 className="font-semibold text-blue-900 mb-3">
                🚀 What happens next?
              </h3>
              <ul className="text-blue-800 text-sm space-y-1 text-left">
                <li>• Create your first accountability task</li>
                <li>• Your contacts will receive verification emails</li>
                <li>
                  • Set realistic deadlines (this works best when you succeed)
                </li>
                <li>
                  • Watch your productivity soar with real social pressure!
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
              >
                <Link href="/tasks/guided">
                  Create My First Accountable Task ⚡
                </Link>
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setCurrentStep(ONBOARDING_STEPS.CONTACT_SELECTION)
                }
              >
                Add More Contacts
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
