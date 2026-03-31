import {
  Activity,
  Crosshair,
  FileText,
  LayoutDashboard,
  LogOut,
  Shield,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { Page, User } from "../types";

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  user: User;
  onLogout: () => void;
}

const navItems: { page: Page; label: string; icon: React.ReactNode }[] = [
  {
    page: "dashboard",
    label: "DASHBOARD",
    icon: <LayoutDashboard size={16} />,
  },
  { page: "users", label: "USERS", icon: <Users size={16} /> },
  { page: "attack", label: "ATTACK", icon: <Crosshair size={16} /> },
  { page: "detect", label: "DETECT", icon: <Shield size={16} /> },
  { page: "prevent", label: "PREVENT", icon: <ShieldCheck size={16} /> },
  { page: "reports", label: "REPORTS", icon: <FileText size={16} /> },
  { page: "activity", label: "ACTIVITY", icon: <Activity size={16} /> },
];

export default function Sidebar({
  currentPage,
  onNavigate,
  user,
  onLogout,
}: SidebarProps) {
  return (
    <aside className="w-56 flex flex-col shrink-0 bg-sidebar border-r border-border h-full">
      {/* Brand */}
      <div className="p-4 border-b border-border">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
          COMBO TOOL
        </p>
        <div className="bg-cyan-950/60 border border-cyber-cyan/40 rounded px-2 py-2 mb-2">
          <p className="text-[11px] font-mono font-bold text-foreground leading-tight tracking-wide">
            ATTACK + DETECT
            <br />+ PREVENT
          </p>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded-sm border border-cyber-cyan/50 text-cyber-cyan text-[10px] font-mono tracking-widest">
          SAFE REPLAY MODE
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5">
        {navItems.map(({ page, label, icon }) => (
          <button
            type="button"
            key={page}
            data-ocid={`nav.${page}.link`}
            onClick={() => onNavigate(page)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded text-left text-[11px] font-mono tracking-widest transition-colors ${
              currentPage === page
                ? "bg-cyber-cyan/10 text-cyber-cyan border-l-2 border-cyber-cyan"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <span className={currentPage === page ? "text-cyber-cyan" : ""}>
              {icon}
            </span>
            {label}
          </button>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-border">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
          {user.role.toUpperCase()}
        </p>
        <p className="text-xs font-mono text-foreground truncate">
          {user.name}
        </p>
        <p className="text-[10px] text-muted-foreground truncate mb-2">
          {user.email}
        </p>
        <button
          type="button"
          data-ocid="nav.signout.button"
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-[10px] font-mono tracking-widest text-muted-foreground hover:text-foreground hover:bg-secondary border border-border transition-colors"
        >
          <LogOut size={12} />
          SIGN OUT
        </button>
      </div>
    </aside>
  );
}
