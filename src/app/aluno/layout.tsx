import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Compass, GraduationCap } from "lucide-react";
import { getUsuarioAtual } from "@/lib/supabase/auth";
import Sidebar from "@/design-system/organisms/Sidebar";

const ITEMS = [
  { href: "/aluno", label: "Minha trilha", icon: <Compass size={18} /> },
  { href: "/aluno/certificados", label: "Certificados", icon: <GraduationCap size={18} /> },
];

export default async function AlunoLayout({ children }: { children: ReactNode }) {
  const usuario = await getUsuarioAtual();

  if (!usuario) redirect("/login");
  // admin também pode visualizar a área do aluno (modo preview), aluno não entra no admin.

  return (
    <div className="min-h-screen bg-background">
      <Sidebar items={ITEMS} brandSubtitle="Minha área" usuarioNome={usuario.nome} />
      <div className="pl-[17.5rem] pr-6 py-8">{children}</div>
    </div>
  );
}
