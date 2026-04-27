import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { CrudPage } from "@/components/CrudPage";

export const Route = createFileRoute("/estados")({
  component: () => (
    <RequireAuth>
      <CrudPage
        title="Estados"
        description="Estados del flujo de mantenimiento."
        table="estados"
        orderBy="orden"
        writeRoles={["admin"]}
        searchKeys={["nombre"]}
        fields={[
          { key: "nombre", label: "Nombre", required: true },
          { key: "orden", label: "Orden", type: "number" },
          { key: "color", label: "Color", type: "color" },
        ]}
        columns={[
          { key: "orden", header: "#" },
          {
            key: "nombre",
            header: "Estado",
            render: (r: any) => (
              <span className="inline-flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ background: r.color || "#999" }}
                />
                {r.nombre}
              </span>
            ),
          },
        ]}
      />
    </RequireAuth>
  ),
});
