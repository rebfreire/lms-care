import { iniciarUploadDireto } from "./upload-direto";
import { validarArquivo, type BucketNome } from "./buckets";

// PUT com FormData, igual ao que o uploadToSignedUrl do supabase-js faz por baixo — mas via
// XHR, que é o único jeito de ter o evento de progresso do envio.
function putComProgresso(url: string, arquivo: File, onProgresso: (pct: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgresso(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      let detalhe = "";
      try {
        detalhe = JSON.parse(xhr.responseText).message ?? "";
      } catch {}
      reject(new Error(detalhe || `O armazenamento recusou o arquivo (HTTP ${xhr.status}).`));
    };
    xhr.onerror = () => reject(new Error("Falha de conexão durante o envio."));
    const form = new FormData();
    form.append("cacheControl", "3600");
    form.append("", arquivo);
    xhr.send(form);
  });
}

/**
 * Envia um arquivo direto do navegador pro bucket. Devolve o caminho no bucket; quem chama
 * precisa gravá-lo no banco numa action de confirmação. Lança Error com mensagem em
 * português, pronta pra mostrar na tela.
 */
export async function enviarArquivoDireto(
  bucket: BucketNome,
  pasta: string,
  arquivo: File,
  onProgresso: (pct: number) => void,
): Promise<string> {
  const invalido = validarArquivo(bucket, arquivo);
  if (invalido) throw new Error(invalido);

  const inicio = await iniciarUploadDireto(bucket, pasta, arquivo.name);
  if ("erro" in inicio) throw new Error(inicio.erro);

  await putComProgresso(inicio.signedUrl, arquivo, onProgresso);
  return inicio.caminho;
}
