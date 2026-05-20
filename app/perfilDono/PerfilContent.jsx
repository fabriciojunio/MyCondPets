"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { PetsList } from "./PetsList";

export function PerfilContent({ dono, pets, residencia }) {
  const { data: session, update: updateSession } = useSession();

  const perfilCompleto = session?.user?.perfilCompleto;

  const [editando, setEditando] = useState(!perfilCompleto); // Já inicia editando se perfil incompleto
  const [salvando, setSalvando] = useState(false);
  const [toast, setToast] = useState(null); // { tipo: "sucesso" | "erro" | "aviso", mensagem: "" }

  function mostrarToast(tipo, mensagem) {
    setToast({ tipo, mensagem });
    setTimeout(() => setToast(null), 4000);
  }
  
  // Dados do dono
  const [nome, setNome] = useState(dono.don_nome || "");
  const [contato, setContato] = useState(dono.don_contato || "");
  
  // Dados da residência
  const [complemento, setComplemento] = useState(residencia?.res_complemento || "");
  const [numero, setNumero] = useState(residencia?.res_numero || "");
  const [cep, setCep] = useState(residencia?.res_cep || "");

  // Valores originais para cancelar
  const [nomeOriginal] = useState(dono.don_nome || "");
  const [contatoOriginal] = useState(dono.don_contato || "");
  const [complementoOriginal] = useState(residencia?.res_complemento || "");
  const [numeroOriginal] = useState(residencia?.res_numero || "");
  const [cepOriginal] = useState(residencia?.res_cep || "");

  function cancelarEdicao() {
    if (!perfilCompleto) {
      mostrarToast("aviso", "Você precisa preencher todos os campos obrigatórios para continuar.");
      return;
    }
    
    setNome(nomeOriginal);
    setContato(contatoOriginal);
    setComplemento(complementoOriginal);
    setNumero(numeroOriginal);
    setCep(cepOriginal);
    setEditando(false);
  }

  function formatarCep(valor) {
    // Remove tudo que não é número
    const numeros = valor.replace(/\D/g, "");
    // Aplica máscara 00000-000
    if (numeros.length <= 5) {
      return numeros;
    }
    return `${numeros.slice(0, 5)}-${numeros.slice(5, 8)}`;
  }

  function formatarContato(valor) {
    // Remove tudo que não é número
    const numeros = valor.replace(/\D/g, "");
    // Aplica máscara (00) 00000-0000
    if (numeros.length <= 2) {
      return numeros;
    }
    if (numeros.length <= 7) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    }
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
  }

  async function salvarAlteracoes() {
    // Validações
    if (!nome.trim()) {
      mostrarToast("aviso", "O nome é obrigatório.");
      return;
    }
    if (!contato.trim()) {
      mostrarToast("aviso", "O contato é obrigatório.");
      return;
    }
    if (!complemento.trim()) {
      mostrarToast("aviso", "O complemento (bloco/apartamento) é obrigatório.");
      return;
    }
    if (!numero) {
      mostrarToast("aviso", "O número do apartamento é obrigatório.");
      return;
    }
    if (!cep.trim() || cep.replace(/\D/g, "").length < 8) {
      mostrarToast("aviso", "O CEP é obrigatório e deve ter 8 dígitos.");
      return;
    }

    setSalvando(true);

    try {
      const res = await fetch("/api/perfil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: session?.user?.email,
          nome,
          contato: contato.replace(/\D/g, ""),
          complemento,
          numero: parseInt(numero),
          cep: cep.replace(/\D/g, ""),
          residenciaId: residencia?.res_id
        }),
      });

      const contentType = res.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");

      if (!res.ok) {
        let mensagemErro = "Erro ao salvar. Tente novamente.";
        if (isJson) {
          const error = await res.json();
          mensagemErro = error.message || mensagemErro;
        }
        mostrarToast("erro", mensagemErro);
        return;
      }

      mostrarToast("sucesso", "Perfil atualizado com sucesso!");
      setEditando(false);
      await updateSession();
    } catch {
      mostrarToast("erro", "Não foi possível conectar ao servidor. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  const toastCores = {
    sucesso: { bg: "#22c55e", icon: "fa-circle-check" },
    erro:    { bg: "#ef4444", icon: "fa-circle-xmark" },
    aviso:   { bg: "#f59e0b", icon: "fa-triangle-exclamation" },
  };

  return (
    <main className="content">
      {toast && (
        <div style={{
          position: "fixed", top: "24px", right: "24px", zIndex: 9999,
          background: toastCores[toast.tipo].bg,
          color: "#fff", padding: "14px 20px", borderRadius: "10px",
          display: "flex", alignItems: "center", gap: "10px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
          fontSize: "0.95rem", maxWidth: "360px",
          animation: "slideIn 0.3s ease"
        }}>
          <i className={`fa-solid ${toastCores[toast.tipo].icon}`}></i>
          {toast.mensagem}
        </div>
      )}
      <div className="image-container">
        <img src="../images/pet11.jpg" className="pets-image" alt="Pet" />
      </div>

      <section className="contentInfos">
        <h1 className="title">
          <i className="fa-solid fa-user"></i> Meu Perfil
        </h1>

        {!perfilCompleto && (
          <div className="aviso-completar-perfil">
            <i className="fa-solid fa-circle-exclamation"></i>
            <p>
              <strong>Bem-vindo!</strong> Para continuar usando o sistema, 
              por favor preencha todos os campos obrigatórios abaixo.
            </p>
          </div>
        )}

        <div className="acoes-perfil">
          {!editando ? (
            <button className="btn-editar" onClick={() => setEditando(true)}>
              <i className="fa-solid fa-pen"></i> Editar Perfil
            </button>
          ) : (
            <div className="btns-edicao">
              <button 
                className="btn-salvar" 
                onClick={salvarAlteracoes}
                disabled={salvando}
              >
                <i className="fa-solid fa-check"></i> 
                {salvando ? "Salvando..." : "Salvar"}
              </button>
              {perfilCompleto && (
                <button 
                  className="btn-cancelar" 
                  onClick={cancelarEdicao}
                  disabled={salvando}
                >
                  <i className="fa-solid fa-xmark"></i> Cancelar
                </button>
              )}
            </div>
          )}
        </div>

        <div className="infos">
          {/* Dados Pessoais */}
          <div className="secao-info">
            <h2 className="secao-titulo">Dados Pessoais</h2>
            
            <div className="label-info">
              <label>Nome <span className="obrigatorio">*</span></label>
              <input 
                type="text" 
                value={nome} 
                onChange={(e) => setNome(e.target.value)}
                disabled={!editando}
                className={editando ? "input-editando" : ""}
                placeholder="Seu nome completo"
              />
            </div>
            
            <div className="label-info">
              <label>E-mail</label>
              <input type="text" value={dono.don_email || ""} disabled />
              <small className="hint">E-mail não pode ser alterado</small>
            </div>
            
            <div className="label-info">
              <label>Contato <span className="obrigatorio">*</span></label>
              <input 
                type="text" 
                value={contato}
                onChange={(e) => setContato(formatarContato(e.target.value))}
                disabled={!editando}
                className={editando ? "input-editando" : ""}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>
          </div>

          {/* Dados da Residência */}
          <div className="secao-info">
            <h2 className="secao-titulo">Dados da Residência</h2>
            
            <div className="label-info">
              <label>Bloco / Apartamento <span className="obrigatorio">*</span></label>
              <input
                type="text"
                value={complemento}
                onChange={(e) => setComplemento(e.target.value)}
                disabled={!editando}
                className={editando ? "input-editando" : ""}
                placeholder="Ex: Bloco A, Apt 101"
              />
            </div>
            
            <div className="label-info">
              <label>Número <span className="obrigatorio">*</span></label>
              <input
                type="number"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                disabled={!editando}
                className={editando ? "input-editando" : ""}
                placeholder="Número do apartamento"
                min="1"
              />
            </div>
            
            <div className="label-info">
              <label>CEP <span className="obrigatorio">*</span></label>
              <input
                type="text"
                value={cep}
                onChange={(e) => setCep(formatarCep(e.target.value))}
                disabled={!editando}
                className={editando ? "input-editando" : ""}
                placeholder="00000-000"
                maxLength={9}
              />
            </div>
          </div>
        </div>

        <section className="meus-pets">
          <div className="titulo-pets">
            <h2>Meus Pets</h2>
          </div>

          <div className="lista-pets">
            <PetsList pets={pets} donoCpf={dono.don_cpf} />
          </div>

          <div className="add-pet">
            <Link href="/cadastropet">
              <button className="btn-add">
                <i className="fa-solid fa-circle-plus"></i>
              </button>
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}