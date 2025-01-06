/***********************************************
  main.js
***********************************************/
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

const ADMIN_USER = "clicksy2025";
const ADMIN_PASS = "clicksy2025";

// Riferimenti DOM Principali
const emailOverlay = document.getElementById("emailOverlay");
const emailInput = document.getElementById("emailInput");
const emailSaveButton = document.getElementById("emailSaveButton");

const editEmailSection = document.getElementById("editEmailSection");
const showEditEmailForm = document.getElementById("showEditEmailForm");
const editEmailForm = document.getElementById("editEmailForm");
const editEmailInput = document.getElementById("editEmailInput");
const editEmailButton = document.getElementById("editEmailButton");

const claimButton = document.getElementById("claimButton");
const timerDisplay = document.getElementById("timerDisplay");

const referralLink = document.getElementById("referralLink");
const copyButton = document.getElementById("copyButton");
const copiedIcon = document.getElementById("copiedIcon");

const instagramShare = document.getElementById("instagramShare");
const goToContactsLink = document.getElementById("goToContactsLink");
const contactsList = document.getElementById("contactsList");
const instagramSocial = document.getElementById("instagramSocial");
const tiktokSocial = document.getElementById("tiktokSocial");

// Vetrina
const vetrinaScorrevole = document.getElementById("vetrinaScorrevole");
const minimizeVetrina = document.getElementById("minimizeVetrina");
const restoreVetrina = document.getElementById("restoreVetrina");
const vetrinaItems = document.getElementById("vetrinaItems");

// Admin
const adminOverlay = document.getElementById("adminOverlay");
const adminLoginForm = document.getElementById("adminLoginForm");
const adminContent = document.getElementById("adminContent");
const adminLoginButton = document.getElementById("adminLoginButton");
const adminLogoutButton = document.getElementById("adminLogoutButton");
const adminUsername = document.getElementById("adminUsername");
const adminPassword = document.getElementById("adminPassword");
const totalAccessCount = document.getElementById("totalAccessCount");
const contactsListInput = document.getElementById("contactsListInput");
const saveContactsButton = document.getElementById("saveContactsButton");
const instagramLinkInput = document.getElementById("instagramLinkInput");
const tiktokLinkInput = document.getElementById("tiktokLinkInput");
const saveSocialButton = document.getElementById("saveSocialButton");
const leaderboardUL = document.getElementById("leaderboard");

const comeFunzionaAdmin = document.getElementById("comeFunzionaAdmin");
const linkPersonaleAdmin = document.getElementById("linkPersonaleAdmin");
const btnTextAdmin = document.getElementById("btnTextAdmin");
const btnColorAdmin = document.getElementById("btnColorAdmin");
const btnSizeAdmin = document.getElementById("btnSizeAdmin");
const clicksyTitleAdmin = document.getElementById("clicksyTitleAdmin");
const bgValueAdmin = document.getElementById("bgValueAdmin");
const newSectionType = document.getElementById("newSectionType");
const newSectionContent = document.getElementById("newSectionContent");
const addSectionButton = document.getElementById("addSectionButton");
const saveAdminConfig = document.getElementById("saveAdminConfig");

let bgChoiceRadio = null; // gestito a runtime
let userData = null;
let userTimerInterval = null;

// Config Client (caricato dall’adminConfig)
let adminConfig = null;

// Carica contatti, social
function loadContacts() {
  fetch("/api/contacts")
    .then(r => r.json())
    .then(arr => {
      contactsList.innerHTML = "";
      arr.forEach(line => {
        const li = document.createElement("li");
        li.textContent = line;
        contactsList.appendChild(li);
      });
    })
    .catch(err => console.error("Errore nel caricamento dei contatti:", err));
}

function loadSocial() {
  fetch("/api/social")
    .then(r => r.json())
    .then(d => {
      instagramSocial.href = d.instagram || "#";
      tiktokSocial.href = d.tiktok || "#";
    })
    .catch(err => console.error("Errore nel caricamento dei social:", err));
}

