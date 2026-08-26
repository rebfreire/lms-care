import Button from "@/design-system/atoms/Button";
import ProgressBar from "@/design-system/atoms/ProgressBar";
import StatusBadge from "@/design-system/atoms/StatusBadge";
import StatCard from "@/design-system/molecules/StatCard";

export default function Home() {
  return (
    <main className="min-h-screen bg-background px-6 py-16 sm:px-10">
      <div className="max-w-3xl mx-auto space-y-10">
        <header>
          <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-2">
            Fase 0 — setup do projeto
          </p>
          <h1 className="text-4xl font-headline font-bold text-on-surface">
            Care, plataforma de treinamentos
          </h1>
          <p className="text-on-surface-variant mt-2">
            Next.js, Supabase e o design system &ldquo;Care Terra&rdquo; no ar. A partir
            daqui entram autenticação (Fase 1) e o CRUD de cursos (Fase 2).
          </p>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon="👥" label="Usuários" value="70" />
          <StatCard icon="📚" label="Trilhas ativas" value="3" variant="primary" />
          <StatCard icon="🎓" label="Certificados emitidos" value="12" variant="accent" />
        </section>

        <section className="bg-surface rounded-card-lg p-8 shadow-soft space-y-6">
          <div>
            <h2 className="text-xl font-headline font-bold text-on-surface mb-3">
              Trilha de Onboarding
            </h2>
            <ProgressBar value={42} label="Progresso geral" />
          </div>

          <div className="flex flex-wrap gap-2">
            <StatusBadge status="concluido" />
            <StatusBadge status="em_andamento" />
            <StatusBadge status="bloqueado" />
            <StatusBadge status="atrasado" />
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button variant="primary">Continuar assistindo</Button>
            <Button variant="secondary">Ver certificado</Button>
            <Button variant="ghost">Ignorar</Button>
          </div>
        </section>
      </div>
    </main>
  );
}
