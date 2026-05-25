"use client";

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Bot, User, MapPin, Phone, Mail, Clock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import "./styles.css";

export function Footer() {
  const [isOpen, setIsOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: 'Olá! 👋 Sou o assistente do MyCondPets. Como posso ajudar?',
      timestamp: new Date()
    }
  ]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch('/api/dashboard');
        if (res.ok) {
          const data = await res.json();
          setDashboardData({
            totalPets: data.petsCadastrados,
            petsLost: data.petsPerdidos,
            totalOwners: data.donosCadastrados,
            apartmentsWithPets: data.aptosComPets
          });
        }
      } catch (error) {
        console.error("Erro ao carregar dados no Footer", error);
      }
    };
    fetchDashboardData();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const predefinedResponses = {
    stats: `📊 Estatísticas do Sistema:\n\n🐕 Pets cadastrados: ${dashboardData?.totalPets ?? 0}\n🚨 Pets perdidos: ${dashboardData?.petsLost ?? 0}\n👥 Donos cadastrados: ${dashboardData?.totalOwners ?? 0}\n🏠 Apartamentos com pets: ${dashboardData?.apartmentsWithPets ?? 0}`,
    register: `🐕 Cadastro de Pets:\n\nCadastre seu pet com foto, raça, porte e dados completos.\n\n1. Acesse a seção "Perfil" no menu\n2. Clique no botão + ao lado dos seus pets\n3. Preencha o formulário em "Cadastrar Pet"`,
    lost: `🚨 Pet Perdido ou Encontrado:\n\n1. Acesse "Notícias" no menu\n2. Clique em "+ Publicar"\n3. Preencha o título e a descrição\n4. Selecione o status: Perdido ou Encontrado\n5. Informe o tipo de animal e adicione uma foto\n\nTodos os moradores poderão ver e comentar o aviso!`,
    store: `🛒 Nossa Loja:\n\nTemos produtos premium para o seu pet!\n• Coleiras e guias\n• Rações e petiscos\n• Brinquedos\n• Camas e casinhas\n• Higiene e saúde\n\nAcesse /loja e use nossa busca inteligente com IA!`,
    news: `📰 Notícias:\n\nMantenha-se informado sobre o condomínio:\n• Pets perdidos/encontrados\n• Comunicados importantes\n• Eventos e regras\n\nAcesse a seção Notícias no menu.`,
    help: `❓ Ajuda:\n\n• 🐕 Cadastre seus pets em Perfil\n• 🛒 Compre produtos na Loja\n• 📰 Leia avisos em Notícias\n• 🚨 Reporte pets perdidos\n• 📊 Veja estatísticas (admin)\n\nDúvidas? Entre em contato!`,
    contact: `📞 Contato:\n\n📧 mycondpets@gmail.com\n📍 São Paulo, SP\n⏰ Seg–Sex 8h–18h\n\nPara suporte, envie um e-mail ou fale com a administração do condomínio.`
  };

  const quickActions = [
    { text: '📊 Estatísticas', action: 'stats' },
    { text: '🐕 Cadastrar Pet', action: 'register' },
    { text: '🚨 Pet Perdido', action: 'lost' },
    { text: '🛒 Loja', action: 'store' },
    { text: '📰 Notícias', action: 'news' },
    { text: '❓ Ajuda', action: 'help' },
    { text: '📞 Contato', action: 'contact' }
  ];

  const handleQuickAction = (action) => {
    const titles = {
      stats: '📊 Estatísticas', register: '🐕 Cadastrar Pet', lost: '🚨 Pet Perdido',
      store: '🛒 Loja', news: '📰 Notícias', help: '❓ Ajuda', contact: '📞 Contato'
    };
    setMessages(prev => [...prev, { type: 'user', text: titles[action], timestamp: new Date() }]);
    setTimeout(() => {
      setMessages(prev => [...prev, { type: 'bot', text: predefinedResponses[action], timestamp: new Date() }]);
    }, 300);
  };

  return (
    <>
      {/* ===== CHATBOT ===== */}
      {!isOpen && (
        <button className="chatbot-toggle" onClick={() => setIsOpen(true)} aria-label="Abrir chat">
          <MessageCircle className="chatbot-icon" />
          <span className="chatbot-badge">Bot</span>
        </button>
      )}

      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar"><Bot className="chatbot-icon" /></div>
              <div>
                <h3 className="chatbot-header-title">Assistente Virtual</h3>
                <p className="chatbot-header-subtitle">Sempre online</p>
              </div>
            </div>
            <button className="chatbot-close" onClick={() => setIsOpen(false)} aria-label="Fechar chat">
              <X className="chatbot-icon" />
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chatbot-message ${msg.type === 'user' ? 'user-message' : 'bot-message'}`}>
                <div className="message-avatar">
                  {msg.type === 'user' ? <User className="chatbot-icon-small" /> : <Bot className="chatbot-icon-small" />}
                </div>
                <div className="message-content">
                  <p className="message-text">{msg.text}</p>
                  <span className="message-time">
                    {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-quick-actions">
            {quickActions.map((a, i) => (
              <button key={i} className="quick-action-btn" onClick={() => handleQuickAction(a.action)}>
                {a.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===== FOOTER ===== */}
      <footer className="footer-wrapper">
        <div className="footer-main">
          {/* Brand */}
          <div className="footer-brand">
            <Image src="/images/logo/logo_fundo-removebg.png" alt="MyCondPets" className="footer-logo" width={180} height={48} />
            <div className="footer-brand-name">MyCondPets</div>
            <p className="footer-brand-desc">
              Plataforma completa de gestão de pets em condomínios. Segurança, organização e carinho para você e seu animal.
            </p>
            <div className="footer-social">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="footer-social-btn" aria-label="Instagram">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="footer-social-btn" aria-label="Facebook">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="https://wa.me/5511987654321" target="_blank" rel="noopener noreferrer" className="footer-social-btn" aria-label="WhatsApp">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
            </div>
          </div>

          {/* Links */}
          <div className="footer-col">
            <h4>Plataforma</h4>
            <ul>
              <li><Link href="/">Início</Link></li>
              <li><Link href="/loja">Loja</Link></li>
              <li><Link href="/noticias">Notícias</Link></li>
              <li><Link href="/perfilDono">Meu Perfil</Link></li>
              <li><Link href="/cadastropet">Cadastrar Pet</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Suporte</h4>
            <ul>
              <li><a href="mailto:mycondpets@gmail.com">Fale Conosco</a></li>
              <li><Link href="/noticias">Avisos do Condomínio</Link></li>
              <li><Link href="/cadastropet">Cadastrar Pet</Link></li>
              <li><Link href="/loja">Loja de Produtos</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="footer-col">
            <h4>Contato</h4>
            <div className="footer-contact-item">
              <Mail size={13} />
              <span>mycondpets@gmail.com</span>
            </div>
            <div className="footer-contact-item">
              <Phone size={13} />
              <span>(11) 98765-4321</span>
            </div>
            <div className="footer-contact-item">
              <MapPin size={13} />
              <span>São Paulo, SP</span>
            </div>
            <div className="footer-contact-item">
              <Clock size={13} />
              <span>Seg–Sex • 8h às 18h</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} MyCondPets. Todos os direitos reservados.</span>
          <div className="footer-bottom-links">
            <a href="mailto:mycondpets@gmail.com">Contato</a>
          </div>
        </div>
      </footer>
    </>
  );
}
