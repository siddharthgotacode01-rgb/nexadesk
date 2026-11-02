
import { useState, useEffect } from 'react'

const API_URL = 'http://127.0.0.1:8000/api/products/'
const BACKEND_URL = 'http://127.0.0.1:8000'

// Convert Django image paths into complete URLs
function getImageUrl(imagePath) {
    if (!imagePath) return ''

    if (
        imagePath.startsWith('http://') ||
        imagePath.startsWith('https://')
    ) {
        return imagePath
    }

    return `${BACKEND_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`
}

function Products() {
    const [products, setProducts] = useState([])
    const [search, setSearch] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState(null)

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const [newProduct, setNewProduct] = useState({
        name: '',
        sku: '',
        category: '',
        price: '',
        stock: '',
        description: ''
    })

    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState('')

    // GET: Fetch products from Django
    async function fetchProducts() {
        try {
            setLoading(true)
            setError('')

            const response = await fetch(API_URL)

            if (!response.ok) {
                throw new Error('Could not fetch products.')
            }

            const data = await response.json()
            setProducts(data)

        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProducts()
    }, [])

    // Handle text inputs
    function handleChange(event) {
        const { name, value } = event.target

        setNewProduct(previous => ({
            ...previous,
            [name]: value
        }))
    }

    // Handle image selection
    function handleImageChange(event) {
        const file = event.target.files[0]

        if (!file) return

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.')
            event.target.value = ''
            return
        }

        if (file.size > 1024 * 1024) {
            alert('Please choose an image smaller than 1 MB.')
            event.target.value = ''
            return
        }

        setImageFile(file)
        setImagePreview(URL.createObjectURL(file))
    }

    // Reset product form
    function resetForm() {
        setNewProduct({
            name: '',
            sku: '',
            category: '',
            price: '',
            stock: '',
            description: ''
        })

        setImageFile(null)
        setImagePreview('')
        setEditingId(null)
        setShowForm(false)
        setError('')
    }

    // POST: Create a product
    // PATCH: Update an existing product
    async function saveProduct(event) {
        event.preventDefault()

        try {
            setSaving(true)
            setError('')

            const formData = new FormData()

            formData.append('name', newProduct.name)
            formData.append('sku', newProduct.sku)
            formData.append('category', newProduct.category)
            formData.append('price', newProduct.price)
            formData.append('stock', newProduct.stock)
            formData.append('description', newProduct.description)

            if (imageFile) {
                formData.append('image', imageFile)
            }

            const url = editingId
                ? `${API_URL}${editingId}/`
                : API_URL

            const response = await fetch(url, {
                method: editingId ? 'PATCH' : 'POST',
                body: formData
            })

            if (!response.ok) {
                const errorData = await response.json()

                throw new Error(
                    Object.values(errorData).flat().join(' ') ||
                    'Could not save product.'
                )
            }

            await fetchProducts()
            resetForm()

        } catch (err) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    // Edit product
    function editProduct(product) {
        setNewProduct({
            name: product.name,
            sku: product.sku,
            category: product.category,
            price: String(product.price),
            stock: String(product.stock),
            description: product.description || ''
        })

        setImageFile(null)

        // Show the existing Django image in the edit preview
        setImagePreview(getImageUrl(product.image))

        setEditingId(product.id)
        setShowForm(true)
        setError('')
    }

    // DELETE: Remove a product
    async function deleteProduct(id) {
        if (!window.confirm('Are you sure you want to delete this product?')) {
            return
        }

        try {
            setError('')

            const response = await fetch(`${API_URL}${id}/`, {
                method: 'DELETE'
            })

            if (!response.ok) {
                throw new Error('Could not delete product.')
            }

            await fetchProducts()

        } catch (err) {
            setError(err.message)
        }
    }

    // Search and filter products
    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.category.toLowerCase().includes(search.toLowerCase()) ||
        product.sku.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="products-page">

            {/* PRODUCT TOOLBAR */}

            <div className="product-toolbar">

                <input
                    type="text"
                    placeholder="Search products..."
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                />

                <button
                    className="add-customer-btn"
                    onClick={() => {
                        if (showForm) {
                            resetForm()
                        } else {
                            setShowForm(true)
                        }
                    }}
                >
                    + Add Product
                </button>

            </div>

            {/* ERROR MESSAGE */}

            {error && (
                <p className="error-message">
                    {error}
                </p>
            )}

            {/* ADD / EDIT PRODUCT FORM */}

            {showForm && (
                <form
                    className="product-form"
                    onSubmit={saveProduct}
                >

                    <h3>
                        {editingId !== null ? 'Edit Product' : 'Add New Product'}
                    </h3>

                    <input
                        name="name"
                        placeholder="Product name"
                        value={newProduct.name}
                        onChange={handleChange}
                        required
                    />

                    <input
                        name="sku"
                        placeholder="SKU (unique product code)"
                        value={newProduct.sku}
                        onChange={handleChange}
                        required
                    />

                    <select
                        name="category"
                        value={newProduct.category}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select category</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Clothing">Clothing</option>
                        <option value="Accessories">Accessories</option>
                        <option value="Food">Food</option>
                        <option value="Other">Other</option>
                    </select>

                    <input
                        name="price"
                        type="number"
                        placeholder="Price (₹)"
                        min="0.01"
                        step="0.01"
                        value={newProduct.price}
                        onChange={handleChange}
                        required
                    />

                    <input
                        name="stock"
                        type="number"
                        placeholder="Stock quantity"
                        min="0"
                        step="1"
                        value={newProduct.stock}
                        onChange={handleChange}
                        required
                    />

                    <textarea
                        name="description"
                        placeholder="Product description (optional)"
                        value={newProduct.description}
                        onChange={handleChange}
                    />

                    {/* IMAGE UPLOAD */}

                    <label className="image-upload">
                        Product Image

                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                    </label>

                    {/* IMAGE PREVIEW */}

                    {imagePreview && (
                        <img
                            src={imagePreview}
                            alt="Product preview"
                            className="product-preview"
                            onError={event => {
                                event.currentTarget.style.display = 'none'
                            }}
                        />
                    )}

                    <button
                        type="submit"
                        className="add-customer-btn"
                        disabled={saving}
                    >
                        {saving
                            ? 'Saving...'
                            : editingId !== null
                                ? 'Update Product'
                                : 'Save Product'}
                    </button>

                    <button
                        type="button"
                        className="delete-btn"
                        onClick={resetForm}
                    >
                        Cancel
                    </button>

                </form>
            )}

            {/* PRODUCT COUNT */}

            <div className="product-count">
                <h3>All Products ({products.length})</h3>
                <p>Manage your business product catalogue.</p>
            </div>

            {/* PRODUCT GRID */}

            {loading ? (

                <p>Loading products...</p>

            ) : (

                <div className="products-grid">

                    {filteredProducts.map(product => (
                        <div
                            className="product-card"
                            key={product.id}
                        >

                            {/* PRODUCT IMAGE */}

                            {product.image ? (

                                <img
                                    src={getImageUrl(product.image)}
                                    alt={product.name}
                                    className="product-image"
                                    onError={event => {
                                        event.currentTarget.style.display = 'none'
                                    }}
                                />

                            ) : (

                                <div className="product-image-placeholder">
                                    <span>
                                        {product.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>

                            )}

                            {/* PRODUCT DETAILS */}

                            <div className="product-details">

                                <span className="product-category">
                                    {product.category}
                                </span>

                                <h3>{product.name}</h3>

                                <p>SKU: {product.sku}</p>

                                <h2>
                                    ₹{Number(product.price).toLocaleString('en-IN')}
                                </h2>

                                <p className={
                                    Number(product.stock) <= 5
                                        ? 'low-stock'
                                        : 'stock'
                                }>
                                    {Number(product.stock) <= 5
                                        ? `Only ${product.stock} left`
                                        : `${product.stock} in stock`}
                                </p>

                                {/* PRODUCT ACTIONS */}

                                <div className="product-actions">

                                    <button
                                        className="view-button"
                                        onClick={() => editProduct(product)}
                                    >
                                        Edit
                                    </button>

                                    <button
                                        className="delete-btn"
                                        onClick={() => deleteProduct(product.id)}
                                    >
                                        Delete
                                    </button>

                                </div>

                            </div>

                        </div>
                    ))}

                    {filteredProducts.length === 0 && (
                        <p>No products found.</p>
                    )}

                </div>

            )}

        </div>
    )
}

export default Products
