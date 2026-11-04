import { useState, useEffect } from 'react'
import { apiRequest } from '../api'

const API_URL = '/products/products/'
const BACKEND_URL = 'http://127.0.0.1:8000'

// Convert Django image paths into complete URLs.
function getImageUrl(imagePath) {
    if (!imagePath) return ''

    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath
    }

    return `${BACKEND_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`
}

function Inventory() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [updatingId, setUpdatingId] = useState(null)

    // GET: Fetch the authenticated user's products from Django.
    async function fetchProducts() {
        try {
            setLoading(true)
            setError('')

            const data = await apiRequest(API_URL)

            if (!Array.isArray(data)) {
                throw new Error('The products API returned an unexpected response.')
            }

            setProducts(data)
        } catch (err) {
            setError(err.message || 'Could not fetch inventory.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProducts()
    }, [])

    // PATCH: Update stock in Django database.
    async function updateStock(id, change) {
        const product = products.find((item) => item.id === id)

        if (!product || updatingId !== null) return

        const currentStock = Number(product.stock)
        const newStock = Math.max(0, currentStock + change)

        if (newStock === currentStock) return

        try {
            setUpdatingId(id)
            setError('')

            const updatedProduct = await apiRequest(`${API_URL}${id}/`, {
                method: 'PATCH',
                body: JSON.stringify({
                    stock: newStock,
                }),
            })

            setProducts((previous) =>
                previous.map((item) =>
                    item.id === id ? updatedProduct : item
                )
            )
        } catch (err) {
            setError(err.message || 'Could not update product stock.')
        } finally {
            setUpdatingId(null)
        }
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

                {error && (
                    <p className="error-message" role="alert">{error}</p>
                )}

                {loading ? (
                    <p>Loading inventory...</p>
                ) : products.length === 0 ? (
                    <p>No products found. Add products first.</p>
                ) : (
                    <div className="inventory-list">
                        {products.map((product) => (
                            <div className="inventory-item" key={product.id}>
                                <div className="inventory-product">
                                    {product.image ? (
                                        <img
                                            src={getImageUrl(product.image)}
                                            alt={product.name || 'Product'}
                                            onError={(event) => {
                                                event.currentTarget.style.display = 'none'
                                            }}
                                        />
                                    ) : (
                                        <div className="inventory-placeholder">
                                            {(product.name || '?').charAt(0).toUpperCase()}
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

                                    <span
                                        className={
                                            Number(product.stock) <= 5
                                                ? 'stock-status low-stock'
                                                : 'stock-status'
                                        }
                                    >
                                        {Number(product.stock) <= 5
                                            ? 'Low Stock'
                                            : 'In Stock'}
                                    </span>
                                </div>

                                <div className="stock-controls">
                                    <button
                                        type="button"
                                        onClick={() => updateStock(product.id, -1)}
                                        disabled={
                                            Number(product.stock) <= 0 ||
                                            updatingId !== null
                                        }
                                        aria-label={`Decrease ${product.name} stock`}
                                    >
                                        −
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => updateStock(product.id, 1)}
                                        disabled={updatingId !== null}
                                        aria-label={`Increase ${product.name} stock`}
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
