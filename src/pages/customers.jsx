
import { useState, useEffect } from 'react'

const API_URL = 'http://127.0.0.1:8000/api/customers/'

function Customers() {
    // Customer records from Django
    const [customers, setCustomers] = useState([])

    // UI states
    const [search, setSearch] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    // Customer form data
    const [newCustomer, setNewCustomer] = useState({
        name: '',
        email: '',
        phone: '',
        city: ''
    })

    // Fetch customers from Django
    async function fetchCustomers() {
        try {
            setLoading(true)
            setError('')

            const response = await fetch(API_URL)

            if (!response.ok) {
                throw new Error('Could not fetch customers')
            }

            const data = await response.json()
            setCustomers(data)

        } catch (error) {
            console.error('Fetch error:', error)
            setError('Unable to load customers. Check whether Django is running.')
        } finally {
            setLoading(false)
        }
    }

    // Run when the component first loads
    useEffect(() => {
        fetchCustomers()
    }, [])

    // Handle form input changes
    function handleChange(event) {
        const { name, value } = event.target

        setNewCustomer(previous => ({
            ...previous,
            [name]: value
        }))
    }

    // Reset the form
    function resetForm() {
        setNewCustomer({
            name: '',
            email: '',
            phone: '',
            city: ''
        })

        setEditingId(null)
        setShowForm(false)
    }

    // Add customer to Django database
    async function addCustomer(event) {
        event.preventDefault()

        try {
            setError('')

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newCustomer)
            })

            if (!response.ok) {
                const errorData = await response.json()
                console.error('Server validation error:', errorData)
                throw new Error('Could not add customer')
            }

            const savedCustomer = await response.json()

            setCustomers(previous => [...previous, savedCustomer])
            resetForm()

        } catch (error) {
            console.error('Add customer error:', error)
            setError('Could not save customer. Please check the form and backend.')
        }
    }

    // Load customer details into the form
    function editCustomer(customer) {
        setNewCustomer({
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            city: customer.city || ''
        })

        setEditingId(customer.id)
        setShowForm(true)
    }

    // Update customer in Django database
    async function updateCustomer(event) {
        event.preventDefault()

        try {
            setError('')

            const response = await fetch(`${API_URL}${editingId}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newCustomer)
            })

            if (!response.ok) {
                const errorData = await response.json()
                console.error('Server validation error:', errorData)
                throw new Error('Could not update customer')
            }

            const updatedCustomer = await response.json()

            setCustomers(previous =>
                previous.map(customer =>
                    customer.id === editingId
                        ? updatedCustomer
                        : customer
                )
            )

            resetForm()

        } catch (error) {
            console.error('Update customer error:', error)
            setError('Could not update customer. Please try again.')
        }
    }

    // Delete customer from Django database
    async function deleteCustomer(id) {
        const confirmed = window.confirm(
            'Are you sure you want to delete this customer?'
        )

        if (!confirmed) return

        try {
            setError('')

            const response = await fetch(`${API_URL}${id}/`, {
                method: 'DELETE'
            })

            if (!response.ok) {
                throw new Error('Could not delete customer')
            }

            setCustomers(previous =>
                previous.filter(customer => customer.id !== id)
            )

        } catch (error) {
            console.error('Delete customer error:', error)
            setError('Could not delete customer. Please try again.')
        }
    }

    // Search customers
    const filteredCustomers = customers.filter(customer =>
        (customer.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (customer.email || '').toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="customers-page">

            {/* TOOLBAR */}

            <div className="customer-toolbar">

                <input
                    type="text"
                    placeholder="Search customers..."
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
                    + Add Customer
                </button>

            </div>

            {/* ERROR MESSAGE */}

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {/* CUSTOMER FORM */}

            {showForm && (

                <form
                    className="customer-form"
                    onSubmit={
                        editingId !== null
                            ? updateCustomer
                            : addCustomer
                    }
                >

                    <h3>
                        {editingId !== null
                            ? 'Edit Customer'
                            : 'Add New Customer'}
                    </h3>

                    <input
                        name="name"
                        placeholder="Customer name"
                        value={newCustomer.name}
                        onChange={handleChange}
                        required
                    />

                    <input
                        name="email"
                        type="email"
                        placeholder="Email address"
                        value={newCustomer.email}
                        onChange={handleChange}
                        required
                    />

                    <input
                        name="phone"
                        placeholder="Phone number"
                        value={newCustomer.phone}
                        onChange={handleChange}
                        required
                    />

                    <input
                        name="city"
                        placeholder="City"
                        value={newCustomer.city}
                        onChange={handleChange}
                        required
                    />

                    <button
                        type="submit"
                        className="add-customer-btn"
                    >
                        {editingId !== null
                            ? 'Update Customer'
                            : 'Save Customer'}
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

            {/* CUSTOMER COUNT */}

            <div className="customer-count">

                <h3>All Customers ({customers.length})</h3>

                <p>Manage your business customers.</p>

            </div>

            {/* CUSTOMER TABLE */}

            <div className="panel customer-table-panel">

                <div className="table-wrapper">

                    <table>

                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>City</th>
                                <th>Action</th>
                            </tr>
                        </thead>

                        <tbody>

                            {loading ? (

                                <tr>
                                    <td colSpan="5">
                                        Loading customers...
                                    </td>
                                </tr>

                            ) : filteredCustomers.length > 0 ? (

                                filteredCustomers.map(customer => (

                                    <tr key={customer.id}>

                                        <td>{customer.name}</td>
                                        <td>{customer.email}</td>
                                        <td>{customer.phone}</td>
                                        <td>{customer.city}</td>

                                        <td>

                                            <button
                                                className="view-button"
                                                onClick={() => editCustomer(customer)}
                                            >
                                                Edit
                                            </button>

                                            <button
                                                className="delete-btn"
                                                onClick={() => deleteCustomer(customer.id)}
                                            >
                                                Delete
                                            </button>

                                        </td>

                                    </tr>

                                ))

                            ) : (

                                <tr>
                                    <td colSpan="5">
                                        No customers found.
                                    </td>
                                </tr>

                            )}

                        </tbody>

                    </table>

                </div>

            </div>

        </div>
    )
}

export default Customers
