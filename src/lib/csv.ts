// Parser simples de CSV: separador vírgula, aspas duplas opcionais por campo,
// primeira linha como cabeçalho. Suficiente para exportações de planilha comuns.
export function parseCsv(texto: string): Record<string, string>[] {
  const linhas = texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (linhas.length === 0) return [];

  const parseLinha = (linha: string) =>
    linha.split(",").map((campo) => campo.trim().replace(/^"|"$/g, ""));

  const cabecalho = parseLinha(linhas[0]).map((h) => h.toLowerCase());

  return linhas.slice(1).map((linha) => {
    const valores = parseLinha(linha);
    const registro: Record<string, string> = {};
    cabecalho.forEach((chave, i) => {
      registro[chave] = valores[i] ?? "";
    });
    return registro;
  });
}

export function gerarSenhaTemporaria(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let senha = "";
  for (let i = 0; i < 10; i++) {
    senha += chars[Math.floor(Math.random() * chars.length)];
  }
  return senha;
}
