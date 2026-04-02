import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldAlert } from "lucide-react";
import { useState } from "react";

interface LoginPageProps {
  onLogin: (email: string, password: string) => boolean;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setTimeout(() => {
      const ok = onLogin(email, password);
      if (!ok) setError("Invalid credentials. Check email and password.");
      setLoading(false);
    }, 400);
  };

  const fillDemo = (type: "admin" | "analyst" | "webuser") => {
    if (type === "admin") {
      setEmail("admin@combodefense.local");
      setPassword("admin123");
    } else if (type === "analyst") {
      setEmail("analyst@combodefense.local");
      setPassword("analyst123");
    } else {
      setEmail("webuser@combodefense.local");
      setPassword("webuser123");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-card border border-border rounded-lg overflow-hidden flex shadow-2xl">
        {/* Left side */}
        <div className="flex-1 p-10 flex flex-col justify-center border-r border-border">
          <div className="mb-6">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-cyber-cyan/50 text-cyber-cyan text-[11px] font-mono tracking-widest mb-6">
              <ShieldAlert size={12} />
              SOC SAFE SIMULATION
            </span>
          </div>
          <h1 className="text-3xl font-mono font-bold uppercase tracking-widest text-foreground leading-tight mb-4">
            COMBO
            <br />
            DEFENSE
            <br />
            CONSOLE
          </h1>
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
            Unified security operations platform for SQL injection simulation,
            threat detection, and prevention hardening. Safe replay environment
            for training and validation.
          </p>

          <div className="space-y-3">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              DEMO CREDENTIALS
            </p>
            <button
              type="button"
              data-ocid="login.admin_demo.button"
              onClick={() => fillDemo("admin")}
              className="w-full text-left p-3 rounded border border-border bg-secondary/40 hover:border-cyber-cyan/40 hover:bg-secondary transition-colors"
            >
              <p className="text-[10px] font-mono uppercase tracking-widest text-cyber-cyan mb-1">
                ADMIN DEMO
              </p>
              <p className="text-[11px] font-mono text-muted-foreground">
                admin@combodefense.local / admin123
              </p>
            </button>
            <button
              type="button"
              data-ocid="login.analyst_demo.button"
              onClick={() => fillDemo("analyst")}
              className="w-full text-left p-3 rounded border border-border bg-secondary/40 hover:border-cyber-cyan/40 hover:bg-secondary transition-colors"
            >
              <p className="text-[10px] font-mono uppercase tracking-widest text-cyber-cyan mb-1">
                ANALYST DEMO
              </p>
              <p className="text-[11px] font-mono text-muted-foreground">
                analyst@combodefense.local / analyst123
              </p>
            </button>
            <button
              type="button"
              data-ocid="login.webuser_demo.button"
              onClick={() => fillDemo("webuser")}
              className="w-full text-left p-3 rounded border border-border bg-secondary/40 hover:border-orange-400/40 hover:bg-secondary transition-colors"
            >
              <p className="text-[10px] font-mono uppercase tracking-widest text-orange-400 mb-1">
                WEB TARGET USER
              </p>
              <p className="text-[11px] font-mono text-muted-foreground">
                webuser / webuser123
              </p>
            </button>
          </div>
        </div>

        {/* Right side */}
        <div className="w-80 p-10 flex flex-col justify-center bg-secondary/20">
          <h2 className="text-lg font-mono font-bold uppercase tracking-widest text-foreground mb-1">
            SIGN IN
          </h2>
          <p className="text-[11px] text-muted-foreground mb-8">
            Access your security console
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5"
              >
                EMAIL / USERNAME
              </label>
              <Input
                id="login-email"
                data-ocid="login.email.input"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-card border-border font-mono text-xs focus:border-cyber-cyan focus:ring-cyber-cyan"
                placeholder="your@email.com or username"
                required
              />
            </div>
            <div>
              <label
                htmlFor="login-password"
                className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5"
              >
                PASSWORD
              </label>
              <Input
                id="login-password"
                data-ocid="login.password.input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-card border-border font-mono text-xs focus:border-cyber-cyan"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <p
                data-ocid="login.error_state"
                className="text-[11px] text-cyber-red font-mono"
              >
                {error}
              </p>
            )}

            <Button
              data-ocid="login.submit_button"
              type="submit"
              disabled={loading}
              className="w-full bg-cyber-cyan text-background hover:bg-cyber-cyan/90 font-mono text-xs uppercase tracking-widest h-10 mt-2"
            >
              {loading ? "AUTHENTICATING..." : "ENTER CONSOLE"}
            </Button>
          </form>
        </div>
      </div>

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2">
        <p className="text-[10px] text-muted-foreground font-mono">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyber-cyan hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
