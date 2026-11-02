
# NexaDesk

A full-stack business management dashboard designed to help small businesses manage customers, products, inventory, and orders from one place.

## Overview

NexaDesk is a business management application built using React and Django REST Framework. It provides a centralized dashboard for managing business operations, tracking inventory, processing orders, and monitoring performance.

## Features

- **Dashboard:** Overview of business activity and key metrics.
- **Customer Management:** Create, view, update, and delete customer records.
- **Product Management:** Manage products, prices, categories, stock, and images.
- **Inventory Management:** Monitor stock levels and update inventory.
- **Order Management:** Create, track, update, and delete orders.
- **Automatic Stock Management:** Deduct inventory when orders are created and restore stock when orders are deleted.
- **Analytics:** View revenue, order statistics, and product performance.
- **REST API:** Backend API built with Django REST Framework.
- **Automated Testing:** Backend API tests using Django REST Framework's APITestCase.

## Tech Stack

### Frontend
- React
- Vite
- JavaScript
- CSS

### Backend
- Python
- Django
- Django REST Framework

### Database
- SQLite (development)

### Tools
- Git
- GitHub
- VS Code

## Project Structure

```text
nexadesk/
│
├── Backend/
│   ├── config/
│   ├── customers/
│   ├── products/
│   ├── orders/
│   ├── manage.py
│   └── requirements.txt
│
├── src/
│   ├── pages/
│   ├── App.jsx
│   └── main.jsx
│
├── public/
├── package.json
├── vite.config.js
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/customers/` | List customers |
| POST | `/api/customers/` | Create customer |
| GET | `/api/products/` | List products |
| POST | `/api/products/` | Create product |
| GET | `/api/orders/` | List orders |
| POST | `/api/orders/` | Create order |

The APIs also support relevant update and delete operations.

## Automated Tests

The backend includes automated tests for:

- Product creation and validation.
- Customer creation and validation.
- Order creation and stock deduction.
- Order deletion and stock restoration.
- Invalid quantities and insufficient inventory.

Current test suite: **12 passing tests**.

Run the tests:

```bash
python manage.py test
```

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/siddharthgotacode01-rgb/nexadesk.git
cd nexadesk
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Start the frontend

```bash
npm run dev
```

### 4. Set up the backend

Open a separate terminal:

```bash
cd Backend
python -m venv venv
```

Activate the virtual environment on Windows:

```powershell
.\venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

### 5. Apply database migrations

```bash
python manage.py migrate
```

### 6. Start Django

```bash
python manage.py runserver
```

The backend runs at:

`http://127.0.0.1:8000/`

The frontend and backend must both be running during local development.

## Project Status

NexaDesk is an actively developed portfolio project. New features, improvements, testing, and deployment configurations are being added.

## Author

**Siddharth**

GitHub: [@siddharthgotacode01-rgb](https://github.com/siddharthgotacb)
