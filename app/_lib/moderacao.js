// Moderação de conteúdo — mensagens e comentários

const FRASES_PROIBIDAS = [
  "vou te matar", "vou matar voce", "te mato", "vai morrer",
  "vou te machucar", "vou te bater", "vou te agredir", "vou te espancar",
  "vou te estuprar", "vou te sequestrar",
  "pague resgate", "paga resgate", "manda pix", "transfere dinheiro",
  "deposita dinheiro", "vou roubar voce", "vou traficar",
  "drogas pela entrega",
  "filho da puta", "vai se fuder", "vai tomar no cu",
  "sua puta", "sua vadia", "sua vagabunda",
];

const PALAVRAS_GRAVES = [
  "estupro", "estuprar", "pedofilia", "pedofilo",
  "extorsao", "extorsão",
];

function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function moderar(texto) {
  if (!texto || texto.trim().length === 0) {
    return { ok: false, motivo: "O texto não pode estar vazio." };
  }
  if (texto.trim().length > 1000) {
    return { ok: false, motivo: "Texto muito longo (máx. 1000 caracteres)." };
  }

  const norm = normalizar(texto);

  for (const frase of FRASES_PROIBIDAS) {
    if (norm.includes(normalizar(frase))) {
      return { ok: false, motivo: "Mensagem bloqueada: contém conteúdo violento ou ameaçador." };
    }
  }

  for (const palavra of PALAVRAS_GRAVES) {
    const p = normalizar(palavra);
    if (new RegExp(`(^|\\s)${p}($|\\s)`).test(norm)) {
      return { ok: false, motivo: "Mensagem bloqueada: contém conteúdo inapropriado." };
    }
  }

  return { ok: true };
}
