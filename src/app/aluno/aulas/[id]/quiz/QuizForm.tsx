"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import Button from "@/design-system/atoms/Button";
import { responderQuiz, type ResultadoQuiz } from "./actions";

interface Alternativa {
  id: string;
  texto: string;
}

interface Questao {
  id: string;
  enunciado: string;
  alternativas: Alternativa[];
}

interface QuizFormProps {
  quizId: string;
  notaCorte: number;
  questoes: Questao[];
  aulaId: string;
}

export default function QuizForm({ quizId, notaCorte, questoes, aulaId }: QuizFormProps) {
  const router = useRouter();

  function sairDoQuiz() {
    if (window.confirm("Sair do quiz agora? Suas respostas não serão salvas.")) {
      router.push(`/aluno/aulas/${aulaId}`);
    }
  }
  const [resultado, formAction, isPending] = useActionState<ResultadoQuiz | string | null, FormData>(
    responderQuiz.bind(null, quizId),
    null,
  );

  if (resultado && typeof resultado !== "string") {
    return (
      <div className="space-y-5">
        <div
          className={`rounded-card-lg p-6 text-center ${
            resultado.aprovado ? "bg-success-container text-success" : "bg-warning-container text-warning"
          }`}
        >
          <p className="text-3xl font-headline font-bold">{resultado.nota}%</p>
          <p className="text-sm font-semibold mt-1">
            {resultado.aprovado ? "Aprovado" : `Não atingiu a nota de corte (${notaCorte}%)`}
          </p>
        </div>

        {questoes.map((q, i) => (
          <div key={q.id} className="bg-surface rounded-card-lg p-5 shadow-soft">
            <p className="text-sm font-semibold text-on-surface mb-2">
              {i + 1}. {q.enunciado}
            </p>
            <ul className="space-y-1">
              {q.alternativas.map((alt) => {
                const ehCorreta = resultado.corretas[q.id] === alt.id;
                return (
                  <li
                    key={alt.id}
                    className={`text-sm px-3 py-1.5 rounded-lg flex items-center gap-2 ${
                      ehCorreta
                        ? "bg-success-container text-success"
                        : "bg-surface-container-low text-on-surface-variant"
                    }`}
                  >
                    {ehCorreta ? <CheckCircle2 size={14} /> : <XCircle size={14} className="opacity-0" />}
                    {alt.texto}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <Link href={`/aluno/aulas/${aulaId}`} className="inline-block">
          <Button variant="ghost">Voltar para a aula</Button>
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      {typeof resultado === "string" && (
        <p className="text-sm text-error bg-error-container/40 rounded-xl px-4 py-2">{resultado}</p>
      )}

      {questoes.map((q, i) => (
        <div key={q.id} className="bg-surface rounded-card-lg p-5 shadow-soft">
          <p className="text-sm font-semibold text-on-surface mb-3">
            {i + 1}. {q.enunciado}
          </p>
          <div className="space-y-2">
            {q.alternativas.map((alt) => (
              <label
                key={alt.id}
                className="flex items-center gap-2 text-sm text-on-surface-variant px-3 py-2 rounded-lg hover:bg-surface-container-low cursor-pointer"
              >
                <input type="radio" name={`questao_${q.id}`} value={alt.id} required className="accent-primary" />
                {alt.texto}
              </label>
            ))}
          </div>
        </div>
      ))}

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Enviando..." : "Enviar respostas"}
        </Button>
        <Button type="button" variant="ghost" onClick={sairDoQuiz}>
          Sair do quiz
        </Button>
      </div>
    </form>
  );
}
