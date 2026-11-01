
import { useState, useEffect } from 'react'

function Products() {
  const [products, setProducts] = useState(() => {
    const savedProducts = localStorage.getItem('nexadesk-products')

    if (savedProducts) {
      try {
        return JSON.parse(savedProducts)
      } catch {
        console.error('Could not load saved products')
      }
    }

    return [
      {
        id: 1,
        name: 'Wireless Headphones',
        category: 'Electronics',
        price: 2499,
        stock: 15,
        image: ''
      },
      {
        id: 2,
        name: 'Classic T-Shirt',
        category: 'Clothing',
        price: 799,
        stock: 8,
        image: ''
      },
      {
        id: 3,
        name: 'Travel Backpack',
        category: 'Accessories',
        price: 1499,
        stock: 3,
        image: ''
      }
    ]
  })

  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    price: '',
    stock: '',
    image: ''
  })

  useEffect(() => {
    localStorage.setItem(
      'nexadesk-products',
      JSON.stringify(products)
    )
  }, [products])

  function handleChange(event) {
    const { name, value } = event.target

    setNewProduct({
      ...newProduct,
      [name]: value
    })
  }

  function handleImageChange(event) {
    const file = event.target.files[0]

    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.')
      return
    }

    if (file.size > 1024 * 1024) {
      alert('Please choose an image smaller than 1 MB.')
      return
    }

    const reader = new FileReader()

    reader.onloadend = () => {
      setNewProduct((previous) => ({
        ...previous,
        image: reader.result
      }))
    }

    reader.readAsDataURL(file)
  }

  function resetForm() {
    setNewProduct({
      name: '',
      category: '',
      price: '',
      stock: '',
      image: ''
    })

    setEditingId(null)
    setShowForm(false)
  }

  function saveProduct(event) {
    event.preventDefault()

    const product = {
      ...newProduct,
      price: Number(newProduct.price),
      stock: Number(newProduct.stock)
    }

    if (editingId !== null) {
      setProducts((previous) =>
        previous.map((item) =>
          item.id === editingId
            ? { ...item, ...product }
            : item
        )
      )
    } else {
      setProducts((previous) => [
        ...previous,
        {
          id: Date.now(),
          ...product
        }
      ])
    }

    resetForm()
  }

  function editProduct(product) {
    setNewProduct({
      name: product.name,
      category: product.category,
      price: String(product.price),
      stock: String(product.stock),
      image: product.image
    })

    setEditingId(product.id)
    setShowForm(true)
  }

  function deleteProduct(id) {
    setProducts((previous) =>
      previous.filter((product) => product.id !== id)
    )
  }

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase()) ||
    product.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="products-page">

      <div className="product-toolbar">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
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

      {showForm && (
        <form className="product-form" onSubmit={saveProduct}>
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

          <label className="image-upload">
            Product Image
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
          </label>

          {newProduct.image && (
            <img
              src={newProduct.image}
              alt="Product preview"
              className="product-preview"
            />
          )}

          <button type="submit" className="add-customer-btn">
            {editingId !== null ? 'Update Product' : 'Save Product'}
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

      <div className="product-count">
        <h3>All Products ({products.length})</h3>
        <p>Manage your business product catalogue.</p>
      </div>

      <div className="products-grid">
        {filteredProducts.map((product) => (
          <div className="product-card" key={product.id}>

            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="product-image"
              />
            ) : (
              <div className="product-image-placeholder">
                <span>{product.name.charAt(0).toUpperCase()}</span>
              </div>
            )}

            <div className="product-details">
              <span className="product-category">
                {product.category}
              </span>

              <h3>{product.name}</h3>

              <h2>₹{product.price.toLocaleString('en-IN')}</h2>

              <p className={product.stock <= 5 ? 'low-stock' : 'stock'}>
                {product.stock <= 5
                  ? `Only ${product.stock} left`
                  : `${product.stock} in stock`}
              </p>

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

    </div>
  )
}

export default Products
