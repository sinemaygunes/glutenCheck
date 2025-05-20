document.addEventListener("DOMContentLoaded", function () {
  const registerForm = document.getElementById("registerForm");
  const loginForm = document.getElementById("loginForm");
  const forgotForm = document.getElementById("forgotForm");

  if (registerForm) {
    registerForm.addEventListener("submit", function (e) {
      e.preventDefault();
      register();
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      login();
    });
  }

  if (forgotForm) {
    forgotForm.addEventListener("submit", function (e) {
      e.preventDefault();
      forgotPassword();
    });
  }

  function register() {
    const fullname = document.getElementById("fullname").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const gluten = document.getElementById("gluten").checked;

    fetch("http://localhost:8080/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fullname: fullname,
        email: email,
        password: password,
        gluten: gluten,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Error during registration");
        }
        return response.text();
      })
      .then((data) => {
        alert("Registration successful, you can now login!");
        window.location.href = "login.html";
      })
      .catch((error) => {
        alert("This email is already registered or another error occurred!");
        console.error(error);
      });
  }

  function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    fetch("http://localhost:8080/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Login failed");
        }
        return response.text();
      })
      .then((data) => {
        alert("Login successful, redirecting...");
        window.location.href = "dashboard.html";
      })
      .catch((error) => {
        alert("Incorrect email or password!");
        console.error(error);
      });
  }

  function forgotPassword() {
    const email = document.getElementById("email").value;

    fetch("http://localhost:8080/api/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: email }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Could not send email.");
        }
        return response.text();
      })
      .then((data) => {
        alert(data);
      })
      .catch((error) => {
        alert("Could not send email!");
        console.error(error);
      });
  }
});
