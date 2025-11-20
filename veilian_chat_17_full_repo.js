// ================================
// Veilian Chat 17 - FULL REPOSITORY
// All files combined in one document
// Copy each section into your GitHub repo
// ================================

// ================================
// FILE: package.json
// ================================
{
  "name": "veilian-chat-17",
  "version": "1.0.0",
  "description": "Veilian Chat 17 with full profiles, avatars, bios, join dates, unique usernames, admin panel, and user banning.",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "body-parser": "^1.20.2",
    "pusher": "^5.1.2",
    "multer": "1.4.5-lts.1",
    "fs-extra": "^11.2.0",
    "cors": "^2.8.5"
  }
}

// ================================
// FILE: server.js
// ================================
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

// === Load database ===
const USERS_FILE = path.join(__dirname, "data/users.json");
const BANNED_FILE = path.join(__dirname, "data/banned.json");

if (!fs.existsSync(USERS_FILE)) fs.writeJSONSync(USERS_FILE, { users: [] });
if (!fs.existsSync(BANNED_FILE)) fs.writeJSONSync(BANNED_FILE, { banned: [] });

// === Multer Upload Setup (avatars) ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/profilePics");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  },
});

const upload = multer({ storage: storage });

// ================================
// AUTH: SIGNUP
// ================================
app.post("/signup", (req, res) => {
  let { username, password } = req.body;

  username = username.toLowerCase();

  const usersData = fs.readJSONSync(USERS_FILE);

  if (usersData.users.find(u => u.username === username)) {
    return res.json({ success: false, message: "Username already taken" });
  }

  // Create user profile
  usersData.users.push({
    username,
    password,
    isModerator: false,
    displayName: username,
    avatar: "default.png",
    bio: "",
    joinDate: new Date().toISOString(),
  });

  fs.writeJSONSync(USERS_FILE, usersData);

  res.json({ success: true });
});

// ================================
// AUTH: LOGIN
// ================================
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const usersData = fs.readJSONSync(USERS_FILE);
  const bannedData = fs.readJSONSync(BANNED_FILE);

  if (bannedData.banned.includes(username)) {
    return res.json({ success: false, message: "User is banned." });
  }

  const user = usersData.users.find(
    u => u.username === username && u.password === password
  );

  if (!user) {
    return res.json({ success: false, message: "Invalid login" });
  }

  res.json({ success: true, user });
});

// ================================
// UPDATE PROFILE
// ================================
app.post("/updateProfile", upload.single("avatar"), (req, res) => {
  const { username, displayName, bio } = req.body;
  const usersData = fs.readJSONSync(USERS_FILE);

  const user = usersData.users.find(u => u.username === username);
  if (!user) return res.json({ success: false });

  if (displayName) user.displayName = displayName;
  if (bio) user.bio = bio;
  if (req.file) user.avatar = req.file.filename;

  fs.writeJSONSync(USERS_FILE, usersData);

  res.json({ success: true });
});

// ================================
// GET PROFILE BY USERNAME
// ================================
app.get("/profile/:username", (req, res) => {
  const username = req.params.username;
  const usersData = fs.readJSONSync(USERS_FILE);
  const user = usersData.users.find(u => u.username === username);

  if (!user) return res.json({ success: false });

  res.json({ success: true, user });
});

// ================================
// ADMIN BAN USER
// ================================
app.post("/ban", (req, res) => {
  const { username } = req.body;

  const bannedData = fs.readJSONSync(BANNED_FILE);
  if (!bannedData.banned.includes(username)) bannedData.banned.push(username);

  fs.writeJSONSync(BANNED_FILE, bannedData);

  res.json({ success: true });
});

// ================================
// ADMIN UNBAN USER
// ================================
app.post("/unban", (req, res) => {
  const { username } = req.body;

  const bannedData = fs.readJSONSync(BANNED_FILE);
  bannedData.banned = bannedData.banned.filter(u => u !== username);
  fs.writeJSONSync(BANNED_FILE, bannedData);

  res.json({ success: true });
});

// ================================
// SEND CHAT MESSAGE
// ================================
app.post("/send-message", (req, res) => {
  const { username, message } = req.body;

  pusher.trigger("chat", "message", {
    username,
    message,
  });

  res.json({ success: true });
});

