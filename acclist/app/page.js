import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div className="text-center sm:text-left">
          <h1 className="text-4xl font-bold tracking-tight">AccountaList</h1>
          <p className="mt-2 text-xl text-muted-foreground">
            Social accountability for maximum productivity
          </p>
        </div>

        <div className="max-w-md text-center sm:text-left">
          <p className="mb-4">
            AccountaList helps you get things done by adding social stakes to
            your tasks. Miss a deadline? We'll notify your chosen contacts with
            escalating shame levels.
          </p>
          <ul className="list-disc list-inside mb-6 space-y-2">
            <li>Create tasks with real social consequences</li>
            <li>Set up escalation policies for missed deadlines</li>
            <li>Track your accountability with the receipts dashboard</li>
          </ul>
        </div>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <Link
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="/login"
          >
            Get Started
          </Link>
          <Link
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto"
            href="/login"
          >
            Sign In
          </Link>
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} AccountaList. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
