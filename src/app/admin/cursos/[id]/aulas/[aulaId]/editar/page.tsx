import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAtual } from "@/lib/supabase/auth";
import PageHeader from "@/design-system/organisms/PageHeader";
import EditarAulaForm from "./EditarAulaForm";
import MateriaisSection from "./MateriaisSection";

function paraDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function EditarAulaPage({
  params,
}: {
  params: Promise<{ id: string; aulaId: string }>;
}) {
  const { id: cursoId, aulaId } = await params;
  const usuario = await getUsuarioAtual();
  const supabase = await createClient();

  const [{ data: aula }, { data: materiais }, { data: turmas }] = await Promise.all([
    supabase
      .from("aulas")
      .select("id, titulo, texto_apoio, liberacao_agendada_em, turma_id")
      .eq("id", aulaId)
      .single(),
    supabase
      .from("aula_materiais")
      .select("id, tipo, nome, url")
      .eq("aula_id", aulaId)
      .order("nome"),
    supabase.from("turmas").select("id, nome").eq("empresa_id", usuario!.empresaId).order("nome"),
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
          liberacaoAtual={paraDatetimeLocal(aula.liberacao_agendada_em)}
          turmaIdAtual={aula.turma_id ?? ""}
          turmas={turmas ?? []}
        />
        <MateriaisSection cursoId={cursoId} aulaId={aula.id} materiais={materiais ?? []} />
      </div>
    </div>
  );
}
