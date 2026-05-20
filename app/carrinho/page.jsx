"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import "./styles.css";
import { FiShoppingCart, FiTrash2, FiArrowLeft, FiCheck, FiTruck } from "react-icons/fi";
import { useSession } from "next-auth/react";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem("mycondpets_cart") || "[]");
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem("mycondpets_cart", JSON.stringify(cart));
  window.dispatchEvent(new Event("cartUpdated"));
}

export default function CarrinhoPage() {
  const { data: session } = useSession();
  const [cart, setCart] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [pedidoOk, setPedidoOk] = useState(null);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");

  // Formulário de checkout
  const [form, setForm] = useState({ nome: "", email: "", telefone: "", endereco: "" });

  useEffect(() => {
    setCart(getCart());
    setMounted(true);
  }, []);

  // Preenche automaticamente com dados da sessão
  useEffect(() => {
    if (session?.user) {
      setForm((prev) => ({
        ...prev,
        nome: prev.nome || session.user.name || "",
        email: prev.email || session.user.email || "",
      }));
    }
  }, [session]);

  const updateQty = (prod_id, delta) => {
    const updated = cart.map((i) => {
      if (i.prod_id === prod_id) {
        const novaQty = i.quantidade + delta;
        return novaQty <= 0 ? null : { ...i, quantidade: novaQty };
      }
      return i;
    }).filter(Boolean);
    setCart(updated);
    saveCart(updated);
  };

  const removeItem = (prod_id) => {
    const updated = cart.filter((i) => i.prod_id !== prod_id);
    setCart(updated);
    saveCart(updated);
  };

  const clearCart = () => {
    setCart([]);
    saveCart([]);
  };

  const subtotal = cart.reduce((acc, i) => acc + i.preco * i.quantidade, 0);
  const frete = subtotal >= 199 ? 0 : 19.90;
  const total = subtotal + frete;

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!form.nome || !form.email) {
      setErro("Preencha nome e email para continuar.");
      return;
    }
    setProcessando(true);
    setErro("");

    try {
      const res = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itens: cart.map((i) => ({ prod_id: i.prod_id, quantidade: i.quantidade })),
          nome: form.nome,
          email: form.email,
          telefone: form.telefone,
          endereco: form.endereco,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.error || "Erro ao processar pedido.");
        return;
      }

      // Sucesso
      clearCart();
      setPedidoOk(data.pedido_id);
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setProcessando(false);
    }
  };

  if (!mounted) {
    return (
      <div className="cart-page">
        <div className="cart-inner">
          <div className="loading-wrapper"><div className="spinner" /></div>
        </div>
      </div>
    );
  }

  if (pedidoOk) {
    return (
      <div className="cart-page">
        <div className="cart-inner">
          <div className="cart-success">
            <div className="cart-success-icon">✅</div>
            <h2>Pedido realizado com sucesso!</h2>
            <p>
              Seu pedido <strong>#{pedidoOk}</strong> foi confirmado.
              Em breve você receberá uma confirmação por email.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/loja" className="btn btn-primary">
                <FiShoppingCart size={15} /> Continuar comprando
              </Link>
              <Link href="/" className="btn btn-ghost">
                <FiArrowLeft size={15} /> Voltar ao início
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-inner">
          <div className="cart-empty">
            <div className="cart-empty-icon">🛒</div>
            <h2>Seu carrinho está vazio</h2>
            <p>Adicione produtos da nossa loja para continuar.</p>
            <Link href="/loja" className="btn btn-primary btn-lg">
              <FiShoppingCart size={16} /> Explorar a Loja
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-inner">
        {/* Header */}
        <div className="cart-header">
          <Link href="/loja" className="btn btn-ghost btn-sm">
            <FiArrowLeft size={14} /> Continuar comprando
          </Link>
          <h1>Carrinho</h1>
          <span className="cart-header-badge">
            {cart.reduce((a, i) => a + i.quantidade, 0)} iten(s)
          </span>
        </div>

        {/* Items */}
        <div>
          <div className="cart-items-card">
            <div className="cart-items-header">
              <h2>Produtos</h2>
              <button className="cart-clear-btn" onClick={clearCart}>
                <FiTrash2 size={12} /> Limpar tudo
              </button>
            </div>

            {cart.map((item) => (
              <div className="cart-item" key={item.prod_id}>
                <div className="cart-item-img">
                  {item.imagem?.startsWith("/") || item.imagem?.startsWith("http") ? (
                    <img src={item.imagem} alt={item.nome} />
                  ) : (
                    <span>{item.imagem || "📦"}</span>
                  )}
                </div>
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.nome}</div>
                  <div className="cart-item-price">
                    R$ {(item.preco * item.quantidade).toFixed(2).replace(".", ",")}
                  </div>
                  <div className="cart-item-unit">
                    R$ {item.preco.toFixed(2).replace(".", ",")} / unidade
                  </div>
                </div>
                <div className="cart-item-actions">
                  <div className="cart-qty-control">
                    <button className="qty-btn" onClick={() => updateQty(item.prod_id, -1)}>−</button>
                    <span className="qty-display">{item.quantidade}</span>
                    <button className="qty-btn" onClick={() => updateQty(item.prod_id, +1)}>+</button>
                  </div>
                  <button className="cart-remove-btn" onClick={() => removeItem(item.prod_id)}>
                    <FiTrash2 size={11} /> Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary + Checkout */}
        <div className="cart-summary">
          <div className="cart-summary-header">Resumo do pedido</div>
          <div className="cart-summary-body">
            <div className="summary-line">
              <span>Subtotal</span>
              <span>R$ {subtotal.toFixed(2).replace(".", ",")}</span>
            </div>
            <div className="summary-line">
              <span>Frete</span>
              <span>{frete === 0 ? "Grátis" : `R$ ${frete.toFixed(2).replace(".", ",")}`}</span>
            </div>
            <div className="summary-line total">
              <span>Total</span>
              <span>R$ {total.toFixed(2).replace(".", ",")}</span>
            </div>

            {subtotal < 199 && (
              <div className="summary-shipping-badge">
                <FiTruck size={12} style={{ marginRight: 4 }} />
                Frete grátis acima de R$ 199,00
                <br />
                <small>Faltam R$ {(199 - subtotal).toFixed(2).replace(".", ",")} para frete grátis</small>
              </div>
            )}
            {frete === 0 && (
              <div className="summary-shipping-badge">
                <FiTruck size={12} style={{ marginRight: 4 }} />
                ✅ Frete grátis aplicado!
              </div>
            )}

            {/* Checkout form */}
            <form className="checkout-form" onSubmit={handleCheckout}>
              <div className="checkout-section-title">Dados para entrega</div>

              <input
                className="checkout-input"
                type="text"
                placeholder="Nome completo *"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                required
              />
              <input
                className="checkout-input"
                type="email"
                placeholder="Email *"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <input
                className="checkout-input"
                type="tel"
                placeholder="Telefone / WhatsApp"
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              />
              <textarea
                className="checkout-input"
                placeholder="Endereço completo (bloco, apto, rua...)"
                rows={3}
                value={form.endereco}
                onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                style={{ resize: "vertical", minHeight: "72px" }}
              />

              {erro && (
                <div className="alert alert-error" style={{ marginTop: 8 }}>
                  ⚠️ {erro}
                </div>
              )}

              <button className="checkout-submit" type="submit" disabled={processando}>
                {processando ? (
                  <>
                    <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                    Processando...
                  </>
                ) : (
                  <>
                    <FiCheck size={16} /> Finalizar Pedido — R$ {total.toFixed(2).replace(".", ",")}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
