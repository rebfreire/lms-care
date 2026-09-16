interface EnviarEmailParams {
  to: string;
  subject: string;
  html: string;
}

export interface ResultadoEnvio {
  ok: boolean;
  erro?: string;
}

// Chamado direto na API v3 do SendGrid via fetch, sem SDK — evita adicionar
// uma dependência só pra um POST simples. Diferente do SMTP configurado no
// Supabase Auth (que só serve pros e-mails de link mágico dele), essa chave
// é usada aqui pra mandar e-mails com conteúdo livre (ex.: senha temporária).
export async function enviarEmail({ to, subject, html }: EnviarEmailParams): Promise<ResultadoEnvio> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const from = process.env.SENDGRID_FROM_EMAIL;
  const fromNome = process.env.SENDGRID_FROM_NOME ?? "Grupo Care Anestesia";

  if (!apiKey || !from) {
    return { ok: false, erro: "SendGrid não configurado (faltam SENDGRID_API_KEY / SENDGRID_FROM_EMAIL)." };
  }

  const resposta = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: from, name: fromNome },
      subject,
      content: [{ type: "text/html", value: html }],
    }),
  });

  if (resposta.ok) return { ok: true };

  const corpo = await resposta.text();
  return { ok: false, erro: `SendGrid ${resposta.status}: ${corpo.slice(0, 300)}` };
}

interface EmailAcessoParams {
  nomeUsuario: string;
  email: string;
  senha: string;
  loginUrl: string;
  empresaNome: string;
  logoUrl: string | null;
  corPrimaria: string | null;
}

export function emailAcessoHtml({
  nomeUsuario,
  email,
  senha,
  loginUrl,
  empresaNome,
  logoUrl,
  corPrimaria,
}: EmailAcessoParams): string {
  const cor = corPrimaria || "#1c4b8f";
  const logo = logoUrl
    ? `<img src="${logoUrl}" alt="${empresaNome}" style="height:40px;max-width:220px;object-fit:contain;margin-bottom:24px;" />`
    : `<div style="font-size:20px;font-weight:700;color:${cor};margin-bottom:24px;">${empresaNome}</div>`;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
  <body style="margin:0;padding:32px 16px;background-color:#f2f2f2;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;">
      <tr>
        <td style="padding:32px 32px 24px 32px;">
          ${logo}
          <h1 style="font-size:20px;color:#1a1a1a;margin:0 0 12px 0;">Seu acesso à plataforma</h1>
          <p style="font-size:14px;line-height:1.6;color:#3a3a3a;margin:0 0 20px 0;">
            Olá, ${nomeUsuario}. Segue o acesso à plataforma de treinamentos de ${empresaNome}:
          </p>
          <table role="presentation" width="100%" style="background:#f7f7f7;border-radius:8px;margin-bottom:20px;">
            <tr>
              <td style="padding:16px 20px;font-size:14px;color:#1a1a1a;">
                <strong>E-mail:</strong> ${email}<br />
                <strong>Senha provisória:</strong> ${senha}
              </td>
            </tr>
          </table>
          <p style="font-size:14px;line-height:1.6;color:#3a3a3a;margin:0 0 24px 0;">
            Você pode trocar essa senha a qualquer momento depois de entrar, se quiser — não é
            obrigatório.
          </p>
          <a href="${loginUrl}" style="display:inline-block;background:${cor};color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:12px 28px;border-radius:8px;">
            Entrar na plataforma
          </a>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
