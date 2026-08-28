import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { LayoutDashboard, BookOpen, Map, Users, BarChart3, Settings } from "lucide-react";
import { getUsuarioAtual } from "@/lib/supabase/auth";
import { getEmpresaBranding } from "@/lib/empresa";
import Sidebar from "@/design-system/organisms/Sidebar";

const ITEMS = [
  { href: "/admin", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { href: "/admin/cursos", label: "Cursos", icon: <BookOpen size={18} /> },
  { href: "/admin/trilhas", label: "Trilhas", icon: <Map size={18} /> },
  { href: "/admin/usuarios", label: "Usuários e turmas", icon: <Users size={18} /> },
  { href: "/admin/relatorios", label: "Relatórios", icon: <BarChart3 size={18} /> },
  { href: "/admin/configuracoes", label: "Configurações", icon: <Settings size={18} /> },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const usuario = await getUsuarioAtual();

  if (!usuario) redirect("/login");
  if (usuario.papel !== "admin") redirect("/aluno");

  const empresa = await getEmpresaBranding(usuario.empresaId);

  return (
    <div className="min-h-screen bg-background">
      {empresa?.corPrimaria && (
        <style>{`:root { --primary: ${empresa.corPrimaria}; }`}</style>
      )}
      <Sidebar
        items={ITEMS}
        brandName={empresa?.nome}
        brandLogoUrl={empresa?.logoUrl}
        brandSubtitle="Área Admin"
        usuarioNome={usuario.nome}
      />
      <div className="pl-[17.5rem] pr-6 py-8">{children}</div>
    </div>
  );
}
