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
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                fullname: fullname,
                email: email,
                password: password,
                gluten: gluten
            })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Kayıt sırasında hata oluştu");
                }
                return response.text();
            })
            .then(data => {
                alert("Kayıt başarılı, giriş yapabilirsiniz!");
                window.location.href = "login.html";
            })
            .catch(error => {
                alert("Bu email zaten kayıtlı veya başka bir hata oluştu!");
                console.error(error);
            });
    }

    function login() {
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        fetch("http://localhost:8080/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Giriş başarısız");
                }
                return response.text();
            })
            .then(data => {
                alert("Giriş başarılı, yönlendiriliyorsunuz...");
                window.location.href = "dashboard.html";
            })
            .catch(error => {
                alert("E-posta veya şifre yanlış!");
                console.error(error);
            });
    }

    function forgotPassword() {
        const email = document.getElementById("email").value;

        fetch("http://localhost:8080/api/forgot-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email: email })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error("E-posta gönderilemedi.");
                }
                return response.text();
            })
            .then(data => {
                alert(data);
            })
            .catch(error => {
                alert("E-posta gönderilemedi!");
                console.error(error);
            });
    }
});
