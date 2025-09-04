/* ==== Firebase (compat) ==== */
const firebaseConfig = {
  apiKey: "AIzaSyCLb8BeZODM8vMynaIXINx4AN_P8snTBk8",
  authDomain: "sistemataloes.firebaseapp.com",
  projectId: "sistemataloes",
  storageBucket: "sistemataloes.appspot.com",
  messagingSenderId: "684534379685",
  appId: (typeof __app_id !== 'undefined' ? __app_id : 'default-app-id')
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db   = firebase.firestore();

/* ==== Captura de elementos ==== */
const menuNav = document.getElementById('menuNav');
const userNameDisplay = document.getElementById('userNameDisplay');
const userNivelDisplay = document.getElementById('userNivelDisplay');
const logoutButton = document.getElementById('logoutButton');

// intervalo de Data de Corte
const filterDataCorteStart = document.getElementById('filterDataCorteStart');
const filterDataCorteEnd   = document.getElementById('filterDataCorteEnd');

const filterRemessa = document.getElementById('filterRemessa');
const filterTalao = document.getElementById('filterTalao');
const filterLinha = document.getElementById('filterLinha');
const filterModelo = document.getElementById('filterModelo');
const filterCor = document.getElementById('filterCor');
const filterTipoCliente = document.getElementById('filterTipoCliente');
const filterStatusGeral = document.getElementById('filterStatusGeral');
const filterAtelieResponsavel = document.getElementById('filterAtelieResponsavel');

// checkboxes
const chkNoAtelier  = document.getElementById('chkNoAtelier');
const chkNaFabrica  = document.getElementById('chkNaFabrica');
const chkMontado    = document.getElementById('chkMontado');

// botão limpar filtros (pode não existir no HTML antigo)
const btnClearFilters = document.getElementById('btnClearFilters');

// tabela e totalizador
const taloesTableBody = document.getElementById('taloesTableBody');
const totalParesDisplay = document.getElementById('totalPares');

// modal edição
const editModal = document.getElementById('editModal');
const closeEditModalBtn = document.getElementById('closeEditModal');
const cancelEditModalBtn = document.getElementById('cancelEditModal');
const editTalaoForm = document.getElementById('editTalaoForm');
const editTalaoId = document.getElementById('editTalaoId');
const editNumeroRemessa = document.getElementById('editNumeroRemessa');
const editNumeroTalaoSequencial = document.getElementById('editNumeroTalaoSequencial');
const editLinha = document.getElementById('editLinha');
const editModelo = document.getElementById('editModelo');
const editCorSapato = document.getElementById('editCorSapato');
const editPares = document.getElementById('editPares');
const editTipoCliente = document.getElementById('editTipoCliente');
const editStatusGeral = document.getElementById('editStatusGeral');
const editAtelieResponsavel = document.getElementById('editAtelieResponsavel');
const editMessage = document.getElementById('editMessage');

// modal mensagens
const messageModal = document.getElementById('messageModal');
const closeMessageModalBtn = document.getElementById('closeMessageModal');
const messageModalTitle = document.getElementById('messageModalTitle');
const messageModalText = document.getElementById('messageModalText');
const messageModalButtons = document.getElementById('messageModalButtons');

/* ==== Estado ==== */
let allTaloes = [];
let filteredTaloes = [];
let currentUserName = '';

/* ==== Constantes ==== */
const nivelNomes = { '01': 'Cadastro', '02': 'Corte', '03': 'Costura', '04': 'Montagem', '05': 'Admin' };
const pages = [
            { name: 'Resumo', href: 'resumo.html', levels: ['05'] },
            { name: 'Index', href: 'index.html', levels: ['01','02','03', '04','05', '06'] },
            { name: 'Cadastro Talões', href: 'cadastroTaloes.html', levels: ['01', '05'] },
            { name: 'Cronograma', href: 'cronograma.html', levels: ['01','02', '04','05', '06'] },
            { name: 'Cronograma Mobile', href: 'cronogramamobile.html', levels: ['01','02', '04','05', '06'] },
            { name: 'Corte', href: 'corte.html', levels: ['02', '05'] },
            { name: 'Costura', href: 'costura.html', levels: ['03', '05'] },
            { name: 'Relatorio Atelier', href: 'relatorioAtelier.html', levels: ['03', '05'] },
            { name: 'Relatório Master', href: 'relatorioMaster.html', levels: ['05'] },
            { name: 'Atlier Mobile', href: 'relatoriomobile.html', levels: ['05'] },
            { name: 'Romaneio', href: 'romaneio.html', levels: ['05'] },
            { name: 'Excluir Dados', href: 'excluirDados.html', levels: ['05'] },
            { name: 'Registro em Massa', href: 'registroEmMassa.html', levels: ['05'] },
            { name: 'Distribuição', href: 'distribuicao.html', levels: ['04', '05'] },
            { name: 'Talonagem', href: 'talonagem.html', levels: ['04', '05'] },
            { name: 'Montagem', href: 'montagem.html', levels: ['05'] }
];

// mapa de cor por tipo de cliente
const corTalaoMapping = {
  'Exportacao': 'row-Exportacao',
  'Cliente especial': 'row-Cliente-especial',
  'Mercado Interno': 'row-Mercado-Interno',
  'Estoque': 'row-Estoque',
  'Amostra': 'row-Amostra'
};

/* ==== Utilitários ==== */
function addSafeListener(el, evt, handler, name) {
  if (!el) {
    console.warn(`[RelatorioMaster] Elemento não encontrado: #${name} — verifique o id no HTML`);
    return;
  }
  el.addEventListener(evt, handler);
}

// Normaliza strings removendo acentos (compatível cross-browser)
const normalize = s => (s || '')
  .toString()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim();

function hasAnyFilterActive() {
  const start = filterDataCorteStart && filterDataCorteStart.value;
  const end   = filterDataCorteEnd   && filterDataCorteEnd.value;
  const textVals = [
    filterRemessa?.value, filterTalao?.value, filterLinha?.value,
    filterModelo?.value, filterCor?.value
  ].filter(Boolean).map(v => v.trim());
  const selectVals = [
    filterTipoCliente?.value, filterStatusGeral?.value, filterAtelieResponsavel?.value
  ].filter(Boolean).map(v => v.trim());
  const check = (chkNoAtelier?.checked || chkNaFabrica?.checked || chkMontado?.checked);

  return Boolean(
    (start && start.trim()) || (end && end.trim()) ||
    textVals.some(v => v.length) ||
    selectVals.some(v => v.length) ||
    check
  );
}

/* ==== Opções estáticas (garantia) ==== */
const TIPO_CLIENTE_OPTIONS = [
  'Exportacao', 'Cliente especial', 'Mercado Interno', 'Estoque', 'Amostra'
];

const STATUS_GERAL_OPTIONS = [
  'Pendente',
  'Aguardando Material',
  'Cortando',
  'Cortado',
  'Costurando',
  'Costurado',
  'Distribuído',
  'Talonado',
  'Montado',
  'Finalizado'
];

function ensureFilterOptions() {
  if (filterTipoCliente && filterTipoCliente.options.length <= 1) {
    filterTipoCliente.innerHTML = '<option value=\"\">Todos</option>' +
      TIPO_CLIENTE_OPTIONS.map(v => `<option value=\"${v}\">${v}</option>`).join('');
  }
  if (filterStatusGeral && filterStatusGeral.options.length <= 1) {
    filterStatusGeral.innerHTML = '<option value=\"\">Todos</option>' +
      STATUS_GERAL_OPTIONS.map(v => `<option value=\"${v}\">${v}</option>`).join('');
  }
}

/* ==== Limpar filtros ==== */
function clearFilters() {
  if (filterDataCorteStart) filterDataCorteStart.value = '';
  if (filterDataCorteEnd)   filterDataCorteEnd.value   = '';
  if (filterRemessa)  filterRemessa.value  = '';
  if (filterTalao)    filterTalao.value    = '';
  if (filterLinha)    filterLinha.value    = '';
  if (filterModelo)   filterModelo.value   = '';
  if (filterCor)      filterCor.value      = '';
  if (filterTipoCliente)   filterTipoCliente.value = '';
  if (filterStatusGeral)   filterStatusGeral.value = '';
  if (filterAtelieResponsavel) filterAtelieResponsavel.value = '';
  if (chkNoAtelier)  chkNoAtelier.checked = false;
  if (chkNaFabrica)  chkNaFabrica.checked = false;
  if (chkMontado)    chkMontado.checked   = false;

  // volta a zerar a tela
  renderTable([]);
  calculateTotalPares([]);
}
addSafeListener(btnClearFilters, 'click', clearFilters, 'btnClearFilters');

/* ==== Menu ==== */
function generateMenu(userLevel, userName) {
  menuNav.innerHTML = '';
  userNameDisplay.textContent = `Olá, ${userName || 'Usuário'}!`;
  userNivelDisplay.textContent = `Setor: ${nivelNomes[userLevel] || ('Nível ' + userLevel)}`;
  pages.forEach(page => {
    if (page.levels.includes(userLevel)) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = page.href;
      a.textContent = page.name;
      li.appendChild(a);
      menuNav.appendChild(li);
    }
  });
}