// Ottengo userData e applico logica
function getUserData() {
  return fetch("/api/user")
    .then(r => {
      if (!r.ok) throw new Error("User not found");
      return r.json();
    });
}

function saveUserData(body) {
  return fetch("/api/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  })
    .then(r => {
      if (!r.ok) throw new Error("Errore nel salvataggio dei dati utente");
      return r.json();
    });
}

// REFERRAL LOGIC
function checkReferralParam() {
  const ref = getQueryParam("ref");
  if (ref) {
    fetch(`/api/referral?ref=${encodeURIComponent(ref)}`)
      .then(r => r.json())
      .then(d => console.log("Referral param registrato:", d))
      .catch(err => console.error("Errore nel registrare il referral:", err));
  }
}

function initReferralLink(userD) {
  if (!userD.referralCode) {
    // In un mondo perfetto generiamo server-side
    userD.referralCode = "REF-" + Math.random().toString(36).substr(2, 9);
    // Salva il referralCode generato
    saveUserData({ referralCode: userD.referralCode })
      .then(updated => {
        userData = updated;
        updateReferralLink(updated.referralCode);
      })
      .catch(err => console.error("Errore nel salvare il referralCode:", err));
  } else {
    updateReferralLink(userD.referralCode);
  }
}

function updateReferralLink(referralCode) {
  const base = location.origin + location.pathname;
  const personalLink = `${base}?ref=${referralCode}`;
  referralLink.href = personalLink;
  referralLink.textContent = personalLink;
}

copyButton?.addEventListener("click", () => {
  navigator.clipboard.writeText(referralLink.textContent)
    .then(() => {
      copiedIcon.style.display = "block";
      setTimeout(() => copiedIcon.style.display = "none", 1500);
    })
    .catch(err => console.error("Errore nella copia del testo:", err));
});

// REFERRAL LOGIC END

// ADMIN LOGIC
function loadAdminData() {
  fetch("/api/accessCount")
    .then(r => r.json())
    .then(d => totalAccessCount.textContent = d.totalAccessCount)
    .catch(err => console.error("Errore nel caricamento accessCount:", err));

  fetch("/api/contacts")
    .then(r => r.json())
    .then(arr => {
      contactsListInput.value = arr.join("\n");
    })
    .catch(err => console.error("Errore nel caricamento contacts:", err));

  fetch("/api/social")
    .then(r => r.json())
    .then(d => {
      instagramLinkInput.value = d.instagram || "#";
      tiktokLinkInput.value = d.tiktok || "#";
    })
    .catch(err => console.error("Errore nel caricamento social:", err));

  fetch("/api/leaderboard")
    .then(r => r.json())
    .then(lb => {
      leaderboardUL.innerHTML = "";
      lb.forEach(item => {
        const li = document.createElement("li");
        li.textContent = `${item.referralCode} => ${item.successfulReferrals} referral`;
        leaderboardUL.appendChild(li);
      });
      if (lb.length === 0) {
        leaderboardUL.innerHTML = "<li>Nessun referral presente</li>";
      }
    })
    .catch(err => console.error("Errore nel caricamento leaderboard:", err));

  // Carica admin config
  fetch("/api/adminConfig")
    .then(r => r.json())
    .then(cfg => {
      adminConfig = cfg;
      comeFunzionaAdmin.value = cfg.comeFunzionaText;
      linkPersonaleAdmin.value = cfg.linkPersonaleText;
      btnTextAdmin.value = cfg.ritiraButtonText;
      btnColorAdmin.value = cfg.ritiraButtonColor || "#f39c12";
      btnSizeAdmin.value = cfg.ritiraButtonSize || "1em";
      clicksyTitleAdmin.value = cfg.clicksyTitle || "Partecipa a Clicksy!";
      bgValueAdmin.value = cfg.backgroundValue;
      // Se customSections esiste, iniettiamo nel DOM
      if (cfg.customSections && cfg.customSections.length > 0) {
        cfg.customSections.forEach(s => addCustomSection(s));
      }
      // Aggiorna interfaccia
      document.querySelectorAll("input[name='bgChoice']").forEach(rad => {
        if (rad.value === cfg.backgroundChoice) {
          rad.checked = true;
          bgChoiceRadio = rad;
        }
      });
    })
    .catch(err => console.error("Errore nel caricamento adminConfig:", err));
}

// Salva admin config
saveAdminConfig?.addEventListener("click", () => {
  const body = {
    comeFunzionaText: comeFunzionaAdmin.value,
    linkPersonaleText: linkPersonaleAdmin.value,
    ritiraButtonText: btnTextAdmin.value,
    ritiraButtonColor: btnColorAdmin.value,
    ritiraButtonSize: btnSizeAdmin.value,
    clicksyTitle: clicksyTitleAdmin.value,
    backgroundChoice: document.querySelector("input[name='bgChoice']:checked")?.value || "color",
    backgroundValue: bgValueAdmin.value
  };
  fetch("/api/adminConfig", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Basic " + btoa(`${ADMIN_USER}:${ADMIN_PASS}`)
    },
    body: JSON.stringify(body)
  })
    .then(r => {
      if (!r.ok) throw new Error("Errore nel salvataggio adminConfig");
      return r.json();
    })
    .then(d => {
      alert("Configurazione salvata!");
      adminConfig = d.adminConfig;
      applyAdminConfig(d.adminConfig);
    })
    .catch(err => {
      console.error("Errore nel salvataggio adminConfig:", err);
      alert("Errore salvataggio configurazione.");
    });
});

