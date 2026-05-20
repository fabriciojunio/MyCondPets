-- =============================================
--  MyCondPets — Schema completo
-- =============================================

CREATE DATABASE IF NOT EXISTS mycondpets;
\c mycondpets;

-- Donos (moradores)
CREATE TABLE IF NOT EXISTS dono (
    don_id      SERIAL PRIMARY KEY,
    don_nome    VARCHAR(150) NOT NULL,
    don_email   VARCHAR(150) NOT NULL UNIQUE,
    don_contato VARCHAR(20),
    don_cpf     VARCHAR(20)
);

-- Residências
CREATE TABLE IF NOT EXISTS residencia (
    res_id          SERIAL PRIMARY KEY,
    res_complemento VARCHAR(200),
    res_numero      INT,
    res_rua         VARCHAR(150),
    res_bairro      VARCHAR(150),
    res_cidade      VARCHAR(150),
    res_estado      VARCHAR(2),
    res_cep         VARCHAR(15),
    don_id          INT,
    CONSTRAINT fk_residencia_dono FOREIGN KEY (don_id)
        REFERENCES dono(don_id)
);

-- Pets
CREATE TABLE IF NOT EXISTS pet (
    pet_id              SERIAL PRIMARY KEY,
    pet_nome            VARCHAR(150) NOT NULL,
    pet_tipo            VARCHAR(100),
    pet_raca            VARCHAR(100),
    pet_porte           VARCHAR(50),
    pet_sexo            VARCHAR(20),
    pet_data_nascimento DATE,
    pet_cor             VARCHAR(50),
    pet_foto            TEXT,
    don_id              INT,
    CONSTRAINT fk_pet_dono FOREIGN KEY (don_id)
        REFERENCES dono(don_id)
);

-- Notícias
CREATE TABLE IF NOT EXISTS noticias (
    not_id               SERIAL PRIMARY KEY,
    not_titulo           VARCHAR(300) NOT NULL,
    not_conteudo         TEXT NOT NULL,
    not_data_publicacao  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    don_id               INT,
    not_foto             TEXT,
    CONSTRAINT fk_noticias_dono FOREIGN KEY (don_id)
        REFERENCES dono(don_id)
);

-- =============================================
--  SAÚDE DOS PETS
-- =============================================

-- Vacinação
CREATE TABLE IF NOT EXISTS vacinacao (
    vac_id              SERIAL PRIMARY KEY,
    pet_id              INT NOT NULL,
    vac_tipo            VARCHAR(100) NOT NULL,
    vac_data_aplicacao  DATE NOT NULL,
    vac_data_vencimento DATE NOT NULL,
    vac_carteira        TEXT,
    CONSTRAINT fk_vacinacao_pet FOREIGN KEY (pet_id) REFERENCES pet(pet_id) ON DELETE CASCADE
);

-- Saúde geral do pet
CREATE TABLE IF NOT EXISTS saude_pet (
    sau_id          SERIAL PRIMARY KEY,
    pet_id          INT NOT NULL UNIQUE,
    sau_doencas     TEXT,
    sau_contagiosas TEXT,
    sau_alergias    TEXT,
    sau_medicacao   TEXT,
    sau_comportamento TEXT,
    CONSTRAINT fk_saude_pet FOREIGN KEY (pet_id) REFERENCES pet(pet_id) ON DELETE CASCADE
);

-- Colunas extras em noticias
ALTER TABLE noticias ADD COLUMN IF NOT EXISTS not_status VARCHAR(20) DEFAULT 'aberto';
ALTER TABLE noticias ADD COLUMN IF NOT EXISTS not_tipo_animal VARCHAR(50);

-- =============================================
--  E-COMMERCE
-- =============================================

-- Categorias de produtos
CREATE TABLE IF NOT EXISTS categoria_produto (
    cat_id   SERIAL PRIMARY KEY,
    cat_nome VARCHAR(100) NOT NULL UNIQUE
);

-- Produtos da loja
CREATE TABLE IF NOT EXISTS produto (
    prod_id        SERIAL PRIMARY KEY,
    prod_nome      VARCHAR(200) NOT NULL,
    prod_descricao TEXT,
    prod_preco     NUMERIC(10,2) NOT NULL,
    prod_estoque   INT NOT NULL DEFAULT 0,
    prod_imagem    TEXT,           -- emoji ou path de imagem
    prod_tags      TEXT,           -- tags para busca semântica ex: "coleira nylon azul bolinhas vermelhas"
    cat_id         INT,
    prod_ativo     BOOLEAN DEFAULT TRUE,
    prod_criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_produto_categoria FOREIGN KEY (cat_id)
        REFERENCES categoria_produto(cat_id)
);

