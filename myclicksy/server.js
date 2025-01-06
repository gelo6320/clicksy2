/***********************************************
  server.js
***********************************************/
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const path = require("path");

let db = require("./db.json");

const ADMIN_USER = "clicksy2025";
const ADMIN_PASS = "clicksy2025";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public"))); // serve index.html, style.css, main.js

function saveDB() {
  fs.writeFileSync(path.join(__dirname, "db.json"), JSON.stringify(db, null, 2));
}

// 1) Genera userId se non c’è
app.use((req, res, next) => {
  if (!req.cookies.userId) {
    const newUserId = "user-" + Math.random().toString(36).substr(2, 9);
    res.cookie("userId", newUserId, { maxAge: 31536000000 }); // 1 anno
    db.users[newUserId] = {
      email: null,
      claimed: false,
      timerEnd: 0
    };
    saveDB();
  }
  next();
});

// 2) Contatore accessi
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
  const userId = req.cookies.userId;
  if (!userId || !db.users[userId]) {
    return res.status(400).json({ error: "Utente non trovato" });
  }
  res.json(db.users[userId]);
});

app.post("/api/user", (req, res) => {
  const userId = req.cookies.userId;
  if (!userId) {
    return res.status(400).json({ error: "Cookie utente mancante" });
  }
  if (!db.users[userId]) {
    db.users[userId] = { email: null, claimed: false, timerEnd: 0 };
  }
  const userData = db.users[userId];

  if (req.body.email !== undefined) userData.email = req.body.email;
  if (req.body.claimed !== undefined) userData.claimed = req.body.claimed;
  if (req.body.timerEnd !== undefined) userData.timerEnd = req.body.timerEnd;

  db.users[userId] = userData;
  saveDB();
  res.json(userData);
});

/*
  ================================
  API REFERRAL
  ================================
*/
app.get("/api/referral", (req, res) => {
  const { ref } = req.query;
  if (!ref) {
    return res.status(400).json({ error: "Parametro ref mancante" });
  }
  if (!db.refDiscounts[ref]) {
    db.refDiscounts[ref] = 0;
  }
  db.refDiscounts[ref] += 4;
  saveDB();
  res.json({ message: "Referral incrementato", ref, totalDiscount: db.refDiscounts[ref] });
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
*/
app.get("/api/leaderboard", (req, res) => {
  const arr = Object.entries(db.refDiscounts).map(([ref, discount]) => ({ ref, discount }));
  arr.sort((a, b) => b.discount - a.discount);
  res.json(arr);
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