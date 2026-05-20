"use server";

import pool from "@/app/_lib/db";
import { revalidatePath } from "next/cache";

export async function cadastrarPet(formData) {
  try {
    const nomePet = formData.get("nome-pet");
    const especie = formData.get("especie");
    const raca = formData.get("raca");
    const dataNascimento = formData.get("data-nascimento");
    const sexo = formData.get("sexo");
    const porte = formData.get("porte");
    const fotoBase64 = formData.get("foto-base64") || null;
    const donoId = formData.get("don_id");

    // Validações básicas
    if (!nomePet || !especie || !raca || !dataNascimento || !sexo || !porte) {
      return { success: false, message: "Preencha todos os campos obrigatórios." };
    }

    // --------------------------------
    // 📌 INSERÇÃO NO BANCO
    // --------------------------------
    const client = await pool.connect();

    try {
      const query = `
        INSERT INTO pet (
          pet_nome, 
          pet_tipo, 
          pet_raca, 
          pet_data_nascimento, 
          pet_sexo, 
          pet_porte, 
          pet_foto, 
          don_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING pet_id;
      `;

      const values = [
        nomePet,
        especie,
        raca,
        dataNascimento,
        sexo,
        porte,
        fotoBase64,
        donoId
      ];

      const result = await client.query(query, values);

      // atualizar a página
      revalidatePath("/cadastropet");

      return {
        success: true,
        message: "Pet cadastrado com sucesso!",
        petId: result.rows[0].pet_id
      };

    } catch (error) {
      console.error("❌ Erro ao inserir pet no banco:", error);
      return { success: false, message: "Erro ao cadastrar no banco." };
    } finally {
      client.release();
    }

  } catch (error) {
    console.error("❌ ERRO GERAL:", error);
    return {
      success: false,
      message: "Erro ao cadastrar pet. Tente novamente."
    };
  }
}
