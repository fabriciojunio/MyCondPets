"use client";
import { useEffect, useState } from "react";
import "./styles.css";

export default function DetalhesPets() {
  const [pets, setPets] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedPet, setSelectedPet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPets() {
      try {
        const res = await fetch("/api/detalhesPets");
        const data = await res.json();
        setPets(data);
        if (data.length > 0) setSelectedPet(data[0]);
      } catch (err) {
        console.error("Erro ao carregar pets", err);
      } finally {
        setLoading(false);
      }
    }
    loadPets();
  }, []);

  if (loading) {
    return (
      <div className="pets-loading">
        <i className="fa-solid fa-paw fa-spin"></i> Carregando pets...
      </div>
    );
  }

  const filteredPets = pets.filter((p) =>
    p.nome.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pets-page">
      {/* Header */}
      <div className="pets-page-header">
        <div className="pets-page-title">
          <i className="fa-solid fa-paw" style={{ fontSize: 20, color: "var(--primary)" }}></i>
          <h1>Pets do Condomínio</h1>
          <span className="pets-count-badge">{pets.length}</span>
        </div>
      </div>

      <div className="pets-layout">
        {/* Detail panel */}
        <div className="pet-detail-card">
          {selectedPet ? (
            <>
              <div className="pet-detail-header">
                <div className="pet-avatar">
                  <i className="fa-solid fa-paw"></i>
                </div>
                <div>
                  <h2 className="pet-name">{selectedPet.nome}</h2>
                  <div className="pet-badges">
                    {selectedPet.raca && <span className="pet-badge"><i className="fa-solid fa-dna"></i> {selectedPet.raca}</span>}
                    {selectedPet.idade && <span className="pet-badge"><i className="fa-solid fa-cake-candles"></i> {selectedPet.idade}</span>}
                    {selectedPet.cor && <span className="pet-badge"><i className="fa-solid fa-palette"></i> {selectedPet.cor}</span>}
                  </div>
                </div>
              </div>

              <div className="pet-info-sections">
                {/* Pet info */}
                <div className="pet-info-section">
                  <div className="pet-section-title">Informações do Pet</div>

                  <div className="pet-info-row">
                    <div className="pet-info-icon"><i className="fa-solid fa-dna"></i></div>
                    <div className="pet-info-content">
                      <div className="pet-info-label">Raça</div>
                      <div className="pet-info-value">{selectedPet.raca || "—"}</div>
                    </div>
                  </div>

                  <div className="pet-info-row">
                    <div className="pet-info-icon"><i className="fa-solid fa-cake-candles"></i></div>
                    <div className="pet-info-content">
                      <div className="pet-info-label">Idade</div>
                      <div className="pet-info-value">{selectedPet.idade || "—"}</div>
                    </div>
                  </div>

                  <div className="pet-info-row">
                    <div className="pet-info-icon"><i className="fa-solid fa-palette"></i></div>
                    <div className="pet-info-content">
                      <div className="pet-info-label">Cor</div>
                      <div className="pet-info-value">{selectedPet.cor || "—"}</div>
                    </div>
                  </div>
                </div>

                {/* Owner info */}
                <div className="pet-info-section">
                  <div className="pet-section-title">Informações do Dono</div>

                  <div className="pet-info-row">
                    <div className="pet-info-icon"><i className="fa-solid fa-user"></i></div>
                    <div className="pet-info-content">
                      <div className="pet-info-label">Nome</div>
                      <div className="pet-info-value">{selectedPet.dono || "—"}</div>
                    </div>
                  </div>

                  <div className="pet-info-row">
                    <div className="pet-info-icon"><i className="fa-solid fa-building"></i></div>
                    <div className="pet-info-content">
                      <div className="pet-info-label">Endereço</div>
                      <div className="pet-info-value">
                        {selectedPet.endereco ? `${selectedPet.endereco}, Nº ${selectedPet.num}` : "—"}
                      </div>
                    </div>
                  </div>

                  <div className="pet-info-row">
                    <div className="pet-info-icon"><i className="fa-solid fa-phone"></i></div>
                    <div className="pet-info-content">
                      <div className="pet-info-label">Telefone</div>
                      <div className="pet-info-value">{selectedPet.telefone || "—"}</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="pet-empty-state">
              <i className="fa-solid fa-paw"></i>
              <p>Nenhum pet cadastrado no condomínio.</p>
            </div>
          )}
        </div>

        {/* Sidebar search */}
        <div className="pets-sidebar">
          <div className="sidebar-header">
            <i className="fa-solid fa-magnifying-glass" style={{ color: "var(--primary)" }}></i>
            Pesquisar pet
          </div>
          <div className="sidebar-search">
            <input
              className="sidebar-search-input"
              type="text"
              placeholder="Nome do pet..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="sidebar-results">
            {filteredPets.length === 0 ? (
              <div className="sidebar-empty">Nenhum pet encontrado</div>
            ) : (
              filteredPets.map((p) => (
                <div
                  key={p.nome}
                  className={`sidebar-result-item ${selectedPet?.nome === p.nome ? "active" : ""}`}
                  onClick={() => { setSelectedPet(p); setSearch(""); }}
                >
                  <div className="sidebar-result-name">
                    <i className="fa-solid fa-paw" style={{ marginRight: 6, fontSize: 11, color: "var(--primary)" }}></i>
                    {p.nome}
                  </div>
                  <div className="sidebar-result-address">{p.endereco}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
