"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import Button, { LoadingSpinner } from "@/components/ui/button";
import { Input, FormField } from "@/components/ui/form";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export default function AuthForm({ className }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const router = useRouter();
  const { signIn, signUp, resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (isResetPassword) {
        const { error } = await resetPassword(email);
        if (error) throw error;
        setMessage("Check your email for the password reset link");
      } else if (isSignUp) {
        const { data, error } = await signUp(email, password);
        if (error) throw error;

        // Check if user was immediately confirmed (email confirmation disabled)
        if (data?.user && !data.user.email_confirmed_at) {
          setMessage("Check your email to confirm your account");
        } else if (data?.user && data.user.email_confirmed_at) {
          // User is immediately confirmed and logged in
          setMessage(
            "Account created successfully! Setting up your profile..."
          );
          setTimeout(() => router.push("/onboarding"), 1500);
        } else {
          setMessage("Check your email to confirm your account");
        }
      } else {
        const { data, error } = await signIn(email, password);
        if (error) throw error;

        // Check if user is confirmed
        if (data?.user && !data.user.email_confirmed_at) {
          setError("Please confirm your email address before signing in");
          return;
        }

        setMessage("Welcome back! Redirecting...");
        setTimeout(() => router.push("/dashboard"), 1000);
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setIsResetPassword(false);
    setError(null);
    setMessage(null);
  };

  const toggleResetPassword = () => {
    setIsResetPassword(!isResetPassword);
    setError(null);
    setMessage(null);
  };

  return (
    <Card className={cn("w-full max-w-md mx-auto", className)}>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">
          {isResetPassword ?
            "Reset Password"
          : isSignUp ?
            "Create Account"
          : "Sign In"}
        </CardTitle>
        <CardDescription>
          {isResetPassword ?
            "Enter your email to receive a reset link"
          : isSignUp ?
            "Create an account to get started"
          : "Sign in to your account"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
              {error}
            </div>
          )}

          {message && (
            <div className="p-3 bg-green-100 text-green-800 text-sm rounded-md">
              {message}
            </div>
          )}

          <FormField label="Email">
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@example.com"
            />
          </FormField>

          {!isResetPassword && (
            <FormField label="Password">
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </FormField>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading && (
              <LoadingSpinner
                size="sm"
                className="mr-2"
              />
            )}
            {loading ?
              "Loading..."
            : isResetPassword ?
              "Send Reset Link"
            : isSignUp ?
              "Sign Up"
            : "Sign In"}
          </Button>
        </form>

        <div className="text-center text-sm space-y-2">
          {!isResetPassword && (
            <Button
              variant="ghost"
              onClick={toggleMode}
              className="text-primary hover:underline p-0 h-auto"
            >
              {isSignUp ?
                "Already have an account? Sign in"
              : "Need an account? Sign up"}
            </Button>
          )}

          {!isResetPassword && !isSignUp && (
            <div>
              <Button
                variant="ghost"
                onClick={toggleResetPassword}
                className="text-primary hover:underline p-0 h-auto"
              >
                Forgot your password?
              </Button>
            </div>
          )}

          {isResetPassword && (
            <Button
              variant="ghost"
              onClick={() => setIsResetPassword(false)}
              className="text-primary hover:underline p-0 h-auto"
            >
              Back to sign in
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
