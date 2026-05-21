"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import "./styles.css";
import { FiSearch, FiShoppingCart, FiStar, FiZap, FiTag, FiFilter } from "react-icons/fi";
import { MdAutoAwesome } from "react-icons/md";

const DEMO_CATEGORIAS = [
  { cat_id: '1', cat_nome: 'Alimentação' },
  { cat_id: '2', cat_nome: 'Brinquedos' },
  { cat_id: '3', cat_nome: 'Higiene' },
  { cat_id: '4', cat_nome: 'Acessórios' },
];

const DEMO_PRODUTOS = [
  { prod_id: '1', prod_nome: 'Ração Premium Golden Retriever 15kg', prod_descricao: 'Ração completa para cães adultos de grande porte', prod_preco: '189.90', prod_estoque: 12, prod_imagem: '🥩', cat_nome: 'Alimentação' },
  { prod_id: '2', prod_nome: 'Ração Natural para Gatos 3kg', prod_descricao: 'Ingredientes naturais sem conservantes artificiais', prod_preco: '67.50', prod_estoque: 8, prod_imagem: '🐟', cat_nome: 'Alimentação' },
  { prod_id: '3', prod_nome: 'Coleira Antifuga com GPS', prod_descricao: 'Monitoramento em tempo real pelo celular', prod_preco: '249.00', prod_estoque: 5, prod_imagem: '📡', cat_nome: 'Acessórios' },
  { prod_id: '4', prod_nome: 'Cama Ortopédica Cachorro Grande', prod_descricao: 'Espuma de alta densidade, lavável e impermeável', prod_preco: '159.90', prod_estoque: 3, prod_imagem: '🛏️', cat_nome: 'Acessórios' },
  { prod_id: '5', prod_nome: 'Kit Brinquedos Interativos para Gato', prod_descricao: 'Varinha com penas, bolinhas e arranhador', prod_preco: '44.90', prod_estoque: 20, prod_imagem: '🧶', cat_nome: 'Brinquedos' },
  { prod_id: '6', prod_nome: 'Shampoo Hipoalergênico para Pets', prod_descricao: 'Fórmula suave indicada por veterinários', prod_preco: '32.90', prod_estoque: 15, prod_imagem: '🧴', cat_nome: 'Higiene' },
  { prod_id: '7', prod_nome: 'Mordedor Brinquedo Kong Resistente', prod_descricao: 'Borracha reforçada para cães que adoram morder', prod_preco: '59.90', prod_estoque: 10, prod_imagem: '🦴', cat_nome: 'Brinquedos' },
  { prod_id: '8', prod_nome: 'Escova Dental Pet + Pasta Sabor Frango', prod_descricao: 'Kit completo para higiene bucal do seu pet', prod_preco: '24.90', prod_estoque: 18, prod_imagem: '🦷', cat_nome: 'Higiene' },
];

const SEARCH_HINTS = [
  "coleira com bolinhas vermelhas",
  "cama ortopédica",
  "brinquedo para gato",
  "ração natural",
  "shampoo hipoalergênico",
];

function SkeletonCard() {
  return (
    <div className="prod-skeleton">
      <div className="skeleton skeleton-img" />
      <div className="skeleton-body">
        <div className="skeleton skeleton-line" style={{ width: "60%" }} />
        <div className="skeleton skeleton-line" style={{ width: "90%" }} />
        <div className="skeleton skeleton-line" style={{ width: "75%" }} />
        <div className="skeleton skeleton-line" style={{ width: "40%", height: "20px", marginTop: "8px" }} />
      </div>
    </div>
  );
}

