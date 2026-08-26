import { Users, BookOpen, GraduationCap } from "lucide-react";
import PageHeader from "@/design-system/organisms/PageHeader";
import StatCard from "@/design-system/molecules/StatCard";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [{ count: usuarios }, { count: trilhas }, { count: certificados }] = await Promise.all([
    supabase.from("usuarios").select("id", { count: "exact", head: true }).eq("papel", "aluno"),
    supabase.from("trilhas").select("id", { count: "exact", head: true }),
    supabase.from("certificados").select("id", { count: "exact", head: true }),
  ]);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Visão geral dos treinamentos da empresa."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={<Users size={22} />} label="Usuários" value={usuarios ?? 0} />
        <StatCard icon={<BookOpen size={22} />} label="Trilhas" value={trilhas ?? 0} variant="primary" />
        <StatCard icon={<GraduationCap size={22} />} label="Certificados emitidos" value={certificados ?? 0} variant="accent" />
      </div>
    </div>
  );
}
