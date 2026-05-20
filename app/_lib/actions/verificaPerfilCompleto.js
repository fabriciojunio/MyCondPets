"use server";

import pool from "../db";

/**
 * Verifica se o perfil do usuário está completo
 * Retorna true se tem contato E residência completa (complemento, numero, cep)
 */
export async function verificaPerfilCompleto(email) {
  if (!email) {
    return false;
  }

  let client;
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      client = await pool.connect();
      break;
    } catch (err) {
      console.error(`Tentativa ${attempt}/${maxRetries} de conectar ao banco falhou:`, err.message);
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  if (!client) {
    console.error("Não foi possível conectar ao banco após tentativas.");
    return false;
  }

  try {

    // Busca o dono
    const donoResult = await client.query(
      "SELECT don_id, don_contato FROM dono WHERE don_email = $1",
      [email]
    );

    if (donoResult.rows.length === 0) {
      return false;
    }

    const dono = donoResult.rows[0];

    // Verifica se tem contato
    if (!dono.don_contato) {
      return false;
    }

    // Verifica se tem residência completa
    const resResult = await client.query(
      "SELECT res_complemento, res_numero, res_cep FROM residencia WHERE don_id = $1",
      [dono.don_id]
    );

    if (resResult.rows.length === 0) {
      return false;
    }

    const residencia = resResult.rows[0];

    // Perfil completo = tem contato E tem todos os campos da residência
    return !!(
      residencia.res_complemento && 
      residencia.res_numero && 
      residencia.res_cep
    );

  } catch (error) {
    console.error("Erro ao verificar perfil:", error);
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
}