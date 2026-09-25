"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import VideoUploader from "../../../VideoUploader";
import { removerVideo } from "../../../../actions";

interface VideoSectionProps {
  cursoId: string;
  aulaId: string;
  videoId: string | null;
}

export default function VideoSection({ cursoId, aulaId, videoId }: VideoSectionProps) {
  const [confirmando, setConfirmando] = useState(false);

  return (
    <div className="border-t border-outline-variant pt-6 mt-6 space-y-4">
      <h3 className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
        Vídeo da aula
      </h3>

      {videoId ? (
        <>
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black">
            <iframe
              // key força recarregar o player quando o vídeo é trocado
              key={videoId}
              src={`https://iframe.videodelivery.net/${videoId}`}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; gyroscope; encrypted-media; picture-in-picture;"
              allowFullScreen
            />
          </div>
          <p className="text-xs text-on-surface-variant">
            Logo depois do envio o Cloudflare ainda está processando o vídeo — pode levar alguns
            minutos até ele tocar aqui.
          </p>

          {confirmando ? (
            <div className="flex flex-wrap items-center gap-2 bg-error-container/30 rounded-2xl px-4 py-2">
              <span className="text-xs text-on-surface flex-1 min-w-[180px]">
                Remover o vídeo desta aula? Ele é apagado do Cloudflare e não dá pra desfazer.
              </span>
              <form action={removerVideo.bind(null, aulaId, cursoId)}>
                <button
                  type="submit"
                  className="rounded-pill bg-error text-on-error px-3 py-1 text-xs font-semibold hover:opacity-90"
                >
                  Confirmar
                </button>
              </form>
              <button
                type="button"
                onClick={() => setConfirmando(false)}
                className="text-xs font-semibold text-on-surface-variant hover:underline"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <VideoUploader aulaId={aulaId} cursoId={cursoId} variante="botao" rotulo="Trocar vídeo" />
              <button
                type="button"
                onClick={() => setConfirmando(true)}
                className="inline-flex items-center gap-2 text-sm font-semibold text-error hover:underline"
              >
                <Trash2 size={16} /> Remover vídeo
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <VideoUploader aulaId={aulaId} cursoId={cursoId} variante="botao" rotulo="Enviar vídeo" />
          <span className="text-xs text-on-surface-variant">Nenhum vídeo enviado ainda.</span>
        </div>
      )}
    </div>
  );
}
