"use server";

import pool from "../db";

/**
 * Busca um 'dono' pelo email. Se não encontrar, cria um novo.
 * Retorna o usuário, um booleano 'isNew' e se o perfil está completo
 */
export async function buscaOuCriaDono(email, name) {
  if (!email) {
    throw new Error("Email é obrigatório.");
  }

  let client;
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      client = await pool.connect();
      break; // Sucesso, sai do loop
    } catch (err) {
      lastError = err;
      console.error(`Tentativa ${attempt}/${maxRetries} de conectar ao banco falhou:`, err.message);
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Espera exponencial
      }
    }
  }

  if (!client) {
    throw new Error(`Não foi possível conectar ao banco após ${maxRetries} tentativas.`);
  }

  try {

    let result = await client.query(
      "SELECT * FROM dono WHERE don_email = $1", 
      [email]
    );

    if (result.rows.length > 0) {
      const dono = result.rows[0];
      
      // Verifica se tem contato
      if (!dono.don_contato) {
        return { 
          dono, 
          isNew: false,
          perfilCompleto: false 
        };
      }
      
      // Verifica se tem residência completa
      const resResult = await client.query(
        "SELECT res_complemento, res_numero, res_cep FROM residencia WHERE don_id = $1",
        [dono.don_id]
      );
      
      const residencia = resResult.rows[0];
      
      // Perfil completo = tem contato E tem todos os campos da residência
      const perfilCompleto = !!(
        residencia?.res_complemento && 
        residencia?.res_numero && 
        residencia?.res_cep
      );
      
      return { 
        dono, 
        isNew: false,
        perfilCompleto 
      };
    }

    // Cria novo dono
    result = await client.query(
      "INSERT INTO dono (don_email, don_nome) VALUES ($1, $2) RETURNING *",
      [email, name]
    );

    return { 
      dono: result.rows[0], 
      isNew: true,
      perfilCompleto: false // Novo usuário sempre tem perfil incompleto
    };

  } catch (error) {
    console.error("Erro no banco de dados ao buscar/criar dono:", error);
    throw new Error("Não foi possível processar o login.");
  } finally {
    if (client) {
      client.release();
    }
  }
}