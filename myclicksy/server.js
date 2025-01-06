/***********************************************
  server.js
***********************************************/
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const path = require("path");

let db = require("./db.json");

// Credenziali Admin
const ADMIN_USER = "clicksy2025";
const ADMIN_PASS = "clicksy2025";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public"))); // serve i file statici

function saveDB() {
  fs.writeFileSync(path.join(__dirname, "db.json"), JSON.stringify(db, null, 2));
}

// Genera userId se non esiste
app.use((req, res, next) => {
  if (!req.cookies.userId) {
    const newUserId = "user-" + Math.random().toString(36).substr(2, 9);
    res.cookie("userId", newUserId, { maxAge: 31536000000 }); // 1 anno
    db.users[newUserId] = {
      email: null,
      claimed: false,
      timerEnd: 0,
      referralCode: "REF-" + Math.random().toString(36).substr(2, 9),
      usedRefBenefit: false,
      arrivedFrom: null,
      successfulReferrals: 0
    };
    saveDB();
  }
  next();
});

// Contatore accessi
app.use((req, res, next) => {
  db.totalAccessCount++;
  saveDB();
  next();
});

/*
  ================================
  API UTENTE
  ================================
*/
app.get("/api/user", (req, res) => {
  const uid = req.cookies.userId;
  if (!uid || !db.users[uid]) {
    return res.status(400).json({ error: "Utente non trovato" });
  }
  res.json(db.users[uid]);
});

app.post("/api/user", (req, res) => {
  const uid = req.cookies.userId;
  if (!uid) {
    return res.status(400).json({ error: "Cookie utente mancante" });
  }
  if (!db.users[uid]) {
    // Creiamo entry se non esiste
    db.users[uid] = {
      email: null,
      claimed: false,
      timerEnd: 0,
      referralCode: "REF-" + Math.random().toString(36).substr(2, 9),
      usedRefBenefit: false,
      arrivedFrom: null,
      successfulReferrals: 0
    };
  }
  let userData = db.users[uid];

  if (req.body.email !== undefined) userData.email = req.body.email;
  if (req.body.claimed !== undefined) userData.claimed = req.body.claimed;
  if (req.body.timerEnd !== undefined) userData.timerEnd = req.body.timerEnd;
  if (req.body.usedRefBenefit !== undefined) userData.usedRefBenefit = req.body.usedRefBenefit;
  if (req.body.arrivedFrom !== undefined) userData.arrivedFrom = req.body.arrivedFrom;
  if (req.body.successfulReferrals !== undefined) userData.successfulReferrals = req.body.successfulReferrals;

  db.users[uid] = userData;
  saveDB();
  res.json(userData);
});

/*
  ================================
  API REFERRAL
  ================================
  
  - /api/referral?ref=XXXX => l’utente in arrivo registra "arrivedFrom" e timer ridotto a 10h se non ha mai cliccato prima.
  - La persona "ref" (il proprietario di quel referral) otterrà +4 ore SOLO dopo che questo utente clicca effettivamente.
*/
app.get("/api/referral", (req, res) => {
  const { ref } = req.query;
  if (!ref) {
    return res.status(400).json({ error: "Parametro ref mancante" });
  }

  // Trovare chi ha referralCode = ref
  let ownerUid = null;
  for (let uid in db.users) {
    if (db.users[uid].referralCode === ref) {
      ownerUid = uid;
      break;
    }
  }
  if (!ownerUid) {
    return res.json({ message: "Referral non trovato", ref });
  }

  // Se il visitatore è lo stesso proprietario => no sense
  const visitorId = req.cookies.userId;
  if (visitorId === ownerUid) {
    return res.json({ message: "Stesso utente, nessun referral", ref });
  }

  // Salviamo arrivedFrom (solo se non l'ha mai definito)
  let visitorData = db.users[visitorId];
  if (!visitorData.arrivedFrom) {
    visitorData.arrivedFrom = ownerUid;
    saveDB();
  }

  res.json({ message: "OK, referral registrato", ref, ownerUid });
});

