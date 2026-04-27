import { createFileRoute } from "@tanstack/react-router";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Download, FileText } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { RequireAuth } from "@/components/RequireAuth";
import { useTable } from "@/lib/use-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/reportes")({
  component: () => (
    <RequireAuth><ReportesPage /></RequireAuth>
  ),
});

function ReportesPage() {
  const mant = useTable<any>("mantenimientos", "*, estados(nombre), categorias(nombre), areas(nombre)");
  const areas = useTable<any>("areas");
  const categorias = useTable<any>("categorias");

  const byArea = (areas.data ?? []).map((a) => ({
    name: a.nombre, Total: (mant.data ?? []).filter((m) => m.area_id === a.id).length,
  }));
  const byCat = (categorias.data ?? []).map((c) => ({
    name: c.nombre, Total: (mant.data ?? []).filter((m) => m.categoria_id === c.id).length,
  }));

  const rows = (mant.data ?? []).map((m) => ({
    Tipo: m.tipo, Estado: m.estados?.nombre ?? "", Categoría: m.categorias?.nombre ?? "",
    Área: m.areas?.nombre ?? "", Inicio: m.fecha_inicio ?? "", Fin: m.fecha_fin ?? "",
    Descripción: m.descripcion ?? "",
  }));

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mantenimientos");
    XLSX.writeFile(wb, "reporte-mantenimientos.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("EMC — Reporte de Mantenimientos", 14, 18);
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 25);
    autoTable(doc, {
      startY: 32,
      head: [["Tipo", "Estado", "Categoría", "Área", "Inicio", "Fin"]],
      body: rows.map((r) => [r.Tipo, r.Estado, r.Categoría, r.Área, r.Inicio, r.Fin]),
      styles: { fontSize: 9 }, headStyles: { fillColor: [25, 118, 210] },
    });
    doc.save("reporte-mantenimientos.pdf");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">Reportes</h2>
          <p className="text-sm text-muted-foreground">Tendencias y exportación de datos.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportExcel}><Download className="w-4 h-4 mr-1" />Excel</Button>
          <Button onClick={exportPDF}><FileText className="w-4 h-4 mr-1" />PDF</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Mantenimientos por área</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byArea}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis allowDecimals={false} fontSize={11} />
                <Tooltip /><Legend />
                <Bar dataKey="Total" fill="oklch(0.55 0.17 254)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Mantenimientos por categoría</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCat}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis allowDecimals={false} fontSize={11} />
                <Tooltip /><Legend />
                <Bar dataKey="Total" fill="oklch(0.74 0.16 60)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Detalle de mantenimientos ({rows.length})</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["Tipo", "Estado", "Categoría", "Área", "Inicio", "Fin"].map((h) => (
                  <th key={h} className="text-left font-medium px-4 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="px-4 py-2 capitalize">{r.Tipo}</td>
                  <td className="px-4 py-2">{r.Estado}</td>
                  <td className="px-4 py-2">{r.Categoría}</td>
                  <td className="px-4 py-2">{r.Área}</td>
                  <td className="px-4 py-2">{r.Inicio}</td>
                  <td className="px-4 py-2">{r.Fin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