// Aggiungi sezione custom
addSectionButton?.addEventListener("click", () => {
  const stype = newSectionType.value; // text o code
  const scontent = newSectionContent.value;
  if (!scontent.trim()) return;
  const newSec = { type: stype, content: scontent };
  // Salviamo
  fetch("/api/adminConfig", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Basic " + btoa(`${ADMIN_USER}:${ADMIN_PASS}`)
    },
    body: JSON.stringify({ newSection: newSec })
  })
    .then(r => {
      if (!r.ok) throw new Error("Errore nell'aggiunta della sezione");
      return r.json();
    })
    .then(d => {
      adminConfig = d.adminConfig;
      addCustomSection(newSec);
      alert("Nuova sezione aggiunta!");
    })
    .catch(err => {
      console.error("Errore nell'aggiunta della sezione:", err);
      alert("Errore aggiunta sezione.");
    });
});

// Funzione che inietta una sezione custom nel DOM
function addCustomSection(sec) {
  const container = document.getElementById("mainContainer");
  if (!container) {
    console.error("mainContainer non trovato nel DOM.");
    return;
  }
  const div = document.createElement("div");
  div.style.marginTop = "16px";
  div.style.padding = "14px";
  div.style.borderRadius = "8px";
  div.style.backgroundColor = "#fafafa";

  if (sec.type === "text") {
    div.textContent = sec.content;
  } else if (sec.type === "code") {
    // interpretiamo come HTML
    div.innerHTML = sec.content;
  }
  container.appendChild(div);
}

