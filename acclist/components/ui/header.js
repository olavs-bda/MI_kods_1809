"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

export default function Header({ className }) {
  const { user, signOut, isLoading } = useAuth();

  return (
    <header
      className={cn(
        "border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link
            href="/"
            className="flex items-center space-x-2 text-xl font-bold tracking-tight"
          >
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AccountaList
            </span>
          </Link>
        </div>

        <nav className="flex items-center space-x-4">
          {!isLoading && (
            <>
              {user ?
                <>
                  <Link
                    href="/dashboard"
                    className="text-sm font-medium transition-colors hover:text-primary"
                  >
                    Dashboard
                  </Link>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                      {user.email}
                    </span>
                    <button
                      onClick={() => signOut()}
                      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              : <>
                  <Link
                    href="/login"
                    className="text-sm font-medium transition-colors hover:text-primary"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    Get Started
                  </Link>
                </>
              }
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
