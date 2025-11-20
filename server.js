const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs-extra");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const Pusher = require("pusher");

// === Pusher Setup ===
const pusher = new Pusher({
  appId: "2080160",
  key: "b7d05dcc13df522efbbc",
  secret: "4064ce2fc0ac5596d506",
  cluster: "us2",
  useTLS: true,
});

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

// === Ensure folders exist ===
fs.ensureDirSync("uploads/profilePics");
fs.ensureDirSync("data");

// === Database files ===
const USERS_FILE = path.join(__dirname, "data/users.json");
const BANNED_FILE = path.join(__dirname, "data/banned.json");

if (!fs.existsSync(USERS_FILE)) fs.writeJSONSync(USERS_FILE, { users: [] });
if (!fs.existsSync(BANNED_FILE)) fs.writeJSONSync(BANNED_FILE, { banned: [] });

// === Multer for avatars ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/profilePics"),
  filename: (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage });

// ================================
// SIGNUP
// ================================
app.post("/signup", (req, res) => {
  let { username, password } = req.body;
  if (!username || !password) return res.json({ success: false, message: "Enter both username and password" });

  username = username.toLowerCase();
  const usersData = fs.readJSONSync(USERS_FILE);

  if (usersData.users.find(u => u.username === username)) {
    return res.json({ success: false, message: "Username already taken" });
  }

  usersData.users.push({
    username,
    password,
    isModerator: false,
    displayName: username,
    avatar: "default.png",
    bio: "",
    joinDate: new Date().toISOString()
  });

  fs.writeJSONSync(USERS_FILE, usersData);
  res.json({ success: true });
});

// ================================
// LOGIN
// ================================
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.json({ success: false, message: "Enter both username and password" });

  const usersData = fs.readJSONSync(USERS_FILE);
  const bannedData = fs.readJSONSync(BANNED_FILE);

  if (bannedData.banned.includes(username.toLowerCase())) {
    return res.json({ success: false, message: "User is banned" });
  }

  const user = usersData.users.find(u => u.username === username.toLowerCase() && u.password === password);
  if (!user) return res.json({ success: false, message: "Invalid login" });

  res.json({ success: true, user });
});

// ================================
// START SERVER
// ================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Veilian-Chat-17 running on port ${PORT}`);
});
