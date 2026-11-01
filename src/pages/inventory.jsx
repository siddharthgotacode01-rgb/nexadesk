
import { useState, useEffect } from 'react'

function Inventory() {
  const [products, setProducts] = useState(() => {
    const savedProducts = localStorage.getItem('nexadesk-products')
    return savedProducts ? JSON.parse(savedProducts) : []
  })

  useEffect(() => {
    localStorage.setItem(
      'nexadesk-products',
      JSON.stringify(products)
    )
  }, [products])

  const updateStock = (id, change) => {
    setProducts((currentProducts) =>
      currentProducts.map((product) =>
        product.id === id
          ? {
              ...product,
              stock: Math.max(0, Number(product.stock) + change)
            }
          : product
      )
    )
  }

  const lowStockCount = products.filter(
    (product) => Number(product.stock) <= 5
  ).length

  const totalStock = products.reduce(
    (total, product) => total + Number(product.stock),
    0
  )

  return (
    <section className="inventory-page">

      <div className="inventory-stats">
        <div className="panel">
          <p>Total Products</p>
          <h2>{products.length}</h2>
        </div>

        <div className="panel">
          <p>Total Units in Stock</p>
          <h2>{totalStock}</h2>
        </div>

        <div className="panel">
          <p>Low Stock Products</p>
          <h2>{lowStockCount}</h2>
        </div>
      </div>

      <div className="panel inventory-panel">
        <div className="inventory-heading">
          <div>
            <h2>Inventory Management</h2>
            <p>Monitor and update your product stock.</p>
          </div>
        </div>

        {products.length === 0 ? (
          <p>No products found. Add products first.</p>
        ) : (
          <div className="inventory-list">
            {products.map((product) => (
              <div className="inventory-item" key={product.id}>

                <div className="inventory-product">
                  {product.image ? (
                    <img src={product.image} alt={product.name} />
                  ) : (
                    <div className="inventory-placeholder">
                      {product.name.charAt(0)}
                    </div>
                  )}

                  <div>
                    <h3>{product.name}</h3>
                    <p>{product.category}</p>
                  </div>
                </div>

                <div className="inventory-stock">
                  <span>Current Stock</span>
                  <strong>{product.stock} units</strong>

                  <span className={
                    Number(product.stock) <= 5
                      ? 'stock-status low-stock'
                      : 'stock-status'
                  }>
                    {Number(product.stock) <= 5
                      ? 'Low Stock'
                      : 'In Stock'}
                  </span>
                </div>

                <div className="stock-controls">
                  <button
                    onClick={() => updateStock(product.id, -1)}
                    disabled={Number(product.stock) <= 0}
                  >
                    −
                  </button>

                  <button
                    onClick={() => updateStock(product.id, 1)}
                  >
                    +
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

export default Inventory
