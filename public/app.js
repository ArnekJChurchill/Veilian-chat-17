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
