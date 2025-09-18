"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

export default function AuthForm({ className }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

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
        const { error } = await signUp(email, password);
        if (error) throw error;
        setMessage("Check your email to confirm your account");
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
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
    <div className={cn("w-full max-w-md mx-auto p-6", className)}>
      <div className="space-y-2 text-center mb-6">
        <h1 className="text-3xl font-bold">
          {isResetPassword
            ? "Reset Password"
            : isSignUp
            ? "Create Account"
            : "Sign In"}
        </h1>
        <p className="text-muted-foreground">
          {isResetPassword
            ? "Enter your email to receive a reset link"
            : isSignUp
            ? "Create an account to get started"
            : "Sign in to your account"}
        </p>
      </div>

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

        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-sm font-medium"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-2 border border-input rounded-md"
            placeholder="name@example.com"
          />
        </div>

        {!isResetPassword && (
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-2 border border-input rounded-md"
              placeholder="••••••••"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium"
        >
          {loading
            ? "Loading..."
            : isResetPassword
            ? "Send Reset Link"
            : isSignUp
            ? "Sign Up"
            : "Sign In"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm">
        {!isResetPassword && (
          <button
            onClick={toggleMode}
            className="text-primary hover:underline"
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "Need an account? Sign up"}
          </button>
        )}

        {!isResetPassword && !isSignUp && (
          <div className="mt-2">
            <button
              onClick={toggleResetPassword}
              className="text-primary hover:underline"
            >
              Forgot your password?
            </button>
          </div>
        )}

        {isResetPassword && (
          <button
            onClick={() => setIsResetPassword(false)}
            className="text-primary hover:underline"
          >
            Back to sign in
          </button>
        )}
      </div>
    </div>
  );
}
