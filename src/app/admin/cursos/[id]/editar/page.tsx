import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/design-system/organisms/PageHeader";
import EditarCursoForm from "./EditarCursoForm";

export default async function EditarCursoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: curso } = await supabase
    .from("cursos")
    .select("id, nome, descricao, certificado_ativo, capa_url, capa_vertical_url")
    .eq("id", id)
    .single();

  if (!curso) notFound();

  return (
    <div>
      <PageHeader title="Editar curso" />
      <div className="bg-surface rounded-card-lg p-8 shadow-soft max-w-xl">
        <EditarCursoForm
          cursoId={curso.id}
          nomeAtual={curso.nome}
          descricaoAtual={curso.descricao ?? ""}
          certificadoAtivoAtual={curso.certificado_ativo}
          capaHorizontalAtual={curso.capa_url}
          capaVerticalAtual={curso.capa_vertical_url}
        />
      </div>
    </div>
  );
}
