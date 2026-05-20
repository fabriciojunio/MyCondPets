import { NextResponse } from "next/server";
import pool from "@/app/_lib/db";

export async function PUT(request) {
  let client;
  
  try {
    const body = await request.json();
    const { userEmail, nome, contato, complemento, numero, cep, residenciaId } = body;

    if (!userEmail) {
      return NextResponse.json(
        { message: "Email do usuário não fornecido" },
        { status: 400 }
      );
    }

    // Validações
    if (!nome || !contato || !complemento || !numero || !cep) {
      return NextResponse.json(
        { message: "Todos os campos obrigatórios devem ser preenchidos" },
        { status: 400 }
      );
    }

    client = await pool.connect();

    // Inicia transação
    await client.query("BEGIN");

    // Busca o don_id pelo email
    const donoResult = await client.query(
      "SELECT don_id FROM dono WHERE don_email = $1",
      [userEmail]
    );

    if (donoResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { message: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const donId = donoResult.rows[0].don_id;

    // Atualiza dados do dono (nome e contato)
    await client.query(
      "UPDATE dono SET don_nome = $1, don_contato = $2 WHERE don_id = $3",
      [nome, contato, donId]
    );

    // Atualiza ou insere a residência
    if (residenciaId) {
      // Atualiza residência existente
      await client.query(
        `UPDATE residencia 
         SET res_complemento = $1, res_numero = $2, res_cep = $3 
         WHERE res_id = $4 AND don_id = $5`,
        [complemento, numero, cep, residenciaId, donId]
      );
    } else {
      // Verifica se já existe uma residência para esse dono
      const resExistente = await client.query(
        "SELECT res_id FROM residencia WHERE don_id = $1",
        [donId]
      );

      if (resExistente.rows.length > 0) {
        // Atualiza a residência existente
        await client.query(
          `UPDATE residencia 
           SET res_complemento = $1, res_numero = $2, res_cep = $3 
           WHERE don_id = $4`,
          [complemento, numero, cep, donId]
        );
      } else {
        // Cria nova residência
        await client.query(
          `INSERT INTO residencia (don_id, res_complemento, res_numero, res_cep) 
           VALUES ($1, $2, $3, $4)`,
          [donId, complemento, numero, cep]
        );
      }
    }

    // Confirma transação
    await client.query("COMMIT");

    return NextResponse.json(
      { message: "Perfil atualizado com sucesso" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    
    if (client) {
      await client.query("ROLLBACK"); 
    }
    
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}