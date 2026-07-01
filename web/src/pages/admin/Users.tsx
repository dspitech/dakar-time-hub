import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  useEffect(() => { api.listUsers().then(setUsers).catch((e) => toast.error(e.message)); }, []);
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Utilisateurs</h1><p className="text-muted-foreground text-sm">Comptes actifs sur la plateforme.</p></div>
      <Card>
        <CardHeader><CardTitle className="text-base">{users.length} compte{users.length > 1 ? "s" : ""}</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50"><tr><th className="text-left p-3 font-medium">Identifiant</th><th className="text-left p-3 font-medium">Rôle</th><th className="text-left p-3 font-medium">Créé</th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.username} className="border-t">
                    <td className="p-3 font-medium">{u.username}</td>
                    <td className="p-3"><span className={"px-2 py-0.5 rounded text-xs font-medium " + (u.role === "admin" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>{u.role}</span></td>
                    <td className="p-3 text-muted-foreground">{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
                {users.length === 0 && <tr><td colSpan={3} className="p-8 text-center text-muted-foreground">Aucun compte</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
