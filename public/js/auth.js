document.addEventListener('DOMContentLoaded', async () => {
    // Verificar si ya hay sesión válida
    const existingToken = localStorage.getItem('token');
    if (existingToken) {
        try {
            const sessionResponse = await fetch('/api/profile', {
                headers: {
                    Authorization: `Bearer ${existingToken}`
                }
            });

            if (sessionResponse.ok) {
                window.location.href = '/app';
                return;
            }

            // Limpiar sesión inválida/expirada para evitar bucles de redirección
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            localStorage.removeItem('userProfile');
            localStorage.removeItem('gameRecentRuns');
        } catch (error) {
            // Si hay error de red, mantenemos al usuario en landing sin borrar sesión.
            console.warn('No se pudo validar la sesión actual', error);
        }
    }

    // Theme Logic
    const themeBtn = document.getElementById('theme-toggle');
    const themeSequence = ['light', 'dark', 'aurora'];
    let currentTheme = localStorage.getItem('theme') || 'light';

    const themeIcons = {
        light: '🌙',
        dark: '⚡',
        aurora: '☀️'
    };

    const applyTheme = (theme) => {
        currentTheme = themeSequence.includes(theme) ? theme : 'light';
        document.body.classList.remove('dark-mode', 'aurora-mode');
        if (currentTheme === 'dark') {
            document.body.classList.add('dark-mode');
        } else if (currentTheme === 'aurora') {
            document.body.classList.add('aurora-mode');
        }
        localStorage.setItem('theme', currentTheme);
        if (themeBtn) themeBtn.textContent = themeIcons[currentTheme] || '🌙';
    };

    const getNextTheme = () => {
        const idx = themeSequence.indexOf(currentTheme);
        return themeSequence[(idx + 1) % themeSequence.length];
    };

    applyTheme(currentTheme);

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const nextTheme = getNextTheme();
            applyTheme(nextTheme);
        });
    }

    const triggerBounce = (button) => {
        if (!button) return;
        button.classList.remove('btn-bounce-animation');
        void button.offsetWidth;
        button.classList.add('btn-bounce-animation');
        button.addEventListener('animationend', () => {
            button.classList.remove('btn-bounce-animation');
        }, { once: true });
    };

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (btn) triggerBounce(btn);
    });

    // 3D Flip Logic
    const authCard = document.getElementById('auth-card');
    const toRegisterBtn = document.getElementById('to-register');
    const toLoginBtn = document.getElementById('to-login');
    
    // Forms
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    // Error Messages
    const loginError = document.getElementById('login-error');
    const registerError = document.getElementById('register-error');

    // Toggle Flip
    if (toRegisterBtn && authCard) {
        toRegisterBtn.addEventListener('click', () => {
            authCard.classList.add('flipped');
            if (window.sounds) window.sounds.playWhoosh();
            // Limpiar errores al cambiar
            if (loginError) loginError.style.display = 'none';
            if (registerError) registerError.style.display = 'none';
        });
    }

    if (toLoginBtn && authCard) {
        toLoginBtn.addEventListener('click', () => {
            authCard.classList.remove('flipped');
            if (window.sounds) window.sounds.playWhoosh();
            // Limpiar errores al cambiar
            if (loginError) loginError.style.display = 'none';
            if (registerError) registerError.style.display = 'none';
        });
    }

    // Handle Login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;
            
            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.error || 'Error en el inicio de sesión');
                }
                
                localStorage.removeItem('userProfile');
                localStorage.removeItem('gameRecentRuns');
                localStorage.setItem('token', data.token);
                localStorage.setItem('username', data.username);
                
                if (window.notifications) window.notifications.show('¡Bienvenido!', 'success');
                
                setTimeout(() => {
                    window.location.href = '/app';
                }, 1000);
                
            } catch (error) {
                if (window.notifications) window.notifications.show(error.message, 'error');
                if (loginError) {
                    loginError.textContent = error.message;
                    loginError.style.display = 'block';
                }
                if (window.sounds) window.sounds.playError();
            }
        });
    }

    // Handle Register
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('register-username').value;
            const password = document.getElementById('register-password').value;
            
            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.error || 'Error en el registro');
                }
                
                if (window.notifications) window.notifications.show('Registro exitoso. Por favor inicia sesión.', 'success');
                
                // Volver a la cara frontal (Login)
                if (authCard) authCard.classList.remove('flipped');
                
                // Pre-llenar el usuario en login para conveniencia
                const loginUser = document.getElementById('login-username');
                const loginPass = document.getElementById('login-password');
                if (loginUser) loginUser.value = username;
                if (loginPass) loginPass.focus();
                
            } catch (error) {
                if (window.notifications) window.notifications.show(error.message, 'error');
                if (registerError) {
                    registerError.textContent = error.message;
                    registerError.style.display = 'block';
                }
                if (window.sounds) window.sounds.playError();
            }
        });
    }

    // Swipe Gesture Logic for Mobile
    if (authCard) {
        let touchStartX = 0;
        let touchEndX = 0;
        
        authCard.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        authCard.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });

        const handleSwipe = () => {
            const swipeThreshold = 50; // Minimum distance for swipe
            const diff = touchEndX - touchStartX;

            // Swipe Left (Login -> Register)
            if (diff < -swipeThreshold && !authCard.classList.contains('flipped')) {
                authCard.classList.add('flipped');
                if (window.sounds) window.sounds.playWhoosh();
                if (loginError) loginError.style.display = 'none';
                if (registerError) registerError.style.display = 'none';
            }
            
            // Swipe Right (Register -> Login)
            if (diff > swipeThreshold && authCard.classList.contains('flipped')) {
                authCard.classList.remove('flipped');
                if (window.sounds) window.sounds.playWhoosh();
                if (loginError) loginError.style.display = 'none';
                if (registerError) registerError.style.display = 'none';
            }
        };
    }
});