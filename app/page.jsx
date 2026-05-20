import * as React from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/authOptions";
import "./styles.css";

const features = [
  {
    icon: "🐾",
    color: "#D6EAF8",
    title: "Cadastro de Pets",
    desc: "Registre todos os animais do condomínio com foto, raça, porte e informações do responsável."
  },
  {
    icon: "🚨",
    color: "#FDEDEC",
    title: "Alertas de Pets Perdidos",
    desc: "Sistema de notificação instantânea para todos os moradores quando um pet some ou é encontrado."
  },
  {
    icon: "🛒",
    color: "#FEF9E7",
    title: "Loja com Busca Inteligente",
    desc: "E-commerce com IA — pesquise por 'coleira azul com bolinhas' e encontre exatamente o que precisa."
  },
  {
    icon: "📰",
    color: "#D5F5E3",
    title: "Comunicados & Notícias",
    desc: "Central de avisos do condomínio sobre pets, eventos, regras e comunicados da administração."
  },
  {
    icon: "🏠",
    color: "#EBF5FB",
    title: "Controle por Apartamento",
    desc: "Saiba quais unidades têm pets, quantos animais por apartamento e os dados dos proprietários."
  },
  {
    icon: "🤖",
    color: "#F4ECF7",
    title: "Assistente Virtual IA",
    desc: "Chatbot inteligente disponível 24h para tirar dúvidas e guiar moradores e administradores."
  }
];

const previewProducts = [
  { id: 1, emoji: "🦮", cat: "Coleiras", name: "Coleira Nylon Premium", price: "R$ 39,90" },
  { id: 2, emoji: "🎾", cat: "Brinquedos", name: "Kit 3 Bolas de Tênis", price: "R$ 24,90" },
  { id: 3, emoji: "🛏️", cat: "Camas", name: "Cama Ortopédica P/M", price: "R$ 189,90" },
  { id: 4, emoji: "🍖", cat: "Petiscos", name: "Snack Natural Frango", price: "R$ 32,90" },
];

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <main>
      {/* ===== HERO ===== */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-text">
            <div className="hero-eyebrow">
              <span className="hero-eyebrow-dot" />
              Plataforma Nº1 em Condomínios
            </div>
            <h1 className="hero-title">
              Gerencie os pets do seu <span>condomínio</span> com facilidade
            </h1>
            <p className="hero-desc">
              Cadastro de animais, alertas de pets perdidos, loja com busca por IA e muito mais.
              Tudo em um só lugar, para deixar seu condomínio mais seguro e organizado.
            </p>
            <div className="hero-cta">
              {session ? (
                <>
                  <Link href="/noticias" className="hero-btn-primary">
                    🐾 Ver Pets Perdidos →
                  </Link>
                  <Link href="/perfilDono" className="hero-btn-secondary">
                    👤 Ver meu Perfil
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" className="hero-btn-primary">
                    Começar agora →
                  </Link>
                  <Link href="/loja" className="hero-btn-secondary">
                    🛒 Visitar a Loja
                  </Link>
                </>
              )}
            </div>
            <div className="hero-stats">
              <div>
                <div className="hero-stat-num">500+</div>
                <div className="hero-stat-label">Pets cadastrados</div>
              </div>
              <div>
                <div className="hero-stat-num">120+</div>
                <div className="hero-stat-label">Condomínios</div>
              </div>
              <div>
                <div className="hero-stat-num">98%</div>
                <div className="hero-stat-label">Satisfação</div>
              </div>
            </div>
          </div>
          <div className="hero-img-wrap">
            <div className="hero-img-circle">
              <img src="/images/pet1.jpg" alt="Pet feliz no condomínio" />
            </div>
            <div className="hero-img-badge">
              <div className="hero-img-badge-icon">🐾</div>
              <div>
                <div className="hero-img-badge-text">Pet Seguro</div>
                <div className="hero-img-badge-sub">Sistema ativo</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="features">
        <div className="features-inner">
          <div className="features-header">
            <div className="features-tag">Funcionalidades</div>
            <h2 className="features-title">Tudo que você precisa para gerir os pets</h2>
            <p className="features-subtitle">
              Uma plataforma completa pensada para síndicos, moradores e a segurança dos animais.
            </p>
          </div>
          <div className="features-grid">
            {features.map((f, i) => (
              <div className="feature-card" key={i}>
                <div className="feature-icon" style={{ background: f.color }}>
                  {f.icon}
                </div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== STORE PREVIEW ===== */}
      <section className="store-preview">
        <div className="store-preview-inner">
          <div className="store-preview-header">
            <div>
              <div className="features-tag">Loja</div>
              <h2 className="features-title" style={{ marginBottom: 0 }}>
                Produtos para o seu pet
              </h2>
            </div>
            <Link href="/loja" className="btn btn-primary btn-sm">
              Ver tudo na loja →
            </Link>
          </div>
          <div className="store-preview-products">
            {previewProducts.map((p) => (
              <Link href="/loja" key={p.id} className="preview-card" style={{ textDecoration: "none" }}>
                <div className="preview-card-img">{p.emoji}</div>
                <div className="preview-card-body">
                  <div className="preview-card-cat">{p.cat}</div>
                  <div className="preview-card-name">{p.name}</div>
                  <div className="preview-card-price">{p.price}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA — só para visitantes ===== */}
      {!session && (
        <section className="cta-banner">
          <div className="cta-banner-inner">
            <h2>Comece a usar gratuitamente</h2>
            <p>
              Cadastre-se com Google, complete seu perfil e tenha acesso imediato
              a todas as funcionalidades da plataforma.
            </p>
            <div className="cta-banner-btns">
              <Link href="/login" className="cta-banner-btn cta-banner-btn--white">
                🚀 Criar conta grátis
              </Link>
              <Link href="/loja" className="cta-banner-btn cta-banner-btn--outline">
                🛒 Explorar a Loja
              </Link>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
