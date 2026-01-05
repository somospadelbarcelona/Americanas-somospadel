/**
 * AuthController.js (Global Version)
 */
(function () {
    class AuthController {
        constructor() {
            // Wait for DOM
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.init());
            } else {
                this.init();
            }
        }

        init() {
            console.log("🔒 AuthController Global Binding Forms...");

            // Bind Login Form
            const loginForm = document.getElementById('login-form');
            if (loginForm) {
                // Brute force replacement to kill old listeners
                const newLoginForm = loginForm.cloneNode(true);
                loginForm.parentNode.replaceChild(newLoginForm, loginForm);

                newLoginForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    const phone = newLoginForm.phone.value.trim();
                    const password = newLoginForm.password.value.trim();

                    if (!phone || !password) {
                        alert("❌ Introduce usuario y contraseña");
                        return;
                    }

                    const btn = newLoginForm.querySelector('button[type="submit"]');
                    const originalText = btn ? btn.textContent : "Entrar";
                    if (btn) btn.textContent = "Verificando...";

                    let email = phone;
                    if (!email.includes('@')) email = phone + '@somospadel.com';

                    try {
                        const result = await window.AuthService.login(email, password);
                        if (!result.success) {
                            alert("❌ Error de acceso: " + result.error);
                            if (btn) btn.textContent = originalText;
                        } else {
                            console.log("✅ Login Success!");
                        }
                    } catch (err) {
                        alert("❌ Error Inesperado: " + err.message);
                        if (btn) btn.textContent = originalText;
                    }
                });
            }

            // Bind Register Form
            const registerForm = document.getElementById('register-form');
            if (registerForm) {
                const newRegisterForm = registerForm.cloneNode(true);
                registerForm.parentNode.replaceChild(newRegisterForm, registerForm);

                newRegisterForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    const name = newRegisterForm.name.value.trim();
                    const phone = newRegisterForm.phone.value.trim();
                    const password = newRegisterForm.password.value.trim();

                    let email = phone;
                    if (!email.includes('@')) email = phone + '@somospadel.com';

                    const btn = newRegisterForm.querySelector('button[type="submit"]');
                    const originalText = btn ? btn.textContent : "Unirme ahora";
                    if (btn) btn.textContent = "Creando cuenta...";

                    try {
                        const result = await window.AuthService.register(email, password, { name, role: 'player' });
                        if (!result.success) {
                            alert("❌ Error de registro: " + result.error);
                            if (btn) btn.textContent = originalText;
                        } else {
                            alert("✅ ¡Cuenta Creada! Iniciando sesión...");
                        }
                    } catch (err) {
                        alert("❌ Error Inesperado: " + err.message);
                        if (btn) btn.textContent = originalText;
                    }
                });
            }
        }
    }

    window.AuthController = new AuthController();
    console.log("🎮 AuthController Global Loaded");
})();
