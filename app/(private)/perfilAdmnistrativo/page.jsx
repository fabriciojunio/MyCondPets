"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  Users,
  Lock,
  UserCheck,
  UserX,
  Home,
  LogOut,
} from "lucide-react";
import "./css/perfilAdministrativo.css";

const CONDOMINIO_INFO = {
  name: "Residencial Jardim das Flores",
  totalApartments: 120,
  totalPets: 45,
};

export default function AdminPanel() {
  const [currentUser] = useState({
    id: 1,
    name: "Admin Master",
    isAdmin: true,
    isMaster: true,
    condominioId: 1,
  });

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("all");

  // Buscar usuários do banco de dados
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/administradores");
        const data = await response.json();

        if (Array.isArray(data)) {
          setUsers(data);
        } else {
          console.error("Data não é um array:", data);
          setUsers([]);
        }
      } catch (error) {
        console.error("Erro ao buscar usuários:", error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (!isAuthenticated || !currentUser.isAdmin) {
    return (
      <div className="unauthorized-container">
        <Lock size={64} color="#e74c3c" />
        <h1 className="unauthorized-title">Acesso Negado</h1>
        <p className="unauthorized-text">
          Você não tem permissão para acessar esta página.
        </p>
        <p className="unauthorized-subtext">
          Apenas administradores podem visualizar o painel de controle.
        </p>
      </div>
    );
  }

  const toggleAdminPermission = async (userId) => {
    const user = users.find((u) => u.id === userId);

    if (user.isMaster) {
      alert("O usuário Master não pode ter suas permissões alteradas!");
      return;
    }

    try {
      const response = await fetch("/api/administradores", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isAdmin: !user.isAdmin }),
      });

      if (response.ok) {
        setUsers(
          users.map((u) =>
            u.id === userId ? { ...u, isAdmin: !u.isAdmin } : u,
          ),
        );
      }
    } catch (error) {
      console.error("Erro ao atualizar permissões:", error);
      alert("Erro ao atualizar permissões");
    }
  };

  const filteredUsers = users.filter((user) => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "admins") return user.isAdmin;
    if (selectedFilter === "users") return !user.isAdmin;
    return true;
  });

  const stats = {
    totalUsers: users.length,
    totalAdmins: users.filter((u) => u.isAdmin).length,
    totalRegularUsers: users.filter((u) => !u.isAdmin).length,
  };

  if (loading) {
    return (
      <div className="container">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <Home size={28} color="#3498db" />
          <div className="header-info">
            <h1 className="header-title">Painel Administrativo</h1>
            <p className="header-subtitle">{CONDOMINIO_INFO.name}</p>
          </div>
        </div>
        <div className="header-right">
          <div className="user-info">
            <Shield size={20} color="#f39c12" />
            <span className="user-name">{currentUser.name}</span>
            {currentUser.isMaster && (
              <span className="master-badge">MASTER</span>
            )}
          </div>
          <button className="logout-btn">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="stats-container">
        <div className="stat-card">
          <Users size={32} color="#3498db" />
          <div className="stat-info">
            <span className="stat-value">{stats.totalUsers}</span>
            <span className="stat-label">Total de Usuários</span>
          </div>
        </div>
        <div className="stat-card">
          <Shield size={32} color="#2ecc71" />
          <div className="stat-info">
            <span className="stat-value">{stats.totalAdmins}</span>
            <span className="stat-label">Administradores</span>
          </div>
        </div>
        <div className="stat-card">
          <UserCheck size={32} color="#9b59b6" />
          <div className="stat-info">
            <span className="stat-value">{stats.totalRegularUsers}</span>
            <span className="stat-label">Usuários Comuns</span>
          </div>
        </div>
        <div className="stat-card">
          <Home size={32} color="#e67e22" />
          <div className="stat-info">
            <span className="stat-value">{CONDOMINIO_INFO.totalPets}</span>
            <span className="stat-label">Total de Pets</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-container">
        <button
          className={`filter-btn ${selectedFilter === "all" ? "active" : ""}`}
          onClick={() => setSelectedFilter("all")}
        >
          Todos
        </button>
        <button
          className={`filter-btn ${selectedFilter === "admins" ? "active" : ""}`}
          onClick={() => setSelectedFilter("admins")}
        >
          Administradores
        </button>
        <button
          className={`filter-btn ${selectedFilter === "users" ? "active" : ""}`}
          onClick={() => setSelectedFilter("users")}
        >
          Usuários Comuns
        </button>
      </div>

      {/* Users Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr className="table-header">
              <th>Usuário</th>
              <th>Apartamento</th>
              <th>Pets</th>
              <th>Data de Cadastro</th>
              <th>Permissão</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="table-row">
                <td>
                  <div className="user-cell">
                    <div className="user-avatar">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="user-cell-name">{user.name}</div>
                      <div className="user-cell-email">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="apartment-badge">Apto {user.apartment}</span>
                </td>
                <td>
                  <span className="pets-badge">{user.pets} pet(s)</span>
                </td>
                <td>{new Date(user.joinedDate).toLocaleDateString("pt-BR")}</td>
                <td>
                  {user.isMaster ? (
                    <span className="master-label">
                      <Shield size={16} />
                      MASTER
                    </span>
                  ) : user.isAdmin ? (
                    <span className="admin-label">
                      <UserCheck size={16} />
                      Admin
                    </span>
                  ) : (
                    <span className="user-label">
                      <Users size={16} />
                      Usuário
                    </span>
                  )}
                </td>
                <td>
                  {user.isMaster ? (
                    <button className="btn-disabled" disabled>
                      <Lock size={16} />
                      Protegido
                    </button>
                  ) : user.isAdmin ? (
                    <button
                      className="btn-remove-admin"
                      onClick={() => toggleAdminPermission(user.id)}
                    >
                      <UserX size={16} />
                      Remover Admin
                    </button>
                  ) : (
                    <button
                      className="btn-add-admin"
                      onClick={() => toggleAdminPermission(user.id)}
                    >
                      <UserCheck size={16} />
                      Tornar Admin
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
