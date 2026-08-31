import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/design-system/organisms/PageHeader";
import EditarTrilhaForm from "./EditarTrilhaForm";

export default async function EditarTrilhaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: trilha } = await supabase
    .from("trilhas")
    .select("id, nome, descricao")
    .eq("id", id)
    .single();

  if (!trilha) notFound();

  return (
    <div>
      <PageHeader title="Editar trilha" />
      <div className="bg-surface rounded-card-lg p-8 shadow-soft max-w-xl">
        <EditarTrilhaForm trilhaId={trilha.id} nomeAtual={trilha.nome} descricaoAtual={trilha.descricao ?? ""} />
      </div>
    </div>
  );
}
