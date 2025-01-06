/***********************************************
  main.js
***********************************************/
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

const ADMIN_USER = "clicksy2025";
const ADMIN_PASS = "clicksy2025";

//////////////////////////
// RIFERIMENTI DOM
//////////////////////////
const emailOverlay = document.getElementById("emailOverlay");
const emailInput = document.getElementById("emailInput");
const emailSaveButton = document.getElementById("emailSaveButton");

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

//////////////////////////
// ADMIN
//////////////////////////
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

//////////////////////////
// AVVIO
//////////////////////////
if (getQueryParam("admin") === "1") {
  adminOverlay.style.display = "flex";
}

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

function loadAdminData() {
  fetch("/api/accessCount")
    .then(r => r.json())
    .then(d => totalAccessCount.textContent = d.totalAccessCount);

  fetch("/api/contacts")
    .then(r => r.json())
    .then(arr => {
      contactsListInput.value = arr.join("\n");
    });

  fetch("/api/social")
    .then(r => r.json())
    .then(data => {
      instagramLinkInput.value = data.instagram || "#";
      tiktokLinkInput.value = data.tiktok || "#";
    });

  fetch("/api/leaderboard")
    .then(r => r.json())
    .then(lb => {
      leaderboardUL.innerHTML = "";
      lb.forEach(item => {
        const li = document.createElement("li");
        li.textContent = `${item.ref} => ${item.discount} ore guadagnate`;
        leaderboardUL.appendChild(li);
      });
      if (lb.length === 0) {
        leaderboardUL.innerHTML = "<li>Nessun referral presente</li>";
      }
    });
}

saveContactsButton?.addEventListener("click", () => {
  const lines = contactsListInput.value.split("\n").map(l => l.trim()).filter(l => l);
  fetch("/api/contacts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Basic " + btoa(`${ADMIN_USER}:${ADMIN_PASS}`)
    },
    body: JSON.stringify({ contacts: lines })
  })
  .then(r => r.json())
  .then(d => alert("Contatti salvati con successo!"))
  .catch(err => alert("Errore salvataggio contatti"));
});

saveSocialButton?.addEventListener("click", () => {
  const ig = instagramLinkInput.value.trim() || "#";
  const tk = tiktokLinkInput.value.trim() || "#";
  fetch("/api/social", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Basic " + btoa(`${ADMIN_USER}:${ADMIN_PASS}`)
    },
    body: JSON.stringify({ instagram: ig, tiktok: tk })
  })
  .then(r => r.json())
  .then(d => alert("Link Social salvati con successo!"))
  .catch(err => alert("Errore salvataggio social"));
});

//////////////////////////
// LOGICA UTENTE
//////////////////////////
let userData = null;
let userTimerInterval = null;

function getUserData() {
  return fetch("/api/user")
    .then(res => {
      if (!res.ok) throw new Error("Utente non trovato");
      return res.json();
    })
    .then(data => {
      userData = data;
      return data;
    });
}

function saveUserData(updates) {
  return fetch("/api/user", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(updates)
  })
  .then(res => {
    if (!res.ok) throw new Error("Errore salvataggio user");
    return res.json();
  })
  .then(data => {
    userData = data;
    return data;
  });
}

function checkEmailOverlay() {
  if (!userData.email) {
    emailOverlay.style.display = "flex";
  }
}
emailSaveButton?.addEventListener("click", () => {
  const newEmail = emailInput.value.trim();
  if (!newEmail) return;
  saveUserData({ email: newEmail }).then(() => {
    emailOverlay.style.display = "none";
    alert("Email salvata con successo!");
  });
});

// Sezione per modificare la mail esistente
editEmailButton?.addEventListener("click", () => {
  const newEmail = editEmailInput.value.trim();
  if (!newEmail) return;
  saveUserData({ email: newEmail }).then(() => {
    alert("Email aggiornata con successo!");
  });
});

// Pulsante RITIRA 100 €
function handleClaimButton() {
  // Se c'è un timer attivo
  if (userData.timerEnd && userData.timerEnd > Date.now()) {
    // Timer in corso -> disabilitiamo
    showTimer(userData.timerEnd);
    return;
  }

  // Se utente ha "claimed" e non è scaduto il timer, disabilita
  if (userData.claimed && userData.timerEnd > Date.now()) {
    claimButton.textContent = "Peccato, non hai vinto";
    claimButton.style.backgroundColor = "#7f8c8d";
    claimButton.disabled = true;
  } else {
    // Abilitiamo
    claimButton.disabled = false;
  }
}

