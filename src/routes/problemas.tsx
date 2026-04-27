import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { CrudPage } from "@/components/CrudPage";

export const Route = createFileRoute("/problemas")({
  component: () => (
    <RequireAuth>
      <CrudPage
        title="Problemas"
        description="Catálogo de problemas reportados en equipos."
        table="problemas"
        orderBy="descripcion"
        writeRoles={["admin", "mantenimiento"]}
        searchKeys={["descripcion"]}
        fields={[
          { key: "descripcion", label: "Descripción", required: true, type: "textarea" },
        ]}
        columns={[{ key: "descripcion", header: "Descripción" }]}
      />
    </RequireAuth>
  ),
});
