import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "EMC — Gestión de mantenimiento de equipos" },
      {
        name: "description",
        content:
          "Panel de administración EMC para gestionar mantenimiento, traslado y control de equipos de iluminación y sonido.",
      },
      { property: "og:title", content: "EMC — Gestión de mantenimiento de equipos" },
      { name: "twitter:title", content: "EMC — Gestión de mantenimiento de equipos" },
      { name: "description", content: "EMC Gear Manager is a React/TypeScript app for managing audio and lighting equipment maintenance." },
      { property: "og:description", content: "EMC Gear Manager is a React/TypeScript app for managing audio and lighting equipment maintenance." },
      { name: "twitter:description", content: "EMC Gear Manager is a React/TypeScript app for managing audio and lighting equipment maintenance." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/605b5a66-b05c-42fa-bb24-f74d958fb867/id-preview-d98d1bea--a59e2e6c-ff7a-43fd-919a-789b25bfe40c.lovable.app-1777310998285.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/605b5a66-b05c-42fa-bb24-f74d958fb867/id-preview-d98d1bea--a59e2e6c-ff7a-43fd-919a-789b25bfe40c.lovable.app-1777310998285.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <h1 className="text-7xl font-bold text-primary">404</h1>
        <h2 className="mt-2 text-xl font-semibold">Página no encontrada</h2>
        <p className="text-sm text-muted-foreground mt-2">
          La ruta solicitada no existe.
        </p>
        <a
          href="/dashboard"
          className="inline-block mt-6 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium"
        >
          Ir al panel
        </a>
      </div>
    </div>
  ),
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const [qc] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
  }));
  return (
    <QueryClientProvider client={qc}>
      <ThemeProvider>
        <AuthProvider>
          <Outlet />
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
