import { Users, BookOpen, GraduationCap } from "lucide-react";
import PageHeader from "@/design-system/organisms/PageHeader";
import StatCard from "@/design-system/molecules/StatCard";

export default function AdminDashboard() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Visão geral dos treinamentos da empresa."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={<Users size={22} />} label="Usuários" value="—" />
        <StatCard icon={<BookOpen size={22} />} label="Trilhas ativas" value="—" variant="primary" />
        <StatCard icon={<GraduationCap size={22} />} label="Certificados emitidos" value="—" variant="accent" />
      </div>

      <p className="text-on-surface-variant mt-8">
        CRUD de cursos/trilhas e relatórios entram na Fase 2 e 7. Este dashboard já
        está protegido por papel — só admin chega aqui.
      </p>
    </div>
  );
}
