"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAtual } from "@/lib/supabase/auth";

const PERCENTUAL_CONCLUSAO = 90;

export async function salvarProgresso(aulaId: string, percentual: number, posicaoSegundos: number) {
  const usuario = await getUsuarioAtual();
  if (!usuario) return;

  const percentualArredondado = Math.min(100, Math.round(percentual));
  const concluida = percentualArredondado >= PERCENTUAL_CONCLUSAO;

  const supabase = await createClient();

  const { data: existente } = await supabase
    .from("progresso")
    .select("concluida, concluida_em")
    .eq("usuario_id", usuario.id)
    .eq("aula_id", aulaId)
    .maybeSingle();

  await supabase.from("progresso").upsert(
    {
      usuario_id: usuario.id,
      aula_id: aulaId,
      percentual_assistido: percentualArredondado,
      posicao_segundos: posicaoSegundos,
      concluida: concluida || existente?.concluida || false,
      concluida_em: existente?.concluida_em ?? (concluida ? new Date().toISOString() : null),
      ultimo_acesso_em: new Date().toISOString(),
    },
    { onConflict: "usuario_id,aula_id" },
  );

  if (concluida && !existente?.concluida) {
    revalidatePath("/aluno");
  }
}
