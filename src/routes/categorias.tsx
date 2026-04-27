import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { CrudPage } from "@/components/CrudPage";

export const Route = createFileRoute("/categorias")({
  component: () => (
    <RequireAuth>
      <CrudPage
        title="Categorías"
        description="Clasificación principal de los equipos (Sonido, Iluminación)."
        table="categorias"
        orderBy="nombre"
        writeRoles={["admin"]}
        searchKeys={["nombre"]}
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