-- Pedidos
CREATE TABLE IF NOT EXISTS pedido (
    ped_id          SERIAL PRIMARY KEY,
    don_id          INT,
    ped_status      VARCHAR(50) DEFAULT 'pendente',  -- pendente, pago, enviado, entregue, cancelado
    ped_total       NUMERIC(10,2) NOT NULL,
    ped_criado_em   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ped_nome        VARCHAR(150),   -- nome do comprador (pode não ter conta)
    ped_email       VARCHAR(150),
    ped_telefone    VARCHAR(20),
    ped_endereco    TEXT,
    CONSTRAINT fk_pedido_dono FOREIGN KEY (don_id)
        REFERENCES dono(don_id)
);

-- Itens do pedido
CREATE TABLE IF NOT EXISTS item_pedido (
    item_id       SERIAL PRIMARY KEY,
    ped_id        INT NOT NULL,
    prod_id       INT NOT NULL,
    item_qtd      INT NOT NULL DEFAULT 1,
    item_preco    NUMERIC(10,2) NOT NULL,
    CONSTRAINT fk_item_pedido FOREIGN KEY (ped_id)
        REFERENCES pedido(ped_id),
    CONSTRAINT fk_item_produto FOREIGN KEY (prod_id)
        REFERENCES produto(prod_id)
);

-- =============================================
--  DADOS INICIAIS — categorias
-- =============================================
INSERT INTO categoria_produto (cat_nome) VALUES
    ('Coleiras e Guias'),
    ('Brinquedos'),
    ('Camas e Abrigos'),
    ('Alimentação'),
    ('Higiene e Saúde'),
    ('Roupas e Acessórios'),
    ('Transporte')
ON CONFLICT (cat_nome) DO NOTHING;

-- =============================================
--  DADOS INICIAIS — produtos de exemplo
-- =============================================
INSERT INTO produto (prod_nome, prod_descricao, prod_preco, prod_estoque, prod_imagem, prod_tags, cat_id) VALUES

-- Coleiras e Guias
('Coleira Nylon Azul com Bolinhas Vermelhas',
 'Coleira resistente em nylon azul royal com estampa de bolinhas vermelhas. Fecho de segurança em plástico ABS. Ideal para cães de porte pequeno a médio.',
 39.90, 50, '🦮',
 'coleira nylon azul bolinhas vermelhas cão cachorro fecho segurança pequeno médio',
 1),

('Coleira de Couro Legítimo Marrom Premium',
 'Coleira artesanal em couro legítimo marrom. Costura dupla reforçada, fivela em aço inoxidável. Para cães de porte grande.',
 119.90, 20, '🦮',
 'coleira couro marrom premium grande fivela aço artesanal robusto',
 1),

('Coleira LED Luminosa Noturna',
 'Coleira com tira LED recarregável via USB. 3 modos de iluminação: fixa, pisca lento e pisca rápido. Ótima visibilidade noturna.',
 67.90, 30, '🦮',
 'coleira led luminosa noturna usb segurança visibilidade escuro',
 1),

('Coleira Antipulgas para Gatos',
 'Coleira repelente de pulgas e carrapatos para gatos adultos. Proteção de até 8 meses. Ajustável e com desencaixe de segurança.',
 35.90, 45, '🐈',
 'coleira antipulgas gato gatos repelente carrapatos proteção ajustável segurança',
 1),

('Coleira Floral Rosa com Bolinhas Amarelas',
 'Coleira em tecido macio padrão floral rosa com bolinhas amarelas bordadas. Perfeita para cães pequenos e fêmeas.',
 29.90, 60, '🦮',
 'coleira floral rosa bolinhas amarelas tecido macio pequeno fêmea fofa bonita',
 1),

('Guia Retrátil 5 metros',
 'Guia extensível até 5 metros com trava de segurança. Fita resistente. Para cães de até 25kg.',
 69.90, 40, '🦮',
 'guia retrátil extensível 5 metros trava segurança passeio cão',
 1),

-- Brinquedos
('Kit 3 Bolas de Tênis para Cães',
 'Kit com 3 bolas de tênis coloridas resistentes à mordida. Ideais para brincadeiras e treino de busca.',
 24.90, 80, '🎾',
 'bola tênis brinquedo cão cachorro kit 3 coloridas mordida busca agilidade',
 2),

('Brinquedo Mordedor de Borracha Natural',
 'Mordedor 100% borracha natural, não tóxico. Fortalece a dentição e alivia o estresse. Formato osso.',
 22.90, 70, '🦴',
 'mordedor borracha natural osso dentição estresse brinquedo cão não tóxico',
 2),

