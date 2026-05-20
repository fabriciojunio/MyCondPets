// ============================================
// TESTES DA TELA INICIAL (TelaInicialCond)
// ============================================

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TelaInicialCond from '../../app/telaInicialCond/page';
import { Footer } from '../../components/footer/index';
// Mocks
global.fetch = jest.fn();

// CORREÇÃO CRÍTICA: Mocka scrollIntoView para evitar TypeError no JSDOM (Footer tests)
// Isso simula o comportamento do navegador para elementos HTML.
if (typeof Element !== 'undefined') {
  Element.prototype.scrollIntoView = jest.fn();
}

describe('TelaInicialCond - Dashboard Principal', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock da API do dashboard
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        petsCadastrados: 34,
        petsPerdidos: 5,
        donosCadastrados: 28,
        aptosComPets: 20
      })
    });
  });

  // ============================================
  // TESTE 1: Renderiza sem erros
  // ============================================
  test('renderiza a página sem erros', async () => {
    render(<TelaInicialCond />);

    await waitFor(() => {
      expect(screen.queryByText('Carregando dashboard...')).not.toBeInTheDocument();
    });
  });

  // ============================================
  // TESTE 2: Mostra loading inicialmente
  // ============================================
  test('mostra loading ao carregar dados', () => {
    render(<TelaInicialCond />);

    expect(screen.getByText('Carregando dashboard...')).toBeInTheDocument();
  });

  // ============================================
  // TESTE 3: Mostra os dados corretos da API
  // ============================================
  test('mostra os dados mockados da API', async () => {
    render(<TelaInicialCond />);

    await waitFor(() => {
      expect(screen.getByText('34')).toBeInTheDocument();
      expect(screen.getByText('Pets cadastrados')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('Pets perdidos')).toBeInTheDocument();
      expect(screen.getByText('28')).toBeInTheDocument();
      expect(screen.getByText('Donos cadastrados')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
      expect(screen.getByText('Apartamentos com pets')).toBeInTheDocument();
    });
  });

  // ============================================
  // TESTE 4: Faz chamada à API corretamente
  // ============================================
  test('faz chamada para /api/dashboard ao montar', async () => {
    render(<TelaInicialCond />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/dashboard');
    });
  });

  // ============================================
  // TESTE 5: Mostra alerta quando há pets perdidos
  // O componente usa .stat-card-alert para o ícone de alerta
  // ============================================
  test('mostra alerta quando há pets perdidos', async () => {
    render(<TelaInicialCond />);

    await waitFor(() => {
      expect(document.querySelector('.stat-card-alert')).toBeInTheDocument();
    });
  });

  // ============================================
  // TESTE 6: NÃO mostra alerta quando não há pets perdidos
  // ============================================
  test('não mostra alerta quando não há pets perdidos', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        petsCadastrados: 34,
        petsPerdidos: 0,
        donosCadastrados: 28,
        aptosComPets: 20
      })
    });

    render(<TelaInicialCond />);

    await waitFor(() => {
      expect(screen.getByText('Pets cadastrados')).toBeInTheDocument();
    });

    // Verifica a AUSÊNCIA do elemento de alerta
    expect(document.querySelector('.stat-card-alert')).not.toBeInTheDocument();
  });

  // ============================================
  // TESTE 7: Renderiza todos os cards
  // ============================================
  test('renderiza todos os 4 cards principais', async () => {
    render(<TelaInicialCond />);

    await waitFor(() => {
      expect(screen.getByText('Pets cadastrados')).toBeInTheDocument();
      expect(screen.getByText('Pets perdidos')).toBeInTheDocument();
      expect(screen.getByText('Donos cadastrados')).toBeInTheDocument();
      expect(screen.getByText('Apartamentos com pets')).toBeInTheDocument();
    });
  });

  // ============================================
  // TESTE 8: Mostra zeros quando API falha
  // O componente catch define data com zeros e não exibe mensagem de erro na UI
  // ============================================
  test('mostra zeros quando a API falha', async () => {
    fetch.mockRejectedValueOnce(new Error('Erro ao carregar dados'));

    render(<TelaInicialCond />);

    await waitFor(() => {
      // O componente mostra os dados com valor 0 quando ocorre erro
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBe(4);
    });
  });

  // ============================================
  // TESTE 9: Botão "Atualizar" recarrega os dados
  // ============================================
  test('botão "Atualizar" recarrega os dados', async () => {
    render(<TelaInicialCond />);

    await waitFor(() => {
      expect(screen.getByText('34')).toBeInTheDocument();
    });

    // Muda a resposta para o próximo fetch
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        petsCadastrados: 50,
        petsPerdidos: 2,
        donosCadastrados: 35,
        aptosComPets: 25
      })
    });

    const refreshButton = screen.getByText(/Atualizar/i);
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(screen.getByText('50')).toBeInTheDocument();
    });
  });

  // ============================================
  // TESTE 10: Mostra zeros quando API retorna erro 500
  // O componente trata response.ok === false como erro genérico
  // ============================================
  test('mostra zeros quando API retorna erro 500', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'Erro ao buscar dados do dashboard',
        details: 'Database connection failed'
      })
    });

    render(<TelaInicialCond />);

    await waitFor(() => {
      // O componente exibe 0 em todos os cards quando há erro
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBe(4);
    });
  });

  // ============================================
  // TESTE 11: Card de Notícias renderiza corretamente
  // ============================================
  test('renderiza o card de Notícias com link', async () => {
    render(<TelaInicialCond />);

    await waitFor(() => {
      expect(screen.getByText('Notícias')).toBeInTheDocument();
      expect(screen.getByText('Ver todas')).toBeInTheDocument();
    });
  });

  // ============================================
  // TESTE 12: Verifica classes de cor dos stat-cards
  // ============================================
  test('aplica as classes de cor corretas aos cards', async () => {
    render(<TelaInicialCond />);

    await waitFor(() => {
      const cards = document.querySelectorAll('.stat-card');
      expect(cards.length).toBe(4);
      expect(cards[0]).toHaveClass('stat-card-teal');
      expect(cards[1]).toHaveClass('stat-card-red');
      expect(cards[2]).toHaveClass('stat-card-dark');
      expect(cards[3]).toHaveClass('stat-card-blue');
    });
  });
});

