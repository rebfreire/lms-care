// Configuração dos buckets que aceitam upload direto do navegador. Sem dependência de
// servidor, então vale tanto pro cliente (validação antes de enviar) quanto pras actions.
// Pra um bucket novo (ex.: "capas"), basta adicionar uma entrada aqui.
export interface BucketConfig {
  maxBytes: number;
  /** Prefixos de MIME aceitos; omitido = qualquer tipo. */
  tiposAceitos?: string[];
}

export const BUCKETS = {
  materiais: { maxBytes: 50 * 1024 * 1024 },
} satisfies Record<string, BucketConfig>;

export type BucketNome = keyof typeof BUCKETS;

export function validarArquivo(bucket: BucketNome, arquivo: File): string | null {
  const config: BucketConfig = BUCKETS[bucket];
  if (arquivo.size === 0) return "O arquivo está vazio.";
  if (arquivo.size > config.maxBytes) {
    const limiteMb = Math.round(config.maxBytes / 1024 / 1024);
    const tamanhoMb = (arquivo.size / 1024 / 1024).toFixed(1).replace(".", ",");
    return `O arquivo tem ${tamanhoMb} MB e o limite é ${limiteMb} MB.`;
  }
  if (config.tiposAceitos && !config.tiposAceitos.some((t) => arquivo.type.startsWith(t))) {
    return "Tipo de arquivo não aceito.";
  }
  return null;
}
