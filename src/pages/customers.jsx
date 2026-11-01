
import { useState, useEffect } from 'react'

function Customers() {
    const [customers, setCustomers] = useState(() => {
        const savedCustomers = localStorage.getItem('nexadesk-customers')

        if (savedCustomers) {
            try {
                return JSON.parse(savedCustomers)
            } catch {
                console.error('Could not read saved customers')
            }
        }

        return [
            {
                id: 1,
                name: 'Rahul Sharma',
                email: 'rahul@gmail.com',
                phone: '9876543210',
                city: 'Delhi'
            },
            {
                id: 2,
                name: 'Priya Verma',
                email: 'priya@gmail.com',
                phone: '9876543211',
                city: 'Mumbai'
            },
            {
                id: 3,
                name: 'Aman Gupta',
                email: 'aman@gmail.com',
                phone: '9876543212',
                city: 'Jaipur'
            }
        ]
    })
    const [search, setSearch] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState(null)

    useEffect(() => {
        localStorage.setItem(
            'nexadesk-customers',
            JSON.stringify(customers)
        )
    }, [customers])

    const [newCustomer, setNewCustomer] = useState({
        name: '',
        email: '',
        phone: '',
        city: ''
    })

    function handleChange(event) {
        const { name, value } = event.target

        setNewCustomer({
            ...newCustomer,
            [name]: value
        })
    }

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

    function addCustomer(event) {
        event.preventDefault()

        const customer = {
            id: Date.now(),
            ...newCustomer
        }

        setCustomers([...customers, customer])
        resetForm()
    }

    function editCustomer(customer) {
        setNewCustomer({
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            city: customer.city
        })

        setEditingId(customer.id)
        setShowForm(true)
    }

    function updateCustomer(event) {
        event.preventDefault()

        setCustomers(
            customers.map((customer) =>
                customer.id === editingId
                    ? { ...customer, ...newCustomer }
                    : customer
            )
        )

        resetForm()
    }

    function deleteCustomer(id) {
        setCustomers(
            customers.filter((customer) => customer.id !== id)
        )
    }

    const filteredCustomers = customers.filter((customer) =>
        customer.name.toLowerCase().includes(search.toLowerCase()) ||
        customer.email.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="customers-page">

            <div className="customer-toolbar">
                <input
                    type="text"
                    placeholder="Search customers..."
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
                    + Add Customer
                </button>
            </div>

            {showForm && (
                <form
                    className="customer-form"
                    onSubmit={editingId !== null ? updateCustomer : addCustomer}
                >
                    <h3>
                        {editingId !== null ? 'Edit Customer' : 'Add New Customer'}
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

                    <button type="submit" className="add-customer-btn">
                        {editingId !== null ? 'Update Customer' : 'Save Customer'}
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

            <div className="customer-count">
                <h3>All Customers ({customers.length})</h3>
                <p>Manage your business customers.</p>
            </div>

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
                            {filteredCustomers.map((customer) => (
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
                            ))}

                            {filteredCustomers.length === 0 && (
                                <tr>
                                    <td colSpan="5">No customers found.</td>
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
