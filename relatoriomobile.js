import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
    import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
    import { getFirestore, doc, getDoc, collection, onSnapshot, query, where } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

    const firebaseConfig = {
      apiKey: "AIzaSyCLb8BeZODM8vMynaIXINx4AN_P8snTBk8",
      authDomain: "sistemataloes.firebaseapp.com",
      projectId: "sistemataloes",
      storageBucket: "sistemataloes.appspot.com",
      messagingSenderId: "684534379685",
      appId: "1:684534379685:web:ac0f831c26991ac059094c"
    };

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db   = getFirestore(app);

    /* Header/Nav refs */
    const menuNav = document.getElementById('menuNav');
    const userNameDisplay = document.getElementById('userNameDisplay');
    const userNivelDisplay = document.getElementById('userNivelDisplay');
    const logoutButton = document.getElementById('logoutButton');

    /* Toolbar & tabela refs */
    const btnFilter = document.getElementById('btnFilter');
    const btnReport = document.getElementById('btnReport');
    const btnCloseReport = document.getElementById('btnCloseReport');

    const tbody = document.getElementById('tbody');
    const totalPares = document.getElementById('totalPares');
    const tableWrap = document.getElementById('tableWrap');
    const hint = document.getElementById('hint');

    /* Filtro refs */
    const btnClose  = document.getElementById('btnClose');
    const btnApply  = document.getElementById('btnApply');
    const btnClear  = document.getElementById('btnClear');
    const remessa=document.getElementById('remessa'), talao=document.getElementById('talao'), linha=document.getElementById('linha'),
          modelo=document.getElementById('modelo'), cor=document.getElementById('cor'), tipoCliente=document.getElementById('tipoCliente'),
          dtCorteIni=document.getElementById('dtCorteIni'), dtCorteFim=document.getElementById('dtCorteFim'),
          dtEntrada=document.getElementById('dtEntrada'), dtSaidaIni=document.getElementById('dtSaidaIni'), dtSaidaFim=document.getElementById('dtSaidaFim'),
          statusCostura=document.getElementById('statusCostura');

    /* Modais */
    const modal = document.getElementById('modal');
    const modalReport = document.getElementById('modalReport');
    const open = el => el.style.display='flex';
    const close = el => el.style.display='none';

    /* Utils */
    const normLevel=v=>String(v??'').toUpperCase().replace(/^O/,'0').padStart(2,'0');
    const currentPage=()=>location.pathname.split('/').pop().toLowerCase();
    const safeLower=v=>String(v??'').toLowerCase();
    const formatBR=iso=>{if(!iso)return'';const[y,m,d]=iso.split('-');return`${d}/${m}/${y}`};

    
      // Tipos de Usuarios e niveis
        const nivelNomes = {
            '01': 'Cadastro',
            '02': 'Corte',
            '03': 'Costura',
            '04': 'Montagem',
            '05': 'Admin',
            '06': 'Consultor',
            '07':'Super'

        };

        // Definição das páginas e seus níveis de acesso (copiado do index.html)
        const pages = [
          // Inicio
            { name: 'Index', href: 'index.html', levels: ['01','02','03', '04','05', '06','07'] },
          // Cadastro
            { name: 'Cadastro Usuarios', href: 'cadastroUsuarios.html', levels: ['07'] },
            { name: 'Cadastro Talões', href: 'cadastroTaloes.html', levels: ['01', '05','07'] },

          // Ferramentas
            { name: 'Romaneio', href: 'romaneio.html', levels: ['05','07'] },
            { name: 'Excluir Dados', href: 'excluirDados.html', levels: ['05','07'] },
            { name: 'Registro em Massa', href: 'registroEmMassa.html', levels: ['07'] },
          
          // Corte
            { name: 'Corte', href: 'corte.html', levels: ['02','07'] },
            { name: 'Relatório Erros', href: 'relatorioerros.html', levels: ['02','04','07'] },

          // Relatorios
            { name: 'Resumo', href: 'resumo.html', levels: ['04','06','07'] },
            { name: 'Cronograma', href: 'cronograma.html', levels: ['01','02', '04','05','06','07'] },
            { name: 'Cronograma Mobile', href: 'cronogramamobile.html', levels: ['06','07'] },
            { name: 'Relatório Master', href: 'relatorioMaster.html', levels: ['05','07'] },

          //Costura
            { name: 'Costura', href: 'costura.html', levels: ['03','07'] },
            { name: 'Relatorio Atelier', href: 'relatorioAtelier.html', levels: ['03','07'] },
            { name: 'Atlier Celular', href: 'relatoriomobile.html', levels: ['03','07'] },

          // Fabrica
            { name: 'Distribuição', href: 'distribuicao.html', levels: ['04','07'] },
            { name: 'Talonagem', href: 'talonagem.html', levels: ['04','07'] },
            { name: 'Montagem', href: 'montagem.html', levels: ['05','07'] }
            
        ];

    //Funçoes

    function generateMenu(nivel,user){
      menuNav.innerHTML='';
      userNameDisplay.textContent=`Olá, ${user||'Usuário'}!`;
      userNivelDisplay.textContent=`Setor: ${nivelNomes[nivel]||nivel}`;
      pages.forEach(p=>{
        if(p.levels.includes(nivel)){
          const li=document.createElement('li');const a=document.createElement('a');
          a.href=p.href;a.textContent=p.name;li.appendChild(a);menuNav.appendChild(li);
        }
      });
    }

    /* Data state */
    let allTaloes=[]; let filtered=[]; let currentUserName='';

    // ===== AUTH + PERMISSÃO =====
    onAuthStateChanged(auth, async (user)=>{
      if(!user){ location.href='login.html'; return; }
      const snap = await getDoc(doc(db,'Usuario', user.email));
      if(!snap.exists()){ await signOut(auth); location.href='login.html'; return; }
      const data  = snap.data();
      const nivel = normLevel(data.nivelAcesso);
      currentUserName = data.Nome || user.email;

      const cfg = pages.find(p => (p.href||'').toLowerCase() === currentPage());
      if(!(cfg?.levels||[]).map(normLevel).includes(nivel)){
        alert('Você não tem permissão para acessar esta página.'); location.href='index.html'; return;
      }

      generateMenu(nivel, currentUserName);

      // Carrega talões (não renderiza até aplicar filtro)
      onSnapshot(query(collection(db,'taloes'), where('idAtelieResponsavel','==', currentUserName)), (qs)=>{
        allTaloes = qs.docs.map(d => ({ id:d.id, ...d.data() }));
      });
    });

    // ===== Modais =====
    btnFilter.onclick = () => open(modal);
    btnClose.onclick  = () => close(modal);
    modal.addEventListener('click', e => { if(e.target===modal) close(modal); });

    btnReport.onclick = () => { buildReport(); open(modalReport); };
    btnCloseReport.onclick = () => close(modalReport);
    modalReport.addEventListener('click', e => { if(e.target===modalReport) close(modalReport); });

    // ===== Helpers =====
    const inferStatus = (t)=>{
      const s = safeLower(t.statusCostura || t.status);
      if (s.includes('aguard')) return 'aguardando';
      if (s.includes('final'))  return 'finalizado';
      if (s.includes('produ'))  return 'producao';
      if (t.dataSaidaCostura)   return 'finalizado';
      if (t.dataEntradaCostura) return 'producao';
      return 'aguardando';
    };

    // ===== Filtro =====
    btnClear.onclick = ()=>{
      [remessa,talao,linha,modelo,cor,tipoCliente,dtCorteIni,dtCorteFim,dtEntrada,dtSaidaIni,dtSaidaFim,statusCostura]
        .forEach(el=>el.value='');
      tableWrap.style.display='none'; hint.style.display='block'; tbody.innerHTML=''; totalPares.textContent='0'; filtered=[];
    };

    btnApply.onclick = ()=>{
      filtered = [...allTaloes];

      const fRem  = safeLower(remessa.value);
      const fTal  = safeLower(talao.value);
      const fLin  = safeLower(linha.value);
      const fMod  = safeLower(modelo.value);
      const fCor  = safeLower(cor.value);
      const fTipo = safeLower(tipoCliente.value);
      const diC = dtCorteIni.value, dfC = dtCorteFim.value;
      const dEnt = dtEntrada.value, dSi = dtSaidaIni.value, dSf = dtSaidaFim.value;
      const fStatus = safeLower(statusCostura.value);

      if(diC && dfC) filtered = filtered.filter(t => (t.dataCorte||'') >= diC && (t.dataCorte||'') <= dfC);
      else if(diC)   filtered = filtered.filter(t => (t.dataCorte||'') === diC);
      if(dEnt)       filtered = filtered.filter(t => (t.dataEntradaCostura||'') === dEnt);
      if(dSi && dSf) filtered = filtered.filter(t => (t.dataSaidaCostura||'') >= dSi && (t.dataSaidaCostura||'') <= dSf);
      else if(dSi)   filtered = filtered.filter(t => (t.dataSaidaCostura||'') === dSi);

      if(fRem)  filtered = filtered.filter(t => safeLower(t.numeroRemessa).includes(fRem));
      if(fTal)  filtered = filtered.filter(t => safeLower(t.numeroTalaoSequencial).includes(fTal));
      if(fLin)  filtered = filtered.filter(t => safeLower(t.linha).includes(fLin));
      if(fMod)  filtered = filtered.filter(t => safeLower(t.modelo).includes(fMod));
      if(fCor)  filtered = filtered.filter(t => safeLower(t.cor).includes(fCor));
      if(fTipo) filtered = filtered.filter(t => {
        const a = safeLower(t.tipoCliente); const b = safeLower(t.tipoRemessa);
        return a.includes(fTipo) || b.includes(fTipo);
      });
      if(fStatus) filtered = filtered.filter(t => inferStatus(t) === fStatus);

      render(); close(modal);
    };

    // ===== Render =====
    function render(){
      tbody.innerHTML='';
      if(!filtered.length){
        tableWrap.style.display='block'; hint.style.display='none';
        totalPares.textContent='0';
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#6b7280">Nenhum talão encontrado.</td></tr>`;
        return;
      }
      let tot = 0;
      for(const t of filtered){
        tot += (t.pares||0);
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${formatBR(t.dataCorte || '')}</td>
          <td>${t.numeroRemessa ?? ''}</td>
          <td>${t.numeroTalaoSequencial ?? ''}</td>
          <td><span class="pill">${t.linha ?? ''}</span></td>
          <td>${t.modelo ?? ''}</td>
          <td style="text-align:right;font-weight:700">${t.pares ?? 0}</td>
        `;
        tbody.appendChild(tr);
      }
      totalPares.textContent = String(tot);
      tableWrap.style.display='block'; hint.style.display='none';
    }

    // ===== Relatório =====
    function buildReport(){
      const buckets = {
        aguardando: {el:document.querySelector('#colAguardando'), total:0},
        producao:   {el:document.querySelector('#colProducao'),   total:0},
        finalizado: {el:document.querySelector('#colFinalizado'), total:0}
      };

      const group = (status)=>{
        const m = new Map();
        for(const t of filtered){
          if(inferStatus(t)!==status) continue;
          const k = `${t.linha ?? ''} - ${t.modelo ?? ''}`;
          m.set(k, (m.get(k)||0) + (t.pares||0));
        }
        return [...m.entries()].sort((a,b)=>a[0].localeCompare(b[0]));
      };

      let geral = 0;
      Object.keys(buckets).forEach(key=>{
        const box  = buckets[key];
        const list = box.el.querySelector('.list');
        const tot  = box.el.querySelector('.total');
        const rows = group(key);

        list.innerHTML = rows.length ? '' : `<div class="sub" style="font-style:italic">Nenhum talão por linha - modelo.</div>`;
        let soma = 0;
        rows.forEach(([lm,pares])=>{
          soma += pares;
          const e = document.createElement('div');
          e.className = 'entry';
          e.innerHTML = `<div class="lm">${lm}</div><div class="pares">${pares} pares</div>`;
          list.appendChild(e);
        });
        tot.textContent = `${soma} pares`;
        box.total = soma; geral += soma;
      });
      document.getElementById('totGeral').textContent = `${geral} pares`;
    }

    // ===== Logout =====
    logoutButton.addEventListener('click', async ()=>{
      try{ await signOut(auth); location.href='login.html'; }
      catch{ alert('Erro ao sair'); }
    });