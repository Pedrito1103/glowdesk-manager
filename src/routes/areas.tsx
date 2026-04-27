import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { CrudPage } from "@/components/CrudPage";

export const Route = createFileRoute("/areas")({
  component: () => (
    <RequireAuth>
      <CrudPage
        title="Áreas"
        description="Áreas de la empresa donde se asignan equipos."
        table="areas"
        orderBy="nombre"
        writeRoles={["admin"]}
        searchKeys={["nombre", "descripcion"]}
        fields={[
          { key: "nombre", label: "Nombre", required: true },
          { key: "descripcion", label: "Descripción", type: "textarea" },
        ]}
        columns={[
          { key: "nombre", header: "Nombre" },
          { key: "descripcion", header: "Descripción" },
        ]}
      />
    </RequireAuth>
  ),
});
