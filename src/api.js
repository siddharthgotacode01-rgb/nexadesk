
const API_BASE_URL = 'https://nexadesk-backend-waci.onrender.com/api'
const REFRESH_URL = `${API_BASE_URL}/token/refresh/`

// Prevent multiple simultaneous requests from refreshing the token repeatedly.
let refreshPromise = null

async function refreshAccessToken() {
    const refreshToken = sessionStorage.getItem('refresh')

    if (!refreshToken) {
        throw new Error('No refresh token available.')
    }

    if (!refreshPromise) {
        refreshPromise = (async () => {
            const response = await fetch(REFRESH_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    refresh: refreshToken,
                }),
            })

            if (!response.ok) {
                throw new Error('Session refresh failed.')
            }

            const data = await response.json()

            if (!data.access) {
                throw new Error('No new access token received.')
            }

            sessionStorage.setItem('access', data.access)

            // Save a rotated refresh token if Django returns one.
            if (data.refresh) {
                sessionStorage.setItem('refresh', data.refresh)
            }

            return data.access
        })().finally(() => {
            refreshPromise = null
        })
    }

    return refreshPromise
}

function createHeaders(options, accessToken) {
    const headers = {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
    }

    // Let the browser set Content-Type for FormData.
    if (
        options.body &&
        !(options.body instanceof FormData)
    ) {
        headers['Content-Type'] = 'application/json'
    }

    return headers
}

async function handleError(response) {
    let message = 'Something went wrong.'

    try {
        const data = await response.json()
        message = Object.values(data).flat().join(' ') || message
    } catch {
        // Keep the default error message.
    }

    throw new Error(message)
}

export async function apiRequest(endpoint, options = {}) {
    let accessToken = sessionStorage.getItem('access')

    if (!accessToken) {
        throw new Error('Please log in to continue.')
    }

    // First API request.
    let response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: createHeaders(options, accessToken),
    })

    // If access token expired, try refreshing it.
    if (response.status === 401) {
        try {
            accessToken = await refreshAccessToken()
        } catch {
            sessionStorage.removeItem('access')
            sessionStorage.removeItem('refresh')

            throw new Error(
                'Your session has expired. Please log in again.'
            )
        }

        // Retry the original request with the new access token.
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: createHeaders(options, accessToken),
        })

        // If the retry also fails authentication, end the session.
        if (response.status === 401) {
            sessionStorage.removeItem('access')
            sessionStorage.removeItem('refresh')

            throw new Error(
                'Your session has expired. Please log in again.'
            )
        }
    }

    if (!response.ok) {
        await handleError(response)
    }

    if (response.status === 204) {
        return null
    }

    return response.json()
}
