import pool from "@/app/_lib/db";
import FormCadastroPet from "./FormCadastroPet";
import "./css/cadastroPet.css";
import { getServerSession } from "next-auth";
// import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { authOptions } from "@/app/_lib/authOptions";
import { redirect } from "next/navigation";
import React from "react";

export default async function CadastroPage() {

  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
    return; // Adicione esta linha
  }

  const userEmail = session.user.email;

  // consulta ao banco – só no servidor
  const client = await pool.connect();
  let dono = null;
  let pets = [];
  let residencia = null;

  try {
    const donoResult = await client.query(
      "SELECT don_id, don_nome, don_email, don_contato, don_cpf FROM dono WHERE don_email = $1;",
      [userEmail]
    );

    dono = donoResult.rows[0];

    if (dono) {
      const petsResult = await client.query(
        "SELECT pet_id, pet_nome, pet_tipo, pet_raca, pet_foto FROM pet WHERE don_id = $1 ORDER BY pet_id DESC;",
        [dono.don_id]
      );
      pets = petsResult.rows;

      const residenciaResult = await client.query(
        "SELECT res_complemento FROM residencia WHERE don_id = $1;",
        [dono.don_id]
      );
      residencia = residenciaResult.rows[0];
    }

  } finally {
    client.release();
  }

  if (!dono) {
    return (
      <main className="container">
        <p>Erro: Usuário não encontrado no sistema.</p>
      </main>
    );
  }

  return (
    <main className="container">
      <section className="dados-dono">
        <h2>Informações do Dono</h2>
        <p><strong>Nome:</strong> {dono.don_nome}</p>
        <p><strong>Telefone:</strong> {dono.don_contato}</p>
        <p><strong>Apartamento:</strong> {residencia?.res_complemento || "Não informado"}</p>
      </section>

      <section className="cadastro-pet">
        <h2>Cadastro do Pet</h2>
        <FormCadastroPet donoId={dono.don_id} />
      </section>

      {/* {pets.length > 0 && (
        <section className="lista-pets">
          <h2>Pets Cadastrados</h2>
          <div className="pets-grid">
            {pets.map((pet) => (
              <div key={pet.pet_id} className="pet-card">
                {pet.pet_foto && (
                  <img 
                    src={pet.pet_foto} 
                    alt={pet.pet_nome} 
                    className="pet-foto"
                  />
                )}
                <h3>{pet.pet_nome}</h3>
                <p>{pet.pet_tipo} - {pet.pet_raca}</p>
              </div>
            ))}
          </div>
        </section>
      )} */}
    </main>
  );
}