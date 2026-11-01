
import { useState, useEffect } from 'react'

function Orders() {
  const [customers] = useState(() => {
    const saved = localStorage.getItem('nexadesk-customers')
    return saved ? JSON.parse(saved) : []
  })

  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('nexadesk-products')
    return saved ? JSON.parse(saved) : []
  })

  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('nexadesk-orders')
    return saved ? JSON.parse(saved) : []
  })

  const [showForm, setShowForm] = useState(false)
  const [customerId, setCustomerId] = useState('')
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    localStorage.setItem('nexadesk-orders', JSON.stringify(orders))
  }, [orders])

  useEffect(() => {
    localStorage.setItem('nexadesk-products', JSON.stringify(products))
  }, [products])

  const selectedProduct = products.find(
    (product) => String(product.id) === productId
  )

  const total = selectedProduct
    ? Number(selectedProduct.price) * Number(quantity)
    : 0

  function createOrder(event) {
    event.preventDefault()

    const customer = customers.find(
      (item) => String(item.id) === customerId
    )

    const product = products.find(
      (item) => String(item.id) === productId
    )

    if (!customer || !product) {
      alert('Please select a customer and product.')
      return
    }

    if (Number(quantity) < 1 || !Number.isInteger(Number(quantity))) {
      alert('Please enter a valid quantity.')
      return
    }

    if (Number(product.stock) < Number(quantity)) {
      alert('Not enough stock available.')
      return
    }

    const newOrder = {
      id: Date.now(),
      customerId: customer.id,
      customerName: customer.name,
      productId: product.id,
      productName: product.name,
      quantity: Number(quantity),
      total: total,
      status: 'Pending',
      date: new Date().toLocaleDateString('en-IN')
    }

    setOrders((previous) => [...previous, newOrder])

    setProducts((previous) =>
      previous.map((item) =>
        item.id === product.id
          ? {
              ...item,
              stock: Number(item.stock) - Number(quantity)
            }
          : item
      )
    )

    setCustomerId('')
    setProductId('')
    setQuantity(1)
    setShowForm(false)
  }

  function updateStatus(orderId, newStatus) {
    setOrders((previous) =>
      previous.map((order) =>
        order.id === orderId
          ? { ...order, status: newStatus }
          : order
      )
    )
  }

  function deleteOrder(orderId) {
    const order = orders.find((item) => item.id === orderId)

    if (!order) return

    const confirmDelete = window.confirm(
      'Delete this order? The stock will be restored.'
    )

    if (!confirmDelete) return

    setOrders((previous) =>
      previous.filter((item) => item.id !== orderId)
    )

    setProducts((previous) =>
      previous.map((product) =>
        product.id === order.productId
          ? {
              ...product,
              stock: Number(product.stock) + order.quantity
            }
          : product
      )
    )
  }

  const totalRevenue = orders
    .filter((order) => order.status === 'Completed')
    .reduce((sum, order) => sum + Number(order.total), 0)

  return (
    <section className="orders-page">

      <div className="orders-stats">
        <div className="panel">
          <p>Total Orders</p>
          <h2>{orders.length}</h2>
        </div>

        <div className="panel">
          <p>Pending Orders</p>
          <h2>
            {orders.filter((order) => order.status === 'Pending').length}
          </h2>
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
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : '+ Create Order'}
          </button>
        </div>

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
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                required
              />
            </label>

            <div className="order-total">
              <span>Order Total</span>
              <h2>₹{total.toLocaleString('en-IN')}</h2>
            </div>

            <button type="submit" className="add-customer-btn">
              Place Order
            </button>

          </form>
        )}

        {customers.length === 0 && (
          <p>Add customers before creating an order.</p>
        )}

        {products.length === 0 && (
          <p>Add products before creating an order.</p>
        )}

        {orders.length === 0 ? (
          <p className="empty-orders">No orders yet. Create your first order.</p>
        ) : (
          <div className="orders-list">

            {orders.map((order) => (
              <div className="order-item" key={order.id}>

                <div>
                  <h3>Order #{String(order.id).slice(-6)}</h3>
                  <p>{order.customerName}</p>
                  <p>{order.productName} × {order.quantity}</p>
                  <span>{order.date}</span>
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

      </div>
    </section>
  )
}

export default Orders
