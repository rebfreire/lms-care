import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/design-system/organisms/PageHeader";
import EditarAulaForm from "./EditarAulaForm";
import MateriaisSection from "./MateriaisSection";

export default async function EditarAulaPage({
  params,
}: {
  params: Promise<{ id: string; aulaId: string }>;
}) {
  const { id: cursoId, aulaId } = await params;
  const supabase = await createClient();

  const [{ data: aula }, { data: materiais }] = await Promise.all([
    supabase.from("aulas").select("id, titulo, texto_apoio").eq("id", aulaId).single(),
    supabase
      .from("aula_materiais")
      .select("id, tipo, nome, url")
      .eq("aula_id", aulaId)
      .order("nome"),
  ]);

  if (!aula) notFound();

  return (
    <div>
      <PageHeader title="Editar aula" />
      <div className="bg-surface rounded-card-lg p-8 shadow-soft max-w-xl">
        <EditarAulaForm
          cursoId={cursoId}
          aulaId={aula.id}
          tituloAtual={aula.titulo}
          textoApoioAtual={aula.texto_apoio ?? ""}
        />
        <MateriaisSection cursoId={cursoId} aulaId={aula.id} materiais={materiais ?? []} />
      </div>
    </div>
  );
}
