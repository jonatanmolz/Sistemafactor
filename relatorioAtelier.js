 const firebaseConfig = {
            apiKey: "AIzaSyCLb8BeZODM8vMynaIXINx4AN_P8snTBk8",
            authDomain: "sistemataloes.firebaseapp.com",
            projectId: "sistemataloes",
            storageBucket: "sistemataloes.appspot.com",
            messagingSenderId: "684534379685",
            appId: typeof __app_id !== 'undefined' ? __app_id : 'default-app-id'
        };

        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
        import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
        import { getFirestore, doc, getDoc, collection, onSnapshot, query, where } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);

        const menuNav = document.getElementById('menuNav');
        const userNameDisplay = document.getElementById('userNameDisplay');
        const userNivelDisplay = document.getElementById('userNivelDisplay');
        const logoutButton = document.getElementById('logoutButton');

        const filterDataCorte = document.getElementById('filterDataCorte');
        const filterDataCorteFim = document.getElementById('filterDataCorteFim');
        const filterRemessa = document.getElementById('filterRemessa');
        const filterTalao = document.getElementById('filterTalao');
        const filterLinha = document.getElementById('filterLinha');
        const filterModelo = document.getElementById('filterModelo');
        const filterCor = document.getElementById('filterCor');
        const filterTipoCliente = document.getElementById('filterTipoCliente');
        const filterDataEntrada = document.getElementById('filterDataEntrada');
        const filterDataSaida = document.getElementById('filterDataSaida');
        const filterDataSaidaFim = document.getElementById('filterDataSaidaFim');
        const filterStatusCostura = document.getElementById('filterStatusCostura');
        
        const searchButton = document.getElementById('searchButton');
        const clearFiltersButton = document.getElementById('clearFiltersButton');
        const reportButton = document.getElementById('reportButton');

        const taloesTableBody = document.getElementById('taloesTableBody');
        const totalParesDisplay = document.getElementById('totalPares');
        const reportContent = document.getElementById('reportContent');
        const loading = document.getElementById('loading');
        const noData = document.getElementById('noData');

        const summaryModal = document.getElementById('summaryModal');
        const closeModalButton = document.getElementById('closeModalButton');
        const atelierSummaryCard = document.getElementById('atelierSummaryCard');

        let allTaloes = [];
        let filteredTaloes = [];
        let currentUserEmail = '';
        let currentUserName = '';

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


        const corTalaoMapping = {
            'Exportacao': 'row-azul', 'Cliente especial': 'row-rosa', 'Mercado Interno': 'row-branco', 'Estoque': 'row-amarelo', 'Amostra': 'row-verde'
        };

        function generateMenu(userLevel, userName) {
            menuNav.innerHTML = '';
            const userNivelText = nivelNomes[userLevel] || `Nível ${userLevel}`;
            userNameDisplay.textContent = `Olá, ${userName || 'Usuário'}!`;
            userNivelDisplay.textContent = `Setor: ${userNivelText}`;
            pages.forEach(page => {
                if (page.levels.includes(userLevel)) {
                    const listItem = document.createElement('li');
                    const link = document.createElement('a');
                    link.href = page.href; 
                    link.textContent = page.name;
                    listItem.appendChild(link);
                    menuNav.appendChild(listItem);
                }
            });
        }

        onAuthStateChanged(auth, async (user) => {
            if (user) {
                currentUserEmail = user.email;
                const userDocRef = doc(db, 'Usuario', user.email);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    const nivelAcesso = userData.nivelAcesso;
                    currentUserName = userData.Nome;
                    if (!pages.find(p => p.href === 'relatorioAtelier.html' && p.levels.includes(nivelAcesso))) {
                        alert('Você não tem permissão para acessar esta página.');
                        window.location.href = 'index.html';
                        return;
                    }
                    generateMenu(nivelAcesso, currentUserName);
                    listenToTaloes();
                } else {
                    alert('Dados do usuário não encontrados. Faça login novamente.');
                    await signOut(auth);
                    window.location.href = 'login.html';
                }
            } else {
                window.location.href = 'login.html';
            }
        });

        logoutButton.addEventListener('click', async () => {
            try { await signOut(auth); window.location.href = 'login.html'; } catch (error) { console.error("Erro ao fazer logout:", error); alert("Erro ao fazer logout. Tente novamente."); }
        });

        function listenToTaloes() {
            loading.style.display = 'block';
            const q = query(
                collection(db, 'taloes'),
                where('idAtelieResponsavel', '==', currentUserName)
            );
            onSnapshot(q, (snapshot) => {
                allTaloes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                console.log("Talões carregados para relatório do ateliê:", allTaloes);
                loading.style.display = 'none';
            }, (error) => {
                console.error("Erro ao escutar talões para relatório do ateliê:", error);
                loading.style.display = 'none';
                noData.textContent = 'Erro ao carregar talões.';
            });
        }

        searchButton.addEventListener('click', applyFilters);

        clearFiltersButton.addEventListener('click', () => {
            filterDataCorte.value = '';
            filterDataCorteFim.value = '';
            filterRemessa.value = '';
            filterTalao.value = '';
            filterLinha.value = '';
            filterModelo.value = '';
            filterCor.value = '';
            filterTipoCliente.value = '';
            filterDataEntrada.value = '';
            filterDataSaida.value = '';
            filterDataSaidaFim.value = '';
            filterStatusCostura.value = '';
            
            taloesTableBody.innerHTML = '';
            reportContent.style.display = 'none';
            document.querySelector('.total-pares-display').style.display = 'none';
            noData.textContent = 'Selecione ao menos um filtro e clique em buscar para exibir os dados.';
            noData.style.display = 'block';
        });

        reportButton.addEventListener('click', () => {
            updateAtelierSummaryCards();
            openModal();
        });

        function applyFilters() {
            loading.style.display = 'block';
            noData.style.display = 'none';
            reportContent.style.display = 'none';

            let currentFilteredTaloes = [...allTaloes];

            const dataCorteInicio = filterDataCorte.value;
            const dataCorteFim = filterDataCorteFim.value;
            const remessa = filterRemessa.value.toLowerCase();
            const talao = filterTalao.value.toLowerCase();
            const linha = filterLinha.value.toLowerCase();
            const modelo = filterModelo.value.toLowerCase();
            const cor = filterCor.value.toLowerCase();
            const tipoCliente = filterTipoCliente.value;
            const dataEntrada = filterDataEntrada.value;
            const dataSaidaInicio = filterDataSaida.value;
            const dataSaidaFim = filterDataSaidaFim.value;
            const statusCostura = filterStatusCostura.value;

            if (dataCorteInicio && dataCorteFim) { currentFilteredTaloes = currentFilteredTaloes.filter(t => t.dataCorte >= dataCorteInicio && t.dataCorte <= dataCorteFim); }
            else if (dataCorteInicio) { currentFilteredTaloes = currentFilteredTaloes.filter(t => t.dataCorte === dataCorteInicio); }
            if (remessa) { currentFilteredTaloes = currentFilteredTaloes.filter(t => t.numeroRemessa && String(t.numeroRemessa).toLowerCase().includes(remessa)); }
            if (talao) { currentFilteredTaloes = currentFilteredTaloes.filter(t => t.numeroTalaoSequencial && String(t.numeroTalaoSequencial).toLowerCase().includes(talao)); }
            if (linha) { currentFilteredTaloes = currentFilteredTaloes.filter(t => t.linha && String(t.linha).toLowerCase().includes(linha)); }
            if (modelo) { currentFilteredTaloes = currentFilteredTaloes.filter(t => t.modelo && String(t.modelo).toLowerCase().includes(modelo)); }
            if (cor) { currentFilteredTaloes = currentFilteredTaloes.filter(t => t.corSapato && String(t.corSapato).toLowerCase().includes(cor)); }
            if (tipoCliente) { currentFilteredTaloes = currentFilteredTaloes.filter(t => t.tipoCliente === tipoCliente); }
            if (dataEntrada) { currentFilteredTaloes = currentFilteredTaloes.filter(t => t.costuraDataInicio === dataEntrada); }
            if (dataSaidaInicio && dataSaidaFim) { currentFilteredTaloes = currentFilteredTaloes.filter(t => t.dataSaidaCostura >= dataSaidaInicio && t.dataSaidaCostura <= dataSaidaFim); }
            else if (dataSaidaInicio) { currentFilteredTaloes = currentFilteredTaloes.filter(t => t.dataSaidaCostura === dataSaidaInicio); }
            if (statusCostura) {
                currentFilteredTaloes = currentFilteredTaloes.filter(t => {
                    if (statusCostura === 'Aguardando Material') { return t.statusCostura === 'Aguardando Material' || (!t.statusCostura && t.statusGeral === 'Cortado'); }
                    else { return t.statusCostura === statusCostura; }
                });
            }

            filteredTaloes = currentFilteredTaloes;
            renderTable(filteredTaloes);
            calculateTotalPares(filteredTaloes);
            loading.style.display = 'none';

            if (filteredTaloes.length > 0) {
                reportContent.style.display = 'block';
                document.querySelector('.total-pares-display').style.display = 'block';
            } else {
                noData.textContent = 'Nenhum dado encontrado com os filtros selecionados.';
                noData.style.display = 'block';
                document.querySelector('.total-pares-display').style.display = 'none';
            }
        }

        function openModal() { summaryModal.style.display = 'flex'; }
        function closeModal() { summaryModal.style.display = 'none'; }
        closeModalButton.addEventListener('click', closeModal);
        window.onclick = (event) => { if (event.target === summaryModal) { closeModal(); } };

        function calculateTotalPares(taloes) {
            const total = taloes.reduce((sum, talao) => sum + (talao.pares || 0), 0);
            totalParesDisplay.textContent = total;
        }

        function renderTable(taloes) {
            taloesTableBody.innerHTML = '';
            if (taloes.length === 0) {
                taloesTableBody.innerHTML = '<tr><td colspan="11" style="text-align: center;">Nenhum talão encontrado com os filtros aplicados.</td></tr>';
                return;
            }
            const formatDate = (dateString) => {
                if (!dateString) return '';
                const [year, month, day] = dateString.split('-');
                return `${day}/${month}/${year}`;
            };
            const getStatusClass = (status) => {
                if (!status) return '';
                return status.toLowerCase().replace(/ /g, '-');
            };
            taloes.forEach(talao => {
                const row = document.createElement('tr');
                const rowColorClass = corTalaoMapping[talao.tipoCliente] || '';
                row.classList.add(rowColorClass);
                const displayStatusCostura = talao.statusCostura || (talao.statusGeral === 'Cortado' ? 'Aguardando Material' : 'N/A');
                row.innerHTML = `
                    <td>${formatDate(talao.dataCorte)}</td>
                    <td>${talao.numeroRemessa || ''}</td>
                    <td>${talao.numeroTalaoSequencial || ''}</td>
                    <td>${talao.linha || ''}</td>
                    <td>${talao.modelo || ''}</td>
                    <td>${talao.corSapato || ''}</td>
                    <td>${talao.tipoCliente || ''}</td>
                    <td>${talao.pares || 0}</td>
                    <td><span class="status-badge ${getStatusClass(displayStatusCostura)}">${displayStatusCostura}</span></td>
                    <td>${formatDate(talao.costuraDataInicio) || ''}</td>
                    <td>${formatDate(talao.dataSaidaCostura) || ''}</td>
                `;
                taloesTableBody.appendChild(row);
            });
        }

        function updateAtelierSummaryCards() {
            const taloesForSummary = filteredTaloes;
            const aggregatedSummaryData = {
                'Aguardando Material': { byLineModel: {} },
                'Em Produção': { byLineModel: {} },
                'Finalizado': { byLineModel: {} }
            };
            taloesForSummary.forEach(talao => {
                const pares = talao.pares || 0;
                const linhaKey = talao.linha || 'N/A';
                const lineModelKey = `${linhaKey}.${talao.modelo || 'N/A'}`;
                const status = talao.statusCostura || (talao.statusGeral === 'Cortado' ? 'Aguardando Material' : 'N/A');
                if (aggregatedSummaryData[status]) {
                    aggregatedSummaryData[status].byLineModel[lineModelKey] = (aggregatedSummaryData[status].byLineModel[lineModelKey] || 0) + pares;
                }
            });
            renderAtelierSummaryCard(aggregatedSummaryData);
        }

        function renderAtelierSummaryCard(data) {
            let summaryHtml = '';
            let totalGeralAtelier = 0;
            const displayStatuses = ['Aguardando Material', 'Em Produção', 'Finalizado'];
            displayStatuses.forEach(status => {
                const statusData = data[status];
                let currentStatusTotal = 0;
                if (statusData && Object.keys(statusData.byLineModel).length > 0) {
                    currentStatusTotal = Object.values(statusData.byLineModel).reduce((sum, pares) => sum + pares, 0);
                }
                let byLineModelContent = '';
                if (statusData && Object.keys(statusData.byLineModel).length > 0) {
                    for (const key in statusData.byLineModel) {
                        byLineModelContent += `<div class="summary-item"><span class="item-label">${key.replace('.', ' - ')}</span><span class="item-value">${statusData.byLineModel[key]} pares</span></div>`;
                    }
                } else {
                    byLineModelContent = '<p class="no-summary-data-message">Nenhum talão por linha - modelo.</p>';
                }
                summaryHtml += `<div class="summary-status-section"><h4>Status: ${status}</h4><div class="summary-content-sub"><h5>Por Linha - Modelo</h5>${byLineModelContent}</div><div class="summary-total">Total: ${currentStatusTotal} pares</div></div>`;
                totalGeralAtelier += currentStatusTotal;
            });
            atelierSummaryCard.innerHTML = summaryHtml;
            if (totalGeralAtelier > 0) {
                const totalGeralElement = document.createElement('div');
                totalGeralElement.className = 'summary-total';
                totalGeralElement.style.gridColumn = '1 / -1';
                totalGeralElement.textContent = `Total Geral: ${totalGeralAtelier} pares`;
                atelierSummaryCard.appendChild(totalGeralElement);
            } else {
                atelierSummaryCard.innerHTML = '<p class="no-summary-data-message">Nenhum dado disponível para o ateliê logado com os filtros aplicados.</p>';
            }
        }