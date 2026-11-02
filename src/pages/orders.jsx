
import { useState, useEffect } from 'react'

const CUSTOMERS_API = 'http://127.0.0.1:8000/api/customers/'
const PRODUCTS_API = 'http://127.0.0.1:8000/api/products/'
const ORDERS_API = 'http://127.0.0.1:8000/api/orders/'

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
  const [error, setError] = useState('')

  // Fetch customers, products and orders
  async function fetchData() {
    try {
      setLoading(true)
      setError('')

      const [customerResponse, productResponse, orderResponse] =
        await Promise.all([
          fetch(CUSTOMERS_API),
          fetch(PRODUCTS_API),
          fetch(ORDERS_API)
        ])

      if (
        !customerResponse.ok ||
        !productResponse.ok ||
        !orderResponse.ok
      ) {
        throw new Error('Could not load order data.')
      }

      const [customerData, productData, orderData] =
        await Promise.all([
          customerResponse.json(),
          productResponse.json(),
          orderResponse.json()
        ])

      setCustomers(customerData)
      setProducts(productData)
      setOrders(orderData)

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const selectedProduct = products.find(
    product => String(product.id) === productId
  )

  const total = selectedProduct
    ? Number(selectedProduct.price) * Number(quantity)
    : 0

  // Create order in Django
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

    try {
      setSaving(true)
      setError('')

      const response = await fetch(ORDERS_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customer: Number(customerId),
          product: Number(productId),
          quantity: Number(quantity)
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          Object.values(data).flat().join(' ') ||
          'Could not create order.'
        )
      }

      setCustomerId('')
      setProductId('')
      setQuantity(1)
      setShowForm(false)

      await fetchData()

    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Update order status
  async function updateStatus(orderId, newStatus) {
    try {
      setError('')

      const response = await fetch(`${ORDERS_API}${orderId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus
        })
      })

      if (!response.ok) {
        throw new Error('Could not update order status.')
      }

      await fetchData()

    } catch (err) {
      setError(err.message)
    }
  }

  // Delete order; Django restores stock
  async function deleteOrder(orderId) {
    const confirmed = window.confirm(
      'Delete this order? The stock will be restored.'
    )

    if (!confirmed) return

    try {
      setError('')

      const response = await fetch(`${ORDERS_API}${orderId}/`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Could not delete order.')
      }

      await fetchData()

    } catch (err) {
      setError(err.message)
    }
  }

  const totalRevenue = orders
    .filter(order => order.status === 'Completed')
    .reduce((sum, order) => sum + Number(order.total), 0)

  const pendingOrders = orders.filter(
    order => order.status === 'Pending'
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
            className="add-customer-btn"
            onClick={() => {
              setShowForm(!showForm)
              setError('')
            }}
          >
            {showForm ? 'Cancel' : '+ Create Order'}
          </button>
        </div>

        {error && (
          <p className="error-message">{error}</p>
        )}

        {showForm && (
          <form className="order-form" onSubmit={createOrder}>

            <label>
              Select Customer

              <select
                value={customerId}
                onChange={event => setCustomerId(event.target.value)}
                required
              >
                <option value="">Choose a customer</option>

                {customers.map(customer => (
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
                onChange={event => setProductId(event.target.value)}
                required
              >
                <option value="">Choose a product</option>

                {products.map(product => (
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
                onChange={event => setQuantity(event.target.value)}
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
              disabled={saving}
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

                {orders.map(order => (
                  <div className="order-item" key={order.id}>

                    <div>
                      <h3>Order #{String(order.id).slice(-6)}</h3>
                      <p>{order.customer_name}</p>
                      <p>{order.product_name} × {order.quantity}</p>
                      <span>
                        {new Date(order.created_at).toLocaleDateString('en-IN')}
                      </span>
                    </div>

                    <div className="order-price">

                      <strong>
                        ₹{Number(order.total).toLocaleString('en-IN')}
                      </strong>

                      <select
                        value={order.status}
                        onChange={event =>
                          updateStatus(order.id, event.target.value)
                        }
                      >
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Completed">Completed</option>
                      </select>

                      <button
                        className="delete-btn"
                        onClick={() => deleteOrder(order.id)}
                      >
                        Delete
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