// ============================================
// TESTES DO FOOTER E CHATBOT
// ============================================

describe('Footer - Chatbot', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        petsCadastrados: 34,
        petsPerdidos: 5,
        donosCadastrados: 28,
        aptosComPets: 20
      })
    });
  });

  // ============================================
  // TESTE 1: Renderiza o rodapé
  // ============================================
  test('renderiza o rodapé com copyright', () => {
    render(<Footer />);
    expect(screen.getByText(/MyCondPets\. Todos os direitos reservados/i)).toBeInTheDocument();
  });

  // ============================================
  // TESTE 2: Botão do chatbot aparece
  // ============================================
  test('exibe o botão de abrir chatbot inicialmente', () => {
    render(<Footer />);
    const chatButton = screen.getByLabelText('Abrir chat');
    expect(chatButton).toBeInTheDocument();
    expect(screen.getByText('Bot')).toBeInTheDocument();
  });

  // ============================================
  // TESTE 3: Abre o chatbot
  // ============================================
  test('abre a janela do chatbot ao clicar no botão', async () => {
    render(<Footer />);

    const chatButton = screen.getByLabelText('Abrir chat');
    fireEvent.click(chatButton);

    await waitFor(() => {
      expect(screen.getByText('Assistente Virtual')).toBeInTheDocument();
      expect(screen.getByText('Sempre online')).toBeInTheDocument();
    });
  });

  // ============================================
  // TESTE 4: Fecha o chatbot
  // ============================================
  test('fecha a janela do chatbot ao clicar no X', async () => {
    render(<Footer />);

    const chatButton = screen.getByLabelText('Abrir chat');
    fireEvent.click(chatButton);

    await waitFor(() => {
      expect(screen.getByText('Assistente Virtual')).toBeInTheDocument();
    });

    const closeButton = screen.getByLabelText('Fechar chat');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Assistente Virtual')).not.toBeInTheDocument();
    });
  });

  // ============================================
  // TESTE 5: Mensagem inicial do bot
  // ============================================
  test('exibe a mensagem de boas-vindas do bot', async () => {
    render(<Footer />);

    const chatButton = screen.getByLabelText('Abrir chat');
    fireEvent.click(chatButton);

    await waitFor(() => {
      expect(screen.getByText(/Sou o assistente do MyCondPets/i)).toBeInTheDocument();
    });
  });

  // ============================================
  // TESTE 6: Botões de ação rápida
  // ============================================
  test('exibe todos os botões de ação rápida', async () => {
    render(<Footer />);

    const chatButton = screen.getByLabelText('Abrir chat');
    fireEvent.click(chatButton);

    await waitFor(() => {
      const buttons = document.querySelectorAll('.quick-action-btn');
      expect(buttons.length).toBeGreaterThanOrEqual(6);
    });
  });

  // ============================================
  // TESTE 7: Carrega dados da API
  // ============================================
  test('carrega dados do dashboard ao montar o componente', async () => {
    render(<Footer />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/dashboard');
    });
  });

  // ============================================
  // TESTE 8: Clique em Estatísticas
  // ============================================
  test('ao clicar em Estatísticas, mostra os dados do dashboard', async () => {
    render(<Footer />);

    const chatButton = screen.getByLabelText('Abrir chat');
    fireEvent.click(chatButton);

    await waitFor(() => {
      expect(screen.getByText(/Estatísticas/)).toBeInTheDocument();
    });

    const statsButton = screen.getByText(/Estatísticas/);
    fireEvent.click(statsButton);

    await waitFor(() => {
      expect(screen.getByText(/Pets cadastrados: 34/i)).toBeInTheDocument();
      expect(screen.getByText(/Pets perdidos: 5/i)).toBeInTheDocument();
      expect(screen.getByText(/Donos cadastrados: 28/i)).toBeInTheDocument();
      expect(screen.getByText(/Apartamentos com pets: 20/i)).toBeInTheDocument();
    });
  });

  // ============================================
  // TESTE 9: Clique em Ajuda
  // ============================================
  test('ao clicar em Ajuda, mostra informações do sistema', async () => {
    render(<Footer />);

    const chatButton = screen.getByLabelText('Abrir chat');
    fireEvent.click(chatButton);

    await waitFor(() => {
      expect(screen.getByText(/Ajuda/)).toBeInTheDocument();
    });

    const helpButton = screen.getByText(/Ajuda/);
    fireEvent.click(helpButton);

    await waitFor(() => {
      expect(screen.getByText(/Cadastre seus pets em Perfil/i)).toBeInTheDocument();
    });
  });

  // ============================================
  // TESTE 10: Clique em Contato
  // ============================================
  test('ao clicar em Contato, mostra informações de contato', async () => {
    render(<Footer />);

    const chatButton = screen.getByLabelText('Abrir chat');
    fireEvent.click(chatButton);

    await waitFor(() => {
      const buttons = document.querySelectorAll('.quick-action-btn');
      expect(buttons.length).toBeGreaterThan(0);
    });

    // Target specifically the quick-action-btn for Contato
    const contactButton = [...document.querySelectorAll('.quick-action-btn')]
      .find(btn => btn.textContent.includes('Contato'));
    fireEvent.click(contactButton);

    await waitFor(() => {
      expect(screen.getByText(/mycondpets@gmail\.com/i)).toBeInTheDocument();
      expect(screen.getByText(/São Paulo, SP/i)).toBeInTheDocument();
    });
  });

  // ============================================
  // TESTE 11: Adiciona mensagem do usuário
  // ============================================
  test('adiciona mensagem do usuário ao clicar em ação rápida', async () => {
    render(<Footer />);

    const chatButton = screen.getByLabelText('Abrir chat');
    fireEvent.click(chatButton);

    await waitFor(() => {
      const buttons = document.querySelectorAll('.quick-action-btn');
      expect(buttons.length).toBeGreaterThan(0);
    });

    // Target specifically the quick-action-btn for Notícias
    const newsButton = [...document.querySelectorAll('.quick-action-btn')]
      .find(btn => btn.textContent.includes('Notícias'));
    fireEvent.click(newsButton);

    await waitFor(() => {
      const userMessages = screen.getAllByText(/Notícias/);
      // Espera-se que haja a mensagem do botão e a nova mensagem na conversa.
      expect(userMessages.length).toBeGreaterThan(1);
    });
  });

  // ============================================
  // TESTE 12: Tratamento de erro na API
  // ============================================
  test('trata erro ao carregar dados do dashboard', async () => {
    fetch.mockRejectedValueOnce(new Error('Erro na API'));

    // Espia console.error para verificar se o erro foi logado corretamente
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<Footer />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Erro ao carregar dados no Footer'),
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });

  // ============================================
  // TESTE 13: Clique em Pet Perdido
  // ============================================
  test('ao clicar em Pet Perdido, mostra informações sobre sistema de alertas', async () => {
    render(<Footer />);

    const chatButton = screen.getByLabelText('Abrir chat');
    fireEvent.click(chatButton);

    await waitFor(() => {
      const buttons = document.querySelectorAll('.quick-action-btn');
      expect(buttons.length).toBeGreaterThan(0);
    });

    const lostButton = [...document.querySelectorAll('.quick-action-btn')]
      .find(btn => btn.textContent.includes('Pet Perdido'));
    fireEvent.click(lostButton);

    await waitFor(() => {
      expect(screen.getByText(/Acesse "Notícias" no menu/i)).toBeInTheDocument();
      expect(screen.getByText(/Selecione o status: Perdido ou Encontrado/i)).toBeInTheDocument();
    });
  });

  // ============================================
  // TESTE 14: Timestamps nas mensagens
  // ============================================
  test('mensagens exibem timestamp formatado', async () => {
    render(<Footer />);

    const chatButton = screen.getByLabelText('Abrir chat');
    fireEvent.click(chatButton);

    await waitFor(() => {
      // Procura por qualquer texto no formato HH:MM
      const timestamps = screen.getAllByText(/\d{2}:\d{2}/);
      expect(timestamps.length).toBeGreaterThan(0);
    });
  });

  // ============================================
  // TESTE 15: Múltiplas interações
  // ============================================
  test('permite múltiplas interações seguidas', async () => {
    render(<Footer />);

    const chatButton = screen.getByLabelText('Abrir chat');
    fireEvent.click(chatButton);

    await waitFor(() => {
      const buttons = document.querySelectorAll('.quick-action-btn');
      expect(buttons.length).toBeGreaterThan(0);
    });

    const statsBtn = [...document.querySelectorAll('.quick-action-btn')]
      .find(btn => btn.textContent.includes('Estatísticas'));
    fireEvent.click(statsBtn);

    await waitFor(() => {
      expect(screen.getByText(/Pets cadastrados: 34/i)).toBeInTheDocument();
    });

    const helpBtn = [...document.querySelectorAll('.quick-action-btn')]
      .find(btn => btn.textContent.includes('Ajuda'));
    fireEvent.click(helpBtn);

    await waitFor(() => {
      expect(screen.getByText(/Cadastre seus pets em Perfil/i)).toBeInTheDocument();
    });
  });
});
