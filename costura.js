// ===============================
// COSTURA.JS (Firebase compat)
// ===============================

(function () {
  // --- Firebase config ---
  const firebaseConfig = {
    apiKey: "AIzaSyCLb8BeZODM8vMynaIXINx4AN_P8snTBk8",
    authDomain: "sistemataloes.firebaseapp.com",
    projectId: "sistemataloes",
    storageBucket: "sistemataloes.appspot.com",
    messagingSenderId: "684534379685",
    appId: "default-app-id"
  };

  // --- Init Firebase ---
  try {
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  } catch (e) {
    console.error("Erro ao inicializar Firebase:", e);
  }

  const auth = firebase.auth();
  const db = firebase.firestore();

  try {
  db.settings({
    experimentalForceLongPolling: true,
    experimentalAutoDetectLongPolling: true
  });
} catch (e) {
  console.warn("Firestore settings warning:", e);
}
  

  // --- Elementos ---
  const menuNav = document.getElementById("menuNav");
  const userNameDisplay = document.getElementById("userNameDisplay");
  const userNivelDisplay = document.getElementById("userNivelDisplay");
  const logoutButton = document.getElementById("logoutButton");

  const barcodeInputEntry = document.getElementById("barcodeInputEntry");
  const barcodeInputExit = document.getElementById("barcodeInputExit");
  const entryMessageDiv = document.getElementById("entryMessage");
  const exitMessageDiv = document.getElementById("exitMessage");
  const lastScannedEntryList = document.getElementById("lastScannedEntryList");
  const lastScannedExitList = document.getElementById("lastScannedExitList");
  const loadingMessageDiv = document.getElementById("loadingMessage");

  // --- Estado ---
  let allTaloes = [];
  let currentUserName = "";
  const lastEntries = [];
  const lastExits = [];
  const MAX_LAST_SCANNED = 5;
  let isDataLoaded = false;
  let unsubscribeTaloes = null;

  // --- Níveis ---
  const nivelNomes = {
    "01": "Cadastro",
    "02": "Corte",
    "03": "Costura",
    "04": "Montagem",
    "05": "Admin",
    "06": "Consultor",
    "07": "Super"
  };

  const pages = [
    { name: "Index", href: "index.html", levels: ["01", "02", "03", "04", "05", "06", "07"] },

    { name: "Cadastro Usuarios", href: "cadastroUsuarios.html", levels: ["07"] },
    { name: "Cadastro Talões", href: "cadastroTaloes.html", levels: ["01", "05", "07"] },

    { name: "Romaneio", href: "romaneio.html", levels: ["05", "07"] },
    { name: "Excluir Dados", href: "excluirDados.html", levels: ["05", "07"] },
    { name: "Registro em Massa", href: "registroEmMassa.html", levels: ["07"] },

    { name: "Corte", href: "corte.html", levels: ["02", "07"] },
    { name: "Relatório Erros", href: "relatorioerros.html", levels: ["02", "04", "07"] },

    { name: "Resumo", href: "resumo.html", levels: ["04", "06", "07"] },
    { name: "Cronograma", href: "cronograma.html", levels: ["01", "02", "04", "05", "06", "07"] },
    { name: "Cronograma Mobile", href: "cronogramamobile.html", levels: ["06", "07"] },
    { name: "Relatório Master", href: "relatorioMaster.html", levels: ["05", "07"] },

    { name: "Costura", href: "costura.html", levels: ["03", "07"] },
    { name: "Relatorio Atelier", href: "relatorioAtelier.html", levels: ["03", "07"] },
    { name: "Atlier Celular", href: "relatoriomobile.html", levels: ["03", "07"] },

    { name: "Distribuição", href: "distribuicao.html", levels: ["04", "07"] },
    { name: "Talonagem", href: "talonagem.html", levels: ["04", "07"] },
    { name: "Montagem", href: "montagem.html", levels: ["05", "07"] }
  ];

  // --- UI helpers ---
  function showLoading(msg) {
    if (!loadingMessageDiv) return;
    loadingMessageDiv.style.display = "block";
    loadingMessageDiv.textContent =
      msg || "Carregando dados... Por favor, aguarde apagar essa mensagem para começar a ler.";
  }

  function hideLoading() {
    if (!loadingMessageDiv) return;
    loadingMessageDiv.style.display = "none";
  }

  function setMessage(div, text, type) {
    if (!div) return;
    div.textContent = text || "";
    div.className = "scanner-message" + (type ? " " + type : "");
  }

  function safeFocus(el) {
    try {
      if (el) el.focus();
    } catch (e) {}
  }

  function addLastScanned(listArray, barcode, displayElement) {
    if (!displayElement) return;
    listArray.unshift(barcode);
    if (listArray.length > MAX_LAST_SCANNED) listArray.pop();
    displayElement.innerHTML = listArray.map((item) => `<li>${item}</li>`).join("");
  }

  function normalizeBarcode(raw) {
    let barcode = (raw || "").trim();
    if (barcode.length > 0 && barcode.charAt(0) !== "1") {
      barcode = "1" + barcode.substring(1);
    }
    return barcode;
  }

  function generateMenu(userLevel, userName) {
    if (!menuNav) return;

    menuNav.innerHTML = "";
    const userNivelText = nivelNomes[userLevel] || `Nível ${userLevel}`;

    if (userNameDisplay) userNameDisplay.textContent = `Olá, ${userName || "Usuário"}!`;
    if (userNivelDisplay) userNivelDisplay.textContent = `Setor: ${userNivelText}`;

    pages.forEach((page) => {
      if (page.levels.includes(userLevel)) {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = page.href;
        a.textContent = page.name;
        li.appendChild(a);
        menuNav.appendChild(li);
      }
    });
  }

  // --- Listener Talões ---
  function listenToTaloes() {
    if (typeof unsubscribeTaloes === "function") unsubscribeTaloes();

    unsubscribeTaloes = db.collection("taloes").onSnapshot(
      (snapshot) => {
        allTaloes = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

        if (!isDataLoaded) {
          isDataLoaded = true;
          hideLoading();

          if (barcodeInputEntry) barcodeInputEntry.disabled = false;
          if (barcodeInputExit) barcodeInputExit.disabled = false;
          safeFocus(barcodeInputEntry);

          console.log("Talões carregados:", allTaloes.length);
        }
      },
      (error) => {
        console.error("Erro ao escutar talões:", error);
        showLoading("Erro ao carregar talões. Confira internet e data/hora do tablet.");
      }
    );
  }

  async function updateTalaoInFirestore(talaoId, updates, messageDiv, barcode) {
    try {
      await db.collection("taloes").doc(talaoId).update(updates);

      if (messageDiv) {
        setMessage(messageDiv, "Sucesso!", "success");
      }

      if (messageDiv === entryMessageDiv) addLastScanned(lastEntries, barcode, lastScannedEntryList);
      if (messageDiv === exitMessageDiv) addLastScanned(lastExits, barcode, lastScannedExitList);

      if (messageDiv) setTimeout(() => setMessage(messageDiv, "", ""), 3000);
    } catch (error) {
      console.error("Erro ao atualizar talão:", talaoId, error);
      if (messageDiv) {
        setMessage(messageDiv, `Erro: ${error.message || "falha ao atualizar"}`, "error");
        setTimeout(() => setMessage(messageDiv, "", ""), 5000);
      }
      throw error;
    }
  }

  // --- Boot ---
  showLoading("Carregando dados...");

  auth.onAuthStateChanged(async (user) => {
    try {
      if (!user) {
        window.location.href = "login.html";
        return;
      }

      const email = user.email || "";
      const userSnap = await db.collection("Usuario").doc(email).get();

      if (!userSnap.exists) {
        alert("Dados do usuário não encontrados. Faça login novamente.");
        await auth.signOut();
        window.location.href = "login.html";
        return;
      }

      const userData = userSnap.data() || {};
      const nivelAcesso = userData.nivelAcesso;
      currentUserName = userData.Nome || "";

      const allowed = pages.find((p) => p.href === "costura.html" && p.levels.includes(nivelAcesso));
      if (!allowed) {
        alert("Você não tem permissão para acessar esta página.");
        window.location.href = "index.html";
        return;
      }

      generateMenu(nivelAcesso, currentUserName);
      listenToTaloes();
    } catch (err) {
      console.error("Erro no login/carregamento:", err);
      showLoading("Erro ao carregar. Verifique internet e data/hora do tablet e tente novamente.");
    }
  });

  // Logout
  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      try {
        await auth.signOut();
        window.location.href = "login.html";
      } catch (error) {
        console.error("Erro ao fazer logout:", error);
        alert("Erro ao fazer logout. Tente novamente.");
      }
    });
  }

  // Entrada
  if (barcodeInputEntry) {
    barcodeInputEntry.addEventListener("keypress", async (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();

      if (!isDataLoaded) {
        setMessage(entryMessageDiv, "Aguarde o carregamento dos dados.", "error");
        return;
      }

      let barcode = normalizeBarcode(barcodeInputEntry.value);
      barcodeInputEntry.value = "";
      setMessage(entryMessageDiv, "Processando...", "");

      if (!barcode) {
        setMessage(entryMessageDiv, "Código de barras vazio.", "error");
        return;
      }

      const talao = allTaloes.find((t) => t.codigoBarrasIdentificador === barcode);
      if (!talao) {
        setMessage(entryMessageDiv, `Talão com código ${barcode} não encontrado.`, "error");
        return;
      }

      // tentativa errada
      if (talao.idAtelieResponsavel && talao.idAtelieResponsavel !== currentUserName) {
        try {
          await updateTalaoInFirestore(
            talao.id,
            { registroErrado: `${currentUserName} (${new Date().toISOString()})` },
            null,
            barcode
          );
        } catch (e) {}

        setMessage(
          entryMessageDiv,
          `Talão ${barcode} já atribuído a outro ateliê: ${talao.idAtelieResponsavel}.`,
          "error"
        );
        return;
      }

      if (talao.statusGeral === "Finalizado" || talao.statusGeral === "Costurado") {
        setMessage(
          entryMessageDiv,
          `Talão ${barcode} já foi finalizado/costurado. Status atual: ${talao.statusGeral}.`,
          "error"
        );
        return;
      }

      const updates = {
        statusCostura: "Em Produção",
        statusGeral: "Costurando",
        costuraDataInicio: new Date().toISOString().split("T")[0],
        costuraUsuario: currentUserName,
        idAtelieResponsavel: currentUserName
      };

      await updateTalaoInFirestore(talao.id, updates, entryMessageDiv, barcode);
    });
  }

  // Saída
  if (barcodeInputExit) {
    barcodeInputExit.addEventListener("keypress", async (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();

      if (!isDataLoaded) {
        setMessage(exitMessageDiv, "Aguarde o carregamento dos dados.", "error");
        return;
      }

      let barcode = normalizeBarcode(barcodeInputExit.value);
      barcodeInputExit.value = "";
      setMessage(exitMessageDiv, "Processando...", "");

      if (!barcode) {
        setMessage(exitMessageDiv, "Código de barras vazio.", "error");
        return;
      }

      const talao = allTaloes.find((t) => t.codigoBarrasIdentificador === barcode);
      if (!talao) {
        setMessage(exitMessageDiv, `Talão com código ${barcode} não encontrado.`, "error");
        return;
      }

      if (talao.idAtelieResponsavel !== currentUserName) {
        setMessage(
          exitMessageDiv,
          `Talão ${barcode} não pertence ao seu ateliê (${talao.idAtelieResponsavel}).`,
          "error"
        );
        return;
      }

      if (talao.statusCostura !== "Em Produção") {
        setMessage(
          exitMessageDiv,
          `Talão ${barcode} não está em produção para dar saída. Status atual: ${talao.statusCostura || "N/A"}.`,
          "error"
        );
        return;
      }

      const updates = {
        statusCostura: "Finalizado",
        statusGeral: "Costurado",
        dataSaidaCostura: new Date().toISOString().split("T")[0]
      };

      await updateTalaoInFirestore(talao.id, updates, exitMessageDiv, barcode);
    });
  }
})();

