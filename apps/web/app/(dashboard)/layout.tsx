/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@lib/auth/supabaseClient";
import { Sidebar } from "@components/layout/Sidebar";
import { Topbar } from "@components/layout/Topbar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionValid, setSessionValid] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const {
          data: { session },
        } = await supabaseClient.auth.getSession();

        if (!isMounted) return;

        if (!session) {
          setSessionValid(false);
          router.push("/login");
        } else {
          setSessionValid(true);
        }
      } finally {
        if (isMounted) {
          setCheckingSession(false);
        }
      }
    }

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-slate-400">
        Verifica della sessione in corso...
      </div>
    );
  }

  if (sessionValid === false) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Topbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-surface to-background px-6 py-6">
          <div className="mx-auto max-w-6xl space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

