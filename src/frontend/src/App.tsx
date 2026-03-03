import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import {
  Link,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useRouterState,
} from "@tanstack/react-router";
import { BookMarked, Coins, Library, Menu, Settings, X } from "lucide-react";
import { useState } from "react";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetSaldoAluno } from "./hooks/useQueries";
import BibliotecaPage from "./pages/BibliotecaPage";
import ConfiguracoesPage from "./pages/ConfiguracoesPage";
import LeitorPage from "./pages/LeitorPage";
import LoginPage from "./pages/LoginPage";
import RecompensasPage from "./pages/RecompensasPage";

// ─── Root Layout ─────────────────────────────────────────────────────────────

function RootLayout() {
  const { identity, isInitializing } = useInternetIdentity();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!identity) {
    return <LoginPage />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-sidebar border-r border-sidebar-border shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <BookMarked className="h-6 w-6 text-sidebar-primary" />
          <span className="font-display font-bold text-sidebar-foreground text-lg">
            DislexiaEdu
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-sidebar-foreground p-1 rounded-md hover:bg-sidebar-accent transition-colors"
          aria-label="Menu"
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        // biome-ignore lint/a11y/useKeyWithClickEvents: backdrop dismiss overlay
        <div
          className="md:hidden fixed inset-0 z-40 bg-sidebar/95 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        >
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: stop propagation on inner panel */}
          <div
            className="w-64 h-full bg-sidebar border-r border-sidebar-border"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent onLinkClick={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto md:mt-0 mt-[57px]">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-sidebar border-t border-sidebar-border flex items-center justify-around px-2 py-2 z-30">
        <MobileNavLink
          to="/biblioteca"
          icon={<Library className="h-5 w-5" />}
          label="Biblioteca"
          data-ocid="nav.biblioteca_link"
        />
        <MobileNavLink
          to="/recompensas"
          icon={<Coins className="h-5 w-5" />}
          label="Recompensas"
          data-ocid="nav.recompensas_link"
          highlight
        />
        <MobileNavLink
          to="/configuracoes"
          icon={<Settings className="h-5 w-5" />}
          label="Config"
          data-ocid="nav.configuracoes_link"
        />
      </nav>

      <Toaster richColors position="top-right" />
    </div>
  );
}

function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const { clear, identity } = useInternetIdentity();
  const { data: saldo } = useGetSaldoAluno();
  const principal = identity?.getPrincipal().toString() ?? "";
  const shortPrincipal =
    principal.length > 10
      ? `${principal.slice(0, 5)}...${principal.slice(-3)}`
      : principal;
  const saldoNum = Number(saldo ?? BigInt(0));

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-sidebar-border">
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.82 0.14 78), oklch(0.68 0.17 62))",
          }}
        >
          <BookMarked className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="font-display font-bold text-sidebar-foreground text-lg leading-tight">
            DislexiaEdu
          </h1>
          <p className="text-sidebar-foreground/50 text-xs">
            Leitura Acessível
          </p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <SidebarNavLink
          to="/biblioteca"
          icon={<Library className="h-5 w-5" />}
          label="Biblioteca"
          onClick={onLinkClick}
          data-ocid="nav.biblioteca_link"
        />
        <SidebarNavLink
          to="/recompensas"
          icon={<Coins className="h-5 w-5" />}
          label="Recompensas"
          onClick={onLinkClick}
          data-ocid="nav.recompensas_link"
          highlight
        />
        <SidebarNavLink
          to="/configuracoes"
          icon={<Settings className="h-5 w-5" />}
          label="Configurações"
          onClick={onLinkClick}
          data-ocid="nav.configuracoes_link"
        />
      </nav>

      {/* Token balance in sidebar */}
      <div
        className="px-4 py-3 mx-3 mb-2 rounded-xl"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.24 0.05 215), oklch(0.28 0.07 205))",
        }}
      >
        <p className="text-sidebar-foreground/50 text-xs mb-0.5">Seu saldo</p>
        <div className="flex items-center gap-1.5">
          <span
            className="font-display font-black text-xl"
            style={{
              background:
                "linear-gradient(90deg, oklch(0.85 0.12 80), oklch(0.70 0.17 65))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {saldoNum.toLocaleString("pt-BR")}
          </span>
          <span className="text-sidebar-foreground/50 text-sm">tokens</span>
        </div>
      </div>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-sidebar-primary/30 flex items-center justify-center">
            <span className="text-sidebar-primary text-xs font-bold">
              {shortPrincipal.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sidebar-foreground text-xs font-medium truncate">
              {shortPrincipal}
            </p>
            <p className="text-sidebar-foreground/40 text-xs">Conectado</p>
          </div>
        </div>
        <button
          type="button"
          onClick={clear}
          className="w-full text-left text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground/80 transition-colors py-1"
        >
          Sair
        </button>
      </div>
    </div>
  );
}

function SidebarNavLink({
  to,
  icon,
  label,
  onClick,
  highlight,
  "data-ocid": dataOcid,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  highlight?: boolean;
  "data-ocid"?: string;
}) {
  const routerState = useRouterState();
  const isActive =
    routerState.location.pathname === to ||
    (to !== "/" && routerState.location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      onClick={onClick}
      data-ocid={dataOcid}
      className={cn("sidebar-nav-link", isActive && "active")}
      style={
        highlight && !isActive
          ? {
              color: "oklch(0.75 0.13 80 / 0.8)",
            }
          : undefined
      }
    >
      {icon}
      <span className="text-sm">{label}</span>
      {highlight && !isActive && (
        <span
          className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full"
          style={{
            background: "oklch(0.78 0.15 75 / 0.2)",
            color: "oklch(0.75 0.13 80)",
          }}
        >
          ✦
        </span>
      )}
    </Link>
  );
}

function MobileNavLink({
  to,
  icon,
  label,
  highlight,
  "data-ocid": dataOcid,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  highlight?: boolean;
  "data-ocid"?: string;
}) {
  const routerState = useRouterState();
  const isActive =
    routerState.location.pathname === to ||
    (to !== "/" && routerState.location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      data-ocid={dataOcid}
      className={cn(
        "flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all",
        isActive
          ? "text-sidebar-primary"
          : highlight
            ? "text-sidebar-primary/70 hover:text-sidebar-primary"
            : "text-sidebar-foreground/60 hover:text-sidebar-foreground",
      )}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}

// ─── Router ───────────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({ component: RootLayout });

const bibliotecaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: BibliotecaPage,
});

const bibliotecaRoute2 = createRoute({
  getParentRoute: () => rootRoute,
  path: "/biblioteca",
  component: BibliotecaPage,
});

const leitorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/leitor/$id",
  component: LeitorPage,
});

const recompensasRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/recompensas",
  component: RecompensasPage,
});

const configuracoesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/configuracoes",
  component: ConfiguracoesPage,
});

const routeTree = rootRoute.addChildren([
  bibliotecaRoute,
  bibliotecaRoute2,
  leitorRoute,
  recompensasRoute,
  configuracoesRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
