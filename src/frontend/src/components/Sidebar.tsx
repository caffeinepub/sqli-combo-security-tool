import {
  Activity,
  Braces,
  ClipboardCheck,
  Crosshair,
  Database,
  FileText,
  Fingerprint,
  GitBranch,
  Globe,
  History,
  LayoutDashboard,
  Lock,
  LogOut,
  ServerCrash,
  Shield,
  ShieldCheck,
  Swords,
  Users,
} from "lucide-react";
import type { Page, User } from "../types";

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  user: User;
  onLogout: () => void;
}

const navItems: {
  page: Page;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}[] = [
  {
    page: "dashboard",
    label: "DASHBOARD",
    icon: <LayoutDashboard size={16} />,
  },
  { page: "users", label: "USERS", icon: <Users size={16} /> },
  { page: "attack", label: "ATTACK", icon: <Crosshair size={16} /> },
  { page: "detect", label: "DETECT", icon: <Shield size={16} /> },
  { page: "prevent", label: "PREVENT", icon: <ShieldCheck size={16} /> },
  {
    page: "reports",
    label: "REPORTS",
    icon: <FileText size={16} />,
    adminOnly: true,
  },
  { page: "waf", label: "WAF", icon: <Lock size={16} />, adminOnly: true },
  { page: "timeline", label: "TIMELINE", icon: <History size={16} /> },
  { page: "map", label: "LIVE MAP", icon: <Globe size={16} /> },
  { page: "activity", label: "ACTIVITY", icon: <Activity size={16} /> },
];

const socItems: {
  page: Page;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}[] = [
  {
    page: "siem",
    label: "SIEM",
    icon: <ServerCrash size={16} />,
    adminOnly: true,
  },
  { page: "threat-intel", label: "THREAT INTEL", icon: <Database size={16} /> },
  {
    page: "attack-chain",
    label: "ATTACK CHAIN",
    icon: <GitBranch size={16} />,
  },
  {
    page: "compliance",
    label: "COMPLIANCE",
    icon: <ClipboardCheck size={16} />,
  },
  { page: "zero-trust", label: "ZERO TRUST", icon: <Fingerprint size={16} /> },
  { page: "api-security", label: "API SECURITY", icon: <Braces size={16} /> },
  { page: "red-blue", label: "RED/BLUE OPS", icon: <Swords size={16} /> },
];

export default function Sidebar({
  currentPage,
  onNavigate,
  user,
  onLogout,
}: SidebarProps) {
  const isAdmin = user.role === "admin";

  const renderNavItem = (
    { page, label, icon, adminOnly }: (typeof navItems)[0],
    idx: number,
  ) => {
    if (adminOnly && !isAdmin) return null;
    return (
      <button
        type="button"
        key={`${page}-${idx}`}
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
        {page === "waf" && (
          <span className="ml-auto text-[8px] font-mono text-cyber-cyan/50 border border-cyber-cyan/20 rounded px-1">
            ADM
          </span>
        )}
        {page === "siem" && (
          <span className="ml-auto text-[8px] font-mono text-cyber-cyan/50 border border-cyber-cyan/20 rounded px-1">
            ADM
          </span>
        )}
      </button>
    );
  };

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
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item, idx) => renderNavItem(item, idx))}

        {/* SOC Modules divider */}
        <div className="px-3 pt-3 pb-1">
          <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/60 border-t border-border pt-2">
            SOC MODULES
          </p>
        </div>

        {socItems.map((item, idx) => renderNavItem(item, idx + 100))}
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
