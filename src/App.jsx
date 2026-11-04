import { useEffect, useState } from 'react'
import { apiRequest } from './api'
import Customers from './pages/customers'
import Products from './pages/products'
import Inventory from './pages/inventory'
import Orders from './pages/orders'
import Analytics from './pages/analytics'
import './App.css'

const API_ROOT = 'http://127.0.0.1:8000/api'
const CUSTOMERS_API = '/customers/customers/'
const PRODUCTS_API = '/products/products/'
const ORDERS_API = '/orders/orders/'

function getOrderDateKey(dateString) {
    if (!dateString) return ''
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return ''

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

async function getResponseError(response, fallback) {
    try {
        const data = await response.json()
        if (data && typeof data === 'object') {
            return Object.values(data).flat().join(' ') || fallback
        }
    } catch {
        // Use the fallback if the response is not JSON.
    }
    return fallback
}

function AuthScreen({ onAuthenticated }) {
    const [mode, setMode] = useState('login')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')

    function switchMode(nextMode) {
        setMode(nextMode)
        setPassword('')
        setConfirmPassword('')
        setError('')
        setMessage('')
    }

    async function handleSubmit(event) {
        event.preventDefault()
        setError('')
        setMessage('')

        if (!username.trim() || !password) {
            setError('Please enter your username and password.')
            return
        }

        if (mode === 'register') {
            if (password.length < 8) {
                setError('Password must contain at least 8 characters.')
                return
            }
            if (password !== confirmPassword) {
                setError('The passwords do not match.')
                return
            }
        }

        try {
            setLoading(true)

            if (mode === 'register') {
                const response = await fetch(`${API_ROOT}/accounts/register/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: username.trim(),
                        password,
                    }),
                })

                if (!response.ok) {
                    throw new Error(await getResponseError(response, 'Could not create your account.'))
                }

                setMode('login')
                setPassword('')
                setConfirmPassword('')
                setMessage('Account created successfully. Please log in.')
                return
            }

            const response = await fetch(`${API_ROOT}/token/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: username.trim(),
                    password,
                }),
            })

            if (!response.ok) {
                throw new Error(await getResponseError(response, 'Invalid username or password.'))
            }

            const tokenData = await response.json()
            if (!tokenData.access || !tokenData.refresh) {
                throw new Error('The server did not return the expected authentication tokens.')
            }

            sessionStorage.setItem('access', tokenData.access)
            sessionStorage.setItem('refresh', tokenData.refresh)
            onAuthenticated()
        } catch (err) {
            setError(err.message || 'Authentication failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="auth-page">
            <section className="auth-card">
                <div className="auth-brand">
                    <h1 className="logo">Nexa<span>Desk.</span></h1>
                    <p>One workspace for your business.</p>
                </div>

                <div className="auth-tabs">
                    <button
                        type="button"
                        className={mode === 'login' ? 'auth-tab active' : 'auth-tab'}
                        onClick={() => switchMode('login')}
                    >
                        Log in
                    </button>
                    <button
                        type="button"
                        className={mode === 'register' ? 'auth-tab active' : 'auth-tab'}
                        onClick={() => switchMode('register')}
                    >
                        Create account
                    </button>
                </div>

                <div className="auth-heading">
                    <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
                    <p>
                        {mode === 'login'
                            ? 'Enter your details to access your workspace.'
                            : 'Create your NexaDesk business workspace.'}
                    </p>
                </div>

                {error && <p className="error-message" role="alert">{error}</p>}
                {message && <p className="auth-success" role="status">{message}</p>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <label htmlFor="auth-username">Username</label>
                    <input
                        id="auth-username"
                        type="text"
                        autoComplete="username"
                        placeholder="Enter your username"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        required
                    />

                    <label htmlFor="auth-password">Password</label>
                    <input
                        id="auth-password"
                        type="password"
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                    />

                    {mode === 'register' && (
                        <>
                            <label htmlFor="auth-confirm-password">Confirm password</label>
                            <input
                                id="auth-confirm-password"
                                type="password"
                                autoComplete="new-password"
                                placeholder="Enter your password again"
                                value={confirmPassword}
                                onChange={(event) => setConfirmPassword(event.target.value)}
                                required
                            />
                        </>
                    )}

                    <button className="auth-submit" type="submit" disabled={loading}>
                        {loading
                            ? 'Please wait...'
                            : mode === 'login'
                                ? 'Log in to NexaDesk'
                                : 'Create account'}
                    </button>
                </form>

                <p className="auth-switch">
                    {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                    {' '}
                    <button
                        type="button"
                        onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                    >
                        {mode === 'login' ? 'Register' : 'Log in'}
                    </button>
                </p>
            </section>
        </main>
    )
}

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(
        () => Boolean(sessionStorage.getItem('access'))
    )
    const [activePage, setActivePage] = useState('Dashboard')

    const [customers, setCustomers] = useState([])
    const [products, setProducts] = useState([])
    const [orders, setOrders] = useState([])
    const [dashboardLoading, setDashboardLoading] = useState(true)
    const [dashboardError, setDashboardError] = useState('')

    function handleLogout() {
        sessionStorage.removeItem('access')
        sessionStorage.removeItem('refresh')
        setCustomers([])
        setProducts([])
        setOrders([])
        setDashboardError('')
        setDashboardLoading(true)
        setActivePage('Dashboard')
        setIsAuthenticated(false)
    }

    useEffect(() => {
        if (!isAuthenticated || activePage !== 'Dashboard') return

        let cancelled = false

        async function fetchDashboardData() {
            try {
                setDashboardLoading(true)
                setDashboardError('')

                const [customerData, productData, orderData] = await Promise.all([
                    apiRequest(CUSTOMERS_API),
                    apiRequest(PRODUCTS_API),
                    apiRequest(ORDERS_API),
                ])

                if (
                    !Array.isArray(customerData) ||
                    !Array.isArray(productData) ||
                    !Array.isArray(orderData)
                ) {
                    throw new Error('The dashboard API returned an unexpected response.')
                }

                if (!cancelled) {
                    setCustomers(customerData)
                    setProducts(productData)
                    setOrders(orderData)
                }
            } catch (err) {
                if (!cancelled) {
                    setDashboardError(err.message || 'Could not load dashboard data.')
                    if (!sessionStorage.getItem('access')) {
                        setIsAuthenticated(false)
                    }
                }
            } finally {
                if (!cancelled) setDashboardLoading(false)
            }
        }

        fetchDashboardData()
        return () => {
            cancelled = true
        }
    }, [isAuthenticated, activePage])

    if (!isAuthenticated) {
        return <AuthScreen onAuthenticated={() => setIsAuthenticated(true)} />
    }

    const totalRevenue = orders
        .filter((order) => order.status === 'Completed')
        .reduce((sum, order) => sum + Number(order.total || 0), 0)

    const totalOrders = orders.length
    const totalCustomers = customers.length
    const totalProducts = products.length
    const completedOrders = orders.filter((order) => order.status === 'Completed').length
    const pendingOrders = orders.filter((order) => order.status === 'Pending').length
    const lowStockItems = products.filter((product) => Number(product.stock) <= 5).length

    const lastSevenDays = Array.from({ length: 7 }, (_, index) => {
        const date = new Date()
        date.setHours(0, 0, 0, 0)
        date.setDate(date.getDate() - (6 - index))

        const dateKey = [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, '0'),
            String(date.getDate()).padStart(2, '0'),
        ].join('-')

        const revenue = orders
            .filter((order) =>
                order.status === 'Completed' &&
                getOrderDateKey(order.created_at) === dateKey
            )
            .reduce((sum, order) => sum + Number(order.total || 0), 0)

        return {
            label: date.toLocaleDateString('en-IN', { weekday: 'short' }),
            revenue,
        }
    })

    const highestRevenue = Math.max(...lastSevenDays.map((day) => day.revenue), 1)

    const recentOrders = [...orders]
        .sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, 5)

    return (
        <div className="app">
            <aside className="sidebar">
                <h2 className="logo">Nexa<span>Desk.</span></h2>
                <p className="menu-label">MENU</p>

                <nav>
                    {['Dashboard', 'Customers', 'Products', 'Inventory', 'Orders', 'Analytics'].map((page) => (
                        <button
                            type="button"
                            key={page}
                            className={`nav-link ${activePage === page ? 'active' : ''}`}
                            onClick={() => setActivePage(page)}
                        >
                            {page}
                        </button>
                    ))}
                </nav>

                <div className="sidebar-bottom">
                    <div className="profile">
                        <div className="avatar">N</div>
                        <div>
                            <strong>Business Owner</strong>
                            <small>NexaDesk account</small>
                        </div>
                    </div>
                    <button type="button" className="logout-button" onClick={handleLogout}>
                        Log out
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <header className="topbar">
                    <div>
                        <p className="welcome">Welcome back 👋</p>
                        <h1>{activePage}</h1>
                    </div>
                    <button type="button" className="date-button">
                        {new Date().toLocaleDateString('en-IN', {
                            month: 'long',
                            year: 'numeric',
                        })}
                    </button>
                </header>

                {activePage === 'Customers' ? (
                    <Customers />
                ) : activePage === 'Products' ? (
                    <Products />
                ) : activePage === 'Inventory' ? (
                    <Inventory />
                ) : activePage === 'Orders' ? (
                    <Orders />
                ) : activePage === 'Analytics' ? (
                    <Analytics />
                ) : (
                    <>
                        {dashboardLoading ? (
                            <p>Loading dashboard data...</p>
                        ) : dashboardError ? (
                            <p className="error-message" role="alert">{dashboardError}</p>
                        ) : (
                            <>
                                <section className="stats-grid">
                                    <div className="stat-card">
                                        <p>Total Revenue</p>
                                        <h2>₹{totalRevenue.toLocaleString('en-IN')}</h2>
                                        <span>From completed orders</span>
                                    </div>
                                    <div className="stat-card">
                                        <p>Total Orders</p>
                                        <h2>{totalOrders}</h2>
                                        <span>All recorded orders</span>
                                    </div>
                                    <div className="stat-card">
                                        <p>Total Customers</p>
                                        <h2>{totalCustomers}</h2>
                                        <span>Registered customers</span>
                                    </div>
                                    <div className="stat-card">
                                        <p>Products</p>
                                        <h2>{totalProducts}</h2>
                                        <span>Across all categories</span>
                                    </div>
                                </section>

                                <section className="content-grid">
                                    <div className="panel sales-panel">
                                        <div className="panel-heading">
                                            <div>
                                                <h3>Sales Overview</h3>
                                                <p>Completed order revenue</p>
                                            </div>
                                            <span className="period">Last 7 days</span>
                                        </div>

                                        <div className="chart">
                                            {lastSevenDays.map((day, index) => (
                                                <div className="chart-column" key={`${day.label}-${index}`}>
                                                    <div
                                                        className="chart-bar"
                                                        style={{
                                                            height: `${
                                                                day.revenue === 0
                                                                    ? 0
                                                                    : Math.max((day.revenue / highestRevenue) * 100, 5)
                                                            }%`,
                                                        }}
                                                        title={`₹${day.revenue.toLocaleString('en-IN')}`}
                                                    />
                                                    <small>{day.label}</small>
                                                </div>
                                            ))}
                                        </div>

                                        {totalOrders === 0 && (
                                            <p className="empty-orders">
                                                Your sales chart will appear when you complete orders.
                                            </p>
                                        )}
                                    </div>

                                    <div className="panel">
                                        <div className="panel-heading">
                                            <div>
                                                <h3>Quick Summary</h3>
                                                <p>Business performance</p>
                                            </div>
                                        </div>
                                        <div className="summary-item">
                                            <span>Completed Orders</span>
                                            <strong>{completedOrders}</strong>
                                        </div>
                                        <div className="summary-item">
                                            <span>Pending Orders</span>
                                            <strong>{pendingOrders}</strong>
                                        </div>
                                        <div className="summary-item">
                                            <span>Low Stock Items</span>
                                            <strong>{lowStockItems}</strong>
                                        </div>
                                    </div>
                                </section>

                                <section className="panel orders-panel">
                                    <div className="panel-heading">
                                        <div>
                                            <h3>Recent Orders</h3>
                                            <p>Latest customer transactions</p>
                                        </div>
                                        <button
                                            type="button"
                                            className="view-button"
                                            onClick={() => setActivePage('Orders')}
                                        >
                                            View all
                                        </button>
                                    </div>

                                    <div className="table-wrapper">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Order ID</th>
                                                    <th>Customer</th>
                                                    <th>Amount</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {recentOrders.map((order) => (
                                                    <tr key={order.id}>
                                                        <td>#{String(order.id).slice(-6)}</td>
                                                        <td>{order.customer_name}</td>
                                                        <td>₹{Number(order.total).toLocaleString('en-IN')}</td>
                                                        <td>
                                                            <span className={`status ${(order.status || '').toLowerCase()}`}>
                                                                {order.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {recentOrders.length === 0 && (
                                                    <tr>
                                                        <td colSpan="4">
                                                            No orders yet. Your recent orders will appear here.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            </>
                        )}
                    </>
                )}
            </main>
        </div>
    )
}

export default App
