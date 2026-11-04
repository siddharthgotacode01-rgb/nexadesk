import { useState, useEffect } from 'react'
import { apiRequest } from '../api'

const CUSTOMERS_API = '/customers/customers/'
const PRODUCTS_API = '/products/products/'
const ORDERS_API = '/orders/orders/'

function Orders() {
    const [customers, setCustomers] = useState([])
    const [products, setProducts] = useState([])
    const [orders, setOrders] = useState([])

    const [showForm, setShowForm] = useState(false)
    const [customerId, setCustomerId] = useState('')
    const [productId, setProductId] = useState('')
    const [quantity, setQuantity] = useState(1)

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [updatingOrderId, setUpdatingOrderId] = useState(null)
    const [deletingOrderId, setDeletingOrderId] = useState(null)
    const [error, setError] = useState('')

    // Fetch the logged-in user's customers, products and orders.
    async function fetchData() {
        try {
            setLoading(true)
            setError('')

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
                throw new Error('One of the order APIs returned an unexpected response.')
            }

            setCustomers(customerData)
            setProducts(productData)
            setOrders(orderData)
        } catch (err) {
            setError(err.message || 'Could not load order data.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const selectedProduct = products.find(
        (product) => String(product.id) === productId
    )

    const total = selectedProduct
        ? Number(selectedProduct.price) * Number(quantity)
        : 0

    // Create an order. The Django backend handles total calculation and stock deduction.
    async function createOrder(event) {
        event.preventDefault()

        if (!customerId || !productId) {
            setError('Please select a customer and product.')
            return
        }

        if (!Number.isInteger(Number(quantity)) || Number(quantity) < 1) {
            setError('Please enter a valid quantity.')
            return
        }

        if (selectedProduct && Number(quantity) > Number(selectedProduct.stock)) {
            setError('The requested quantity exceeds available stock.')
            return
        }

        try {
            setSaving(true)
            setError('')

            await apiRequest(ORDERS_API, {
                method: 'POST',
                body: JSON.stringify({
                    customer: Number(customerId),
                    product: Number(productId),
                    quantity: Number(quantity),
                }),
            })

            setCustomerId('')
            setProductId('')
            setQuantity(1)
            setShowForm(false)

            await fetchData()
        } catch (err) {
            setError(err.message || 'Could not create order.')
        } finally {
            setSaving(false)
        }
    }

    // Update order status.
    async function updateStatus(orderId, newStatus) {
        if (updatingOrderId !== null) return

        try {
            setUpdatingOrderId(orderId)
            setError('')

            await apiRequest(`${ORDERS_API}${orderId}/`, {
                method: 'PATCH',
                body: JSON.stringify({
                    status: newStatus,
                }),
            })

            await fetchData()
        } catch (err) {
            setError(err.message || 'Could not update order status.')
        } finally {
            setUpdatingOrderId(null)
        }
    }

    // Delete order; Django restores the product stock.
    async function deleteOrder(orderId) {
        const confirmed = window.confirm(
            'Delete this order? The stock will be restored.'
        )

        if (!confirmed || deletingOrderId !== null) return

        try {
            setDeletingOrderId(orderId)
            setError('')

            await apiRequest(`${ORDERS_API}${orderId}/`, {
                method: 'DELETE',
            })

            await fetchData()
        } catch (err) {
            setError(err.message || 'Could not delete order.')
        } finally {
            setDeletingOrderId(null)
        }
    }

    const totalRevenue = orders
        .filter((order) => order.status === 'Completed')
        .reduce((sum, order) => sum + Number(order.total), 0)

    const pendingOrders = orders.filter(
        (order) => order.status === 'Pending'
    ).length

    return (
        <section className="orders-page">
            <div className="orders-stats">
                <div className="panel">
                    <p>Total Orders</p>
                    <h2>{orders.length}</h2>
                </div>

                <div className="panel">
                    <p>Pending Orders</p>
                    <h2>{pendingOrders}</h2>
                </div>

                <div className="panel">
                    <p>Completed Revenue</p>
                    <h2>₹{totalRevenue.toLocaleString('en-IN')}</h2>
                </div>
            </div>

            <div className="panel orders-panel">
                <div className="orders-heading">
                    <div>
                        <h2>Order Management</h2>
                        <p>Create and manage customer orders.</p>
                    </div>

                    <button
                        type="button"
                        className="add-customer-btn"
                        onClick={() => {
                            setShowForm((previous) => !previous)
                            setError('')
                        }}
                    >
                        {showForm ? 'Cancel' : '+ Create Order'}
                    </button>
                </div>

                {error && (
                    <p className="error-message" role="alert">{error}</p>
                )}

                {showForm && (
                    <form className="order-form" onSubmit={createOrder}>
                        <label>
                            Select Customer
                            <select
                                value={customerId}
                                onChange={(event) => setCustomerId(event.target.value)}
                                required
                            >
                                <option value="">Choose a customer</option>
                                {customers.map((customer) => (
                                    <option key={customer.id} value={customer.id}>
                                        {customer.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            Select Product
                            <select
                                value={productId}
                                onChange={(event) => setProductId(event.target.value)}
                                required
                            >
                                <option value="">Choose a product</option>
                                {products.map((product) => (
                                    <option
                                        key={product.id}
                                        value={product.id}
                                        disabled={Number(product.stock) <= 0}
                                    >
                                        {product.name} — {product.stock} in stock
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            Quantity
                            <input
                                type="number"
                                min="1"
                                step="1"
                                max={selectedProduct?.stock || undefined}
                                value={quantity}
                                onChange={(event) => setQuantity(event.target.value)}
                                required
                            />
                        </label>

                        <div className="order-total">
                            <span>Order Total</span>
                            <h2>₹{total.toLocaleString('en-IN')}</h2>
                        </div>

                        <button
                            type="submit"
                            className="add-customer-btn"
                            disabled={saving || customers.length === 0 || products.length === 0}
                        >
                            {saving ? 'Creating Order...' : 'Place Order'}
                        </button>
                    </form>
                )}

                {loading ? (
                    <p>Loading orders...</p>
                ) : (
                    <>
                        {customers.length === 0 && (
                            <p>Add customers before creating an order.</p>
                        )}

                        {products.length === 0 && (
                            <p>Add products before creating an order.</p>
                        )}

                        {orders.length === 0 ? (
                            <p className="empty-orders">
                                No orders yet. Create your first order.
                            </p>
                        ) : (
                            <div className="orders-list">
                                {orders.map((order) => (
                                    <div className="order-item" key={order.id}>
                                        <div>
                                            <h3>Order #{String(order.id).slice(-6)}</h3>
                                            <p>{order.customer_name}</p>
                                            <p>{order.product_name} × {order.quantity}</p>
                                            <span>
                                                {order.created_at
                                                    ? new Date(order.created_at).toLocaleDateString('en-IN')
                                                    : 'Date unavailable'}
                                            </span>
                                        </div>

                                        <div className="order-price">
                                            <strong>
                                                ₹{Number(order.total).toLocaleString('en-IN')}
                                            </strong>

                                            <select
                                                value={order.status}
                                                onChange={(event) =>
                                                    updateStatus(order.id, event.target.value)
                                                }
                                                disabled={updatingOrderId !== null}
                                                aria-label={`Update status for order ${order.id}`}
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="Processing">Processing</option>
                                                <option value="Completed">Completed</option>
                                            </select>

                                            <button
                                                type="button"
                                                className="delete-btn"
                                                onClick={() => deleteOrder(order.id)}
                                                disabled={deletingOrderId !== null}
                                            >
                                                {deletingOrderId === order.id ? 'Deleting...' : 'Delete'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </section>
    )
}

export default Orders
