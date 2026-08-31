"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import Button from "@/design-system/atoms/Button";

export default function AlunoError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="bg-surface rounded-card-lg p-10 shadow-soft text-center max-w-lg mx-auto mt-10">
      <AlertTriangle className="mx-auto mb-4 text-warning" size={32} />
      <h2 className="text-lg font-headline font-bold text-on-surface mb-2">
        Algo deu errado por aqui
      </h2>
      <p className="text-sm text-on-surface-variant mb-6">
        Seu progresso até agora foi salvo normalmente. Tenta de novo — se continuar acontecendo,
        avisa o administrador do sistema.
      </p>
      <Button onClick={() => reset()}>Tentar de novo</Button>
    </div>
  );
}
