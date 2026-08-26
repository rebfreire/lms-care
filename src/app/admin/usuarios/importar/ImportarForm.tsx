"use client";

import { useActionState, useRef, useState } from "react";
import { CheckCircle2, XCircle, FileUp } from "lucide-react";
import Button from "@/design-system/atoms/Button";
import { importarUsuariosCsv, type LinhaImportacao } from "../actions";

export default function ImportarForm() {
  const [resultados, formAction, isPending] = useActionState<LinhaImportacao[] | null, FormData>(
    importarUsuariosCsv,
    null,
  );
  const [csvTexto, setCsvTexto] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();
    const utf8 = new TextDecoder("utf-8").decode(buffer);

    // Exportações da Hotmart vêm em ISO-8859-1; UTF-8 mal decodificado produz
    // o caractere de substituição (U+FFFD) — se aparecer, redecodifica.
    const texto = utf8.includes("�")
      ? new TextDecoder("iso-8859-1").decode(buffer)
      : utf8;

    setCsvTexto(texto);
  }

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-4">
        <div>
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-primary cursor-pointer">
            <FileUp size={16} /> Escolher arquivo .csv
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
          </label>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
            Conteúdo do CSV (nome,email,turma — turma é opcional)
          </label>
          <textarea
            ref={textareaRef}
            name="csv"
            rows={8}
            value={csvTexto}
            onChange={(e) => setCsvTexto(e.target.value)}
            placeholder={"nome,email,turma\nMaria Silva,maria@empresa.com,Equipe Contábil"}
            className="w-full rounded-2xl border border-outline-variant bg-surface px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
          />
        </div>

        <Button type="submit" disabled={isPending || !csvTexto.trim()}>
          {isPending ? "Importando..." : "Importar usuários"}
        </Button>
      </form>

      {resultados && resultados.length > 0 && (
        <div className="bg-surface rounded-card-lg shadow-soft overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] font-bold uppercase tracking-widest text-on-surface-variant border-b border-outline-variant">
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">E-mail</th>
                <th className="px-5 py-3">Turma</th>
                <th className="px-5 py-3">Senha temporária</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {resultados.map((r, i) => (
                <tr key={i} className="border-b border-outline-variant last:border-0">
                  <td className="px-5 py-3">{r.nome}</td>
                  <td className="px-5 py-3 text-on-surface-variant">{r.email}</td>
                  <td className="px-5 py-3 text-on-surface-variant">{r.turma ?? "—"}</td>
                  <td className="px-5 py-3 font-mono text-xs">{r.senhaTemporaria ?? "—"}</td>
                  <td className="px-5 py-3">
                    {r.status === "criado" ? (
                      <span className="inline-flex items-center gap-1 text-success text-xs font-bold">
                        <CheckCircle2 size={14} /> criado
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 text-error text-xs font-bold"
                        title={r.erro}
                      >
                        <XCircle size={14} /> erro
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-on-surface-variant p-4 bg-warning-container/30">
            Copie as senhas temporárias agora — elas não ficam salvas em lugar nenhum, só
            aparecem aqui uma vez. Repasse pra cada aluno individualmente.
          </p>
        </div>
      )}
    </div>
  );
}
