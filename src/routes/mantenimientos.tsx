import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { DataTable } from "@/components/DataTable";
import { useTable } from "@/lib/use-table";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/mantenimientos")({
  component: () => (
    <RequireAuth>
      <MantPage />
    </RequireAuth>
  ),
});

function MantPage() {
  const qc = useQueryClient();
  const { roles, user } = useAuth();
  const canWrite = roles.includes("admin") || roles.includes("mantenimiento");

  const mant = useTable<any>(
    "mantenimientos",
    "*, estados(nombre,color), categorias(nombre), areas(nombre), problemas(descripcion), profiles!mantenimientos_responsable_id_fkey(nombre,apellido)",
    "created_at"
  );
  const estados = useTable<any>("estados", "*", "orden");
  const categorias = useTable<any>("categorias");
  const areas = useTable<any>("areas");
  const problemas = useTable<any>("problemas");
  const profiles = useTable<any>("profiles");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [delTarget, setDelTarget] = useState<any>(null);
  const empty = {
    tipo: "preventivo", estado_id: "", categoria_id: "", area_id: "",
    problema_id: "", responsable_id: user?.id ?? "", fecha_inicio: "",
    fecha_fin: "", descripcion: "",
  };
  const [form, setForm] = useState<any>(empty);

  const startCreate = () => { setEditing(null); setForm({ ...empty, responsable_id: user?.id ?? "" }); setOpen(true); };
  const startEdit = (r: any) => {
    setEditing(r);
    setForm({
      tipo: r.tipo, estado_id: r.estado_id ?? "", categoria_id: r.categoria_id ?? "",
      area_id: r.area_id ?? "", problema_id: r.problema_id ?? "",
      responsable_id: r.responsable_id ?? "", fecha_inicio: r.fecha_inicio ?? "",
      fecha_fin: r.fecha_fin ?? "", descripcion: r.descripcion ?? "",
    });
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v === "" ? null : v])
    );
    try {
      if (editing) {
        const { error } = await supabase.from("mantenimientos").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success("Mantenimiento actualizado");
      } else {
        const { error } = await supabase.from("mantenimientos").insert(payload);
        if (error) throw error;
        toast.success("Mantenimiento creado");
      }
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["mantenimientos"] });
    } catch (err: any) { toast.error(err.message); }
  };

  const remove = async () => {
    if (!delTarget) return;
    const { error } = await supabase.from("mantenimientos").delete().eq("id", delTarget.id);
    if (error) toast.error(error.message);
    else { toast.success("Eliminado"); qc.invalidateQueries({ queryKey: ["mantenimientos"] }); }
    setDelTarget(null);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Mantenimientos</h2>
        <p className="text-sm text-muted-foreground">
          Mantenimientos preventivos y correctivos asociados a equipos.
        </p>
      </div>

      <DataTable
        data={mant.data ?? []}
        searchKeys={["descripcion"]}
        actions={canWrite && <Button onClick={startCreate}><Plus className="w-4 h-4 mr-1" />Nuevo</Button>}
        columns={[
          { key: "tipo", header: "Tipo", render: (r) => <span className="capitalize">{r.tipo}</span> },
          {
            key: "estado", header: "Estado",
            render: (r) => r.estados ? (
              <span className="inline-flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full" style={{ background: r.estados.color }} />
                {r.estados.nombre}
              </span>
            ) : "—",
          },
          { key: "categoria", header: "Categoría", render: (r) => r.categorias?.nombre ?? "—" },
          { key: "area", header: "Área", render: (r) => r.areas?.nombre ?? "—" },
          { key: "fecha_inicio", header: "Inicio" },
          { key: "fecha_fin", header: "Fin" },
          { key: "descripcion", header: "Descripción", render: (r) => <span className="line-clamp-2">{r.descripcion}</span> },
          ...(canWrite ? [{
            key: "_a", header: "",
            render: (r: any) => (
              <div className="flex gap-1 justify-end">
                <Button size="icon" variant="ghost" onClick={() => startEdit(r)}><Pencil className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDelTarget(r)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            ),
          }] : []),
        ]}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{editing ? "Editar mantenimiento" : "Nuevo mantenimiento"}</DialogTitle></DialogHeader>
          <form onSubmit={save} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preventivo">Preventivo</SelectItem>
                    <SelectItem value="correctivo">Correctivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estado</Label>
                <Select value={form.estado_id} onValueChange={(v) => setForm({ ...form, estado_id: v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {(estados.data ?? []).map((e) => <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Categoría</Label>
                <Select value={form.categoria_id} onValueChange={(v) => setForm({ ...form, categoria_id: v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {(categorias.data ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Área</Label>
                <Select value={form.area_id} onValueChange={(v) => setForm({ ...form, area_id: v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {(areas.data ?? []).map((a) => <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Problema</Label>
                <Select value={form.problema_id} onValueChange={(v) => setForm({ ...form, problema_id: v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {(problemas.data ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.descripcion}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Responsable</Label>
                <Select value={form.responsable_id} onValueChange={(v) => setForm({ ...form, responsable_id: v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {(profiles.data ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.nombre} {p.apellido}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fecha inicio</Label>
                <Input type="date" value={form.fecha_inicio} onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })} />
              </div>
              <div>
                <Label>Fecha fin</Label>
                <Input type="date" value={form.fecha_fin} onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} rows={3} />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit">{editing ? "Guardar" : "Crear"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!delTarget} onOpenChange={(o) => !o && setDelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar mantenimiento?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