/* ==== Auth ==== */
auth.onAuthStateChanged(async (user) => {
  if (user) {
    try {
      const snap = await db.collection('Usuario').doc(user.email).get();
      if (!snap.exists) throw new Error('Usuário não encontrado');
      const data = snap.data();
      currentUserName = data.Nome;
      const nivelAcesso = data.nivelAcesso;

      if (!pages.find(p => p.href === 'relatorioMaster.html' && p.levels.includes(nivelAcesso))) {
        showMessageModal('Acesso Negado', 'Você não tem permissão para acessar esta página.', 'error', () => {
          window.location.href = 'index.html';
        });
        return;
      }

      generateMenu(nivelAcesso, currentUserName);
      ensureFilterOptions();
      await loadAtelies();
      listenToTaloes(); // inicia zerado até ter filtros
    } catch (e) {
      console.error(e);
      showMessageModal('Erro de Autenticação', 'Faça login novamente.', 'error', async () => {
        await auth.signOut();
        window.location.href = 'login.html';
      });
    }
  } else {
    window.location.href = 'login.html';
  }
});

logoutButton && logoutButton.addEventListener('click', async () => {
  try {
    await auth.signOut();
    window.location.href = 'login.html';
  } catch (e) {
    console.error(e);
    showMessageModal('Erro de Logout', 'Erro ao fazer logout. Tente novamente.', 'error');
  }
});

