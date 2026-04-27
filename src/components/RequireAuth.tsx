import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/AppShell";
import { Navigate } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">Cargando…</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <AppShell>{children}</AppShell>;
}
