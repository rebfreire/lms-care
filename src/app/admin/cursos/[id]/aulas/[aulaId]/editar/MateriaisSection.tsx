import { FileText, Link2, Trash2 } from "lucide-react";
import Button from "@/design-system/atoms/Button";
import { adicionarMaterialArquivo, adicionarMaterialLink, removerMaterial } from "../../../../actions";

interface Material {
  id: string;
  tipo: "arquivo" | "link";
  nome: string;
  url: string;
}

interface MateriaisSectionProps {
  cursoId: string;
  aulaId: string;
  materiais: Material[];
}

export default function MateriaisSection({ cursoId, aulaId, materiais }: MateriaisSectionProps) {
  return (
    <div className="border-t border-outline-variant pt-6 mt-6 space-y-4">
      <h3 className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
        Materiais de apoio
      </h3>

      {materiais.length > 0 && (
        <ul className="space-y-2">
          {materiais.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-surface-container-low"
            >
              {m.tipo === "arquivo" ? (
                <FileText size={16} className="text-on-surface-variant flex-shrink-0" />
              ) : (
                <Link2 size={16} className="text-on-surface-variant flex-shrink-0" />
              )}
              <a
                href={m.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-on-surface flex-1 hover:text-primary truncate"
              >
                {m.nome}
              </a>
              <form action={removerMaterial.bind(null, m.id, cursoId, aulaId)}>
                <button type="submit" className="text-on-surface-variant hover:text-error flex-shrink-0">
                  <Trash2 size={14} />
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form
        action={adicionarMaterialArquivo.bind(null, aulaId, cursoId)}
        className="flex flex-wrap items-center gap-2"
      >
        <input
          type="file"
          name="arquivo"
          required
          className="flex-1 min-w-[200px] text-sm text-on-surface-variant file:mr-3 file:rounded-pill file:border-0 file:bg-surface-container-high file:px-3 file:py-1.5 file:text-xs file:font-semibold"
        />
        <Button type="submit" size="sm" variant="secondary">
          Anexar arquivo
        </Button>
      </form>

      <form
        action={adicionarMaterialLink.bind(null, aulaId, cursoId)}
        className="flex flex-wrap items-center gap-2"
      >
        <input
          name="nome"
          placeholder="Nome do link"
          required
          className="flex-1 min-w-[140px] rounded-2xl border border-outline-variant bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
        />
        <input
          name="url"
          type="url"
          placeholder="https://..."
          required
          className="flex-1 min-w-[180px] rounded-2xl border border-outline-variant bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
        />
        <Button type="submit" size="sm" variant="secondary">
          Adicionar link
        </Button>
      </form>
    </div>
  );
}
