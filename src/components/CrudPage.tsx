import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTable } from "@/lib/use-table";
import { useAuth } from "@/lib/auth-context";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface FieldDef {
  key: string;
  label: string;
  type?: "text" | "textarea" | "number" | "color";
  required?: boolean;
  placeholder?: string;
}

interface CrudPageProps<T> {
  title: string;
  description?: string;
  table: string;
  select?: string;
  orderBy?: string;
  fields: FieldDef[];
  columns: { key: string; header: string; render?: (row: T) => ReactNode }[];
  searchKeys?: (keyof T)[];
  /** if absent, all authenticated users can write. Otherwise restrict by these roles. */
  writeRoles?: ("admin" | "mantenimiento" | "transporte")[];
}

export function CrudPage<T extends Record<string, any>>({
  title,
  description,
  table,
  select = "*",
  orderBy,
  fields,
  columns,
  searchKeys,
  writeRoles,
}: CrudPageProps<T>) {
  const qc = useQueryClient();
  const { roles } = useAuth();
  const canWrite = !writeRoles || writeRoles.some((r) => roles.includes(r));
  const { data = [], isLoading } = useTable<T>(table, select, orderBy);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [delTarget, setDelTarget] = useState<T | null>(null);

  const reset = () => {
    setForm(Object.fromEntries(fields.map((f) => [f.key, ""])));
    setEditing(null);
  };

  const startCreate = () => {
    reset();
    setOpen(true);
  };
  const startEdit = (row: T) => {
    setEditing(row);
    setForm(Object.fromEntries(fields.map((f) => [f.key, row[f.key] ?? ""])));
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const f of fields) {
      if (f.required && !String(form[f.key] ?? "").trim()) {
        return toast.error(`El campo "${f.label}" es obligatorio`);
      }
    }
    const payload: Record<string, any> = {};
    for (const f of fields) {
      let v: any = form[f.key];
      if (f.type === "number") v = v === "" || v === null ? null : Number(v);
      payload[f.key] = v === "" ? null : v;
    }
    try {
      if (editing) {
        const { error } = await supabase.from(table as any).update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success("Actualizado");
      } else {
        const { error } = await supabase.from(table as any).insert(payload);
        if (error) throw error;
        toast.success("Creado");
      }
      setOpen(false);
      qc.invalidateQueries({ queryKey: [table] });
    } catch (err: any) {
      toast.error(err.message ?? "Error");
    }
  };

  const handleDelete = async () => {
    if (!delTarget) return;
    try {
      const { error } = await supabase.from(table as any).delete().eq("id", delTarget.id);
      if (error) throw error;
      toast.success("Eliminado");
      setDelTarget(null);
      qc.invalidateQueries({ queryKey: [table] });
    } catch (err: any) {
      toast.error(err.message ?? "Error");
    }
  };

  const cols: typeof columns = canWrite
    ? [
        ...columns,
        {
          key: "_actions",
          header: "Acciones",
          render: (row) => (
            <div className="flex gap-1 justify-end">
              <Button size="icon" variant="ghost" onClick={() => startEdit(row)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setDelTarget(row)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ),
        },
      ]
    : columns;

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center gap-2">
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>

      <DataTable<T>
        data={isLoading ? [] : data}
        columns={cols}
        searchKeys={searchKeys}
        emptyMessage={isLoading ? "Cargando…" : "Sin registros"}
        actions={
          canWrite && (
            <Button onClick={startCreate}>
              <Plus className="w-4 h-4 mr-1" /> Nuevo
            </Button>
          )
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar" : "Nuevo"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            {fields.map((f) => (
              <div key={f.key}>
                <Label htmlFor={f.key}>
                  {f.label}
                  {f.required && <span className="text-destructive ml-0.5">*</span>}
                </Label>
                {f.type === "textarea" ? (
                  <Textarea
                    id={f.key}
                    value={form[f.key] ?? ""}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    rows={3}
                  />
                ) : (
                  <Input
                    id={f.key}
                    type={f.type === "color" ? "color" : f.type === "number" ? "number" : "text"}
                    value={form[f.key] ?? ""}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                  />
                )}
              </div>
            ))}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">{editing ? "Guardar" : "Crear"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!delTarget} onOpenChange={(o) => !o && setDelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
