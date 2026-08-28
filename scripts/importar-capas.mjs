import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("=")).map((l) => {
    const i = l.indexOf("=");
    return [l.slice(0, i), l.slice(i + 1)];
  }),
);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const pasta = "/Users/ricardofreire/Library/CloudStorage/GoogleDrive-rieller@gmail.com/My Drive/Clientes/Grupo-Care-Anestesia/Area de Cursos";

const mapa = [
  { cursoId: "746d3c5f-6fba-4160-9c2f-849e95edc092", h: "Cardioversor-capa-horizontal.jpeg", v: "Cardioversor-capa-vertical.jpeg" },
  { cursoId: "16831e82-b855-4c1c-87aa-259318ade96a", h: "assepsia-das-maos-gca-horizontal.jpeg", v: "assepsia-das-maos-gca-vertical.jpeg" },
  { cursoId: "d6c947cd-4a79-4c44-9cc8-6ef2717d579b", h: "bomba-infusao-gca-horizontal.jpeg", v: "bomba-infusao-gca-vertical.jpeg" },
  { cursoId: "bb54f158-446a-4009-a2fc-d96d47e3d162", h: "cateter-gca-horizontal.jpeg", v: "cateter-gca-vertical.jpeg" },
  { cursoId: "6aac6f2b-450e-4c5f-a520-4d3ba4158e11", h: "isolamento-gca-horizontal.jpeg", v: "isolamento-gca-vertical.jpeg" },
];

for (const item of mapa) {
  const bufH = fs.readFileSync(`${pasta}/${item.h}`);
  const bufV = fs.readFileSync(`${pasta}/${item.v}`);

  const caminhoH = `${item.cursoId}/horizontal.jpeg`;
  const caminhoV = `${item.cursoId}/vertical.jpeg`;

  const { error: e1 } = await supabase.storage.from("capas").upload(caminhoH, bufH, { upsert: true, contentType: "image/jpeg" });
  const { error: e2 } = await supabase.storage.from("capas").upload(caminhoV, bufV, { upsert: true, contentType: "image/jpeg" });
  if (e1) console.log("erro h", item.cursoId, e1.message);
  if (e2) console.log("erro v", item.cursoId, e2.message);

  const urlH = supabase.storage.from("capas").getPublicUrl(caminhoH).data.publicUrl;
  const urlV = supabase.storage.from("capas").getPublicUrl(caminhoV).data.publicUrl;

  const { error } = await supabase.from("cursos").update({ capa_url: urlH, capa_vertical_url: urlV }).eq("id", item.cursoId);
  if (error) console.log("erro update", item.cursoId, error.message);
  else console.log("ok", item.cursoId);
}
