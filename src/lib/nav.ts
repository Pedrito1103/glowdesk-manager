import {
  LayoutDashboard,
  Users,
  Shield,
  Building2,
  Tags,
  ListChecks,
  AlertTriangle,
  Wrench,
  Lightbulb,
  BarChart3,
} from "lucide-react";

export const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/usuarios", label: "Usuarios", icon: Users },
  { to: "/roles", label: "Roles", icon: Shield },
  { to: "/areas", label: "Áreas", icon: Building2 },
  { to: "/categorias", label: "Categorías", icon: Tags },
  { to: "/estados", label: "Estados", icon: ListChecks },
  { to: "/problemas", label: "Problemas", icon: AlertTriangle },
  { to: "/mantenimientos", label: "Mantenimientos", icon: Wrench },
  { to: "/soluciones", label: "Soluciones", icon: Lightbulb },
  { to: "/reportes", label: "Reportes", icon: BarChart3 },
] as const;