/* ==== Carregar Ateliês ==== */
async function loadAtelies() {
  try {
    const qs = await db.collection('Usuario').where('nivelAcesso', '==', '03').get();
    const nomes = qs.docs.map(d => d.data().Nome).filter(Boolean).sort();

    if (filterAtelieResponsavel) {
      filterAtelieResponsavel.innerHTML = '<option value=\"\">Todos</option>';
      nomes.forEach(n => {
        const o = document.createElement('option');
        o.value = n; o.textContent = n;
        filterAtelieResponsavel.appendChild(o);
      });
    }
    if (editAtelieResponsavel) {
      editAtelieResponsavel.innerHTML = '<option value=\"\">Nenhum</option>';
      nomes.forEach(n => {
        const o = document.createElement('option');
        o.value = n; o.textContent = n;
        editAtelieResponsavel.appendChild(o);
      });
    }
  } catch (err) {
    console.error('Erro ao carregar ateliês:', err);
  }
}

/* ==== Snapshot em tempo real ==== */
function listenToTaloes() {
  db.collection('taloes').onSnapshot(
    (snapshot) => {
      allTaloes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Se já houver filtros ativos, atualiza a lista; senão mantém zerada
      if (hasAnyFilterActive()) {
        applyFilters();
      } else {
        renderTable([]);
        calculateTotalPares([]);
      }
    },
    (error) => {
      console.error('Erro ao escutar talões:', error);
      taloesTableBody.innerHTML = '<tr><td colspan=\"16\" style=\"text-align:center;color:red;\">Erro ao carregar talões.</td></tr>';
    }
  );
}