/*
  ================================
  API CONTATTI
  ================================
*/
app.get("/api/contacts", (req, res) => {
  res.json(db.contacts);
});
app.post("/api/contacts", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Non autorizzato" });

  const base64 = authHeader.split(" ")[1];
  const decoded = Buffer.from(base64, "base64").toString("ascii");
  const [u, p] = decoded.split(":");
  if (u !== ADMIN_USER || p !== ADMIN_PASS) {
    return res.status(401).json({ error: "Credenziali Admin errate" });
  }
  if (!Array.isArray(req.body.contacts)) {
    return res.status(400).json({ error: "Formato contatti non valido" });
  }
  db.contacts = req.body.contacts;
  saveDB();
  res.json({ message: "Contatti aggiornati con successo", contacts: db.contacts });
});

/*
  ================================
  API SOCIAL
  ================================
*/
app.get("/api/social", (req, res) => {
  res.json(db.social);
});
app.post("/api/social", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Non autorizzato" });

  const base64 = authHeader.split(" ")[1];
  const decoded = Buffer.from(base64, "base64").toString("ascii");
  const [u, p] = decoded.split(":");
  if (u !== ADMIN_USER || p !== ADMIN_PASS) {
    return res.status(401).json({ error: "Credenziali Admin errate" });
  }

  const { instagram, tiktok } = req.body;
  if (instagram !== undefined) db.social.instagram = instagram;
  if (tiktok !== undefined) db.social.tiktok = tiktok;
  saveDB();
  res.json({ message: "Social salvati con successo", social: db.social });
});

/*
  ================================
  API ACCESS COUNT
  ================================
*/
app.get("/api/accessCount", (req, res) => {
  res.json({ totalAccessCount: db.totalAccessCount });
});

/*
  ================================
  API LEADERBOARD
  ================================
  => restituisce array di {referralCode, successfulReferrals}
*/
app.get("/api/leaderboard", (req, res) => {
  let arr = [];
  for (let uid in db.users) {
    const u = db.users[uid];
    arr.push({
      referralCode: u.referralCode,
      successfulReferrals: u.successfulReferrals
    });
  }
  arr.sort((a,b) => b.successfulReferrals - a.successfulReferrals);
  res.json(arr);
});

/*
  ================================
  API ADMINCONFIG
  (per modificare testi, pulsante, sfondo, sezioni, ecc.)
  ================================
*/
app.get("/api/adminConfig", (req, res) => {
  res.json(db.adminConfig);
});
app.post("/api/adminConfig", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Non autorizzato" });

  const base64 = authHeader.split(" ")[1];
  const decoded = Buffer.from(base64, "base64").toString("ascii");
  const [u, p] = decoded.split(":");
  if (u !== ADMIN_USER || p !== ADMIN_PASS) {
    return res.status(401).json({ error: "Credenziali Admin errate" });
  }

  let config = db.adminConfig;

  // Aggiorna i campi se presenti
  if (req.body.comeFunzionaText !== undefined) config.comeFunzionaText = req.body.comeFunzionaText;
  if (req.body.linkPersonaleText !== undefined) config.linkPersonaleText = req.body.linkPersonaleText;
  if (req.body.ritiraButtonText !== undefined) config.ritiraButtonText = req.body.ritiraButtonText;
  if (req.body.ritiraButtonColor !== undefined) config.ritiraButtonColor = req.body.ritiraButtonColor;
  if (req.body.ritiraButtonSize !== undefined) config.ritiraButtonSize = req.body.ritiraButtonSize;
  if (req.body.backgroundChoice !== undefined) config.backgroundChoice = req.body.backgroundChoice;
  if (req.body.backgroundValue !== undefined) config.backgroundValue = req.body.backgroundValue;
  if (req.body.clicksyTitle !== undefined) config.clicksyTitle = req.body.clicksyTitle;

  // Aggiunta nuove sezioni
  if (req.body.newSection) {
    config.customSections.push(req.body.newSection);
  }

  db.adminConfig = config;
  saveDB();
  res.json({ message: "Admin config salvato con successo", adminConfig: config });
});

/*
  ================================
  FALLBACK
  ================================
*/
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log("Server in esecuzione su http://localhost:" + PORT);
});
