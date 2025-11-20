let CURRENT_USER = null;

// ================================
// LOGIN
// ================================
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

      // Show admin panel if moderator
      if (CURRENT_USER.isModerator)
        document.getElementById("adminPanel").style.display = "block";
    });
}

// ================================
// SIGNUP
// ================================
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

// ================================
// CHAT
// ================================
var pusher = new Pusher("b7d05dcc13df522efbbc", { cluster: "us2" });
var channel = pusher.subscribe("chat");
channel.bind("message", function(data) {
  addMessage(data.username, data.message);
});

function sendMessage() {
  const message = document.getElementById("chatMessage").value;
  if (!message) return;

  fetch("/send-message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: CURRENT_USER.username, message })
  });

  document.getElementById("chatMessage").value = "";
}

function addMessage(username, message) {
  const msgBox = document.getElementById("messages");
  const div = document.createElement("div");
  div.innerHTML = `<b style='cursor:pointer;color:cyan;' onclick='openProfile("${username}")'>@${username}</b>: ${message}`;
  msgBox.appendChild(div);
  msgBox.scrollTop = msgBox.scrollHeight;
}

// ================================
// PROFILE
// ================================
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

// ================================
// ADMIN / MODERATOR FUNCTIONS
// ================================
function banUser() {
  const username = document.getElementById("banUserInput").value;
  if (!username) return alert("Enter a username to ban.");

  fetch("/ban", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) alert(`User @${username} has been banned.`);
      document.getElementById("banUserInput").value = "";
    });
}

function unbanUser() {
  const username = document.getElementById("unbanUserInput").value;
  if (!username) return alert("Enter a username to unban.");

  fetch("/unban", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) alert(`User @${username} has been unbanned.`);
      document.getElementById("unbanUserInput").value = "";
    });
}

// ================================
// PROFILE EDITOR (CURRENT USER)
// ================================
function openProfileEditor() {
  document.getElementById("profilePage").style.display = "block";
  document.getElementById("profilePage").innerHTML = `
    <div class='profileBox'>
      <h2>Edit Profile</h2>
      <input type='text' id='editDisplayName' placeholder='Display Name' value='${CURRENT_USER.displayName}'>
      <input type='text' id='editBio' placeholder='Bio' value='${CURRENT_USER.bio}'>
      <input type='file' id='editAvatar'>
      <button onclick='saveProfile()'>Save</button>
      <button onclick='closeProfile()'>Cancel</button>
    </div>
  `;
}

function saveProfile() {
  const displayName = document.getElementById("editDisplayName").value;
  const bio = document.getElementById("editBio").value;
  const avatarFile = document.getElementById("editAvatar").files[0];

  const formData = new FormData();
  formData.append("username", CURRENT_USER.username);
  formData.append("displayName", displayName);
  formData.append("bio", bio);
  if (avatarFile) formData.append("avatar", avatarFile);

  fetch("/updateProfile", {
    method: "POST",
    body: formData
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("Profile updated!");
        CURRENT_USER.displayName = displayName;
        CURRENT_USER.bio = bio;
        if (avatarFile) CURRENT_USER.avatar = data.filename || CURRENT_USER.avatar;
        closeProfile();
      }
    });
}
