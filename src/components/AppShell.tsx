import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  Menu,
  Moon,
  Sun,
  LogOut,
  Wrench as WrenchIcon,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { profile, signOut, roles } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const onLogout = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  const initials =
    (profile?.nombre?.[0] ?? "") + (profile?.apellido?.[0] ?? "") || "U";

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Sidebar desktop */}
      <aside
        className={cn(
          "hidden md:flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-200",
          open ? "w-64" : "w-16"
        )}
      >
        <div className="h-16 flex items-center gap-2 px-4 border-b border-sidebar-border">
          <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground shadow-md shrink-0">
            <WrenchIcon className="w-5 h-5" />
          </div>
          {open && (
            <div className="flex-1 min-w-0">
              <div className="font-bold tracking-tight text-base">EMC</div>
              <div className="text-[11px] text-sidebar-foreground/60 truncate">
                Gestión de mantenimiento
              </div>
            </div>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {NAV_ITEMS.map((it) => {
            const active = location.pathname.startsWith(it.to);
            const Icon = it.icon;
            return (
              <Link
                key={it.to}
                to={it.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  active &&
                    "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                )}
                title={it.label}
              >
                <Icon className="w-[18px] h-[18px] shrink-0" />
                {open && <span className="truncate">{it.label}</span>}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={() => setOpen((o) => !o)}
          className="m-2 p-2 rounded-md hover:bg-sidebar-accent flex items-center justify-center text-sidebar-foreground/70"
        >
          <ChevronLeft className={cn("w-4 h-4 transition", !open && "rotate-180")} />
        </button>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-64 bg-sidebar text-sidebar-foreground p-3 space-y-1 overflow-y-auto">
            <div className="h-12 flex items-center gap-2 px-1 mb-2">
              <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground">
                <WrenchIcon className="w-5 h-5" />
              </div>
              <div className="font-bold">EMC</div>
            </div>
            {NAV_ITEMS.map((it) => {
              const active = location.pathname.startsWith(it.to);
              const Icon = it.icon;
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm",
                    "hover:bg-sidebar-accent",
                    active && "bg-sidebar-primary text-sidebar-primary-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {it.label}
                </Link>
              );
            })}
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-card flex items-center px-3 md:px-6 gap-3 sticky top-0 z-40">
          <Button
            size="icon"
            variant="ghost"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base md:text-lg font-semibold truncate">
              {NAV_ITEMS.find((n) => location.pathname.startsWith(n.to))?.label ??
                "EMC"}
            </h1>
            <div className="text-xs text-muted-foreground hidden sm:block">
              Sistema de gestión de mantenimiento
            </div>
          </div>
          <Button size="icon" variant="ghost" onClick={toggle} title="Tema">
            {theme === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-muted">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold uppercase">
                  {initials}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium leading-tight">
                    {profile?.nombre || "Usuario"} {profile?.apellido || ""}
                  </div>
                  <div className="text-[11px] text-muted-foreground capitalize">
                    {roles.join(", ") || "—"}
                  </div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{profile?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout}>
                <LogOut className="w-4 h-4 mr-2" /> Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
