"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ConfirmModal } from "@/components/ConfirmModal";

function VacinaAlertas({ petId }) {
  const [alertas, setAlertas] = useState([]);

  useEffect(() => {
    fetch(`/api/vacinacao?pet_id=${petId}`)
      .then(async (r) => {
        const ct = r.headers.get("content-type") || "";
        if (!r.ok || !ct.includes("application/json")) return { vacinas: [] };
        return r.json();
      })
      .then((data) => {
        const urgentes = (data.vacinas || []).filter(
          (v) => v.vac_status === "atrasada" || v.vac_status === "vencendo"
        );
        setAlertas(urgentes);
      })
      .catch(() => {});
  }, [petId]);

  if (alertas.length === 0) return null;

  return (
    <div className="vacina-alertas">
      {alertas.map((v) => (
        <div
          key={v.vac_id}
          className={`vacina-alerta ${v.vac_status === "atrasada" ? "atrasada" : "vencendo"}`}
        >
          {v.vac_status === "atrasada" ? "⚠️" : "🔔"}{" "}
          <strong>{v.vac_tipo}</strong>:{" "}
          {v.vac_status === "atrasada"
            ? `Vacina ATRASADA (venceu ${new Date(v.vac_data_vencimento).toLocaleDateString("pt-BR")})`
            : `Vencendo em ${new Date(v.vac_data_vencimento).toLocaleDateString("pt-BR")}`}
        </div>
      ))}
    </div>
  );
}

export function PetsList({ pets }) {
  const [listaPets, setListaPets] = useState(pets || []);
  const [toast, setToast] = useState(null);
  const [modalExcluir, setModalExcluir] = useState(null); // { nome }
  const { data: session } = useSession();

  const mostrarToast = (msg, tipo = "sucesso") => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3000);
  };

  const confirmarExcluir = (petNome) => {
    setModalExcluir({ nome: petNome });
  };

  const excluirPet = async (petNome) => {
    try {
      const res = await fetch("/api/pet", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pet_nome: petNome,
          userEmail: session?.user?.email,
        }),
      });

      if (!res.ok) throw new Error("Erro ao excluir pet");

      setListaPets((prev) => prev.filter((p) => p.pet_nome !== petNome));
      mostrarToast(`${petNome} removido com sucesso.`, "sucesso");
    } catch {
      mostrarToast("Erro ao excluir o pet. Tente novamente.", "erro");
    }
  };

  if (listaPets.length === 0) {
    return <p>Nenhum pet cadastrado.</p>;
  }

  return (
    <>
      {/* Modal de confirmação de exclusão */}
      {modalExcluir && (
        <ConfirmModal
          titulo="Excluir pet"
          mensagem={`Tem certeza que deseja excluir ${modalExcluir.nome}? Esta ação não pode ser desfeita.`}
          tipo="perigo"
          labelConfirmar="Sim, excluir"
          onConfirm={() => excluirPet(modalExcluir.nome)}
          onClose={() => setModalExcluir(null)}
        />
      )}

      {/* Toast de feedback */}
      {toast && (
        <div className={`pets-toast pets-toast-${toast.tipo}`}>
          {toast.tipo === "sucesso" ? "✅" : "❌"} {toast.msg}
        </div>
      )}

      <div className="lista-pets">
        {listaPets.map((pet, index) => (
          <div className="pet-item" key={index}>
            <div className="pet-info">
              <span className="icone"><i className="fa-solid fa-paw"></i></span>
              <span className="nome">{pet.pet_nome}</span>
            </div>
            <div className="acoes">
              <button className="btn-delete" onClick={() => confirmarExcluir(pet.pet_nome)}>
                <i className="fa-solid fa-square-minus"></i>
              </button>
            </div>
            {pet.pet_id && <VacinaAlertas petId={pet.pet_id} />}
          </div>
        ))}
      </div>
    </>
  );
}
