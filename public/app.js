let CURRENT_USER = null;

// LOGIN
function login() {
  const username = document.getElementById("usernameInput").value.trim();
  const password = document.getElementById("passwordInput").value;

  if (!username || !password) return alert("Enter both username and password.");

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

    if (CURRENT_USER.isModerator) {
      document.getElementById("adminPanel").style.display = "block";
    }
  });
}

// SIGNUP
function signup() {
  const username = document.getElementById("usernameInput").value.trim();
  const password = document.getElementById("passwordInput").value;

  if (!username || !password) return alert("Enter both username and password.");

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