// Applica config (background, testo, etc.)
function applyAdminConfig(cfg) {
  const comeFunzionaText = document.getElementById("comeFunzionaText");
  const linkPersonaleText = document.getElementById("linkPersonaleText");
  const clicksyTitle = document.getElementById("clicksyTitle");

  if (comeFunzionaText) comeFunzionaText.textContent = cfg.comeFunzionaText;
  if (linkPersonaleText) linkPersonaleText.textContent = cfg.linkPersonaleText;
  if (claimButton) {
    claimButton.textContent = cfg.ritiraButtonText || "Ritira 100€";
    claimButton.style.backgroundColor = cfg.ritiraButtonColor || "#f39c12";
    claimButton.style.fontSize = cfg.ritiraButtonSize || "1em";
  }
  if (clicksyTitle) clicksyTitle.textContent = cfg.clicksyTitle || "Partecipa a Clicksy!";

  // background
  if (cfg.backgroundChoice === "image") {
    document.body.style.background = `url(${cfg.backgroundValue}) no-repeat center center / cover`;
  } else {
    document.body.style.background = cfg.backgroundValue || "linear-gradient(115deg, #1fd1f9 10%, #b621fe 90%)";
  }

  // Aggiungi sezioni custom
  if (cfg.customSections && cfg.customSections.length > 0) {
    cfg.customSections.forEach(s => addCustomSection(s));
  }
}

// EVENT LISTENERS PER ADMIN
adminLoginButton?.addEventListener("click", () => {
  if (adminUsername.value === ADMIN_USER && adminPassword.value === ADMIN_PASS) {
    adminLoginForm.style.display = "none";
    adminContent.style.display = "block";
    loadAdminData();
  } else {
    alert("Credenziali errate!");
  }
});

adminLogoutButton?.addEventListener("click", () => {
  adminUsername.value = "";
  adminPassword.value = "";
  adminContent.style.display = "none";
  adminLoginForm.style.display = "block";
  adminOverlay.style.display = "none";
});

// REFERRAL LOGIC END

// Gestione timer
function handleTimer(endTime) {
  if (endTime > Date.now()) {
    claimButton.textContent = "Peccato, non hai vinto";
    claimButton.disabled = true;
    showTimer(endTime);
  } else {
    claimButton.disabled = false;
  }
}

// Timer display
function showTimer(endTime) {
  if (!timerDisplay) return;
  timerDisplay.style.display = "block";
  updateTimer(endTime);
  userTimerInterval = setInterval(() => updateTimer(endTime), 1000);
}

function updateTimer(endTime) {
  if (!timerDisplay) return;
  const diff = endTime - Date.now();
  if (diff <= 0) {
    clearInterval(userTimerInterval);
    timerDisplay.textContent = "";
    if (claimButton) {
      claimButton.disabled = false;
      claimButton.style.backgroundColor = btnColorAdmin?.value || "#f39c12";
      claimButton.textContent = btnTextAdmin?.value || "Ritira 100€";
    }
    saveUserData({ claimed: false, timerEnd: 0 })
      .then(() => {})
      .catch(err => console.error("Errore nel resettare i dati utente:", err));
    return;
  }
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  timerDisplay.textContent = `Timer: ${h}h ${m}m ${s}s`;
}

//  Vetrina
const LAUNCH_TIMESTAMP = new Date("2025-01-01T00:00:00Z").getTime();
let partialSums = [0];
let globalItems = [];

function getIntervalByIndex(i) {
  const val = (i * 9301 + 49297) % 233280;
  const rand = val / 233280;
  return 5 + Math.floor(rand * 16);
}

function initializeVetrina() {
  const now = Date.now();
  let currentIndex = 0;
  while (true) {
    const nextInterval = getIntervalByIndex(currentIndex);
    const nextTimeSeconds = partialSums[partialSums.length - 1] + nextInterval;
    const nextTimestamp = LAUNCH_TIMESTAMP + nextTimeSeconds * 1000;
    if (nextTimestamp > now) break;
    partialSums.push(nextTimeSeconds);
    createItem(nextTimestamp, currentIndex);
    currentIndex++;
  }
  renderVetrina();
}

function createItem(timestamp, index) {
  const messages = [
    "È stata appena inviata una nuova vincita!",
    "Un premio inatteso è stato distribuito ora!",
    "Un utente ha ricevuto un bonus speciale!",
    "Un nuovo payout è stato appena erogato!",
    "Una nuova vincita è stata confermata!"
  ];
  const msgIndex = index % messages.length;
  globalItems.push({ time: timestamp, text: messages[msgIndex] });
}