claimButton?.addEventListener("click", () => {
  // Spinner minimal
  claimButton.innerHTML = `<span class="spinner"></span> Caricamento...`;
  claimButton.disabled = true;

  setTimeout(() => {
    claimButton.style.backgroundColor = "#e74c3c";
    claimButton.textContent = "Peccato, non hai vinto";
    setTimeout(() => {
      claimButton.style.backgroundColor = "#7f8c8d"; 
      saveUserData({ claimed: true, timerEnd: Date.now() + (24 * 60 * 60 * 1000) })
        .then(() => {
          claimButton.textContent = "Peccato, non hai vinto";
          claimButton.disabled = true;
          showTimer(userData.timerEnd);
        });
    }, 500);
  }, 1500);
});

function showTimer(endTime) {
  timerDisplay.style.display = "block";
  updateTimer(endTime);
  userTimerInterval = setInterval(() => updateTimer(endTime), 1000);
}
function updateTimer(endTime) {
  const now = Date.now();
  const diff = endTime - now;
  if (diff <= 0) {
    clearInterval(userTimerInterval);
    timerDisplay.textContent = "";
    claimButton.disabled = false;
    claimButton.style.backgroundColor = "#f39c12";
    claimButton.textContent = "Ritira 100 €";
    userData.claimed = false;
    return;
  }
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  timerDisplay.textContent = `Timer: ${hours}h ${mins}m ${secs}s`;
}

// Link Personale
function initReferralLink() {
  referralLink.href = location.origin + location.pathname + "?ref=REF-EXAMPLE";
  referralLink.textContent = referralLink.href;
}
copyButton?.addEventListener("click", () => {
  navigator.clipboard.writeText(referralLink.textContent)
    .then(() => {
      copiedIcon.style.display = "block";
      setTimeout(() => copiedIcon.style.display = "none", 1500);
    });
});

// Instagram
instagramShare?.addEventListener("click", () => {
  const link = referralLink.textContent.trim();
  navigator.clipboard.writeText(link).then(() => {
    alert("Link copiato! Ora puoi condividerlo nella tua story.");
  });
  const shareText = encodeURIComponent("Partecipa a Clicksy! " + link);
  window.open(`instagram://story-camera?text=${shareText}`, "_blank");
});

// Contatti
function loadContacts() {
  fetch("/api/contacts")
    .then(r => r.json())
    .then(data => {
      contactsList.innerHTML = "";
      data.forEach(line => {
        const li = document.createElement("li");
        li.textContent = line;
        contactsList.appendChild(li);
      });
    });
}
goToContactsLink?.addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("contactsSection").scrollIntoView({ behavior: "smooth" });
});

// Social
function loadSocial() {
  fetch("/api/social")
    .then(r => r.json())
    .then(s => {
      instagramSocial.href = s.instagram || "#";
      tiktokSocial.href = s.tiktok || "#";
    });
}

//////////////////////////
// VETRINA
//////////////////////////
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
  while(true) {
    const nextInterval = getIntervalByIndex(currentIndex);
    const nextTimeSeconds = partialSums[partialSums.length-1] + nextInterval;
    const nextTimestamp = LAUNCH_TIMESTAMP + nextTimeSeconds*1000;
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
  while(true) {
    const nextInterval = getIntervalByIndex(currentIndex);
    const nextTimeSeconds = partialSums[partialSums.length-1] + nextInterval;
    const nextTimestamp = LAUNCH_TIMESTAMP + nextTimeSeconds*1000;
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
  const oneHourAgo = Date.now() - 3600*1000;
  globalItems = globalItems.filter(item => item.time >= oneHourAgo);
  globalItems.sort((a, b) => b.time - a.time);

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
    const pureText = splitted[splitted.length-1];
    div.setAttribute("data-original-text", pureText);
    div.querySelector("span").textContent = `${displayTime} fa - ${pureText}`;
  });
}

minimizeVetrina.addEventListener("click", () => {
  vetrinaScorrevole.classList.remove("show");
  vetrinaScorrevole.classList.add("hide");
  restoreVetrina.classList.add("visible");
});
restoreVetrina.addEventListener("click", () => {
  vetrinaScorrevole.classList.remove("hide");
  vetrinaScorrevole.classList.add("show");
  restoreVetrina.classList.remove("visible");
});

//////////////////////////
// INIT
//////////////////////////
function initAll() {
  getUserData()
    .then(data => {
      checkEmailOverlay();
      handleClaimButton();
      if (data.timerEnd && data.timerEnd > Date.now()) {
        showTimer(data.timerEnd);
      }
    })
    .catch(err => console.log("Errore user:", err));

  initReferralLink();
  loadContacts();
  loadSocial();
  initializeVetrina();
  setInterval(updateVetrinaTimers, 1000);
  setInterval(checkNewItem, 3000);
}

initAll();