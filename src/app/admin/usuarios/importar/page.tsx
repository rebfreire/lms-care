import PageHeader from "@/design-system/organisms/PageHeader";
import ImportarForm from "./ImportarForm";

export default function ImportarUsuariosPage() {
  return (
    <div>
      <PageHeader
        title="Importar usuários"
        description="Cole ou envie um CSV com nome, email e turma (opcional). Cada linha vira uma conta com senha temporária."
      />
      <div className="bg-surface rounded-card-lg p-8 shadow-soft max-w-3xl">
        <ImportarForm />
      </div>
    </div>
  );
}
