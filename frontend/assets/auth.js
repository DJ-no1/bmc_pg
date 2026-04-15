// Authentication helper functions

function updateNavbar() {
    const token = api.getAuthToken();
    const navProfile = document.getElementById('navProfile');
    const navAdmin = document.getElementById('navAdmin');
    const navLogout = document.getElementById('navLogout');

    if (token) {
        if (navProfile) navProfile.style.display = 'block';
        if (navLogout) navLogout.style.display = 'block';

        // Check if user is admin
        api.getProfile().then(profile => {
            if (profile.is_admin && navAdmin) {
                navAdmin.style.display = 'block';
            }
        }).catch(error => console.error('Error fetching profile:', error));
    }
}

function logout() {
    api.logout();
    window.location.href = 'index.html';
}

// Handle login form submission
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const errorEl = document.getElementById('loginError');

        try {
            errorEl.textContent = '';
            const response = await api.login(email, password);

            // Hide auth section and show welcome
            document.getElementById('authSection').style.display = 'none';
            document.getElementById('welcomeSection').style.display = 'block';
            updateNavbar();

            // Redirect to movies after 2 seconds
            setTimeout(() => {
                window.location.href = 'movies.html';
            }, 2000);
        } catch (error) {
            errorEl.textContent = error.message;
        }
    });
}

// Handle register form submission
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const phone = document.getElementById('registerPhone').value;
        const errorEl = document.getElementById('registerError');

        try {
            errorEl.textContent = '';
            const response = await api.register({
                name,
                email,
                password,
                phone
            });

            alert('Registration successful! Please check your email to verify your account. Then login.');
            registerForm.reset();

            // Switch to login tab
            document.getElementById('loginForm').style.display = 'block';
            document.getElementById('registerForm').style.display = 'none';
            document.querySelectorAll('.tab-btn')[0].classList.add('active');
            document.querySelectorAll('.tab-btn')[1].classList.remove('active');
        } catch (error) {
            errorEl.textContent = error.message;
        }
    });
}
