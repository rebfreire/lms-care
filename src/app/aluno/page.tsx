import PageHeader from "@/design-system/organisms/PageHeader";
import ProgressBar from "@/design-system/atoms/ProgressBar";

export default function AlunoTrilha() {
  return (
    <div>
      <PageHeader
        title="Minha trilha"
        description="Continue de onde parou."
      />

      <div className="bg-surface rounded-card-lg p-8 shadow-soft">
        <ProgressBar value={0} label="Progresso geral" />
        <p className="text-on-surface-variant mt-6">
          Player de vídeo e lista de aulas entram na Fase 5, depois que a trilha e os
          cursos existirem (Fase 2 e 3). Por enquanto, esta tela só confirma que o
          login e a proteção por papel de aluno estão funcionando.
        </p>
      </div>
    </div>
  );
}
