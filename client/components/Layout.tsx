import { Link, NavLink, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Activity, AlertTriangle, Droplets } from "lucide-react";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/report", label: "Community Reporting" },
  { to: "/kits", label: "Water Kits" },
  { to: "/education", label: "Education" },
  { to: "/analytics", label: "Analytics" },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 font-extrabold text-xl"
          >
            <Droplets className="text-primary" />
            <span>Smart Water Surveillance</span>
          </Link>
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "px-3 py-2 rounded-md text-sm font-medium hover:bg-secondary",
                    isActive ? "text-primary" : "text-foreground/80",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-destructive" />
            <Activity className="text-primary" />
          </div>
        </div>
      </header>

      <main className="container mx-auto py-6">
        <Outlet />
      </main>

      <footer className="mt-10 border-t bg-card/60">
        <div className="container mx-auto py-6 text-sm text-foreground/70 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>
            © {new Date().getFullYear()} Smart Water Monitoring & Early
            Warning System
          </p>
          <p>Obsidian</p>
        </div>
      </footer>
    </div>
  );
}
