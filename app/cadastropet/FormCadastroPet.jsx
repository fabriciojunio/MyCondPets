"use client";

import { useState, useRef } from "react";
import { FaPaw, FaBone, FaCalendar, FaVenusMars, FaArrowsUpDownLeftRight, FaCamera, FaCheck, FaSyringe, FaHeart, FaPlus, FaTrash } from "react-icons/fa6";
import { cadastrarPet } from "./actions";

const TIPOS_VACINA = ["V8", "V10", "Antirrábica", "Giardíase", "Bordetella", "Leishmaniose", "Outra"];

export default function FormCadastroPet({ donoId }) {
  // Etapa atual: 1 = dados básicos, 2 = saúde
  const [etapa, setEtapa] = useState(1);
  const [petIdCriado, setPetIdCriado] = useState(null);

  // Etapa 1
  const [preview, setPreview] = useState(null);
  const [fotoBase64, setFotoBase64] = useState(null);
  const [especie, setEspecie] = useState("");
  const [racas, setRacas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const formRef = useRef(null);

  // Etapa 2 — Saúde
  const [doencas, setDoencas] = useState("");
  const [contagiosas, setContagiosas] = useState("");
  const [alergias, setAlergias] = useState("");
  const [medicacao, setMedicacao] = useState("");
  const [comportamento, setComportamento] = useState("");

  // Vacinas
  const [vacinas, setVacinas] = useState([{ tipo: "", dataAplicacao: "", dataVencimento: "", carteira: null, carteiraPreview: null }]);
  const [salvandoSaude, setSalvandoSaude] = useState(false);
  const [concluido, setConcluido] = useState(false);

  const racasPorEspecie = {
    Cachorro: ["Labrador Retriever", "Golden Retriever", "Poodle", "Beagle", "Bulldog", "Pastor Alemão", "Outros"],
    Gato: ["Persa", "Siamês", "Angorá", "Bengal", "Maine Coon", "Ragdoll", "Outros"]
  };

  const handleEspecieChange = (e) => {
    const especieSel = e.target.value;
    setEspecie(especieSel);
    setRacas(racasPorEspecie[especieSel] || []);
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target.result);
      setFotoBase64(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Etapa 1 — cadastrar dados básicos
  const handleSubmitEtapa1 = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensagem(null);

    try {
      const formData = new FormData(e.target);
      formData.append("don_id", donoId);
      if (fotoBase64) formData.set("foto-base64", fotoBase64);

      const resultado = await cadastrarPet(formData);

      if (resultado.success) {
        setPetIdCriado(resultado.petId);
        setEtapa(2);
      } else {
        setMensagem({ tipo: "erro", texto: resultado.message });
      }
    } catch (error) {
      setMensagem({ tipo: "erro", texto: `Erro: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  // Vacinas helpers
  const addVacina = () => setVacinas(prev => [...prev, { tipo: "", dataAplicacao: "", dataVencimento: "", carteira: null, carteiraPreview: null }]);
  const removeVacina = (i) => setVacinas(prev => prev.filter((_, idx) => idx !== i));
  const updateVacina = (i, field, value) => setVacinas(prev => prev.map((v, idx) => idx === i ? { ...v, [field]: value } : v));
  const handleCarteiraChange = (i, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => updateVacina(i, "carteiraPreview", ev.target.result);
    reader.readAsDataURL(file);
    updateVacina(i, "carteira", file);
  };

  // Etapa 2 — salvar saúde
  const handleSubmitEtapa2 = async (e) => {
    e.preventDefault();

    // Valida vacinas preenchidas
    const vacinasValidas = vacinas.filter(v => v.tipo && v.dataAplicacao && v.dataVencimento);
    if (vacinasValidas.length === 0) {
      setMensagem({ tipo: "erro", texto: "Adicione pelo menos uma vacina com tipo, data de aplicação e vencimento." });
      return;
    }

    setSalvandoSaude(true);
    setMensagem(null);

    try {
      // Salvar saúde
      await fetch("/api/saude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pet_id: petIdCriado,
          sau_doencas: doencas,
          sau_contagiosas: contagiosas,
          sau_alergias: alergias,
          sau_medicacao: medicacao,
          sau_comportamento: comportamento,
        }),
      });

      // Salvar cada vacina
      for (const v of vacinasValidas) {
        let carteiraBase64 = null;
        if (v.carteira) {
          carteiraBase64 = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = ev => resolve(ev.target.result);
            reader.readAsDataURL(v.carteira);
          });
        }
        await fetch("/api/vacinacao", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pet_id: petIdCriado,
            vac_tipo: v.tipo,
            vac_data_aplicacao: v.dataAplicacao,
            vac_data_vencimento: v.dataVencimento,
            vac_carteira: carteiraBase64,
          }),
        });
      }

      setConcluido(true);
    } catch (error) {
      setMensagem({ tipo: "erro", texto: `Erro ao salvar saúde: ${error.message}` });
    } finally {
      setSalvandoSaude(false);
    }
  };

  // Sucesso final
  if (concluido) {
    return (
      <div className="saude-sucesso">
        <div className="saude-sucesso-icon">🐾</div>
        <h2>Pet cadastrado com sucesso!</h2>
        <p>Dados de saúde e vacinação salvos.</p>
        <a href="/perfilDono" className="btn azul">Ver meu perfil</a>
      </div>
    );
  }

  return (
    <div className="form-etapas">
      {/* Steps indicator */}
      <div className="steps-bar">
        <div className={`step ${etapa >= 1 ? "active" : ""} ${etapa > 1 ? "done" : ""}`}>
          <span className="step-num">1</span>
          <span className="step-label">Dados do Pet</span>
        </div>
        <div className="step-line" />
        <div className={`step ${etapa >= 2 ? "active" : ""}`}>
          <span className="step-num"><FaSyringe size={14} /></span>
          <span className="step-label">Saúde <span className="obrig-tag">Obrigatório</span></span>
        </div>
      </div>

      {mensagem && (
        <div className={`mensagem ${mensagem.tipo}`}>{mensagem.texto}</div>
      )}

      {/* ═══════════════ ETAPA 1 ═══════════════ */}
      {etapa === 1 && (
        <div key="etapa1" className="etapa-anim">
        <form onSubmit={handleSubmitEtapa1} ref={formRef}>
          <div className="form-grid">
            <div className="campo">
              <label htmlFor="nome-pet"><FaPaw /> Nome do Pet *</label>
              <input type="text" id="nome-pet" name="nome-pet" placeholder="Ex: Rex" required disabled={loading} />
            </div>

            <div className="campo">
              <label htmlFor="especie"><FaPaw /> Espécie *</label>
              <select id="especie" name="especie" required onChange={handleEspecieChange} disabled={loading}>
                <option value="">Selecione...</option>
                <option value="Cachorro">Cachorro</option>
                <option value="Gato">Gato</option>
              </select>
            </div>

            <div className="campo">
              <label htmlFor="raca"><FaBone /> Raça *</label>
              <select id="raca" name="raca" required disabled={!racas.length || loading}>
                <option value="">Selecione...</option>
                {racas.map((r, i) => <option key={i} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="campo">
              <label htmlFor="data-nascimento"><FaCalendar /> Data de Nascimento Estimada *</label>
              <input type="date" id="data-nascimento" name="data-nascimento" required
                min="2000-01-01" max={new Date().toISOString().split("T")[0]} disabled={loading} />
            </div>

            <div className="campo">
              <label><FaVenusMars /> Sexo *</label>
              <div className="opcoes-sexo">
                <label><input type="radio" name="sexo" value="macho" required disabled={loading} /> Macho</label>
                <label><input type="radio" name="sexo" value="femea" disabled={loading} /> Fêmea</label>
              </div>
            </div>

            <div className="campo">
              <label><FaArrowsUpDownLeftRight /> Porte *</label>
              <div className="opcoes-porte">
                <label><input type="radio" name="porte" value="pequeno" required disabled={loading} /> Pequeno</label>
                <label><input type="radio" name="porte" value="medio" disabled={loading} /> Médio</label>
                <label><input type="radio" name="porte" value="grande" disabled={loading} /> Grande</label>
              </div>
            </div>

            <div className="campo campo-full">
              <label><FaCamera /> Foto do Pet</label>
              <label className="btn-foto-upload" htmlFor="foto-pet-input">
                <FaCamera /> {preview ? "Trocar foto" : "Selecionar foto"}
              </label>
              <input type="file" id="foto-pet-input" name="foto-pet" accept="image/*"
                onChange={handleFotoChange} disabled={loading} style={{ display: "none" }} />
              {preview && <img src={preview} alt="Preview" className="foto-preview-img" loading="lazy" />}
            </div>
          </div>

          <div className="aviso-etapa2">
            💉 Na próxima etapa você preencherá as informações de <strong>saúde e vacinação</strong> (obrigatório).
          </div>

          <div className="botoes">
            <button type="submit" className="btn azul" disabled={loading}>
              <FaCheck /> {loading ? "Salvando..." : "Continuar →"}
            </button>
          </div>
        </form>
        </div>
      )}

      {/* ═══════════════ ETAPA 2 — SAÚDE ═══════════════ */}
      {etapa === 2 && (
        <div key="etapa2" className="etapa-anim">
        <form onSubmit={handleSubmitEtapa2}>
          {/* Vacinas */}
          <div className="saude-section">
            <h3 className="saude-titulo"><FaSyringe /> Vacinação <span className="obrig-tag">Obrigatório</span></h3>
            <p className="saude-hint">Adicione pelo menos uma vacina.</p>

            {vacinas.map((v, i) => (
              <div key={i} className="vacina-card">
                <div className="vacina-header">
                  <span>Vacina {i + 1}</span>
                  {vacinas.length > 1 && (
                    <button type="button" className="btn-remove-vacina" onClick={() => removeVacina(i)}>
                      <FaTrash size={12} /> Remover
                    </button>
                  )}
                </div>
                <div className="vacina-grid">
                  <div className="campo">
                    <label>Tipo de Vacina *</label>
                    <select value={v.tipo} onChange={e => updateVacina(i, "tipo", e.target.value)} required>
                      <option value="">Selecione...</option>
                      {TIPOS_VACINA.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="campo">
                    <label>Data de Aplicação *</label>
                    <input type="date" value={v.dataAplicacao}
                      onChange={e => updateVacina(i, "dataAplicacao", e.target.value)}
                      max={new Date().toISOString().split("T")[0]} required />
                  </div>
                  <div className="campo">
                    <label>Data de Vencimento *</label>
                    <input type="date" value={v.dataVencimento}
                      onChange={e => updateVacina(i, "dataVencimento", e.target.value)} required />
                  </div>
                  <div className="campo">
                    <label>Carteira de Vacinação (foto/PDF)</label>
                    <div className="carteira-upload-area">
                      <label className="carteira-upload-label" htmlFor={`carteira-${i}`}>
                        <i className="fa-solid fa-camera"></i>
                        <span>{v.carteiraPreview ? "Trocar foto" : "Anexar carteira"}</span>
                        <small>Foto ou PDF</small>
                      </label>
                      <input type="file" id={`carteira-${i}`} accept="image/*,application/pdf"
                        onChange={e => handleCarteiraChange(i, e.target.files[0])}
                        style={{ display: "none" }} />
                    </div>
                    {v.carteiraPreview && (
                      <div className="carteira-preview-wrap">
                        <img src={v.carteiraPreview} alt="Carteira" className="carteira-preview" loading="lazy" />
                        <label className="carteira-troca" htmlFor={`carteira-${i}`}>
                          <i className="fa-solid fa-arrows-rotate"></i> Trocar imagem
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <button type="button" className="btn-add-vacina" onClick={addVacina}>
              <FaPlus /> Adicionar outra vacina
            </button>
          </div>

          {/* Saúde geral */}
          <div className="saude-section">
            <h3 className="saude-titulo"><FaHeart /> Saúde Geral</h3>

            <div className="form-grid">
              <div className="campo">
                <label>Doenças Pré-existentes</label>
                <textarea rows={3} placeholder="Ex: Displasia, Diabetes..." value={doencas} onChange={e => setDoencas(e.target.value)} />
              </div>
              <div className="campo">
                <label>Doenças Contagiosas ⚠️</label>
                <textarea rows={3} placeholder="Ex: Leishmaniose, Cinomose..." value={contagiosas} onChange={e => setContagiosas(e.target.value)} />
              </div>
              <div className="campo">
                <label>Alergias</label>
                <textarea rows={3} placeholder="Ex: Alergia a frango, ácaros..." value={alergias} onChange={e => setAlergias(e.target.value)} />
              </div>
              <div className="campo">
                <label>Medicação Contínua</label>
                <textarea rows={3} placeholder="Ex: Apoquel 8mg 1x ao dia..." value={medicacao} onChange={e => setMedicacao(e.target.value)} />
              </div>
              <div className="campo campo-full">
                <label>Comportamento</label>
                <textarea rows={2} placeholder="Ex: Agitado com estranhos, brincalhão..." value={comportamento} onChange={e => setComportamento(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="botoes">
            <button type="submit" className="btn azul" disabled={salvandoSaude}>
              <FaCheck /> {salvandoSaude ? "Salvando..." : "Concluir Cadastro"}
            </button>
          </div>
        </form>
        </div>
      )}
    </div>
  );
}
