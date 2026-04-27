import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Download, Pencil } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { DataTable } from "@/components/DataTable";
import { useTable } from "@/lib/use-table";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/usuarios")({
  component: () => (
    <RequireAuth>
      <UsuariosPage />
    </RequireAuth>
  ),
});

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "transporte", label: "Transporte" },
];

function UsuariosPage() {
  const qc = useQueryClient();
  const { isAdmin } = useAuth();
  const profiles = useTable<any>("profiles", "*", "nombre");
  const userRoles = useTable<any>("user_roles");

  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>({ nombre: "", apellido: "", estado: "activo", role: "mantenimiento" });

  const startEdit = (row: any) => {
    setEditing(row);
    const role =
      (userRoles.data ?? []).find((r) => r.user_id === row.id)?.role ?? "mantenimiento";
    setForm({ nombre: row.nombre, apellido: row.apellido, estado: row.estado, role });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      const { error } = await supabase.from("profiles").update({
        nombre: form.nombre, apellido: form.apellido, estado: form.estado,
      }).eq("id", editing.id);
      if (error) throw error;
      // sync role: delete others, ensure selected
      if (isAdmin) {
        await supabase.from("user_roles").delete().eq("user_id", editing.id);
        await supabase.from("user_roles").insert({ user_id: editing.id, role: form.role });
      }
      toast.success("Usuario actualizado");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["profiles"] });
      qc.invalidateQueries({ queryKey: ["user_roles"] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const exportExcel = () => {
    const rows = (profiles.data ?? []).map((p) => ({
      Nombre: p.nombre, Apellido: p.apellido, Email: p.email, Estado: p.estado,
      Rol: (userRoles.data ?? []).find((r) => r.user_id === p.id)?.role ?? "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Usuarios");
    XLSX.writeFile(wb, "usuarios.xlsx");
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Usuarios</h2>
        <p className="text-sm text-muted-foreground">
          Gestión de usuarios, roles y estado de cuenta. Los nuevos usuarios se crean desde la pantalla de registro.
        </p>
      </div>

      <DataTable
        data={profiles.data ?? []}
        searchKeys={["nombre", "apellido", "email"]}
        actions={
          <Button variant="outline" onClick={exportExcel}>
            <Download className="w-4 h-4 mr-1" /> Excel
          </Button>
        }
        columns={[
          { key: "nombre", header: "Nombre", render: (r) => `${r.nombre} ${r.apellido}` },
          { key: "email", header: "Email" },
          {
            key: "role", header: "Rol",
            render: (r) => {
              const role = (userRoles.data ?? []).find((x) => x.user_id === r.id)?.role;
              return role ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground capitalize">{role}</span>
              ) : "—";
            },
          },
          {
            key: "estado", header: "Estado",
            render: (r) => (
              <span className={`text-xs px-2 py-0.5 rounded-full ${r.estado === "activo" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                {r.estado}
              </span>
            ),
          },
          ...(isAdmin ? [{
            key: "_a", header: "",
            render: (r: any) => (
              <Button size="icon" variant="ghost" onClick={() => startEdit(r)}>
                <Pencil className="w-4 h-4" />
              </Button>
            ),
          }] : []),
        ]}
      />

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nombre</Label>
                <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              </div>
              <div>
                <Label>Apellido</Label>
                <Input value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={form.estado} onValueChange={(v) => setForm({ ...form, estado: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isAdmin && (
              <div>
                <Label>Rol</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button type="submit">Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
