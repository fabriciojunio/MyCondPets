"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import "./css/telaInicial.css";

export default function TelaInicialCond() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/dashboard");
      if (!response.ok) throw new Error("Erro ao carregar dados");
      const json = await response.json();
      setData({
        totalPets: json.petsCadastrados,
        petsLost: json.petsPerdidos,
        totalOwners: json.donosCadastrados,
        apartmentsWithPets: json.aptosComPets,
      });
    } catch (err) {
      setError(err.message);
      setData({ totalPets: 0, petsLost: 0, totalOwners: 0, apartmentsWithPets: 0 });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="dashboard-spinner"></div>
        <span>Carregando dashboard...</span>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-title">
          <i className="fa-solid fa-chart-line" style={{ fontSize: 20, color: "var(--primary)" }}></i>
          <div>
            <h1>Dashboard</h1>
            <div className="dashboard-subtitle">Visão geral do condomínio</div>
          </div>
        </div>
        <button className="dashboard-refresh-btn" onClick={loadData}>
          <i className="fa-solid fa-arrows-rotate"></i> Atualizar
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card stat-card-teal">
          <div className="stat-card-icon">
            <i className="fa-solid fa-paw"></i>
          </div>
          <div className="stat-card-value">{data.totalPets}</div>
          <div className="stat-card-label">Pets cadastrados</div>
        </div>

        <div className="stat-card stat-card-red">
          {data.petsLost > 0 && (
            <div className="stat-card-alert">
              <i className="fa-solid fa-exclamation"></i>
            </div>
          )}
          <div className="stat-card-icon">
            <i className="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div className="stat-card-value">{data.petsLost}</div>
          <div className="stat-card-label">Pets perdidos</div>
        </div>

        <div className="stat-card stat-card-dark">
          <div className="stat-card-icon">
            <i className="fa-solid fa-users"></i>
          </div>
          <div className="stat-card-value">{data.totalOwners}</div>
          <div className="stat-card-label">Donos cadastrados</div>
        </div>

        <div className="stat-card stat-card-blue">
          <div className="stat-card-icon">
            <i className="fa-solid fa-building"></i>
          </div>
          <div className="stat-card-value">{data.apartmentsWithPets}</div>
          <div className="stat-card-label">Apartamentos com pets</div>
        </div>
      </div>

      {/* Bottom */}
      <div className="dashboard-bottom">
        <div className="news-card">
          <div className="news-card-left">
            <div className="news-card-icon">
              <i className="fa-solid fa-newspaper"></i>
            </div>
            <div>
              <div className="news-card-title">Notícias</div>
              <div className="news-card-sub">Veja as últimas atualizações</div>
            </div>
          </div>
          <Link href="/noticias" className="news-card-btn">
            Ver todas <i className="fa-solid fa-arrow-right"></i>
          </Link>
        </div>

        <div className="news-card">
          <div className="news-card-left">
            <div className="news-card-icon">
              <i className="fa-solid fa-paw"></i>
            </div>
            <div>
              <div className="news-card-title">Pets do condomínio</div>
              <div className="news-card-sub">Consulte informações dos pets</div>
            </div>
          </div>
          <Link href="/detalhesPets" className="news-card-btn">
            Ver pets <i className="fa-solid fa-arrow-right"></i>
          </Link>
        </div>
      </div>
    </div>
  );
}
