"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import "./CSS/noticiasPage.css";
import { ConfirmModal } from "@/components/ConfirmModal";

const ADMINS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());

function PostCard({ noticia, onResolve, emailUsuario }) {
  const { data: session } = useSession();
  const podeResolver =
    emailUsuario &&
    (emailUsuario === noticia.donoEmail ||
      ADMINS.includes(emailUsuario.toLowerCase()));

  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [status, setStatus] = useState(noticia.status);
  const [resolving, setResolving] = useState(false);
  const [modalResolve, setModalResolve] = useState(false);
  const [modalPendencia, setModalPendencia] = useState(false);

  // Menu dos 3 pontinhos
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef(null);

  const [mostrarComentarios, setMostrarComentarios] = useState(false);
  const [comentarios, setComentarios] = useState([]);
  const [novoComentario, setNovoComentario] = useState("");
  const [enviandoCom, setEnviandoCom] = useState(false);
  const [erroCom, setErroCom] = useState("");
  const [carregandoCom, setCarregandoCom] = useState(false);

  const nomeUsuario = session?.user?.name || session?.user?.email || null;

  // Carrega curtidas reais ao montar o card
  useEffect(() => {
    fetch(`/api/curtidas?not_id=${noticia.id}`)
      .then((r) => r.json())
      .then((data) => {
        setLikes(data.total ?? 0);
        setLiked(data.curtiu ?? false);
      })
      .catch(() => {});
  }, [noticia.id]);

  // Fecha o menu ao clicar fora
  useEffect(() => {
    if (!menuAberto) return;
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuAberto(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuAberto]);

  const username = noticia.dono
    ? noticia.dono.toLowerCase().replace(/\s+/g, "_")
    : "mycondpets";

  const avatar = noticia.dono ? noticia.dono[0].toUpperCase() : "M";
  const localizacao = noticia.localizacao || "Condomínio · MyCondPets";

  const handleLike = async () => {
    if (!emailUsuario) return;
    try {
      const res = await fetch("/api/curtidas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ not_id: noticia.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setLiked(data.curtiu);
        setLikes(data.total);
      }
    } catch {}
  };

  const handleAbrirComentarios = async () => {
    const abrir = !mostrarComentarios;
    setMostrarComentarios(abrir);
    if (abrir && comentarios.length === 0) {
      setCarregandoCom(true);
      try {
        const res = await fetch(`/api/comentarios?not_id=${noticia.id}`);
        const data = await res.json();
        setComentarios(data.comentarios || []);
      } catch {}
      setCarregandoCom(false);
    }
  };

  const handleEnviarComentario = async () => {
    if (!novoComentario.trim()) return;
    setErroCom("");
    setEnviandoCom(true);
    try {
      const res = await fetch("/api/comentarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          not_id: noticia.id,
          com_autor: nomeUsuario,
          com_texto: novoComentario.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErroCom(data.error || "Erro ao publicar comentário.");
      } else {
        setComentarios((prev) => [...prev, data.comentario]);
        setNovoComentario("");
      }
    } catch {
      setErroCom("Erro de conexão.");
    }
    setEnviandoCom(false);
  };

  const handleResolverPendencia = async () => {
    setResolving(true);
    try {
      const res = await fetch(`/api/noticias?not_id=${noticia.id}`, { method: "DELETE" });
      if (res.ok) {
        if (onResolve) onResolve(noticia.id, true);
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao remover notícia.");
      }
    } catch {
      alert("Erro ao remover notícia.");
    }
    setResolving(false);
  };

  const handleResolve = async () => {
    setResolving(true);
    try {
      await fetch("/api/noticias", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ not_id: noticia.id, not_status: "resolvido" }),
      });
      setStatus("resolvido");
      if (onResolve) onResolve(noticia.id);
    } catch {
      alert("Erro ao atualizar status.");
    }
    setResolving(false);
  };

  const handleCompartilhar = () => {
    const url = `${window.location.origin}/noticias#post-${noticia.id}`;
    if (navigator.share) {
      navigator.share({ title: noticia.titulo, text: noticia.descricao, url });
    } else {
      navigator.clipboard.writeText(url).then(() => alert("Link copiado!")).catch(() => {});
    }
    setMenuAberto(false);
  };

  const statusLabel = {
    aberto: "Aberto",
    perdido: "Perdido",
    encontrado: "Encontrado",
    resolvido: "Resolvido",
  }[status?.toLowerCase()] || status;

  return (
    <article className="insta-post" id={`post-${noticia.id}`}>
      <div className="insta-post-header">
        <div className="insta-avatar">{avatar}</div>
        <div className="insta-user-info">
          <div className="insta-username">
            <span>{username}</span>
            <span className={`insta-status-dot ${status?.toLowerCase()}`} title={statusLabel} />
          </div>
          <span className="insta-location">{localizacao}</span>
        </div>

        {/* ── MENU 3 PONTINHOS ── */}
        <div className="insta-more-wrap" ref={menuRef}>
          <button
            className="insta-more"
            aria-label="Mais opções"
            onClick={() => setMenuAberto((p) => !p)}
          >
            <span /><span /><span />
          </button>

          {menuAberto && (
            <div className="insta-more-menu">
              <button className="more-menu-item" onClick={handleCompartilhar}>
                🔗 Compartilhar link
              </button>
              {podeResolver && status?.toLowerCase() !== "resolvido" && (
                <button
                  className="more-menu-item"
                  onClick={() => { setModalResolve(true); setMenuAberto(false); }}
                >
                  ✅ Marcar como Resolvido
                </button>
              )}
              {podeResolver && (
                <button
                  className="more-menu-item more-menu-item--danger"
                  onClick={() => { setModalPendencia(true); setMenuAberto(false); }}
                >
                  🗑️ Apagar publicação
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="insta-post-img">
        {noticia.imagem ? (
          <img src={noticia.imagem} alt={noticia.titulo} />
        ) : (
          <div className="insta-img-placeholder">🐾</div>
        )}
        <span className={`insta-badge ${status?.toLowerCase()}`}>{statusLabel}</span>
        {noticia.tipoAnimal && (
          <span className="insta-badge-animal">{noticia.tipoAnimal}</span>
        )}
      </div>

      <div className="insta-actions">
        <div className="insta-actions-left">
          <button
            className={`insta-btn-action ${liked ? "liked" : ""}`}
            onClick={handleLike}
            aria-label="Curtir"
            title={emailUsuario ? "Curtir" : "Faça login para curtir"}
          >
            <svg viewBox="0 0 24 24" width="24" height="24"
              fill={liked ? "#e74c3c" : "none"}
              stroke={liked ? "#e74c3c" : "currentColor"}
              strokeWidth="2"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>

          <button
            className={`insta-btn-action ${mostrarComentarios ? "comentando" : ""}`}
            onClick={handleAbrirComentarios}
            aria-label="Comentar"
          >
            <svg viewBox="0 0 24 24" width="24" height="24"
              fill={mostrarComentarios ? "currentColor" : "none"}
              stroke="currentColor" strokeWidth="2"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="insta-likes">{likes.toLocaleString("pt-BR")} curtidas</div>

      <div className="insta-caption">
        <span className="insta-caption-user">{username}</span>{" "}
        {noticia.titulo}
        {noticia.descricao && (
          <span className="insta-caption-desc"> {noticia.descricao}</span>
        )}
      </div>

      <div className="insta-comments-hint">
        {noticia.contato && noticia.contato !== "Sem contato" ? (
          <>
            <a
              href={`https://wa.me/55${noticia.contato.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="insta-contato-link"
            >
              💬 WhatsApp
            </a>
            <a
              href={`tel:+55${noticia.contato.replace(/\D/g, "")}`}
              className="insta-contato-link"
            >
              📞 Ligar
            </a>
          </>
        ) : (
          <span className="insta-contato-sem">Sem contato informado</span>
        )}
      </div>

      {noticia.data && (
        <div className="insta-date">
          {new Date(noticia.data).toLocaleDateString("pt-BR", {
            day: "numeric", month: "long", year: "numeric",
          })}
        </div>
      )}

      {modalResolve && (
        <ConfirmModal
          titulo="Marcar como Resolvido"
          mensagem="Tem certeza que deseja marcar este post como resolvido? Esta ação não pode ser desfeita."
          tipo="sucesso"
          labelConfirmar="✅ Sim, marcar"
          onConfirm={handleResolve}
          onClose={() => setModalResolve(false)}
        />
      )}

      {modalPendencia && (
        <ConfirmModal
          titulo="Apagar publicação"
          mensagem="Esta ação irá apagar permanentemente esta notícia e todos os comentários e curtidas associados. Deseja continuar?"
          tipo="perigo"
          labelConfirmar="🗑️ Sim, apagar"
          onConfirm={handleResolverPendencia}
          onClose={() => setModalPendencia(false)}
        />
      )}

      {podeResolver && status?.toLowerCase() !== "resolvido" && (
        <div className="insta-resolve-row">
          <button className="btn-resolve" onClick={() => setModalResolve(true)} disabled={resolving}>
            {resolving ? "Salvando..." : "✅ Marcar como Resolvido"}
          </button>
          <button className="btn-resolver-pendencia" onClick={() => setModalPendencia(true)} disabled={resolving}>
            🗑️ Resolver Pendência
          </button>
        </div>
      )}

      {mostrarComentarios && (
        <div className="com-panel">
          {carregandoCom ? (
            <div className="com-vazio">Carregando comentários...</div>
          ) : comentarios.length === 0 ? (
            <div className="com-vazio">Nenhum comentário ainda. Seja o primeiro!</div>
          ) : (
            <div className="com-lista">
              {comentarios.map((c) => (
                <div key={c.com_id} className="com-item">
                  <span className="com-autor">{c.com_autor}</span>
                  <span className="com-texto">{c.com_texto}</span>
                  <span className="com-data">
                    {new Date(c.com_data).toLocaleDateString("pt-BR", {
                      day: "numeric", month: "short",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}

          {nomeUsuario ? (
            <div className="com-form">
              <div className="com-quem">
                Comentando como <strong>{nomeUsuario}</strong>
              </div>
              <div className="com-input-row">
                <input
                  className="com-input"
                  placeholder="Adicione um comentário..."
                  value={novoComentario}
                  onChange={(e) => setNovoComentario(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleEnviarComentario()}
                  maxLength={300}
                />
                <button
                  className="com-btn-publicar"
                  onClick={handleEnviarComentario}
                  disabled={enviandoCom || !novoComentario.trim()}
                >
                  {enviandoCom ? "..." : "Publicar"}
                </button>
              </div>
              {erroCom && <div className="com-erro">{erroCom}</div>}
            </div>
          ) : (
            <div className="com-login-aviso">
              <a href="/login">Faça login</a> para comentar.
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export default function NoticiasFeed({ noticias, emailUsuario }) {
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [lista, setLista] = useState(noticias || []);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);

  const [busca, setBusca] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [resultadosBusca, setResultadosBusca] = useState(null);
  const [erroBusca, setErroBusca] = useState("");

  const handleBusca = async (e) => {
    e.preventDefault();
    if (!busca.trim()) return;
    setErroBusca("");
    setBuscando(true);
    try {
      const res = await fetch(`/api/busca-semantica?q=${encodeURIComponent(busca.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setErroBusca(data.error || "Erro na busca.");
        setResultadosBusca(null);
      } else {
        setResultadosBusca(data.noticias);
      }
    } catch {
      setErroBusca("Erro de conexão.");
    }
    setBuscando(false);
  };

  const limparBusca = () => {
    setBusca("");
    setResultadosBusca(null);
    setErroBusca("");
  };

  const handleResolve = (id, deletar = false) => {
    if (deletar) {
      setLista((prev) => prev.filter((n) => n.id !== id));
    } else {
      setLista((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: "resolvido" } : n))
      );
    }
  };

  const filtradas = lista.filter((n) => {
    const tipo = filtroTipo === "todos" || n.tipoAnimal?.toLowerCase() === filtroTipo;
    const st = filtroStatus === "todos" || n.status?.toLowerCase() === filtroStatus;
    return tipo && st;
  });

  if (!noticias || noticias.length === 0) {
    return (
      <div className="noticias-empty">
        <span className="noticias-empty-icon">🐾</span>
        <h3>Nenhuma publicação ainda</h3>
        <p>Seja o primeiro a publicar sobre um pet perdido ou encontrado.</p>
      </div>
    );
  }

  const filtrosAtivos =
    (filtroTipo !== "todos" ? 1 : 0) + (filtroStatus !== "todos" ? 1 : 0);

  const listaExibida = resultadosBusca ?? filtradas;

  return (
    <>
      <div className="busca-semantica-section">
        <div className="busca-ia-label">✦ Busque por notícias com IA</div>
        <form className="busca-semantica-form" onSubmit={handleBusca}>
          <div className="busca-input-wrap">
            <svg className="busca-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="busca-input"
              type="text"
              placeholder="Ex: cachorro caramelo perdido perto do bloco 3..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              disabled={buscando}
            />
            {busca && (
              <button type="button" className="busca-clear" onClick={limparBusca}>✕</button>
            )}
          </div>
          <button className="busca-btn" type="submit" disabled={buscando || !busca.trim()}>
            {buscando ? <span className="busca-spinner" /> : "✨ Buscar"}
          </button>
        </form>
        <p className="busca-dica">Descreva com suas próprias palavras — a IA entende o contexto</p>
      </div>

      <div className="noticias-feed-inner">
        {erroBusca && <div className="busca-erro">{erroBusca}</div>}

        {resultadosBusca !== null && (
          <div className="busca-resultado-info">
            <span>
              {resultadosBusca.length === 0
                ? "Nenhum resultado encontrado."
                : <><strong>{resultadosBusca.length}</strong> resultado{resultadosBusca.length > 1 ? "s" : ""} para &ldquo;{busca}&rdquo;</>}
            </span>
            <button className="busca-voltar" onClick={limparBusca}>← Ver todos</button>
          </div>
        )}

        {resultadosBusca === null && (
          <>
            <div className="filtros-bar">
              <button
                className={`btn-filtros ${filtrosAtivos > 0 ? "com-filtros" : ""}`}
                onClick={() => setFiltrosAbertos((p) => !p)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                  <line x1="11" y1="18" x2="13" y2="18" />
                </svg>
                Filtrar
                {filtrosAtivos > 0 && <span className="filtros-badge">{filtrosAtivos}</span>}
                <svg className={`filtros-chevron ${filtrosAbertos ? "aberto" : ""}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>

            {filtrosAbertos && (
              <div className="noticias-filtros">
                <div className="filtro-grupo">
                  <label>Animal</label>
                  <div className="filtro-chips">
                    {["todos", "cachorro", "gato", "outro"].map((t) => (
                      <button key={t} className={`chip ${filtroTipo === t ? "ativo" : ""}`} onClick={() => setFiltroTipo(t)}>
                        {t === "todos" ? "Todos" : t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="filtro-grupo">
                  <label>Status</label>
                  <div className="filtro-chips">
                    {[
                      { val: "todos", label: "Todos" },
                      { val: "perdido", label: "Perdidos" },
                      { val: "encontrado", label: "Encontrados" },
                      { val: "resolvido", label: "Resolvidos" },
                    ].map(({ val, label }) => (
                      <button key={val} className={`chip ${filtroStatus === val ? "ativo" : ""}`} onClick={() => setFiltroStatus(val)}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                {filtrosAtivos > 0 && (
                  <button className="chip limpar" onClick={() => { setFiltroTipo("todos"); setFiltroStatus("todos"); }}>
                    ✕ Limpar filtros
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {listaExibida.length === 0 ? (
          <div className="noticias-empty">
            <span className="noticias-empty-icon">🔍</span>
            <h3>
              {resultadosBusca !== null
                ? "Nenhum resultado encontrado para essa busca."
                : "Nenhum resultado para estes filtros"}
            </h3>
          </div>
        ) : (
          <div className="noticias-feed">
            {listaExibida.map((noticia) => (
              <PostCard key={noticia.id} noticia={noticia} onResolve={handleResolve} emailUsuario={emailUsuario} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