export default function LojaPage() {
  const { data: session, status } = useSession();
  // Modo demo: ativo quando logado como demo OU quando não há sessão (acesso público)
  const isDemo = !session?.user || session?.user?.isDemo;

  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [catAtiva, setCatAtiva] = useState("todos");
  const [query, setQuery] = useState("");
  const [buscaAtiva, setBuscaAtiva] = useState("");
  const [interpretacao, setInterpretacao] = useState("");
  const [loading, setLoading] = useState(true);
  const [buscando, setBuscando] = useState(false);
  const [ordenacao, setOrdenacao] = useState("relevancia");
  const [toast, setToast] = useState(null);
  const inputRef = useRef(null);

  // Carrega categorias
  useEffect(() => {
    if (isDemo) { setCategorias(DEMO_CATEGORIAS); return; }
    fetch("/api/categorias")
      .then((r) => r.json())
      .then((d) => setCategorias(d.categorias || []))
      .catch(() => {});
  }, [isDemo]);

  // Carrega produtos
  const carregarProdutos = useCallback(async () => {
    setLoading(true);
    if (isDemo) {
      const filtrados = catAtiva === "todos"
        ? DEMO_PRODUTOS
        : DEMO_PRODUTOS.filter((p) => p.cat_nome === catAtiva);
      setProdutos(filtrados);
      setBuscaAtiva("");
      setInterpretacao("");
      setLoading(false);
      return;
    }
    try {
      const params = new URLSearchParams();
      if (catAtiva !== "todos") params.set("categoria", catAtiva);
      const res = await fetch(`/api/produtos?${params}`);
      const data = await res.json();
      setProdutos(data.produtos || []);
      setBuscaAtiva("");
      setInterpretacao("");
    } catch {
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  }, [catAtiva, isDemo]);

  useEffect(() => {
    if (!buscaAtiva) {
      carregarProdutos();
    }
  }, [catAtiva, carregarProdutos, buscaAtiva]);

  // Busca com IA — tenta semântica (embeddings) primeiro, depois local
  const buscarComIA = async (q) => {
    if (!q.trim()) { carregarProdutos(); return; }
    if (isDemo) {
      setBuscando(true);
      const ql = q.toLowerCase();
      const found = DEMO_PRODUTOS.filter((p) =>
        p.prod_nome.toLowerCase().includes(ql) ||
        p.prod_descricao.toLowerCase().includes(ql) ||
        p.cat_nome.toLowerCase().includes(ql)
      );
      setProdutos(found);
      setBuscaAtiva(q);
      setInterpretacao('');
      setBuscando(false);
      return;
    }
    setBuscando(true);
    setInterpretacao("");
    try {
      // 1ª tentativa: busca semântica com embeddings (HuggingFace)
      const resSem = await fetch(`/api/busca-semantica-produtos?q=${encodeURIComponent(q)}`);
      if (resSem.ok) {
        const dataSem = await resSem.json();
        if (dataSem.produtos && dataSem.produtos.length > 0) {
          setProdutos(dataSem.produtos);
          setBuscaAtiva(q);
          setInterpretacao("✨ Resultado por busca semântica com IA");
          return;
        }
      }
    } catch {}

    // 2ª tentativa: busca local com sinônimos
    try {
      const res = await fetch("/api/busca-ia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      setProdutos(data.produtos || []);
      setBuscaAtiva(q);
      setInterpretacao(data.interpretacao || "");
    } catch {
      const params = new URLSearchParams({ busca: q });
      const res2 = await fetch(`/api/produtos?${params}`).catch(() => ({ json: () => ({ produtos: [] }) }));
      const d2 = await res2.json();
      setProdutos(d2.produtos || []);
      setBuscaAtiva(q);
    } finally {
      setBuscando(false);
    }
  };

  const handleSearch = (e) => {
    e?.preventDefault();
    buscarComIA(query);
  };

  const handleHint = (hint) => {
    setQuery(hint);
    buscarComIA(hint);
    inputRef.current?.focus();
  };

  const limparBusca = () => {
    setQuery("");
    setBuscaAtiva("");
    setInterpretacao("");
    carregarProdutos();
  };

  // Adiciona ao carrinho
  const addToCart = (produto) => {
    try {
      const cart = JSON.parse(localStorage.getItem("mycondpets_cart") || "[]");
      const idx = cart.findIndex((i) => i.prod_id === produto.prod_id);
      if (idx >= 0) {
        cart[idx].quantidade += 1;
      } else {
        cart.push({
          prod_id: produto.prod_id,
          nome: produto.prod_nome,
          preco: Number(produto.prod_preco),
          imagem: produto.prod_imagem,
          quantidade: 1,
        });
      }
      localStorage.setItem("mycondpets_cart", JSON.stringify(cart));
      window.dispatchEvent(new Event("cartUpdated"));
      mostrarToast(`${produto.prod_nome.split(" ").slice(0, 3).join(" ")} adicionado!`);
    } catch {}
  };

  const mostrarToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // Ordena
  const produtosOrdenados = [...produtos].sort((a, b) => {
    if (ordenacao === "menor") return Number(a.prod_preco) - Number(b.prod_preco);
    if (ordenacao === "maior") return Number(b.prod_preco) - Number(a.prod_preco);
    if (ordenacao === "nome") return a.prod_nome.localeCompare(b.prod_nome);
    return 0;
  });

  // Contagem por categoria
  const contagens = {};
  categorias.forEach((c) => { contagens[c.cat_nome] = 0; });

  return (
    <div className="loja-page">
      {/* Banner frete grátis */}
      <div className="frete-banner">
        🚚 <strong>Frete GRÁTIS</strong> em compras acima de <strong>R$&nbsp;199,00</strong> — aproveite!
      </div>

      {/* Hero + Search */}
      <div className="loja-hero">
        <div className="loja-hero-eyebrow">
          <MdAutoAwesome size={12} /> Busque com Inteligência Artificial
        </div>
        <h1>Loja MyCondPets</h1>
        <p>Encontre tudo para o seu pet com a nossa busca inteligente</p>

        <div className="loja-search-wrap">
          <form className="loja-search-box" onSubmit={handleSearch}>
            <div className="loja-search-icon">
              {buscando ? (
                <div style={{ width: 18, height: 18, border: "2px solid #ccc", borderTopColor: "#E67E22", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
              ) : (
                <FiSearch size={18} />
              )}
            </div>
            <input
              ref={inputRef}
              type="text"
              className="loja-search-input"
              placeholder="Ex: coleira com bolinhas vermelhas, cama ortopédica..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                type="button"
                onClick={limparBusca}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "0 8px", color: "var(--text-light)", fontSize: "18px" }}
              >×</button>
            )}
            <button className="loja-search-btn" type="submit" disabled={buscando}>
              <FiZap size={14} />
              {buscando ? "Buscando..." : "Buscar"}
            </button>
          </form>

          <div className="loja-search-hint">
            {SEARCH_HINTS.map((h, i) => (
              <span key={i} onClick={() => handleHint(h)}>🔍 {h}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="loja-main">
        {/* Sidebar */}
        <aside className="loja-sidebar">
          <div className="sidebar-title">Categorias</div>

          <button
            className={`sidebar-cat-btn ${catAtiva === "todos" ? "active" : ""}`}
            onClick={() => { setCatAtiva("todos"); limparBusca(); }}
          >
            <FiTag size={14} /> Todos os produtos
            <span className="sidebar-cat-count">—</span>
          </button>

          {categorias.map((c) => (
            <button
              key={c.cat_id}
              className={`sidebar-cat-btn ${catAtiva === c.cat_nome ? "active" : ""}`}
              onClick={() => { setCatAtiva(c.cat_nome); setQuery(""); setBuscaAtiva(""); setInterpretacao(""); }}
            >
              <FiTag size={14} /> {c.cat_nome}
            </button>
          ))}

          <div className="sidebar-divider" />

          <div className="sidebar-title">Ordenar por</div>
          <div className="sidebar-sort">
            <select value={ordenacao} onChange={(e) => setOrdenacao(e.target.value)}>
              <option value="relevancia">Relevância</option>
              <option value="menor">Menor preço</option>
              <option value="maior">Maior preço</option>
              <option value="nome">Nome A-Z</option>
            </select>
          </div>
        </aside>

        {/* Products */}
        <div className="loja-content">
          {/* Toolbar */}
          <div className="loja-toolbar">
            <div className="loja-toolbar-left">
              <div className="loja-result-count">
                <strong>{produtosOrdenados.length}</strong>{" "}
                {buscaAtiva ? `resultado${produtosOrdenados.length !== 1 ? "s" : ""} para "${buscaAtiva}"` : "produtos"}
              </div>
              {buscaAtiva && (
                <button className="btn btn-ghost btn-sm" onClick={limparBusca}>
                  × Limpar busca
                </button>
              )}
            </div>
          </div>

          {/* IA Interpretation */}
          {interpretacao && (
            <div className="loja-ia-interpretation">
              <MdAutoAwesome size={15} />
              <span><strong>IA:</strong> {interpretacao}</span>
            </div>
          )}

          {/* Grid */}
          {loading || buscando ? (
            <div className="loja-grid">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : produtosOrdenados.length === 0 ? (
            <div className="loja-empty">
              <div className="loja-empty-icon">🔍</div>
              <h3>Nenhum produto encontrado</h3>
              <p>
                {buscaAtiva
                  ? `Não encontramos produtos para "${buscaAtiva}". Tente termos diferentes.`
                  : "Nenhum produto nesta categoria ainda."}
              </p>
              {buscaAtiva && (
                <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={limparBusca}>
                  Ver todos os produtos
                </button>
              )}
            </div>
          ) : (
            <div className="loja-grid">
              {produtosOrdenados.map((p) => {
                const estoque = Number(p.prod_estoque);
                const stockClass = estoque === 0 ? "stock-out" : estoque <= 5 ? "stock-low" : "stock-ok";
                const stockLabel = estoque === 0 ? "Esgotado" : estoque <= 5 ? `Últimas ${estoque} unid.` : "Em estoque";
                return (
                  <div className="prod-card" key={p.prod_id}>
                    <div className="prod-card-img">
                      {p.prod_imagem?.startsWith("/") || p.prod_imagem?.startsWith("http") ? (
                        <img src={p.prod_imagem} alt={p.prod_nome} />
                      ) : (
                        <span>{p.prod_imagem || "📦"}</span>
                      )}
                      <span className={`prod-card-stock-badge ${stockClass}`}>{stockLabel}</span>
                    </div>
                    <div className="prod-card-body">
                      <div className="prod-card-cat">{p.cat_nome}</div>
                      <div className="prod-card-name">{p.prod_nome}</div>
                      {p.prod_descricao && (
                        <div className="prod-card-desc">{p.prod_descricao}</div>
                      )}
                    </div>
                    <div className="prod-card-footer">
                      <div className="prod-card-price">
                        R$ {Number(p.prod_preco).toFixed(2).replace(".", ",")}
                      </div>
                      <button
                        className="prod-card-add"
                        onClick={() => addToCart(p)}
                        disabled={estoque === 0}
                      >
                        <FiShoppingCart size={13} />
                        {estoque === 0 ? "Esgotado" : "Adicionar"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="loja-toast">
          <FiShoppingCart size={15} /> {toast}
        </div>
      )}
    </div>
  );
}
