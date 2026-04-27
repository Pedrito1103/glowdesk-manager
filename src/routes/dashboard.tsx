import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useTable } from "@/lib/use-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Wrench,
  Users,
  AlertTriangle,
  Lightbulb,
  Building2,
  Tags,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
} from "recharts";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
  component: () => (
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  ),
});

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: any;
  color: string;
}) {
  return (
    <Card className="overflow-hidden relative">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
              {label}
            </div>
            <div className="text-3xl font-bold mt-1">{value}</div>
          </div>
          <div
            className="w-11 h-11 rounded-lg flex items-center justify-center text-white shadow-sm"
            style={{ background: color }}
          >
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const mant = useTable<any>("mantenimientos", "*, estados(nombre,color), categorias(nombre)");
  const usuarios = useTable<any>("profiles");
  const problemas = useTable<any>("problemas");
  const soluciones = useTable<any>("soluciones");
  const areas = useTable<any>("areas");
  const categorias = useTable<any>("categorias");
  const estados = useTable<any>("estados", "*", "orden");

  const byEstado = (estados.data ?? []).map((e) => ({
    name: e.nombre,
    value: (mant.data ?? []).filter((m) => m.estado_id === e.id).length,
    color: e.color || "#9e9e9e",
  }));

  const byCategoria = (categorias.data ?? []).map((c) => ({
    name: c.nombre,
    Mantenimientos: (mant.data ?? []).filter((m) => m.categoria_id === c.id).length,
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Resumen general</h2>
        <p className="text-sm text-muted-foreground">
          Estado actual de equipos, mantenimientos y operaciones.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        <StatCard label="Mantenimientos" value={mant.data?.length ?? "—"} icon={Wrench} color="var(--gradient-primary)" />
        <StatCard label="Usuarios" value={usuarios.data?.length ?? "—"} icon={Users} color="oklch(0.55 0.17 254)" />
        <StatCard label="Problemas" value={problemas.data?.length ?? "—"} icon={AlertTriangle} color="var(--gradient-warning)" />
        <StatCard label="Soluciones" value={soluciones.data?.length ?? "—"} icon={Lightbulb} color="oklch(0.65 0.15 150)" />
        <StatCard label="Áreas" value={areas.data?.length ?? "—"} icon={Building2} color="oklch(0.55 0.12 300)" />
        <StatCard label="Categorías" value={categorias.data?.length ?? "—"} icon={Tags} color="oklch(0.6 0.22 25)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Mantenimientos por estado</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byEstado} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
                  {byEstado.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Mantenimientos por categoría</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCategoria}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Bar dataKey="Mantenimientos" fill="oklch(0.55 0.17 254)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Accesos rápidos</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { to: "/mantenimientos", label: "Nuevo mantenimiento", icon: Wrench },
            { to: "/problemas", label: "Reportar problema", icon: AlertTriangle },
            { to: "/soluciones", label: "Registrar solución", icon: Lightbulb },
            { to: "/reportes", label: "Ver reportes", icon: Users },
          ].map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className="border border-border rounded-lg p-4 hover:border-primary hover:shadow-[var(--shadow-elegant)] transition group"
            >
              <a.icon className="w-5 h-5 text-primary mb-2 group-hover:scale-110 transition" />
              <div className="text-sm font-medium">{a.label}</div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
