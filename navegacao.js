/* navegacao.js
   Menu padrão do SistemaTaloes.
   Para usar em qualquer página:
   1) Coloque este arquivo na mesma pasta dos HTMLs.
   2) Adicione antes do <script type="module"> da página:
      <script src="navegacao.js"></script>
   3) Depois de buscar o usuário no Firebase, chame:
      window.SistemaNavegacao.init({ userLevel, userName, onLogout });
*/
(function () {
  'use strict';

  const NIVEL_NOMES = {
    '01': 'Cadastro',
    '02': 'Corte',
    '03': 'Costura',
    '04': 'Montagem',
    '05': 'Admin',
    '06': 'Consultor',
    '07': 'Super'
  };

  const PAGINAS = [
    // Início
    { group: 'Início', name: 'Index', href: 'index.html', levels: ['01', '02', '03', '04', '05', '06', '07'] },

    // Cadastro
    { group: 'Cadastro', name: 'Cadastro Usuarios', href: 'cadastroUsuarios.html', levels: ['07'] },
    { group: 'Cadastro', name: 'Cadastro Talões', href: 'cadastroTaloes.html', levels: ['01', '05', '07'] },
    { group: 'Cadastro', name: 'Cadastro Manual', href: 'cadastromanual.html', levels: ['05', '07'] },
    { group: 'Cadastro', name: 'Backup', href: 'migracaotaloes.html', levels: ['07'] },
    { group: 'Cadastro', name: 'Excluir (backup)', href: 'excluirbackups.html', levels: ['07'] },
     
    // Ferramentas
    { group: 'Ferramentas', name: 'Romaneio', href: 'romaneio.html', levels: ['05', '07'] },
    { group: 'Ferramentas', name: 'Fechamento de Remessas', href: 'encerramento.html', levels: ['05', '07'] },
    { group: 'Ferramentas', name: 'Relatorio Geral', href: 'relatoriogeral.html', levels: ['01', '02', '04', '05', '06', '07'] },

    // Corte
    { group: 'Corte', name: 'Corte', href: 'corte.html', levels: ['02', '07'] },
    { group: 'Corte', name: 'Talões perdidos', href: 'taloesperdidos.html', levels: ['02', '04', '07'] },
    { group: 'Corte', name: 'Programação Corte', href: 'programacaocrt.html', levels: ['02', '04', '07'] },

    // Relatórios
    { group: 'Relatórios', name: 'Cronograma', href: 'cronograma.html', levels: ['01', '02', '04', '05', '06', '07'] },
    { group: 'Relatórios', name: 'Controle de produção', href: 'controle.html', levels: ['05', '07'] }, 

    // Costura
    { group: 'Costura', name: 'Relatorio Atelier', href: 'relatorioAtelier.html', levels: ['03', '07'] },
    { group: 'Costura', name: 'Controle', href: 'programacaoatt.html', levels: ['03', '07'] },
    { group: 'Costura', name: 'Entrada atelier', href: 'costura_entrada.html', levels: ['03', '07'] },
    { group: 'Costura', name: 'Saida atelier', href: 'costura_saida.html', levels: ['03', '07'] },

    // Fábrica
    { group: 'Fábrica', name: 'Distribuição', href: 'distribuicao.html', levels: ['04', '07'] },
    { group: 'Fábrica', name: 'Talonagem', href: 'talonagem.html', levels: ['04', '07'] },
    { group: 'Fábrica', name: 'Montagem', href: 'montagem.html', levels: ['05', '07'] },

    //Backup
    { group: 'Backup', name: 'Backup', href: 'migracaotaloes.html', levels: ['07'] },
    { group: 'Backup', name: 'Excluir (backup)', href: 'excluirbackups.html', levels: ['07'] },
    { group: 'Backup', name: 'Cronograma Antigos', href: 'cronogramaBackup.html', levels: ['01', '02', '04', '05', '06', '07'] },
    { group: 'Backup', name: 'Relatorio Geral Antigos', href: 'relatoriogeralBackup.html', levels: ['01', '02', '04', '05', '06', '07'] }, 
    { group: 'Backup', name: 'Romaneios Antigos', href: 'romaneioBackup.html', levels: [ '05', '07'] }
  ];

  function normalizarHref(valor) {
    return String(valor || '')
      .split('?')[0]
      .split('#')[0]
      .split('/')
      .pop()
      .toLowerCase();
  }

  function paginaAtual() {
    const atual = normalizarHref(window.location.pathname);
    return atual || 'index.html';
  }

  function paginasPermitidas(userLevel) {
    return PAGINAS.filter((pagina) => pagina.levels.includes(String(userLevel)));
  }

  function podeAcessar(userLevel, href) {
    const arquivo = normalizarHref(href || paginaAtual());
    const pagina = PAGINAS.find((item) => normalizarHref(item.href) === arquivo);

    // Se a página ainda não foi cadastrada no menu, não bloqueia.
    // Isso evita derrubar páginas antigas durante a migração.
    if (!pagina) return true;

    return pagina.levels.includes(String(userLevel));
  }

  function injetarEstilos() {
    if (document.getElementById('sistema-navegacao-style')) return;

    const style = document.createElement('style');
    style.id = 'sistema-navegacao-style';
    style.textContent = `
      :root {
        --nav-bg: #2f343a;
        --nav-bg-2: #424a53;
        --nav-bg-3: #59626d;
        --nav-text: #ffffff;
        --nav-muted: #cfd6df;
        --nav-border: rgba(255,255,255,.10);
        --nav-shadow: 0 10px 30px rgba(0,0,0,.28);
        --nav-red: #e6272f;
        --nav-red-hover: #c91f27;
      }

      body {
        margin: 0;
        padding-top: 54px;
      }

      .sistema-topbar {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 2000;
        height: 54px;
        background: var(--nav-bg);
        color: var(--nav-text);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 12px;
        box-sizing: border-box;
        box-shadow: 0 2px 8px rgba(0,0,0,.18);
      }

      .sistema-topbar-left,
      .sistema-topbar-right {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }

      .sistema-title {
        margin: 0;
        font-size: 23px;
        line-height: 1;
        font-weight: 800;
        letter-spacing: -.4px;
        white-space: nowrap;
      }

      .sistema-menu-btn,
      .sistema-logout-btn,
      .sistema-menu-close {
        border: 0;
        cursor: pointer;
        font-weight: 700;
        transition: background .2s ease, transform .1s ease;
      }

      .sistema-menu-btn {
        background: #f1f3f6;
        color: #111827;
        border-radius: 8px;
        padding: 8px 12px;
        font-size: 14px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }

      .sistema-menu-btn:hover {
        background: #e2e6eb;
      }

      .sistema-menu-btn:active,
      .sistema-logout-btn:active,
      .sistema-menu-close:active {
        transform: scale(.98);
      }

      .sistema-user-box {
        text-align: right;
        line-height: 1.15;
        font-size: 13px;
        font-weight: 700;
        white-space: nowrap;
      }

      .sistema-user-box small {
        display: block;
        color: var(--nav-text);
        font-size: 13px;
        font-weight: 700;
      }

      .sistema-logout-btn {
        background: var(--nav-red);
        color: #fff;
        border-radius: 8px;
        padding: 9px 13px;
        font-size: 14px;
      }

      .sistema-logout-btn:hover {
        background: var(--nav-red-hover);
      }

      .sistema-menu-overlay {
        position: fixed;
        inset: 0;
        z-index: 2100;
        background: rgba(0,0,0,.35);
        opacity: 0;
        visibility: hidden;
        transition: opacity .22s ease, visibility .22s ease;
      }

      .sistema-menu-drawer {
        position: fixed;
        top: 0;
        left: 0;
        z-index: 2200;
        width: min(320px, 88vw);
        height: 100vh;
        background: var(--nav-bg-2);
        color: var(--nav-text);
        box-shadow: var(--nav-shadow);
        transform: translateX(-102%);
        transition: transform .25s ease;
        display: flex;
        flex-direction: column;
      }

      body.sistema-menu-aberto .sistema-menu-overlay {
        opacity: 1;
        visibility: visible;
      }

      body.sistema-menu-aberto .sistema-menu-drawer {
        transform: translateX(0);
      }

      .sistema-menu-head {
        height: 54px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 14px;
        border-bottom: 1px solid var(--nav-border);
        box-sizing: border-box;
      }

      .sistema-menu-head h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 800;
      }

      .sistema-menu-close {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: var(--nav-bg-3);
        color: #fff;
        font-size: 18px;
      }

      .sistema-menu-lista {
        padding: 8px 8px 16px;
        overflow-y: auto;
      }

      .sistema-menu-grupo {
        padding: 12px 10px 5px;
        color: var(--nav-muted);
        font-size: 10.5px;
        font-weight: 800;
        letter-spacing: .09em;
        text-transform: uppercase;
        border-top: 1px solid rgba(255,255,255,.07);
        margin-top: 6px;
      }

      .sistema-menu-grupo:first-child {
        border-top: 0;
        margin-top: 0;
      }

      .sistema-menu-link {
        display: flex;
        align-items: center;
        min-height: 34px;
        padding: 0 12px 0 20px;
        border-radius: 8px;
        color: #f4f7fb;
        text-decoration: none;
        font-size: 13px;
        font-weight: 500;
        margin: 1px 0;
        position: relative;
      }

      .sistema-menu-link::before {
        content: '';
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: rgba(255,255,255,.38);
        position: absolute;
        left: 10px;
      }

      .sistema-menu-link:hover {
        background: rgba(255,255,255,.09);
      }

      .sistema-menu-link.ativo {
        background: rgba(255,255,255,.14);
        font-weight: 650;
      }

      .sistema-menu-vazio {
        padding: 14px;
        color: var(--nav-muted);
        font-weight: 600;
        font-size: 13px;
      }

      @media (max-width: 760px) {
        body {
          padding-top: 50px;
        }

        .sistema-topbar {
          height: 50px;
          padding: 0 8px;
        }

        .sistema-title {
          font-size: 18px;
        }

        .sistema-menu-btn {
          padding: 7px 10px;
          font-size: 13px;
        }

        .sistema-user-box {
          display: none;
        }

        .sistema-logout-btn {
          padding: 8px 11px;
          font-size: 13px;
        }

        .sistema-menu-head {
          height: 50px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function criarTopbar({ userName, userLevel, title, onLogout }) {
    const topbarAntiga = document.querySelector('.sistema-topbar');
    const overlayAntigo = document.querySelector('.sistema-menu-overlay');
    const drawerAntigo = document.querySelector('.sistema-menu-drawer');

    if (topbarAntiga) topbarAntiga.remove();
    if (overlayAntigo) overlayAntigo.remove();
    if (drawerAntigo) drawerAntigo.remove();

    const topbar = document.createElement('header');
    topbar.className = 'sistema-topbar';
    topbar.setAttribute('data-sistema-navegacao', 'topbar');

    const nivelTexto = NIVEL_NOMES[String(userLevel)] || `Nível ${userLevel || ''}`.trim();
    const nomeTexto = userName || 'Usuário';

    topbar.innerHTML = `
      <div class="sistema-topbar-left">
        <button class="sistema-menu-btn" type="button" aria-controls="sistemaMenuDrawer" aria-expanded="false">
          <span aria-hidden="true">☰</span> Menu
        </button>
        <h1 class="sistema-title">${escapeHtml(title || 'SistemaTaloes')}</h1>
      </div>
      <div class="sistema-topbar-right">
        <div class="sistema-user-box">
          <span>Olá, ${escapeHtml(nomeTexto)}!</span>
          <small>Setor: ${escapeHtml(nivelTexto)}</small>
        </div>
        <button class="sistema-logout-btn" type="button">Sair</button>
      </div>
    `;

    const overlay = document.createElement('div');
    overlay.className = 'sistema-menu-overlay';
    overlay.setAttribute('data-sistema-navegacao', 'overlay');

    const drawer = document.createElement('aside');
    drawer.id = 'sistemaMenuDrawer';
    drawer.className = 'sistema-menu-drawer';
    drawer.setAttribute('data-sistema-navegacao', 'drawer');
    drawer.setAttribute('aria-hidden', 'true');

    drawer.innerHTML = `
      <div class="sistema-menu-head">
        <h2>Menu</h2>
        <button class="sistema-menu-close" type="button" aria-label="Fechar menu">×</button>
      </div>
      <nav class="sistema-menu-lista" aria-label="Menu principal"></nav>
    `;

    document.body.prepend(drawer);
    document.body.prepend(overlay);
    document.body.prepend(topbar);

    const botaoMenu = topbar.querySelector('.sistema-menu-btn');
    const botaoSair = topbar.querySelector('.sistema-logout-btn');
    const botaoFechar = drawer.querySelector('.sistema-menu-close');

    function abrirMenu() {
      document.body.classList.add('sistema-menu-aberto');
      botaoMenu.setAttribute('aria-expanded', 'true');
      drawer.setAttribute('aria-hidden', 'false');
    }

    function fecharMenu() {
      document.body.classList.remove('sistema-menu-aberto');
      botaoMenu.setAttribute('aria-expanded', 'false');
      drawer.setAttribute('aria-hidden', 'true');
    }

    botaoMenu.addEventListener('click', abrirMenu);
    botaoFechar.addEventListener('click', fecharMenu);
    overlay.addEventListener('click', fecharMenu);

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') fecharMenu();
    });

    botaoSair.addEventListener('click', async () => {
      if (typeof onLogout === 'function') {
        await onLogout();
      }
    });

    return { topbar, drawer, fecharMenu };
  }

  function montarMenu(drawer, userLevel, fecharMenu) {
    const nav = drawer.querySelector('.sistema-menu-lista');
    nav.innerHTML = '';

    const permitidas = paginasPermitidas(String(userLevel));
    const atual = paginaAtual();
    let grupoAtual = '';

    if (!permitidas.length) {
      nav.innerHTML = '<div class="sistema-menu-vazio">Nenhuma página liberada para este usuário.</div>';
      return;
    }

    permitidas.forEach((pagina) => {
      if (pagina.group !== grupoAtual) {
        grupoAtual = pagina.group;
        const tituloGrupo = document.createElement('div');
        tituloGrupo.className = 'sistema-menu-grupo';
        tituloGrupo.textContent = grupoAtual;
        nav.appendChild(tituloGrupo);
      }

      const link = document.createElement('a');
      link.className = 'sistema-menu-link';
      link.href = pagina.href;
      link.textContent = pagina.name;

      if (normalizarHref(pagina.href) === atual) {
        link.classList.add('ativo');
      }

      link.addEventListener('click', fecharMenu);
      nav.appendChild(link);
    });
  }

  function escapeHtml(texto) {
    return String(texto ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function init(options = {}) {
    const userLevel = String(options.userLevel || localStorage.getItem('userNivelAcesso') || '');
    const userName = options.userName || localStorage.getItem('userName') || 'Usuário';
    const title = options.title || 'SistemaTaloes';

    injetarEstilos();

    if (!podeAcessar(userLevel, paginaAtual())) {
      alert('Você não tem permissão para acessar esta página.');
      window.location.href = 'index.html';
      return;
    }

    const { drawer, fecharMenu } = criarTopbar({
      userName,
      userLevel,
      title,
      onLogout: options.onLogout
    });

    montarMenu(drawer, userLevel, fecharMenu);
  }

  window.SistemaNavegacao = {
    init,
    pages: PAGINAS,
    nivelNomes: NIVEL_NOMES,
    podeAcessar,
    paginasPermitidas
  };
})();
