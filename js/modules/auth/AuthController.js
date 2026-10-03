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

            // Global Helper for UI switching with Segmented Tab sync
            window.toggleAuthMode = (mode) => {
                const loginForm = document.getElementById('login-form');
                const registerForm = document.getElementById('register-form');
                const tabLogin = document.getElementById('tab-auth-login');
                const tabRegister = document.getElementById('tab-auth-register');

                if (!loginForm || !registerForm) return;

                if (mode === 'register') {
                    loginForm.classList.add('hidden');
                    registerForm.classList.remove('hidden');
                    if (tabRegister) {
                        tabRegister.classList.add('active');
                        tabRegister.setAttribute('aria-selected', 'true');
                    }
                    if (tabLogin) {
                        tabLogin.classList.remove('active');
                        tabLogin.setAttribute('aria-selected', 'false');
                    }
                } else {
                    registerForm.classList.add('hidden');
                    loginForm.classList.remove('hidden');
                    if (tabLogin) {
                        tabLogin.classList.add('active');
                        tabLogin.setAttribute('aria-selected', 'true');
                    }
                    if (tabRegister) {
                        tabRegister.classList.remove('active');
                        tabRegister.setAttribute('aria-selected', 'false');
                    }
                }
            };
        }

        init() {
            console.log("🔒 AuthController Global Binding Forms...");

            // Bind Login Form
            const loginForm = document.getElementById('login-form');
            if (loginForm) {
                // Brute force replacement to kill old listeners
                const newLoginForm = loginForm.cloneNode(true);
                loginForm.parentNode.replaceChild(newLoginForm, loginForm);

                // 🧠 [PRO] MEMORIA DE USUARIO: Recuperar teléfono guardado
                const savedPhone = localStorage.getItem('remembered_phone');
                if (savedPhone && newLoginForm.phone) {
                    console.log("📲 [Auth] Recuperando teléfono memorizado...");
                    newLoginForm.phone.value = savedPhone;
                }

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
                    const originalText = btn ? btn.textContent : "INICIAR SESIÓN 🎾";
                    if (btn) btn.textContent = "ESCANEANDO BIOMETRÍA...";

                    // Activar Escáner Láser Cibernético de Biometría
                    const scanner = document.getElementById('login-bio-scanner');
                    if (scanner) scanner.style.display = 'block';

                    let email = phone;
                    if (!email.includes('@')) email = phone + '@somospadel.com';

                    try {
                        const result = await window.AuthService.login(email, password);
                        if (!result.success) {
                            // Feedback de sacudida y alerta roja
                            const card = document.querySelector('.glass-card-pro');
                            if (card) {
                                card.classList.add('shake-error');
                                if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
                                setTimeout(() => card.classList.remove('shake-error'), 500);
                            }
                            
                            alert("❌ Error de acceso: " + result.error);
                            if (btn) btn.textContent = originalText;
                            if (scanner) scanner.style.display = 'none';
                        } else {
                            console.log("✅ Login Success!");

                            // 🧠 [PRO] MEMORIA DE USUARIO: Guardar para la próxima vez según preferencia
                            const rememberCheck = document.getElementById('auth-remember-device');
                            const shouldRemember = !rememberCheck || rememberCheck.checked;
                            if (phone && shouldRemember) {
                                localStorage.setItem('remembered_phone', phone);
                                localStorage.setItem('remembered_pwd', password);
                            } else if (!shouldRemember) {
                                localStorage.removeItem('remembered_phone');
                                localStorage.removeItem('remembered_pwd');
                            }

                            if (scanner) scanner.style.display = 'none';

                            // Transición Premium Láser Fade-out
                            const authModal = document.getElementById('auth-modal');
                            const appShell = document.getElementById('app-shell');
                            
                            // Navegar al Dashboard inmediatamente para pintar el contenido real en el DOM
                            // antes de mostrar la pantalla y evitar ver esqueletos
                            if (window.Router) {
                                window.Router.navigate('dashboard', false, true);
                            }

                            if (authModal) {
                                if (scanner) {
                                    scanner.style.display = 'block';
                                    scanner.style.animation = 'scanLineSweep 0.2s ease-in-out infinite';
                                }
                                authModal.classList.add('dematerialize');
                                if (appShell) appShell.classList.remove('hidden');

                                setTimeout(() => {
                                    authModal.style.setProperty('display', 'none', 'important');
                                    if (scanner) scanner.style.display = 'none';

                                    if (!window.Router) {
                                        window.location.reload();
                                    }
                                }, 180);
                            } else {
                                if (appShell) appShell.classList.remove('hidden');
                                if (!window.Router) {
                                    window.location.reload();
                                }
                            }
                        }
                    } catch (err) {
                        alert("❌ Error Inesperado: " + err.message);
                        if (btn) btn.textContent = originalText;
                        if (scanner) scanner.style.display = 'none';
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
                    const gender = newRegisterForm.gender ? newRegisterForm.gender.value : 'chico';
                    const play_preference = newRegisterForm.play_preference ? newRegisterForm.play_preference.value : 'drive';
                    const level = newRegisterForm.self_rate_level ? (parseFloat(newRegisterForm.self_rate_level.value) || 3.5) : 3.5;

                    let email = phone;
                    if (!email.includes('@')) email = phone + '@somospadel.com';

                    const btn = newRegisterForm.querySelector('button[type="submit"]');
                    const originalText = btn ? btn.textContent : "Unirme ahora";
                    if (btn) btn.textContent = "Creando cuenta...";

                    try {
                        const result = await window.AuthService.register(email, password, {
                            name,
                            gender,
                            play_preference,
                            level,
                            role: 'player'
                        });

                        if (!result.success) {
                            alert("❌ Error de registro: " + result.error);
                            if (btn) btn.textContent = originalText;
                        } else if (result.pendingValidation) {
                            alert("✅ SOLICITUD ENVIADA.\n\nTu cuenta ha sido creada y está pendiente de validación por un administrador (Alejandro).\n\nTe avisaremos cuando esté activa.");
                            // Reset form and go to login
                            newRegisterForm.reset();
                            if (window.toggleAuthMode) window.toggleAuthMode('login');
                            if (btn) btn.textContent = originalText;
                        } else {
                            alert("✅ ¡Cuenta Creada! Iniciando sesión...");
                            setTimeout(() => window.location.reload(), 1000);
                        }
                    } catch (err) {
                        alert("❌ Error Inesperado: " + err.message);
                        if (btn) btn.textContent = originalText;
                    }
                });
            }
        }

        async handleLogout() {
            try {
                const res = await window.AuthService.logout();
                if (res.success) {
                    window.location.reload();
                } else {
                    alert("Error al cerrar sesión: " + res.error);
                }
            } catch (err) {
                console.error("Logout error", err);
                window.location.reload(); // Fallback reload
            }
        }
    }

    window.AuthController = new AuthController();
    console.log("🎮 AuthController Global Loaded");
})();