function checkNewItem() {
  const now = Date.now();
  const lastIndex = partialSums.length - 1;
  let currentIndex = lastIndex;
  while (true) {
    const nextInterval = getIntervalByIndex(currentIndex);
    const nextTimeSeconds = partialSums[partialSums.length - 1] + nextInterval;
    const nextTimestamp = LAUNCH_TIMESTAMP + nextTimeSeconds * 1000;
    if (nextTimestamp <= now) {
      partialSums.push(nextTimeSeconds);
      createItem(nextTimestamp, currentIndex);
      currentIndex++;
    } else {
      break;
    }
  }
  renderVetrina();
}

function renderVetrina() {
  const oneHourAgo = Date.now() - 3600 * 1000;
  globalItems = globalItems.filter(item => item.time >= oneHourAgo);
  globalItems.sort((a, b) => b.time - a.time);
  if (!vetrinaItems) return;
  vetrinaItems.innerHTML = "";
  globalItems.forEach(item => {
    const div = document.createElement("div");
    div.classList.add("vetrina-item");
    div.dataset.time = item.time;
    div.innerHTML = `<span>${item.text}</span>`;
    vetrinaItems.appendChild(div);
  });
}

function updateVetrinaTimers() {
  if (!vetrinaItems) return;
  const itemDivs = vetrinaItems.querySelectorAll(".vetrina-item");
  itemDivs.forEach(div => {
    const itemTime = parseInt(div.dataset.time, 10);
    const timePassed = Math.floor((Date.now() - itemTime) / 1000);
    let displayTime = "";
    if (timePassed >= 3600) {
      const hours = Math.floor(timePassed / 3600);
      displayTime = `${hours} ore`;
    } else if (timePassed >= 60) {
      const minutes = Math.floor(timePassed / 60);
      displayTime = `${minutes} minuti`;
    } else {
      displayTime = `${timePassed} secondi`;
    }
    const originalText = div.getAttribute("data-original-text") || div.querySelector("span").textContent;
    const splitted = originalText.split(" - ");
    const pureText = splitted[splitted.length - 1];
    div.setAttribute("data-original-text", pureText);
    div.querySelector("span").textContent = `${displayTime} fa - ${pureText}`;
  });
}

minimizeVetrina?.addEventListener("click", () => {
  vetrinaScorrevole.classList.remove("show");
  vetrinaScorrevole.classList.add("hide");
  restoreVetrina.classList.add("visible");
});

restoreVetrina?.addEventListener("click", () => {
  vetrinaScorrevole.classList.remove("hide");
  vetrinaScorrevole.classList.add("show");
  restoreVetrina.classList.remove("visible");
});

// CLAIM BUTTON LOGIC
claimButton?.addEventListener("click", () => {
  if (!userData) return;
  // Se già disabilitato
  if (claimButton.disabled) return;

  // Mostra spinner
  if (claimButton) {
    claimButton.innerHTML = `<span class="spinner" style="margin-right:8px;"></span>Caricamento...`;
    claimButton.disabled = true;
  }

  setTimeout(() => {
    // Diventa rosso
    if (claimButton) {
      claimButton.style.backgroundColor = "#e74c3c";
      claimButton.textContent = "Peccato, non hai vinto";
    }

    // Timer 24h, a meno che arrivi da un link e non abbia usato vantaggio
    let newTimer = 24 * 60 * 60 * 1000;
    if (!userData.usedRefBenefit && userData.arrivedFrom && !userData.claimed) {
      // Prima volta => 10h
      newTimer = 10 * 60 * 60 * 1000;
      // E chi l’ha portato riceve +4h
      const refOwner = userData.arrivedFrom;
      addDiscountToOwner(refOwner);
      // Mark usedRefBenefit
      userData.usedRefBenefit = true;
    }

    setTimeout(() => {
      if (claimButton) {
        claimButton.style.backgroundColor = "#7f8c8d";
        // claimed => true
        saveUserData({
          claimed: true,
          usedRefBenefit: userData.usedRefBenefit,
          timerEnd: Date.now() + newTimer
        })
          .then(updated => {
            userData = updated;
            handleTimer(updated.timerEnd);
          })
          .catch(err => console.error("Errore nel salvare i dati utente dopo il claim:", err));
      }
    }, 500);

  }, 1500);
});

