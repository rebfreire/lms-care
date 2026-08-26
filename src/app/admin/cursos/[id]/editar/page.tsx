import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/design-system/organisms/PageHeader";
import EditarCursoForm from "./EditarCursoForm";

export default async function EditarCursoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: curso } = await supabase
    .from("cursos")
    .select("id, nome, descricao")
    .eq("id", id)
    .single();

  if (!curso) notFound();

  return (
    <div>
      <PageHeader title="Editar curso" />
      <div className="bg-surface rounded-card-lg p-8 shadow-soft max-w-xl">
        <EditarCursoForm cursoId={curso.id} nomeAtual={curso.nome} descricaoAtual={curso.descricao ?? ""} />
      </div>
    </div>
  );
}
