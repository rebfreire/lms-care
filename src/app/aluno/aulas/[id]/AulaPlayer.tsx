"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { salvarProgresso } from "./actions";

declare global {
  interface Window {
    Stream?: (el: HTMLIFrameElement) => {
      currentTime: number;
      duration: number;
      addEventListener: (evento: string, cb: () => void) => void;
    };
  }
}

interface AulaPlayerProps {
  aulaId: string;
  videoId: string;
  posicaoInicialSegundos: number;
}

export default function AulaPlayer({ aulaId, videoId, posicaoInicialSegundos }: AulaPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const ultimoSalvoEm = useRef(0);

  useEffect(() => {
    let player: ReturnType<NonNullable<Window["Stream"]>> | null = null;
    let cancelado = false;

    function conectar() {
      if (cancelado || !window.Stream || !iframeRef.current) return;

      player = window.Stream(iframeRef.current);

      player.addEventListener("loadedmetadata", () => {
        if (posicaoInicialSegundos > 0 && player) {
          player.currentTime = posicaoInicialSegundos;
        }
      });

      const salvar = () => {
        if (!player || !player.duration) return;
        const agora = Date.now();
        if (agora - ultimoSalvoEm.current < 5000) return;
        ultimoSalvoEm.current = agora;

        const percentual = (player.currentTime / player.duration) * 100;
        salvarProgresso(aulaId, percentual, player.currentTime);
      };

      player.addEventListener("timeupdate", salvar);
      player.addEventListener("pause", salvar);
      player.addEventListener("ended", () => salvarProgresso(aulaId, 100, player?.duration ?? 0));
    }

    const id = setInterval(() => {
      if (window.Stream) {
        conectar();
        clearInterval(id);
      }
    }, 200);

    return () => {
      cancelado = true;
      clearInterval(id);
    };
  }, [aulaId, posicaoInicialSegundos]);

  return (
    <>
      <Script src="https://embed.cloudflarestream.com/embed/sdk.latest.js" strategy="afterInteractive" />
      <div className="relative w-full aspect-video rounded-card-lg overflow-hidden bg-black shadow-soft-lg">
        <iframe
          ref={iframeRef}
          src={`https://iframe.videodelivery.net/${videoId}?preload=true`}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
          allowFullScreen
        />
      </div>
    </>
  );
}
