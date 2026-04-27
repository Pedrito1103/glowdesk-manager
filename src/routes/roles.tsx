import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useTable } from "@/lib/use-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users } from "lucide-react";

export const Route = createFileRoute("/roles")({
  component: () => (
    <RequireAuth>
      <RolesPage />
    </RequireAuth>
  ),
});

const ROLES = [
  { key: "admin", label: "Admin", desc: "Acceso completo al sistema" },
  { key: "mantenimiento", label: "Encargado de mantenimiento", desc: "Gestiona mantenimientos, problemas y soluciones" },
  { key: "transporte", label: "Encargado de transporte", desc: "Consulta el estado y traslado de equipos" },
] as const;

function RolesPage() {
  const userRoles = useTable<any>("user_roles");
  const profiles = useTable<any>("profiles");
  const permisos = useTable<any>("permisos", "*, acciones(nombre)");

  const usersByRole = (role: string) =>
    (userRoles.data ?? [])
      .filter((u) => u.role === role)
      .map((u) => (profiles.data ?? []).find((p) => p.id === u.user_id))
      .filter(Boolean);

  const accionesByRole = (role: string) =>
    (permisos.data ?? []).filter((p) => p.role === role).map((p) => p.acciones?.nombre);

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Roles y permisos</h2>
        <p className="text-sm text-muted-foreground">
          Roles disponibles, permisos asociados y usuarios con cada rol.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ROLES.map((r) => {
          const users = usersByRole(r.key);
          const acciones = accionesByRole(r.key);
          return (
            <Card key={r.key}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" /> {r.label}
                </CardTitle>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <div className="text-xs uppercase text-muted-foreground mb-1">Permisos</div>
                  <div className="flex flex-wrap gap-1">
                    {acciones.length === 0 ? (
                      <span className="text-muted-foreground text-xs">—</span>
                    ) : (
                      acciones.map((a, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                          {a}
                        </span>
                      ))
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase text-muted-foreground mb-1 flex items-center gap-1">
                    <Users className="w-3 h-3" /> Usuarios ({users.length})
                  </div>
                  <ul className="space-y-1">
                    {users.length === 0 ? (
                      <li className="text-muted-foreground text-xs">Sin usuarios</li>
                    ) : (
                      users.map((u: any) => (
                        <li key={u.id} className="text-xs">
                          {u.nombre} {u.apellido} <span className="text-muted-foreground">— {u.email}</span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
