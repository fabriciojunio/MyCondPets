import pool from "@/app/_lib/db";
import "./CSS/noticiasPage.css";
import NoticiasFeed from "./NoticiasCarousel";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/authOptions";

export default async function Noticias() {
  const session = await getServerSession(authOptions);
  const emailUsuario = session?.user?.email || null;

  let noticias = [];

  try {
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