// ================================
// START SERVER
// ================================
app.listen(3000, () => {
  console.log("Veilian-Chat-17 running on http://localhost:3000");
});

// ================================
// FILE: public/index.html
// ================================
<!DOCTYPE html>
<html>
<head>
  <title>Veilian Chat 17</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="loginScreen">
    <h1>Veilian Chat 17</h1>
    <input id="usernameInput" placeholder="Username">
    <input id="passwordInput" type="password" placeholder="Password">
    <button onclick="login()">Login</button>
    <button onclick="signup()">Sign Up</button>
  </div>

  <div id="chatScreen" style="display:none;">
    <div id="profileBtn" onclick="openProfileEditor()">Edit Profile</div>
    <div id="messages"></div>
    <input id="chatMessage" placeholder="Message...">
    <button onclick="sendMessage()">Send</button>

    <div id="adminPanel" style="display:none;">
      <h3>Admin Panel</h3>
      <input id="banUserInput" placeholder="Ban username">
      <button onclick="banUser()">Ban</button>
      <input id="unbanUserInput" placeholder="Unban username">
      <button onclick="unbanUser()">Unban</button>
    </div>
  </div>

  <div id="profilePage" style="display:none;"></div>

  <script src="https://js.pusher.com/8.2/pusher.min.js"></script>
  <script src="app.js"></script>
</body>
</html>

// ================================
// FILE: public/styles.css
// ================================
body {
  background:#111;
  color:white;
  font-family:Arial;
}
#messages {
  height:400px;
  overflow-y:auto;
  background:#222;
  padding:10px;
  border-radius:10px;
}
.userAvatar {
  width:40px;
  height:40px;
  border-radius:50%;
}
.profileBox {
  background:#222;
  padding:20px;
  border-radius:15px;
  width:300px;
}

// ================================
// FILE: public/app.js
// ================================
let CURRENT_USER = null;

function login() {
  const username = document.getElementById("usernameInput").value;
  const password = document.getElementById("passwordInput").value;

  fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  })
  .then(res => res.json())
  .then(data => {
    if (!data.success) return alert(data.message);

    CURRENT_USER = data.user;

    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("chatScreen").style.display = "block";

    if (CURRENT_USER.isModerator)
      document.getElementById("adminPanel").style.display = "block";
  });
}

function signup() {
  const username = document.getElementById("usernameInput").value;
  const password = document.getElementById("passwordInput").value;

  fetch("/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  })
  .then(res => res.json())
  .then(data => {
    if (!data.success) return alert(data.message);
    alert("Account created! Login now.");
  });
}

// === Chat ===
var pusher = new Pusher("b7d05dcc13df522efbbc", {
  cluster: "us2"
});
var channel = pusher.subscribe("chat");
channel.bind("message", function(data) {
  addMessage(data.username, data.message);
});

function sendMessage() {
  const message = document.getElementById("chatMessage").value;

  fetch("/send-message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: CURRENT_USER.username, message })
  });
}

function addMessage(username, message) {
  const msgBox = document.getElementById("messages");
  const div = document.createElement("div");
  div.innerHTML = `<b style='cursor:pointer;color:cyan;' onclick='openProfile("${username}")'>@${username}</b>: ${message}`;
  msgBox.appendChild(div);
}

// === Profile ===
function openProfile(username) {
  fetch(`/profile/${username}`)
    .then(res => res.json())
    .then(data => {
      if (!data.success) return;

      const u = data.user;

      document.getElementById("profilePage").style.display = "block";
      document.getElementById("profilePage").innerHTML = `
        <div class='profileBox'>
          <img src='/uploads/profilePics/${u.avatar}' class='userAvatar'>
          <h2>${u.displayName}</h2>
          <p><b>@${u.username}</b></p>
          <p>${u.bio}</p>
          <p><i>Joined: ${new Date(u.joinDate).toLocaleDateString()}</i></p>
          <button onclick='closeProfile()'>X</button>
        </div>
      `;
    });
}

function closeProfile() {
  document.getElementById("profilePage").style.display = "none";
}
