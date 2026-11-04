import { useState, useEffect } from 'react'
import { apiRequest } from '../api'

const ORDERS_API = '/orders/orders/'
const PRODUCTS_API = '/products/products/'
const CUSTOMERS_API = '/customers/customers/'

function Analytics() {
    const [orders, setOrders] = useState([])
    const [products, setProducts] = useState([])
    const [customers, setCustomers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    // Fetch analytics data for the authenticated user.
    useEffect(() => {
        async function fetchAnalyticsData() {
            try {
                setLoading(true)
                setError('')

                const [ordersData, productsData, customersData] = await Promise.all([
                    apiRequest(ORDERS_API),
                    apiRequest(PRODUCTS_API),
                    apiRequest(CUSTOMERS_API),
                ])

                if (
                    !Array.isArray(ordersData) ||
                    !Array.isArray(productsData) ||
                    !Array.isArray(customersData)
                ) {
                    throw new Error('An analytics API returned an unexpected response.')
                }

                setOrders(ordersData)
                setProducts(productsData)
                setCustomers(customersData)
            } catch (err) {
                setError(err.message || 'Could not load analytics data.')
            } finally {
                setLoading(false)
            }
        }

        fetchAnalyticsData()
    }, [])

    // Revenue from completed orders.
    const completedOrders = orders.filter(
        (order) => order.status === 'Completed'
    )

    const totalRevenue = completedOrders.reduce(
        (sum, order) => sum + Number(order.total || 0),
        0
    )

    const averageOrderValue = completedOrders.length > 0
        ? totalRevenue / completedOrders.length
        : 0

    // Order status calculations.
    const pendingOrders = orders.filter(
        (order) => order.status === 'Pending'
    ).length

    const processingOrders = orders.filter(
        (order) => order.status === 'Processing'
    ).length

    // Find best-selling products using completed orders.
    const productSales = {}

    orders.forEach((order) => {
        if (order.status !== 'Completed') return

        const productName = order.product_name || 'Unknown Product'

        if (!productSales[productName]) {
            productSales[productName] = 0
        }

        productSales[productName] += Number(order.quantity || 0)
    })

    const bestSellingProducts = Object.entries(productSales)
        .map(([name, quantity]) => ({ name, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5)

    const highestProductSales = Math.max(
        ...bestSellingProducts.map((product) => product.quantity),
        1
    )

    // Revenue by month using Django created_at.
    const monthlyRevenue = Array.from({ length: 6 }, (_, index) => {
        const date = new Date()
        date.setDate(1)
        date.setMonth(date.getMonth() - (5 - index))

        const month = date.getMonth()
        const year = date.getFullYear()

        const revenue = completedOrders
            .filter((order) => {
                if (!order.created_at) return false

                const orderDate = new Date(order.created_at)

                return (
                    !Number.isNaN(orderDate.getTime()) &&
                    orderDate.getMonth() === month &&
                    orderDate.getFullYear() === year
                )
            })
            .reduce(
                (sum, order) => sum + Number(order.total || 0),
                0
            )

        return {
            label: date.toLocaleDateString('en-IN', { month: 'short' }),
            revenue,
        }
    })

    const highestMonthlyRevenue = Math.max(
        ...monthlyRevenue.map((month) => month.revenue),
        1
    )

    const totalStatusOrders =
        completedOrders.length + pendingOrders + processingOrders

    // Loading state.
    if (loading) {
        return (
            <section className="analytics-page">
                <p>Loading analytics data...</p>
            </section>
        )
    }

    // Error state.
    if (error) {
        return (
            <section className="analytics-page">
                <p className="error-message" role="alert">{error}</p>
            </section>
        )
    }

    return (
        <section className="analytics-page">
            {/* TOP STATISTICS */}
            <div className="analytics-stats">
                <div className="panel">
                    <p>Total Revenue</p>
                    <h2>₹{totalRevenue.toLocaleString('en-IN')}</h2>
                    <span>Completed orders</span>
                </div>

                <div className="panel">
                    <p>Total Orders</p>
                    <h2>{orders.length}</h2>
                    <span>All recorded orders</span>
                </div>

                <div className="panel">
                    <p>Average Order Value</p>
                    <h2>₹{Math.round(averageOrderValue).toLocaleString('en-IN')}</h2>
                    <span>Per completed order</span>
                </div>

                <div className="panel">
                    <p>Total Customers</p>
                    <h2>{customers.length}</h2>
                    <span>Registered customers</span>
                </div>
            </div>

            {/* MONTHLY REVENUE */}
            <div className="panel analytics-chart-panel">
                <div className="analytics-heading">
                    <div>
                        <h2>Revenue Overview</h2>
                        <p>Monthly revenue from completed orders</p>
                    </div>
                    <span>Last 6 months</span>
                </div>

                <div className="analytics-chart">
                    {monthlyRevenue.map((month, index) => (
                        <div className="analytics-chart-column" key={`${month.label}-${index}`}>
                            <strong>
                                {month.revenue > 0
                                    ? `₹${month.revenue.toLocaleString('en-IN')}`
                                    : ''}
                            </strong>

                            <div className="analytics-bar-container">
                                <div
                                    className="analytics-bar"
                                    style={{
                                        height: `${
                                            month.revenue === 0
                                                ? 0
                                                : Math.max(
                                                    (month.revenue / highestMonthlyRevenue) * 100,
                                                    5
                                                )
                                        }%`,
                                    }}
                                />
                            </div>

                            <small>{month.label}</small>
                        </div>
                    ))}
                </div>
            </div>

            {/* LOWER ANALYTICS */}
            <div className="analytics-grid">
                {/* ORDER STATUS */}
                <div className="panel">
                    <div className="analytics-heading">
                        <div>
                            <h2>Order Status</h2>
                            <p>Order distribution</p>
                        </div>
                    </div>

                    <div className="status-analytics">
                        {[
                            { name: 'Completed', count: completedOrders.length },
                            { name: 'Pending', count: pendingOrders },
                            { name: 'Processing', count: processingOrders },
                        ].map((status) => (
                            <div className="status-row" key={status.name}>
                                <div className="status-label">
                                    <span>{status.name}</span>
                                    <strong>{status.count}</strong>
                                </div>

                                <div className="status-track">
                                    <div
                                        className={`status-progress ${status.name.toLowerCase()}`}
                                        style={{
                                            width: `${
                                                totalStatusOrders > 0
                                                    ? (status.count / totalStatusOrders) * 100
                                                    : 0
                                            }%`,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* BEST-SELLING PRODUCTS */}
                <div className="panel">
                    <div className="analytics-heading">
                        <div>
                            <h2>Best-selling Products</h2>
                            <p>Based on completed order quantities</p>
                        </div>
                    </div>

                    {bestSellingProducts.length === 0 ? (
                        <p className="analytics-empty">
                            Completed product sales will appear here.
                        </p>
                    ) : (
                        <div className="best-products">
                            {bestSellingProducts.map((product, index) => (
                                <div className="best-product" key={product.name}>
                                    <div className="best-product-info">
                                        <span>{index + 1}. {product.name}</span>
                                        <strong>{product.quantity} units</strong>
                                    </div>

                                    <div className="status-track">
                                        <div
                                            className="analytics-bar product-sales-bar"
                                            style={{
                                                width: `${(product.quantity / highestProductSales) * 100}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* INVENTORY SUMMARY */}
            <div className="panel inventory-analytics">
                <div className="analytics-heading">
                    <div>
                        <h2>Inventory Summary</h2>
                        <p>Current product catalogue performance</p>
                    </div>
                </div>

                <div className="inventory-summary-grid">
                    <div>
                        <span>Total Products</span>
                        <strong>{products.length}</strong>
                    </div>

                    <div>
                        <span>Total Units in Stock</span>
                        <strong>
                            {products.reduce(
                                (sum, product) => sum + Number(product.stock || 0),
                                0
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>Low Stock Products</span>
                        <strong>
                            {products.filter(
                                (product) => Number(product.stock) <= 5
                            ).length}
                        </strong>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Analytics
