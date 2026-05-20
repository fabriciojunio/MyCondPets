"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Newspaper, AlertCircle, CheckCircle, Send, X, Camera, Upload } from 'lucide-react';
import "./css/publicarNoticia.css";

export default function CriarNoticias() {
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    donId: '',
    foto: '',
    tipo_animal: '',
    status: 'perdido',
  });

  const [donos, setDonos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [cameraAtiva, setCameraAtiva] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [loadingDonos, setLoadingDonos] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadDonos();
  }, []);

  const loadDonos = async () => {
    try {
      setLoadingDonos(true);

      const response = await fetch('/api/donos');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Erro ao carregar donos');
      }

      const data = await response.json();
      setDonos(data);

    } catch (error) {
      console.error(' Erro ao carregar donos:', error);
      setMessage({
        type: 'error',
        text: 'Erro ao carregar lista de donos: ' + error.message
      });
    } finally {
      setLoadingDonos(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Limpa mensagem anterior
    setMessage({ type: '', text: '' });

    // Validações síncronas - isso garante que o state seja atualizado antes do async
    if (!formData.titulo.trim()) {
      setMessage({ type: 'error', text: 'Por favor, insira um título' });
      return;
    }

    if (!formData.descricao.trim()) {
      setMessage({ type: 'error', text: 'Por favor, insira uma descrição' });
      return;
    }

    if (!formData.donId) {
      setMessage({ type: 'error', text: 'Por favor, selecione um dono' });
      return;
    }

    // Se passou nas validações, prossegue com o submit
    try {
      setLoading(true);


      const response = await fetch('/api/noticias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Erro ao publicar notícia');
      }

      setMessage({
        type: 'success',
        text: 'Notícia publicada com sucesso!'
      });

      setFormData({
        titulo: '',
        descricao: '',
        donId: '',
        foto: '',
        tipo_animal: '',
        status: 'perdido',
      });

      setTimeout(() => {
        window.location.href = '/noticias';
      }, 2000);

    } catch (error) {
      console.error(' Erro ao publicar notícia:', error);
      setMessage({
        type: 'error',
        text: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const clearMessage = () => {
    setMessage({ type: '', text: '' });
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, foto: reader.result }));
      setFotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const abrirCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      setCameraAtiva(true);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 100);
    } catch {
      setMessage({ type: 'error', text: 'Não foi possível acessar a câmera.' });
    }
  };

  const tirarFoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setFormData(prev => ({ ...prev, foto: dataUrl }));
    setFotoPreview(dataUrl);
    fecharCamera();
  };

  const fecharCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraAtiva(false);
  };

  if (loadingDonos) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="publicar-noticia-wrapper">
      <main className="publicar-noticia-main">
        <div className="form-container">
          <div className="form-header">
            <Newspaper className="header-icon" />
            <h1 className="form-title">Publicar Notícia</h1>
            <p className="form-subtitle">
              Compartilhe informações sobre pets perdidos ou encontrados
            </p>
          </div>

          {message.text && (
            <div className={`message-alert ${message.type}`} role="alert">
              {message.type === 'success' ? (
                <CheckCircle className="message-icon" />
              ) : (
                <AlertCircle className="message-icon" />
              )}
              <span className="message-text">{message.text}</span>
              <button
                onClick={clearMessage}
                className="message-close"
                aria-label="Fechar mensagem"
              >
                <X size={18} />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="noticia-form">
            <div className="form-group">
              <label htmlFor="titulo" className="form-label">
                Título da Notícia *
              </label>
              <input
                type="text"
                id="titulo"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                className="form-input"
                placeholder="Ex: Golden Retriever perdido próximo ao bloco A"
                maxLength={200}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="descricao" className="form-label">
                Descrição *
              </label>
              <textarea
                id="descricao"
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                className="form-textarea"
                placeholder="Descreva detalhes importantes: local, data, características..."
                rows={6}
                maxLength={500}
                required
              />
              <span className="char-count">
                {formData.descricao.length}/500 caracteres
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Foto do Pet *</label>

              {/* Preview da foto */}
              {fotoPreview && (
                <div className="foto-preview">
                  <img src={fotoPreview} alt="Preview" />
                  <button type="button" className="foto-remove" onClick={() => { setFotoPreview(null); setFormData(prev => ({ ...prev, foto: '' })); }}>
                    <X size={16} /> Remover
                  </button>
                </div>
              )}

              {/* Câmera ativa */}
              {cameraAtiva && (
                <div className="camera-container">
                  <video ref={videoRef} autoPlay playsInline className="camera-video" />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                  <div className="camera-actions">
                    <button type="button" className="btn-capture" onClick={tirarFoto}>
                      <Camera size={20} /> Capturar
                    </button>
                    <button type="button" className="btn-cancel-cam" onClick={fecharCamera}>
                      <X size={16} /> Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Botões de escolha */}
              {!cameraAtiva && !fotoPreview && (
                <div className="foto-options">
                  <button type="button" className="btn-foto-op" onClick={abrirCamera}>
                    <Camera size={18} /> Usar Câmera
                  </button>
                  <label className="btn-foto-op" htmlFor="foto-upload">
                    <Upload size={18} /> Galeria / Arquivo
                  </label>
                  <input
                    type="file"
                    id="foto-upload"
                    accept="image/*"
                    onChange={handleFotoChange}
                    style={{ display: 'none' }}
                  />
                </div>
              )}
            </div>
                
            <div className="form-group">
              <label htmlFor="tipo_animal" className="form-label">
                Tipo de Animal
              </label>
              <select
                id="tipo_animal"
                name="tipo_animal"
                value={formData.tipo_animal}
                onChange={handleChange}
                className="form-select"
              >
                <option value="">-- Selecione --</option>
                <option value="cachorro">Cachorro</option>
                <option value="gato">Gato</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="status" className="form-label">
                Situação
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="form-select"
              >
                <option value="perdido">Perdido</option>
                <option value="encontrado">Encontrado</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="donId" className="form-label">
                Publicado por *
              </label>
              <select
                id="donId"
                name="donId"
                value={formData.donId}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="">-- Selecione o responsável --</option>
                {donos.map((dono) => (
                  <option key={dono.don_id} value={dono.don_id}>
                    {dono.don_nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="btn-secondary"
                disabled={loading}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="btn-spinner"></div>
                    Publicando...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    Publicar Notícia
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}