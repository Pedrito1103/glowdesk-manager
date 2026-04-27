import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Upload, ExternalLink, Check } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/soluciones")({
  component: () => (
    <RequireAuth><SolPage /></RequireAuth>
  ),
});

function SolPage() {
  const qc = useQueryClient();
  const { roles, user } = useAuth();
  const canWrite = roles.includes("admin") || roles.includes("mantenimiento");

  const sol = useTable<any>("soluciones", "*, problemas(descripcion), mantenimientos(descripcion)", "created_at");
  const problemas = useTable<any>("problemas");
  const mant = useTable<any>("mantenimientos");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [delTarget, setDelTarget] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const empty = {
    descripcion: "", problema_id: "", mantenimiento_id: "",
    responsable_id: user?.id ?? "", fecha_inicio: "", fecha_fin: "",
    evidencia_url: "", implementada: false,
  };
  const [form, setForm] = useState<any>(empty);

  const startCreate = () => { setEditing(null); setForm({ ...empty, responsable_id: user?.id ?? "" }); setOpen(true); };
  const startEdit = (r: any) => {
    setEditing(r);
    setForm({
      descripcion: r.descripcion ?? "", problema_id: r.problema_id ?? "",
      mantenimiento_id: r.mantenimiento_id ?? "", responsable_id: r.responsable_id ?? "",
      fecha_inicio: r.fecha_inicio ?? "", fecha_fin: r.fecha_fin ?? "",
      evidencia_url: r.evidencia_url ?? "", implementada: !!r.implementada,
    });
    setOpen(true);
  };

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const path = `${user?.id ?? "anon"}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("evidencias").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("evidencias").getPublicUrl(path);
      setForm((f: any) => ({ ...f, evidencia_url: data.publicUrl }));
      toast.success("Evidencia subida");
    } catch (err: any) { toast.error(err.message); }
    finally { setUploading(false); }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.descripcion.trim()) return toast.error("Descripción obligatoria");
    const payload: any = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === "" ? null : v]));
    try {
      if (editing) {
        const { error } = await supabase.from("soluciones").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success("Solución actualizada");
      } else {
        const { error } = await supabase.from("soluciones").insert(payload);
        if (error) throw error;
        toast.success("Solución creada");
      }
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["soluciones"] });
    } catch (err: any) { toast.error(err.message); }
  };

  const remove = async () => {
    if (!delTarget) return;
    const { error } = await supabase.from("soluciones").delete().eq("id", delTarget.id);
    if (error) toast.error(error.message);
    else { toast.success("Eliminada"); qc.invalidateQueries({ queryKey: ["soluciones"] }); }
    setDelTarget(null);
  };

  const toggleImplementada = async (row: any) => {
    const { error } = await supabase.from("soluciones").update({ implementada: !row.implementada }).eq("id", row.id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["soluciones"] });
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Soluciones</h2>
        <p className="text-sm text-muted-foreground">Soluciones aplicadas a problemas, con evidencias.</p>
      </div>

      <DataTable
        data={sol.data ?? []}
        searchKeys={["descripcion"]}
        actions={canWrite && <Button onClick={startCreate}><Plus className="w-4 h-4 mr-1" />Nueva</Button>}
        columns={[
          { key: "descripcion", header: "Descripción", render: (r) => <span className="line-clamp-2">{r.descripcion}</span> },
          { key: "problema", header: "Problema", render: (r) => r.problemas?.descripcion ?? "—" },
          { key: "fecha_fin", header: "Fecha fin" },
          {
            key: "evidencia", header: "Evidencia",
            render: (r) => r.evidencia_url ? (
              <a href={r.evidencia_url} target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-1 text-xs">
                Ver <ExternalLink className="w-3 h-3" />
              </a>
            ) : "—",
          },
          {
            key: "implementada", header: "Implementada",
            render: (r) => (
              <button onClick={() => canWrite && toggleImplementada(r)} className={`text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${r.implementada ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                {r.implementada && <Check className="w-3 h-3" />} {r.implementada ? "Sí" : "No"}
              </button>
            ),
          },
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
          <DialogHeader><DialogTitle>{editing ? "Editar solución" : "Nueva solución"}</DialogTitle></DialogHeader>
          <form onSubmit={save} className="space-y-3">
            <div>
              <Label>Descripción *</Label>
              <Textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
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
                <Label>Mantenimiento</Label>
                <Select value={form.mantenimiento_id} onValueChange={(v) => setForm({ ...form, mantenimiento_id: v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {(mant.data ?? []).map((m) => <SelectItem key={m.id} value={m.id}>{m.descripcion?.slice(0, 40) || m.id.slice(0, 8)}</SelectItem>)}
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
              <Label>Evidencia (imagen o PDF)</Label>
              <div className="flex items-center gap-2">
                <Input type="file" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} disabled={uploading} />
                {form.evidencia_url && (
                  <a href={form.evidencia_url} target="_blank" rel="noreferrer" className="text-xs text-primary">
                    <Upload className="w-3 h-3 inline" /> Ver
                  </a>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <Label htmlFor="impl" className="cursor-pointer">Solución implementada</Label>
              <Switch id="impl" checked={form.implementada} onCheckedChange={(v) => setForm({ ...form, implementada: v })} />
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
            <AlertDialogTitle>¿Eliminar solución?</AlertDialogTitle>
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