function addDiscountToOwner(ownerUid) {
  // Implementazione rapida: incrementa successfulReferrals
  fetch(`/api/user/${ownerUid}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ incrementReferrals: true })
  })
    .then(r => {
      if (!r.ok) throw new Error("Errore nell'aggiornamento dell'owner");
      return r.json();
    })
    .then(data => {
      console.log("Owner aggiornato con successo:", data);
    })
    .catch(err => console.error("Errore nell'aggiornamento dell'owner:", err));
}

// Inizializzo vetrina
initializeVetrina();

// Funzione principale di inizializzazione
function initAll() {
  // Carico config e la applico
  fetch("/api/adminConfig")
    .then(r => r.json())
    .then(cfg => {
      adminConfig = cfg;
      applyAdminConfig(cfg);
    })
    .catch(err => console.error("Errore nel caricamento adminConfig all'inizializzazione:", err));

  // Check referral
  checkReferralParam();

  // Carico user
  getUserData()
    .then(u => {
      userData = u;
      // Se mail = null => popup
      if (!u.email) {
        if (emailOverlay) emailOverlay.style.display = "flex";
      }
      // Se timer non scaduto => disabilito
      if (u.timerEnd && u.timerEnd > Date.now()) {
        if (claimButton) {
          claimButton.disabled = true;
          claimButton.style.backgroundColor = "#7f8c8d";
          claimButton.textContent = "Peccato, non hai vinto";
          showTimer(u.timerEnd);
        }
      } else if (u.claimed) {
        // Se claimed ma timer scaduto => re-enable
        if (u.timerEnd < Date.now()) {
          saveUserData({ claimed: false, timerEnd: 0 })
            .then(() => {
              if (claimButton) claimButton.disabled = false;
            })
            .catch(err => console.error("Errore nel resettare i dati utente:", err));
        } else {
          // Timer non scaduto
          if (claimButton) {
            claimButton.disabled = true;
            claimButton.style.backgroundColor = "#7f8c8d";
            claimButton.textContent = "Peccato, non hai vinto";
            showTimer(u.timerEnd);
          }
        }
      }

      // Genero link referral univoco
      initReferralLink(u);
    })
    .catch(err => {
      console.error("Errore nel caricamento dei dati utente:", err);
      // Potresti voler gestire l'errore mostrando un messaggio all'utente
    });

  loadContacts();
  loadSocial();
  initializeVetrina();
  setInterval(updateVetrinaTimers, 1000);
  setInterval(checkNewItem, 3000);
}

// Apertura e chiusura del form di modifica email
showEditEmailForm?.addEventListener("click", (e) => {
  e.preventDefault();
  if (editEmailForm) {
    editEmailForm.style.display = editEmailForm.style.display === "none" ? "flex" : "none";
  }
});

editEmailButton?.addEventListener("click", () => {
  const newEm = editEmailInput.value.trim();
  if (!newEm) return;
  saveUserData({ email: newEm })
    .then(d => {
      userData = d;
      if (emailOverlay) emailOverlay.style.display = "none";
      alert("Email aggiornata con successo!");
    })
    .catch(err => {
      console.error("Errore nell'aggiornamento dell'email:", err);
      alert("Errore nell'aggiornamento dell'email.");
    });
});

// Inizializzo tutto dopo che il DOM è caricato
document.addEventListener("DOMContentLoaded", initAll);

// Funzioni duplicate rimosse per evitare conflitti
