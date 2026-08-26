import PageHeader from "@/design-system/organisms/PageHeader";
import NovoCursoForm from "./NovoCursoForm";

export default function NovoCursoPage() {
  return (
    <div>
      <PageHeader title="Novo curso" description="Depois você adiciona módulos e aulas." />
      <div className="bg-surface rounded-card-lg p-8 shadow-soft max-w-xl">
        <NovoCursoForm />
      </div>
    </div>
  );
}
