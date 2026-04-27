import { useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface DataTableProps<T> {
  title?: string;
  data: T[];
  columns: { key: string; header: string; render?: (row: T) => ReactNode }[];
  searchKeys?: (keyof T)[];
  actions?: ReactNode;
  emptyMessage?: string;
  pageSize?: number;
}

export function DataTable<T extends Record<string, any>>({
  title,
  data,
  columns,
  searchKeys,
  actions,
  emptyMessage = "Sin registros",
  pageSize = 10,
}: DataTableProps<T>) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const filtered = q && searchKeys?.length
    ? data.filter((row) =>
        searchKeys.some((k) =>
          String(row[k] ?? "").toLowerCase().includes(q.toLowerCase())
        )
      )
    : data;

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const slice = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <Card>
      {(title || actions || searchKeys) && (
        <CardHeader className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
          {title && <CardTitle className="flex-1">{title}</CardTitle>}
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            {searchKeys && (
              <div className="relative">
                <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar…"
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setPage(1);
                  }}
                  className="pl-8 w-full sm:w-64"
                />
              </div>
            )}
            {actions}
          </div>
        </CardHeader>
      )}
      <CardContent className="p-0">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className="text-left font-medium px-4 py-3 whitespace-nowrap"
                  >
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slice.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="text-center py-10 text-muted-foreground"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                slice.map((row, i) => (
                  <tr
                    key={row.id ?? i}
                    className="border-t border-border hover:bg-muted/30"
                  >
                    {columns.map((c) => (
                      <td key={c.key} className="px-4 py-3 align-middle">
                        {c.render ? c.render(row) : (row[c.key] ?? "—")}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-border">
          {slice.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">{emptyMessage}</div>
          ) : (
            slice.map((row, i) => (
              <div key={row.id ?? i} className="p-4 space-y-1.5">
                {columns.map((c) => (
                  <div key={c.key} className="flex justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">{c.header}</span>
                    <span className="text-right break-words">
                      {c.render ? c.render(row) : (row[c.key] ?? "—")}
                    </span>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {filtered.length > pageSize && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border text-sm">
            <span className="text-muted-foreground">
              {filtered.length} resultados
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={safePage === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-2 py-1 rounded hover:bg-muted disabled:opacity-40"
              >
                ←
              </button>
              <span>
                {safePage} / {totalPages}
              </span>
              <button
                disabled={safePage === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-2 py-1 rounded hover:bg-muted disabled:opacity-40"
              >
                →
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