('Arranhador para Gatos com Sisal 80cm',
 'Arranhador vertical em sisal natural com base estável. 80cm de altura. Inclui brinquedo pendurado.',
 89.90, 25, '🐈',
 'arranhador gato sisal natural brinquedo pendurado 80cm estável felino',
 2),

('Peixinho de Pelúcia com Catnip',
 'Brinquedo de pelúcia macia em formato de peixinho recheado com catnip natural. Faz barulhinho.',
 18.90, 90, '🐟',
 'brinquedo pelúcia peixinho catnip gato felino barulho divertido',
 2),

-- Camas e Abrigos
('Cama Ortopédica Impermeável M',
 'Cama com espuma ortopédica de alta densidade. Capa impermeável lavável. Tamanho M (60x50cm). Acompanha capa extra.',
 189.90, 15, '🛏️',
 'cama ortopédica impermeável média espuma alta densidade lavável conforto',
 3),

('Casinha de Madeira Pinus P',
 'Casinha em madeira de pinus tratada, resistente a chuva. Porta com cortina emborrachada. Tamanho P.',
 299.90, 10, '🏠',
 'casinha madeira pinus chuva pequena externa telhado confortável',
 3),

('Caminha Almofadada Redonda',
 'Caminha redonda super macia com bordas almofadadas. Lavável na máquina. 3 cores disponíveis.',
 79.90, 35, '🛏️',
 'caminha redonda macia almofadada lavável máquina gato cão pequeno',
 3),

-- Alimentação
('Ração Premium Adulto Frango 3kg',
 'Ração super premium para cães adultos. Proteína 28%, frango como 1ª fonte. Sem corantes artificiais.',
 89.90, 60, '🥣',
 'ração premium adulto frango 3kg proteína sem corantes cão cachorro',
 4),

('Petisco Natural Liofilizado Frango',
 'Petisco 100% natural de frango liofilizado. Sem conservantes, sem corantes. 100g. Para cães e gatos.',
 39.90, 100, '🍗',
 'petisco natural liofilizado frango sem conservantes saudável cão gato',
 4),

('Sache Úmido Gato Atum ao Molho 12un',
 'Pack com 12 sachês de comida úmida para gatos sabor atum ao molho. Alimentação complementar.',
 42.90, 55, '🐟',
 'ração úmida sachê gato atum molho complementar 12 unidades',
 4),

-- Higiene e Saúde
('Shampoo Hipoalergênico Neutro 500ml',
 'Shampoo de banho hipoalergênico com pH neutro. Fórmula suave para peles sensíveis. 500ml.',
 34.90, 65, '🧴',
 'shampoo hipoalergênico neutro pele sensível banho 500ml cão cachorro',
 5),

('Tapete Higiênico Descartável 80x60 30un',
 'Tapete higiênico com alta absorção, superfície antiderrapante e fragrância neutralizante. 30 unidades.',
 44.90, 80, '🧻',
 'tapete higiênico descartável absorção antiderrapante fragrância 30 unidades',
 5),

('Escova Removedora de Pelos',
 'Escova dupla face com dentes auto-limpantes. Remove pelos soltos e desembaraça o pelo com facilidade.',
 32.90, 55, '🪮',
 'escova removedora pelos auto-limpante desembaraçar grooming banho tosa',
 5),

-- Roupas e Acessórios
('Capa de Chuva Impermeável G',
 'Capa de chuva impermeável com capuz ajustável para cães de porte grande. Velcro de fixação.',
 54.90, 30, '🧥',
 'capa chuva impermeável capuz grande velcro proteção passeio roupa',
 6),

('Roupa Quentinha Listrada P',
 'Roupa de malha quentinha listrada para cães pequenos. 100% algodão, lavável. Cor: azul e branco.',
 38.90, 40, '👕',
 'roupa quentinha listrada pequeno algodão inverno malha frio azul branco',
 6),

('Bandana Floral para Cão/Gato',
 'Bandana em tecido de algodão padrão floral. Ajustável com velcro. Tamanho único. Para cães e gatos.',
 16.90, 100, '🌸',
 'bandana floral algodão ajustável velcro cão gato acessório fofa',
 6),

-- Transporte
('Bolsa Transporte para Gatos até 6kg',
 'Bolsa de transporte ergonômica com janela telada, alça de ombro e rodinhas retrácteis. Para gatos até 6kg.',
 189.90, 12, '👜',
 'bolsa transporte gato ergonômica janela telada rodinhas viagem segurança',
 7),

('Mochila Carrier Cão Pequeno',
 'Mochila porta-pet com janela panorâmica em tela. Suporta até 7kg. Para cães pequenos e gatos.',
 219.90, 8, '🎒',
 'mochila carrier porta-pet janela panorâmica cão pequeno gato viagem passeio',
 7)

ON CONFLICT DO NOTHING;