/* ==== Filtros + Ordenação ==== */
function applyFilters() {
  let current = [...allTaloes];

  // Intervalo de Data de Corte (YYYY-MM-DD)
  const start = filterDataCorteStart && filterDataCorteStart.value;
  const end   = filterDataCorteEnd   && filterDataCorteEnd.value;
  if (start || end) {
    let a = start || '';
    let b = end   || '';
    if (a && b && a > b) { const tmp = a; a = b; b = tmp; }
    current = current.filter(t => {
      const dc = t.dataCorte || '';
      if (!dc) return false;
      if (a && b) return dc >= a && dc <= b;
      if (a)      return dc >= a;
      if (b)      return dc <= b;
      return true;
    });
  }

  // Filtros básicos
  const remessa = (filterRemessa?.value || '').toLowerCase();
  const talao = (filterTalao?.value || '').toLowerCase();
  const linha = (filterLinha?.value || '').toLowerCase();
  const modelo = (filterModelo?.value || '').toLowerCase();
  const cor = (filterCor?.value || '').toLowerCase();
  const tipoCliente = filterTipoCliente ? filterTipoCliente.value : '';
  const statusGeral = filterStatusGeral ? filterStatusGeral.value : '';
  const atelieResponsavelVal = filterAtelieResponsavel ? filterAtelieResponsavel.value : '';

  if (remessa)   current = current.filter(t => t.numeroRemessa && String(t.numeroRemessa).toLowerCase().includes(remessa));
  if (talao)     current = current.filter(t => t.numeroTalaoSequencial && String(t.numeroTalaoSequencial).toLowerCase().includes(talao));
  if (linha)     current = current.filter(t => t.linha && String(t.linha).toLowerCase().includes(linha));
  if (modelo)    current = current.filter(t => t.modelo && String(t.modelo).toLowerCase().includes(modelo));
  if (cor)       current = current.filter(t => t.corSapato && String(t.corSapato).toLowerCase().includes(cor));
  if (tipoCliente) current = current.filter(t => normalize(t.tipoCliente) === normalize(tipoCliente));
  if (statusGeral) current = current.filter(t => normalize(t.statusGeral) === normalize(statusGeral));
  if (atelieResponsavelVal) current = current.filter(t => t.idAtelieResponsavel === atelieResponsavelVal);

  // Filtros por local/status (checkboxes) — OR entre selecionados
  const wantNoAtelier = chkNoAtelier && chkNoAtelier.checked;
  const wantNaFabrica = chkNaFabrica && chkNaFabrica.checked;
  const wantMontado   = chkMontado && chkMontado.checked;
  if (wantNoAtelier || wantNaFabrica || wantMontado) {
    current = current.filter(t => {
      const hasDistrib  = !!t.dataEntradaDistribuicao;
      const hasTalon    = !!t.dataEntradaTalonagem;
      const hasMontagem = !!t.dataEntradaMontagem;

      const isNoAtelier = !hasDistrib && !hasTalon && !hasMontagem;
      const isNaFabrica = (hasDistrib || hasTalon) && !hasMontagem; // se quiser incluir montados, remova "!hasMontagem"
      const isMontado   = hasMontagem;

      return (
        (wantNoAtelier && isNoAtelier) ||
        (wantNaFabrica && isNaFabrica) ||
        (wantMontado && isMontado)
      );
    });
  }

  // Ordenação: Data de Corte > Remessa > Talão (crescentes)
  filteredTaloes = current;
  filteredTaloes.sort((a, b) => {
    if (a.dataCorte !== b.dataCorte) {
      return (a.dataCorte || '').localeCompare(b.dataCorte || '');
    }
    if (a.numeroRemessa !== b.numeroRemessa) {
      return String(a.numeroRemessa || '').localeCompare(String(b.numeroRemessa || ''));
    }
    const ta = parseInt(a.numeroTalaoSequencial) || 0;
    const tb = parseInt(b.numeroTalaoSequencial) || 0;
    return ta - tb;
  });

  renderTable(filteredTaloes);
  calculateTotalPares(filteredTaloes);
}

