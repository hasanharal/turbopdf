import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Trash2, LogOut, Inbox } from "lucide-react";
import { Feedback, deleteFeedback, getFeedback, isAdminAuthed, setAdminAuthed } from "@/lib/feedback-store";
import { Seo } from "@/components/Seo";

export default function AdminPanel() {
  const nav = useNavigate();
  const [list, setList] = useState<Feedback[]>([]);

  useEffect(() => {
    if (!isAdminAuthed()) { nav("/admin", { replace: true }); return; }
    setList(getFeedback());
  }, [nav]);

  const remove = (id: string) => { deleteFeedback(id); setList(getFeedback()); };
  const logout = () => { setAdminAuthed(false); nav("/admin"); };

  return (
    <div className="min-h-screen flex flex-col">
      <Seo title="Admin Panel · TurboPDF" description="Admin panel" canonical="https://turbopdf-lab.vercel.app/admin/panel" />
      <Navbar />
      <main className="flex-1 py-10">
        <div className="container-tight">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Feedback inbox</h1>
              <p className="text-sm text-muted-foreground">{list.length} message{list.length === 1 ? "" : "s"}</p>
            </div>
            <Button variant="outline" onClick={logout}><LogOut className="h-4 w-4 mr-2" /> Sign out</Button>
          </div>

          {list.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
              <Inbox className="h-8 w-8 mx-auto mb-3 opacity-60" />
              No feedback yet.
            </div>
          ) : (
            <div className="space-y-3">
              {list.map((f) => (
                <div key={f.id} className="rounded-xl border border-border bg-card p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <p className="font-semibold">{f.name}</p>
                        <span className="text-xs text-muted-foreground">{f.contactKind}: {f.contact}</span>
                        {f.tool && <span className="text-xs px-2 py-0.5 rounded-full bg-secondary">{f.tool}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{new Date(f.createdAt).toLocaleString()}</p>
                      <p className="mt-3 text-sm whitespace-pre-wrap break-words">{f.message}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => remove(f.id)} aria-label="Delete">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
