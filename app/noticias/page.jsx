import pool from "@/app/_lib/db";
import "./CSS/noticiasPage.css";
import NoticiasFeed from "./NoticiasCarousel";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/authOptions";

const DEMO_NOTICIAS = [
  { id: 1, titulo: 'Golden Retriever perdido no Bloco C', descricao: 'Meu cachorro Bolinha fugiu ontem à tarde. Ele é dourado, usa coleira azul. Por favor, entre em contato se vir!', data: new Date(), dono: 'Ana Paula', contato: '(11) 99999-1111', imagem: null, status: 'perdido', tipoAnimal: 'Cachorro', donoEmail: 'demo@mycondpets.com', localizacao: 'Condomínio · Bloco C' },
  { id: 2, titulo: 'Gato encontrado na garagem', descricao: 'Encontrei um gato cinza com olhos verdes na garagem do bloco B. Está bem alimentado e parece dócil.', data: new Date(Date.now() - 86400000), dono: 'Carlos Silva', contato: '(11) 98888-2222', imagem: null, status: 'encontrado', tipoAnimal: 'Gato', donoEmail: 'demo@mycondpets.com', localizacao: 'Condomínio · Bloco B' },
  { id: 3, titulo: 'Poodle desaparecido — urgente', descricao: 'Nossa Mel desapareceu perto da piscina. É uma poodle branca, pequena, com laço rosa. Recompensa para quem encontrar!', data: new Date(Date.now() - 172800000), dono: 'Fernanda Costa', contato: '(11) 97777-3333', imagem: null, status: 'perdido', tipoAnimal: 'Cachorro', donoEmail: 'demo@mycondpets.com', localizacao: 'Condomínio · Área da Piscina' },
  { id: 4, titulo: 'Dono do Siamês foi encontrado', descricao: 'O gato siamês que estava perdido já foi devolvido ao dono. Obrigada a todos que ajudaram na busca!', data: new Date(Date.now() - 259200000), dono: 'Roberto Lima', contato: '(11) 96666-4444', imagem: null, status: 'encontrado', tipoAnimal: 'Gato', donoEmail: 'demo@mycondpets.com', localizacao: 'Condomínio · MyCondPets' },
];

export default async function Noticias() {
  const session = await getServerSession(authOptions);
  const emailUsuario = session?.user?.email || null;

  let noticias = [];

  if (!session || session?.user?.isDemo) {
    noticias = DEMO_NOTICIAS;
  } else try {
    const client = await pool.connect();
    try {
      await client.query(`
        ALTER TABLE noticias ADD COLUMN IF NOT EXISTS not_status VARCHAR(20) DEFAULT 'aberto';
        ALTER TABLE noticias ADD COLUMN IF NOT EXISTS not_tipo_animal VARCHAR(50);
      `).catch(() => {});

      const result = await client.query(`
        SELECT
          n.not_id,
          n.not_titulo,
          n.not_conteudo,
          n.not_data_publicacao,
          n.not_foto,
          n.not_status,
          n.not_tipo_animal,
          d.don_nome,
          d.don_contato,
          d.don_email,
          r.res_complemento
        FROM noticias n
        INNER JOIN dono d ON n.don_id = d.don_id
        LEFT JOIN residencia r ON d.don_id = r.don_id
        ORDER BY n.not_data_publicacao DESC;
      `);

      noticias = result.rows.map((row) => ({
        id: row.not_id,
        titulo: row.not_titulo,
        descricao: row.not_conteudo,
        data: row.not_data_publicacao,
        dono: row.don_nome,
        contato: row.don_contato || "Sem contato",
        imagem: row.not_foto,
        status: row.not_status || (row.not_titulo?.toLowerCase().includes("perdido") ? "perdido" : "encontrado"),
        tipoAnimal: row.not_tipo_animal || null,
        donoEmail: row.don_email || null,
        localizacao: row.res_complemento
          ? `Condomínio · ${row.res_complemento}`
          : "Condomínio · MyCondPets",
      }));
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Erro ao buscar notícias:", error);
  }

  return (
    <main className="noticias-page">
      <div className="noticias-page-inner">
        <div className="noticias-header">
          <h1>🐾 Pets Perdidos & Encontrados</h1>
          <Link href="/criarNoticias" className="add-noticia-btn">
            + Publicar
          </Link>
        </div>
      </div>

      <NoticiasFeed noticias={noticias} emailUsuario={emailUsuario} />
    </main>
  );
}
