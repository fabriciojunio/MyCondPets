import React from "react";
import pool from "@/app/_lib/db";
import { authOptions } from "@/app/_lib/authOptions";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { PerfilContent } from "./PerfilContent";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
    return;
  }

  const userEmail = session.user.email;

  let client;
  let dono = null;
  let pets = [];
  let residencia = null;

  try {
    client = await pool.connect();

    const donoResult = await client.query(
      "SELECT don_id, don_nome, don_email, don_contato, don_cpf FROM dono WHERE don_email = $1;",
      [userEmail]
    );

    dono = donoResult.rows[0];

    if (dono) {
      const petsResult = await client.query(
        "SELECT pet_id, pet_nome, pet_tipo FROM pet WHERE don_id = $1;",
        [dono.don_id]
      );
      pets = petsResult.rows;

      const residenciaResult = await client.query(
        "SELECT res_id, res_complemento, res_numero, res_cep FROM residencia WHERE don_id = $1;",
        [dono.don_id]
      );
      residencia = residenciaResult.rows[0];
    }
  } catch (error) {
    console.error("Erro ao buscar dados do perfil:", error);
  } finally {
    if (client) {
      client.release();
    }
  }

  if (!dono) {
    return (
      <main className="content">
        <div className="error-container">
          <h1>Dono não encontrado</h1>
          <p>Não foi possível carregar os dados do perfil.</p>
        </div>
      </main>
    );
  }

  return (
    <PerfilContent 
      dono={dono} 
      pets={pets} 
      residencia={residencia} 
    />
  );
}