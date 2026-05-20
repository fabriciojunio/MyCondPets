"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import "./styles.css";

const CONFIG = {
  perigo:  { emoji: "🗑️", cor: "perigo" },
  aviso:   { emoji: "⚠️", cor: "aviso" },
  sucesso: { emoji: "✅", cor: "sucesso" },
  normal:  { emoji: "❓", cor: "normal" },
};

export function ConfirmModal({
  titulo,
  mensagem,
  tipo = "perigo",
  labelConfirmar = "Confirmar",
  labelCancelar = "Cancelar",
  onConfirm,
  onClose,
}) {
  const { emoji, cor } = CONFIG[tipo] || CONFIG.normal;

  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return createPortal(
    <div className="cmodal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cmodal" role="dialog" aria-modal="true">
        <div className={`cmodal-icon-wrap cmodal-icon-${cor}`}>
          <span className="cmodal-emoji">{emoji}</span>
        </div>
        <h3 className="cmodal-titulo">{titulo}</h3>
        {mensagem && <p className="cmodal-mensagem">{mensagem}</p>}
        <div className="cmodal-actions">
          <button className="cmodal-btn cmodal-btn-cancel" onClick={onClose}>
            {labelCancelar}
          </button>
          <button className={`cmodal-btn cmodal-btn-confirm cmodal-btn-${cor}`} onClick={handleConfirm}>
            {labelConfirmar}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