/* ==== Listeners dos filtros ==== */
[
  [filterDataCorteStart,   'change', 'filterDataCorteStart'],
  [filterDataCorteEnd,     'change', 'filterDataCorteEnd'],
  [filterRemessa,          'input',  'filterRemessa'],
  [filterTalao,            'input',  'filterTalao'],
  [filterLinha,            'input',  'filterLinha'],
  [filterModelo,           'input',  'filterModelo'],
  [filterCor,              'input',  'filterCor'],
  [filterTipoCliente,      'change', 'filterTipoCliente'],
  [filterStatusGeral,      'change', 'filterStatusGeral'],
  [filterAtelieResponsavel,'change', 'filterAtelieResponsavel'],
  [chkNoAtelier,           'change', 'chkNoAtelier'],
  [chkNaFabrica,           'change', 'chkNaFabrica'],
  [chkMontado,             'change', 'chkMontado'],
].forEach(([el, evt, name]) => addSafeListener(el, evt, applyFilters, name));

/* ==== Totalizador ==== */
function calculateTotalPares(taloes) {
  const totalPares = taloes.reduce((sum, t) => sum + (t.pares || 0), 0);
  const totalTaloes = taloes.length;
  totalParesDisplay.textContent = `${totalPares} pares | ${totalTaloes} talões`;
}

/* ==== Render da Tabela ==== */
function renderTable(taloes) {
  taloesTableBody.innerHTML = '';

  if (taloes.length === 0) {
    taloesTableBody.innerHTML = '<tr><td colspan=\"16\" style=\"text-align:center;\">Aguardando filtros…</td></tr>';
    return;
  }

  taloes.forEach(talao => {
    const row = document.createElement('tr');
    const rowColorClass = corTalaoMapping[talao.tipoCliente] || '';
    if (rowColorClass) row.classList.add(rowColorClass);

    const formatDate = (dateString) => {
      if (!dateString) return '';
      const [year, month, day] = String(dateString).split('-');
      if (!year || !month || !day) return dateString;
      return `${day}/${month}/${year}`;
    };
    const getStatusClass = (status) => status ? normalize(status).replace(/\s+/g, '-') : '';

    row.innerHTML = `
      <td>${formatDate(talao.dataCorte)}</td>
      <td>${talao.numeroRemessa || ''}</td>
      <td>${talao.numeroTalaoSequencial || ''}</td>
      <td>${talao.linha || ''}</td>
      <td>${talao.modelo || ''}</td>
      <td>${talao.corSapato || ''}</td>
      <td>${talao.tipoCliente || ''}</td>
      <td style="text-align:right;">${talao.pares || 0}</td>
      <td><span class="status-badge ${getStatusClass(talao.statusGeral)}">${talao.statusGeral || 'N/A'}</span></td>
      <td>${talao.idAtelieResponsavel || ''}</td>
      <td>${formatDate(talao.costuraDataInicio) || ''}</td>
      <td>${formatDate(talao.dataSaidaCostura) || ''}</td>
      <td>${formatDate(talao.dataEntradaDistribuicao) || ''}</td>
      <td>${formatDate(talao.dataEntradaTalonagem) || ''}</td>
      <td>${formatDate(talao.dataEntradaMontagem) || ''}</td>
      <td class="action-buttons">
        <button class="edit-btn" data-id="${talao.id}">Editar</button>
        <button class="delete-btn" data-id="${talao.id}">Excluir</button>
      </td>
    `;
    taloesTableBody.appendChild(row);
  });

  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => openEditModal(e.target.dataset.id));
  });
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => confirmDeleteTalao(e.target.dataset.id));
  });
}

