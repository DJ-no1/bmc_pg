// API Configuration
const API_BASE_URL = 'http://localhost:8080/api';

function clearStoredAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
}

function getStoredToken() {
    const token = localStorage.getItem('token');
    if (!token || token === 'undefined' || token === 'null') {
        clearStoredAuth();
        return null;
    }
    return token;
}

function saveAuthTokens(payload) {
    const accessToken = payload.accessToken || payload.token;

    if (!accessToken) {
        throw new Error('Login response is missing access token');
    }

    localStorage.setItem('token', accessToken);

    if (payload.refreshToken) {
        localStorage.setItem('refreshToken', payload.refreshToken);
    } else {
        localStorage.removeItem('refreshToken');
    }
}

function getAuthHeaders(extraHeaders = {}) {
    const token = getStoredToken();

    if (!token) {
        throw new Error('Session expired. Please login again.');
    }

    return {
        'Authorization': `Bearer ${token}`,
        ...extraHeaders
    };
}

const api = {
    getAuthToken() {
        return getStoredToken();
    },

    isAuthenticated() {
        return Boolean(getStoredToken());
    },

    // Auth endpoints
    async register(userData) {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || data.message || 'Registration failed');
        return data.data || data;
    },

    async login(email, password) {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || data.message || 'Login failed');
        const result = data.data || data;
        saveAuthTokens(result);
        return result;
    },

    async logout() {
        const token = getStoredToken();
        try {
            await fetch(`${API_BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
        clearStoredAuth();
    },

    async verifyEmail(token) {
        const response = await fetch(`${API_BASE_URL}/auth/verify-email/${token}`, {
            method: 'GET'
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || data.message || 'Verification failed');
        return data.data || data;
    },

    async getProfile() {
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || data.message || 'Failed to fetch profile');
        return data.data || data;
    },

    async changePassword(oldPassword, newPassword) {
        const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
            method: 'POST',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ oldPassword, newPassword })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || data.message || 'Failed to change password');
        return data.data || data;
    },

    // Movies endpoints
    async getMovies() {
        const response = await fetch(`${API_BASE_URL}/bookings/movies`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || data.message || 'Failed to fetch movies');
        return data.data || data;
    },

    async getMovieById(id) {
        const response = await fetch(`${API_BASE_URL}/bookings/movies/${id}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || data.message || 'Failed to fetch movie');
        return data.data || data;
    },

    // Shows endpoints
    async getShows() {
        const response = await fetch(`${API_BASE_URL}/bookings/shows`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || data.message || 'Failed to fetch shows');
        return data.data || data;
    },

    async getShowById(id) {
        const response = await fetch(`${API_BASE_URL}/bookings/shows/${id}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || data.message || 'Failed to fetch show');
        return data.data || data;
    },

    // Seats endpoints
    async getSeatsForShow(showId) {
        const response = await fetch(`${API_BASE_URL}/bookings/shows/${showId}/seats`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || data.message || 'Failed to fetch seats');
        const result = data.data || data;
        // Handle both formats: array or object with seats property
        return Array.isArray(result) ? result : (result.seats || result);
    },

    // Bookings endpoints
    async bookSeats(showId, seatIds) {
        const response = await fetch(`${API_BASE_URL}/bookings/bookings`, {
            method: 'POST',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({
                show_id: showId,
                seat_ids: seatIds
            })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || data.message || 'Booking failed');
        return data.data || data;
    },

    async getMyBookings() {
        const response = await fetch(`${API_BASE_URL}/bookings/my-bookings`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || data.message || 'Failed to fetch bookings');
        return data.data || data;
    },

    async cancelBooking(bookingId) {
        const response = await fetch(`${API_BASE_URL}/bookings/bookings/${bookingId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || data.message || 'Failed to cancel booking');
        return data.data || data;
    },

    // Admin endpoints - Movies
    async createMovie(movieData) {
        const response = await fetch(`${API_BASE_URL}/admin/movies`, {
            method: 'POST',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(movieData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || data.message || 'Failed to create movie');
        return data.data || data;
    },

    async updateMovie(id, movieData) {
        const response = await fetch(`${API_BASE_URL}/admin/movies/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(movieData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || data.message || 'Failed to update movie');
        return data.data || data;
    },

    async deleteMovie(id) {
        const response = await fetch(`${API_BASE_URL}/admin/movies/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || data.message || 'Failed to delete movie');
        return data.data || data;
    },

    // Admin endpoints - Shows
    async createShow(showData) {
        const response = await fetch(`${API_BASE_URL}/admin/shows`, {
            method: 'POST',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(showData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || data.message || 'Failed to create show');
        return data.data || data;
    },

    async updateShow(id, showData) {
        const response = await fetch(`${API_BASE_URL}/admin/shows/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(showData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || data.message || 'Failed to update show');
        return data.data || data;
    },

    async deleteShow(id) {
        const response = await fetch(`${API_BASE_URL}/admin/shows/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || data.message || 'Failed to delete show');
        return data.data || data;
    }
};
