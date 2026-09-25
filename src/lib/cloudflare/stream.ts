interface DirectUploadResult {
  uid: string;
  uploadURL: string;
}

export async function createDirectUpload(): Promise<DirectUploadResult> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_STREAM_API_TOKEN;

  if (!accountId || !token) {
    throw new Error("Cloudflare Stream não configurado (ver .env.local).");
  }

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/direct_upload`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        maxDurationSeconds: 3600,
        requireSignedURLs: false,
      }),
    },
  );

  const json = await res.json();

  if (!json.success) {
    throw new Error(json.errors?.[0]?.message ?? "Falha ao criar upload no Cloudflare Stream.");
  }

  return { uid: json.result.uid, uploadURL: json.result.uploadURL };
}

// Best-effort: se falhar (vídeo já apagado, token sem permissão), só registra — o
// vínculo com a aula já foi desfeito no banco, então o aluno não vê mais o vídeo.
export async function deleteVideo(uid: string): Promise<void> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_STREAM_API_TOKEN;
  if (!accountId || !token) return;

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${uid}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok && res.status !== 404) {
      console.error(`Falha ao apagar vídeo ${uid} no Cloudflare Stream: HTTP ${res.status}`);
    }
  } catch (e) {
    console.error(`Falha ao apagar vídeo ${uid} no Cloudflare Stream:`, e);
  }
}
