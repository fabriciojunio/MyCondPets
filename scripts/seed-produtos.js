/**
 * seed-produtos.js
 * Popula o banco com produtos de exemplo para a loja.
 *
 * Uso:
 *   node scripts/seed-produtos.js
 *
 * Requer DATABASE_URL no ambiente ou .env.local
 */

// Carrega .env.local manualmente (sem depender do pacote dotenv)
const fs = require("fs");
const path = require("path");
const envPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf-8").split("\n").forEach((line) => {
    const [key, ...rest] = line.split("=");
    if (key && rest.length) process.env[key.trim()] = rest.join("=").trim();
  });
}
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost") ? false : { rejectUnauthorized: false },
});

async function seed() {
  const client = await pool.connect();
  try {
    console.log("🔌 Conectado ao banco de dados.");

    // Cria as tabelas caso não existam
    await client.query(`
      CREATE TABLE IF NOT EXISTS categoria_produto (
        cat_id   SERIAL PRIMARY KEY,
        cat_nome VARCHAR(100) NOT NULL UNIQUE
      );

      CREATE TABLE IF NOT EXISTS produto (
        prod_id        SERIAL PRIMARY KEY,
        prod_nome      VARCHAR(200) NOT NULL,
        prod_descricao TEXT,
        prod_preco     NUMERIC(10,2) NOT NULL,
        prod_estoque   INT NOT NULL DEFAULT 0,
        prod_imagem    TEXT,
        prod_tags      TEXT,
        cat_id         INT REFERENCES categoria_produto(cat_id),
        prod_ativo     BOOLEAN DEFAULT TRUE,
        prod_criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Tabelas verificadas/criadas.");

    // Categorias
    const cats = [
      "Coleiras e Guias",
      "Brinquedos",
      "Camas e Abrigos",
      "Alimentação",
      "Higiene e Saúde",
      "Roupas e Acessórios",
      "Transporte",
    ];
    for (const nome of cats) {
      await client.query(
        "INSERT INTO categoria_produto (cat_nome) VALUES ($1) ON CONFLICT (cat_nome) DO NOTHING",
        [nome]
      );
    }
    console.log("✅ Categorias inseridas.");

    // Produtos
    const produtos = [
      { nome: "Coleira Nylon Azul com Bolinhas Vermelhas", desc: "Coleira resistente em nylon azul royal com estampa de bolinhas vermelhas. Fecho de segurança ABS.", preco: 39.90, estoque: 50, img: "🦮", tags: "coleira nylon azul bolinhas vermelhas cão pequeno médio", cat: "Coleiras e Guias" },
      { nome: "Coleira de Couro Legítimo Marrom Premium", desc: "Coleira artesanal em couro legítimo marrom. Costura dupla, fivela em aço inox.", preco: 119.90, estoque: 20, img: "🦮", tags: "coleira couro marrom premium grande fivela aço artesanal", cat: "Coleiras e Guias" },
      { nome: "Coleira LED Luminosa Noturna", desc: "Coleira com tira LED recarregável via USB. 3 modos de iluminação.", preco: 67.90, estoque: 30, img: "🦮", tags: "coleira led luminosa noturna usb segurança", cat: "Coleiras e Guias" },
      { nome: "Coleira Antipulgas para Gatos", desc: "Coleira repelente de pulgas e carrapatos para gatos. Proteção de 8 meses.", preco: 35.90, estoque: 45, img: "🐈", tags: "coleira antipulgas gato repelente carrapatos proteção", cat: "Coleiras e Guias" },
      { nome: "Coleira Floral Rosa com Bolinhas Amarelas", desc: "Coleira em tecido macio padrão floral rosa com bolinhas amarelas bordadas.", preco: 29.90, estoque: 60, img: "🦮", tags: "coleira floral rosa bolinhas amarelas tecido fêmea bonita", cat: "Coleiras e Guias" },
      { nome: "Guia Retrátil 5 metros", desc: "Guia extensível até 5 metros com trava de segurança. Para cães até 25kg.", preco: 69.90, estoque: 40, img: "🦮", tags: "guia retrátil extensível 5 metros trava segurança passeio", cat: "Coleiras e Guias" },
      { nome: "Kit 3 Bolas de Tênis para Cães", desc: "Kit com 3 bolas coloridas resistentes à mordida. Para busca e treino.", preco: 24.90, estoque: 80, img: "🎾", tags: "bola tênis brinquedo cão kit 3 coloridas mordida busca", cat: "Brinquedos" },
      { nome: "Brinquedo Mordedor de Borracha Natural", desc: "Mordedor 100% borracha natural, não tóxico. Formato osso.", preco: 22.90, estoque: 70, img: "🦴", tags: "mordedor borracha natural osso dentição estresse cão", cat: "Brinquedos" },
      { nome: "Arranhador para Gatos com Sisal 80cm", desc: "Arranhador vertical em sisal natural, 80cm. Inclui brinquedo pendurado.", preco: 89.90, estoque: 25, img: "🐈", tags: "arranhador gato sisal natural brinquedo 80cm estável", cat: "Brinquedos" },
      { nome: "Peixinho de Pelúcia com Catnip", desc: "Brinquedo de pelúcia peixinho com catnip natural. Faz barulhinho.", preco: 18.90, estoque: 90, img: "🐟", tags: "brinquedo pelúcia peixinho catnip gato barulho", cat: "Brinquedos" },
      { nome: "Cama Ortopédica Impermeável M", desc: "Cama com espuma ortopédica. Capa impermeável lavável. Tamanho M.", preco: 189.90, estoque: 15, img: "🛏️", tags: "cama ortopédica impermeável média espuma lavável conforto", cat: "Camas e Abrigos" },
      { nome: "Casinha de Madeira Pinus P", desc: "Casinha em madeira pinus tratada, resistente à chuva.", preco: 299.90, estoque: 10, img: "🏠", tags: "casinha madeira pinus chuva pequena externa confortável", cat: "Camas e Abrigos" },
      { nome: "Caminha Almofadada Redonda", desc: "Caminha redonda super macia com bordas almofadadas. Lavável na máquina.", preco: 79.90, estoque: 35, img: "🛏️", tags: "caminha redonda macia almofadada lavável gato cão pequeno", cat: "Camas e Abrigos" },
      { nome: "Ração Premium Adulto Frango 3kg", desc: "Ração super premium para cães adultos. Proteína 28%, sem corantes artificiais.", preco: 89.90, estoque: 60, img: "🥣", tags: "ração premium adulto frango 3kg proteína sem corantes cão", cat: "Alimentação" },
      { nome: "Petisco Natural Liofilizado Frango", desc: "Petisco 100% natural de frango liofilizado. Sem conservantes. 100g.", preco: 39.90, estoque: 100, img: "🍗", tags: "petisco natural liofilizado frango sem conservantes saudável", cat: "Alimentação" },
      { nome: "Sachê Úmido Gato Atum ao Molho 12un", desc: "Pack 12 sachês de comida úmida para gatos, sabor atum ao molho.", preco: 42.90, estoque: 55, img: "🐟", tags: "ração úmida sachê gato atum molho 12 unidades", cat: "Alimentação" },
      { nome: "Shampoo Hipoalergênico Neutro 500ml", desc: "Shampoo pH neutro, fórmula suave para peles sensíveis. 500ml.", preco: 34.90, estoque: 65, img: "🧴", tags: "shampoo hipoalergênico neutro pele sensível banho 500ml", cat: "Higiene e Saúde" },
      { nome: "Tapete Higiênico Descartável 80x60 30un", desc: "Tapete higiênico alta absorção, antiderrapante, fragrância neutralizante. 30un.", preco: 44.90, estoque: 80, img: "🧻", tags: "tapete higiênico descartável absorção antiderrapante 30 unidades", cat: "Higiene e Saúde" },
      { nome: "Escova Removedora de Pelos", desc: "Escova dupla face auto-limpante. Remove pelos e desembaraça com facilidade.", preco: 32.90, estoque: 55, img: "🪮", tags: "escova removedora pelos auto-limpante grooming banho tosa", cat: "Higiene e Saúde" },
      { nome: "Capa de Chuva Impermeável G", desc: "Capa de chuva impermeável com capuz ajustável, para cães de porte grande.", preco: 54.90, estoque: 30, img: "🧥", tags: "capa chuva impermeável capuz grande velcro proteção roupa", cat: "Roupas e Acessórios" },
      { nome: "Roupa Quentinha Listrada P", desc: "Roupa de malha quentinha listrada para cães pequenos. 100% algodão.", preco: 38.90, estoque: 40, img: "👕", tags: "roupa quentinha listrada pequeno algodão inverno malha frio", cat: "Roupas e Acessórios" },
      { nome: "Bandana Floral para Cão/Gato", desc: "Bandana em tecido algodão padrão floral. Ajustável com velcro.", preco: 16.90, estoque: 100, img: "🌸", tags: "bandana floral algodão velcro cão gato acessório fofa", cat: "Roupas e Acessórios" },
      { nome: "Bolsa Transporte para Gatos até 6kg", desc: "Bolsa ergonômica com janela telada, alça ombro e rodinhas retráteis.", preco: 189.90, estoque: 12, img: "👜", tags: "bolsa transporte gato ergonômica janela telada rodinhas viagem", cat: "Transporte" },
      { nome: "Mochila Carrier Cão Pequeno", desc: "Mochila porta-pet com janela panorâmica. Suporta até 7kg.", preco: 219.90, estoque: 8, img: "🎒", tags: "mochila carrier porta-pet janela panorâmica cão pequeno gato viagem", cat: "Transporte" },
    ];

    let count = 0;
    for (const p of produtos) {
      const catRes = await client.query("SELECT cat_id FROM categoria_produto WHERE cat_nome = $1", [p.cat]);
      const cat_id = catRes.rows[0]?.cat_id;
      await client.query(
        `INSERT INTO produto (prod_nome, prod_descricao, prod_preco, prod_estoque, prod_imagem, prod_tags, cat_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT DO NOTHING`,
        [p.nome, p.desc, p.preco, p.estoque, p.img, p.tags, cat_id]
      );
      count++;
    }

    console.log(`✅ ${count} produtos inseridos.`);
    console.log("🎉 Seed concluído com sucesso!");
  } catch (err) {
    console.error("❌ Erro no seed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
