# 🍕 Vysify - Multi-Tenant Full Stack SaaS

A comprehensive, production-ready food delivery system built with a robust multi-tenant architecture. It allows multiple restaurants to operate independently on a single platform, with centralized management through a Super Admin.

## ✨ Key Features

### 👥 For Customers
- **Intuitive UI**: Modern and responsive interface using Tailwind CSS and Framer Motion.
- **Product Catalog**: Detailed view of dishes with customizable add-ons and extras.
- **Cart System**: Easily add/remove items and calculate totals dynamically.
- **Authentication**: Secure login and registration.
- **Order Tracking**: Complete order history and real-time status.
- **Multiple Payments**: Stripe integration and cash-on-delivery options.

### 🔧 For Store Admins
- **Admin Dashboard**: Dedicated management interface for the store with a premium glassmorphism design.
- **Product Management**: Full CRUD for dishes, add-ons, and categories.
- **Banner Management**: Configure promotional banners and link them directly to products.
- **Order Control**: View and update order statuses in real-time.
- **User Management**: Control registered customers.
- **Store Settings**: Specific customizations for each store.

### 👑 For Super Admins
- **Multi-Tenant Management**: Centralized control over all stores.
- **Store Creation**: Complete system for adding new stores or self-service onboarding via `/register`.
- **Global Settings**: System-wide configuration.
- **Centralized Statistics**: Performance overview across all active stores.

## 🛠️ Technology Stack

### Frontend & Admin Panel
- **React 18** - UI Library
- **Vite** - Lightning-fast build tool
- **Tailwind CSS v4** - Utility-first styling framework
- **Framer Motion** - Fluid animations and micro-interactions
- **Axios** - HTTP client

### Backend (API)
- **Node.js & Express.js** - JavaScript runtime and web framework
- **MongoDB & Mongoose** - NoSQL database and ODM
- **JWT & Bcrypt** - Secure authentication and password hashing
- **Stripe** - Payment gateway
- **Multi-Tenancy Middleware** - Strict data isolation and RBAC (Role-Based Access Control) per store

## 📦 Installation and Setup

### Prerequisites
- **Node.js** (v14 or higher)
- **MongoDB** (Local or Atlas)
- **Stripe Account** (Optional, for payments)

### Quick Start

**1. Clone the repository:**
```bash
git clone https://github.com/Andre-Brito-py/projeto_cardapio_fullstak_beta_02.git
cd projeto_cardapio_fullstak_beta_02
```

**2. Setup Backend:**
Create a `.env` file in the `backend` folder:
```env
MONGODB_URI=mongodb://localhost:27017/food-delivery-multitenant
JWT_SECRET=your_super_secure_jwt_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
PORT=4001
SUPER_ADMIN_EMAIL=superadmin@gmail.com
SUPER_ADMIN_PASSWORD=admin123
```
Install dependencies and run:
```bash
cd backend
npm install
npm run server
```

**3. Setup Frontend (Customers):**
```bash
cd frontend
npm install
npm run dev
```

**4. Setup Admin Panel:**
```bash
cd admin
npm install
npm run dev
```

## 🔒 Security & Data Isolation
This project features a strict multi-tenant architecture. 
The backend middleware (`authMultiTenant`) validates the `storeId` directly from the authenticated JWT token rather than relying on insecure URL parameters. This ensures absolute data isolation between different restaurants operating on the same platform.

## 📄 License
This project is licensed under the MIT License.
