import { Pool } from 'pg';

let pool;

if (!pool) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
    // Timeout e retry para evitar ETIMEDOUT
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    keepAlive: true,
    keepAliveInitialDelay: 10000,
    // Retry automático em caso de falha de conexão
    max: 20,
    // Permite reconectar em caso de erro
    allowExitOnIdle: false,
  });
}

// Handler para reconectar em caso de erro
pool.on('error', (err, client) => {
  console.error('Erro inesperado no pool de conexões:', err);
});

export default pool;