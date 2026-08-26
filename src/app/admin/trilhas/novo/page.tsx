import PageHeader from "@/design-system/organisms/PageHeader";
import NovaTrilhaForm from "./NovaTrilhaForm";

export default function NovaTrilhaPage() {
  return (
    <div>
      <PageHeader title="Nova trilha" description="Depois você adiciona os cursos em ordem." />
      <div className="bg-surface rounded-card-lg p-8 shadow-soft max-w-xl">
        <NovaTrilhaForm />
      </div>
    </div>
  );
}
