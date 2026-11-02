
import { useState, useEffect } from 'react'

import Customers from './pages/customers'
import Products from './pages/products'
import Inventory from './pages/inventory'
import Orders from './pages/orders'
import Analytics from './pages/analytics'

import './App.css'

const CUSTOMERS_API = 'http://127.0.0.1:8000/api/customers/'
const PRODUCTS_API = 'http://127.0.0.1:8000/api/products/'
const ORDERS_API = 'http://127.0.0.1:8000/api/orders/'

function getOrderDateKey(dateString) {
    if (!dateString) return ''

    const date = new Date(dateString)

    if (Number.isNaN(date.getTime())) return ''

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

function App() {
    const [activePage, setActivePage] = useState('Dashboard')

    // Dashboard data
    const [customers, setCustomers] = useState([])
    const [products, setProducts] = useState([])
    const [orders, setOrders] = useState([])

    // Loading and error states
    const [dashboardLoading, setDashboardLoading] = useState(true)
    const [dashboardError, setDashboardError] = useState('')

    // Fetch dashboard data from Django
    useEffect(() => {
        async function fetchDashboardData() {
            try {
                setDashboardLoading(true)
                setDashboardError('')

                const [
                    customerResponse,
                    productResponse,
                    orderResponse
                ] = await Promise.all([
                    fetch(CUSTOMERS_API),
                    fetch(PRODUCTS_API),
                    fetch(ORDERS_API)
                ])

                if (
                    !customerResponse.ok ||
                    !productResponse.ok ||
                    !orderResponse.ok
                ) {
                    throw new Error('Could not load dashboard data.')
                }

                const [
                    customerData,
                    productData,
                    orderData
                ] = await Promise.all([
                    customerResponse.json(),
                    productResponse.json(),
                    orderResponse.json()
                ])

                setCustomers(customerData)
                setProducts(productData)
                setOrders(orderData)

            } catch (error) {
                setDashboardError(error.message)
            } finally {
                setDashboardLoading(false)
            }
        }

        fetchDashboardData()
    }, [])

    // Dashboard statistics
    const totalRevenue = orders
        .filter(order => order.status === 'Completed')
        .reduce(
            (sum, order) => sum + Number(order.total || 0),
            0
        )

    const totalOrders = orders.length
    const totalCustomers = customers.length
    const totalProducts = products.length

    const completedOrders = orders.filter(
        order => order.status === 'Completed'
    ).length

    const pendingOrders = orders.filter(
        order => order.status === 'Pending'
    ).length

    const lowStockItems = products.filter(
        product => Number(product.stock) <= 5
    ).length

    // Revenue from the last seven days
    const lastSevenDays = Array.from({ length: 7 }, (_, index) => {
        const date = new Date()

        date.setHours(0, 0, 0, 0)
        date.setDate(date.getDate() - (6 - index))

        const dateKey = [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, '0'),
            String(date.getDate()).padStart(2, '0')
        ].join('-')

        const revenue = orders
            .filter(order =>
                order.status === 'Completed' &&
                getOrderDateKey(order.created_at) === dateKey
            )
            .reduce(
                (sum, order) => sum + Number(order.total || 0),
                0
            )

        return {
            label: date.toLocaleDateString('en-IN', {
                weekday: 'short'
            }),
            revenue
        }
    })

    const highestRevenue = Math.max(
        ...lastSevenDays.map(day => day.revenue),
        1
    )

    // Latest five orders
    const recentOrders = [...orders]
        .sort((a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        )
        .slice(0, 5)

    return (
        <div className="app">

            {/* SIDEBAR */}
            <aside className="sidebar">

                <h2 className="logo">
                    Nexa<span>Desk.</span>
                </h2>

                <p className="menu-label">MENU</p>

                <nav>
                    {[
                        'Dashboard',
                        'Customers',
                        'Products',
                        'Inventory',
                        'Orders',
                        'Analytics'
                    ].map(page => (
                        <button
                            key={page}
                            className={`nav-link ${
                                activePage === page ? 'active' : ''
                            }`}
                            onClick={() => setActivePage(page)}
                        >
                            {page}
                        </button>
                    ))}
                </nav>

                <div className="sidebar-bottom">
                    <div className="profile">

                        <div className="avatar">S</div>

                        <div>
                            <strong>Admin</strong>
                            <small>Business Owner</small>
                        </div>

                    </div>
                </div>

            </aside>

            {/* MAIN CONTENT */}
            <main className="main-content">

                {/* TOP BAR */}
                <header className="topbar">

                    <div>
                        <p className="welcome">
                            Welcome back, Admin 👋
                        </p>

                        <h1>{activePage}</h1>
                    </div>

                    <button className="date-button">
                        {new Date().toLocaleDateString('en-IN', {
                            month: 'long',
                            year: 'numeric'
                        })}
                    </button>

                </header>

                {/* CUSTOMERS PAGE */}
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

                ) : activePage === 'Dashboard' ? (

                    <>
                        {dashboardLoading ? (

                            <p>Loading dashboard data...</p>

                        ) : dashboardError ? (

                            <p className="error-message">
                                {dashboardError}
                            </p>

                        ) : (

                            <>
                                {/* STATISTICS */}
                                <section className="stats-grid">

                                    <div className="stat-card">
                                        <p>Total Revenue</p>
                                        <h2>
                                            ₹{totalRevenue.toLocaleString('en-IN')}
                                        </h2>
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

                                {/* SALES AND QUICK SUMMARY */}
                                <section className="content-grid">

                                    <div className="panel sales-panel">

                                        <div className="panel-heading">

                                            <div>
                                                <h3>Sales Overview</h3>
                                                <p>Completed order revenue</p>
                                            </div>

                                            <span className="period">
                                                Last 7 days
                                            </span>

                                        </div>

                                        <div className="chart">

                                            {lastSevenDays.map((day, index) => (
                                                <div
                                                    className="chart-column"
                                                    key={index}
                                                >

                                                    <div
                                                        className="chart-bar"
                                                        style={{
                                                            height: `${
                                                                day.revenue === 0
                                                                    ? 0
                                                                    : Math.max(
                                                                        (day.revenue / highestRevenue) * 100,
                                                                        5
                                                                    )
                                                            }%`
                                                        }}
                                                        title={`₹${day.revenue.toLocaleString('en-IN')}`}
                                                    />

                                                    <small>{day.label}</small>

                                                </div>
                                            ))}

                                        </div>

                                        {totalOrders === 0 && (
                                            <p className="empty-orders">
                                                Your sales chart will appear
                                                when you complete orders.
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

                                {/* RECENT ORDERS */}
                                <section className="panel orders-panel">

                                    <div className="panel-heading">

                                        <div>
                                            <h3>Recent Orders</h3>
                                            <p>Latest customer transactions</p>
                                        </div>

                                        <button
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

                                                {recentOrders.map(order => (
                                                    <tr key={order.id}>

                                                        <td>
                                                            #{String(order.id).slice(-6)}
                                                        </td>

                                                        <td>
                                                            {order.customer_name}
                                                        </td>

                                                        <td>
                                                            ₹{Number(order.total).toLocaleString('en-IN')}
                                                        </td>

                                                        <td>
                                                            <span
                                                                className={`status ${order.status.toLowerCase()}`}
                                                            >
                                                                {order.status}
                                                            </span>
                                                        </td>

                                                    </tr>
                                                ))}

                                                {recentOrders.length === 0 && (
                                                    <tr>
                                                        <td colSpan="4">
                                                            No orders yet. Your recent
                                                            orders will appear here.
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

                ) : (

                    <div className="panel">
                        <h3>{activePage}</h3>
                        <p>This section is coming soon.</p>
                    </div>

                )}

            </main>

        </div>
    )
}

export default App
