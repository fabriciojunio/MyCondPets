// Geração de embeddings via HuggingFace Inference API
// Modelo: paraphrase-multilingual-MiniLM-L12-v2 (384 dimensões, suporte a PT-BR)

const HF_URL =
  "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2";

// Remove acentos e normaliza texto para melhorar a busca
function normalizarTexto(texto) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 512);
}

/**
 * Gera um vetor de embedding para o texto fornecido.
 * Retorna um array de 384 números ou null em caso de falha.
 */
export async function gerarEmbedding(texto) {
  if (!texto || !process.env.HF_TOKEN) return null;

  try {
    const res = await fetch(HF_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: normalizarTexto(texto) }),
    });

    if (!res.ok) return null;

    const data = await res.json();

    // A API retorna array de floats diretamente para textos únicos
    if (Array.isArray(data) && typeof data[0] === "number") return data;

    // Às vezes retorna aninhado [[...floats...]]
    if (Array.isArray(data) && Array.isArray(data[0])) return data[0];

    return null;
  } catch {
    return null;
  }
}

/**
 * Formata o embedding para inserção no PostgreSQL/pgvector.
 * Exemplo: [0.1, 0.2, ...] → "[0.1,0.2,...]"
 */
export function formatarEmbedding(embedding) {
  return `[${embedding.join(",")}]`;
}
