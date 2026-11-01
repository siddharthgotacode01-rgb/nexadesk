
import { useState } from 'react'

import Customers from './pages/customers'
import Products from './pages/products'
import Inventory from './pages/inventory'
import Orders from './pages/orders'
import Analytics from './pages/analytics'

import './App.css'

// Read saved data safely from localStorage
function getSavedData(key) {
    try {
        const saved = localStorage.getItem(key)
        return saved ? JSON.parse(saved) : []
    } catch {
        return []
    }
}

// Convert an order date into a comparable date key
function getOrderDateKey(dateString) {
    if (!dateString) return ''

    const parts = dateString.split('/')

    if (parts.length === 3) {
        const [day, month, year] = parts
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }

    return dateString
}

function App() {
    const [activePage, setActivePage] = useState('Dashboard')

    // Get the latest saved information
    const customers = getSavedData('nexadesk-customers')
    const products = getSavedData('nexadesk-products')
    const orders = getSavedData('nexadesk-orders')

    // Calculate dashboard statistics
    const totalRevenue = orders
        .filter(order => order.status === 'Completed')
        .reduce((sum, order) => sum + Number(order.total || 0), 0)

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

    // Get sales data for the last 7 days
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
            .filter(
                order =>
                    order.status === 'Completed' &&
                    getOrderDateKey(order.date) === dateKey
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

    const recentOrders = [...orders]
        .sort((a, b) => Number(b.id) - Number(a.id))
        .slice(0, 5)

    return (
        <div className="app">

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

            <main className="main-content">

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
                                                    {order.customerName}
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
                                                    No orders yet. Your recent orders will appear here.
                                                </td>
                                            </tr>
                                        )}

                                    </tbody>

                                </table>

                            </div>

                        </section>

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
