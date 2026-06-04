import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { ADMIN_PASS, ADMIN_USER, isAdminAuthed, setAdminAuthed } from "@/lib/feedback-store";
import { Seo } from "@/components/Seo";

export default function AdminLogin() {
  const nav = useNavigate();
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");

  if (isAdminAuthed()) { nav("/admin/panel", { replace: true }); }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (u === ADMIN_USER && p === ADMIN_PASS) {
      setAdminAuthed(true);
      nav("/admin/panel");
    } else {
      setErr("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Seo title="Admin · TurboPDF" description="Admin access" canonical="https://turbopdf-lab.vercel.app/admin" />
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-16">
        <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-border bg-card p-7 shadow-soft">
          <div className="h-12 w-12 rounded-xl bg-hero-gradient flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold">Admin sign in</h1>
          <p className="text-sm text-muted-foreground mt-1">Restricted area</p>
          <div className="space-y-3 mt-5">
            <div className="space-y-1.5">
              <Label>Username</Label>
              <Input value={u} onChange={(e) => setU(e.target.value)} autoComplete="username" />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input type="password" value={p} onChange={(e) => setP(e.target.value)} autoComplete="current-password" />
            </div>
            {err && <p className="text-xs text-destructive">{err}</p>}
            <Button type="submit" className="w-full bg-hero-gradient hover:opacity-90 h-11">Sign in</Button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
}
