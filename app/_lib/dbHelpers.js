import pool from "./db";

/**
 * Conecta ao banco com retry automático
 * @param {number} maxRetries - Número máximo de tentativas
 * @param {number} baseDelay - Delay base em ms para espera exponencial
 * @returns {Promise<PoolClient>}
 */
export async function getClient(maxRetries = 3, baseDelay = 1000) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const client = await pool.connect();
      return client;
    } catch (err) {
      lastError = err;
      console.error(`Tentativa ${attempt}/${maxRetries} de conectar ao banco falhou:`, err.message);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, baseDelay * attempt));
      }
    }
  }
  
  throw new Error(`Não foi possível conectar ao banco após ${maxRetries} tentativas: ${lastError?.message}`);
}

/**
 * Executa uma query com retry automático
 * @param {string} text - Query SQL
 * @param {Array} params - Parâmetros da query
 * @param {number} maxRetries - Número máximo de tentativas
 */
export async function queryWithRetry(text, params, maxRetries = 3) {
  const client = await getClient(maxRetries);
  
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}