/* ==== Modal de Edição ==== */
function openEditModal(talaoId) {
  const talao = allTaloes.find(t => t.id === talaoId);
  if (!talao) { showMessageModal('Erro', 'Talão não encontrado para edição.', 'error'); return; }

  editTalaoId.value = talao.id;
  editNumeroRemessa.value = talao.numeroRemessa || '';
  editNumeroTalaoSequencial.value = talao.numeroTalaoSequencial || '';
  editLinha.value = talao.linha || '';
  editModelo.value = talao.modelo || '';
  editCorSapato.value = talao.corSapato || '';
  editPares.value = talao.pares || 0;
  editTipoCliente.value = talao.tipoCliente || '';
  editStatusGeral.value = talao.statusGeral || '';
  editAtelieResponsavel.value = talao.idAtelieResponsavel || '';

  editMessage.textContent = '';
  editMessage.className = 'modal-message';
  editModal.style.display = 'flex';
}
closeEditModalBtn && closeEditModalBtn.addEventListener('click', () => editModal.style.display = 'none');
cancelEditModalBtn && cancelEditModalBtn.addEventListener('click', () => editModal.style.display = 'none');

editTalaoForm && editTalaoForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const talaoId = editTalaoId.value;
  const updates = {
    numeroRemessa: editNumeroRemessa.value,
    numeroTalaoSequencial: editNumeroTalaoSequencial.value,
    linha: editLinha.value,
    modelo: editModelo.value,
    corSapato: editCorSapato.value,
    pares: parseInt(editPares.value) || 0,
    tipoCliente: editTipoCliente.value,
    statusGeral: editStatusGeral.value,
    idAtelieResponsavel: editAtelieResponsavel.value || ''
  };
  try {
    await db.collection('taloes').doc(talaoId).update(updates);
    editMessage.textContent = 'Talão atualizado com sucesso!';
    editMessage.classList.add('success');
    setTimeout(() => { editModal.style.display = 'none'; }, 1200);
  } catch (error) {
    console.error('Erro ao atualizar talão:', error);
    editMessage.textContent = `Erro ao atualizar: ${error.message}`;
    editMessage.classList.add('error');
  }
});

/* ==== Excluir ==== */
function confirmDeleteTalao(talaoId) {
  showMessageModal(
    'Confirmar Exclusão',
    'Tem certeza que deseja excluir este talão? Esta ação é irreversível.',
    'confirm',
    async () => {
      try {
        await db.collection('taloes').doc(talaoId).delete();
        showMessageModal('Sucesso', 'Talão excluído com sucesso!', 'success');
      } catch (error) {
        console.error('Erro ao excluir talão:', error);
        showMessageModal('Erro', `Erro ao excluir: ${error.message}`, 'error');
      }
    },
    () => { messageModal.style.display = 'none'; }
  );
}

/* ==== Modal genérico ==== */
function showMessageModal(title, text, type, confirmCallback = null, cancelCallback = null) {
  messageModalTitle.textContent = title;
  messageModalText.textContent = text;
  messageModalButtons.innerHTML = '';

  const okButton = document.createElement('button');
  okButton.textContent = (type === 'confirm') ? 'Sim' : 'OK';
  okButton.classList.add('save-btn');
  okButton.addEventListener('click', () => {
    messageModal.style.display = 'none';
    if (confirmCallback && type !== 'confirm') confirmCallback();
  });
  messageModalButtons.appendChild(okButton);

  if (type === 'confirm') {
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Não';
    cancelButton.classList.add('cancel-btn');
    cancelButton.addEventListener('click', () => {
      messageModal.style.display = 'none';
      if (cancelCallback) cancelCallback();
    });
    messageModalButtons.appendChild(cancelButton);
  }

  closeMessageModalBtn && (closeMessageModalBtn.onclick = () => {
    messageModal.style.display = 'none';
    if (type === 'confirm' && cancelCallback) cancelCallback();
  });

  messageModal.style.display = 'flex';
}
