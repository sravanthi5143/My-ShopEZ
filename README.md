# shopEZ
video-demolink:-https://drive.google.com/file/d/1Rm2Cmr8cMwA9X31rMCTuUzW3J5D6Tn90/view?usp=drive_link

# 🛍️ Shopezz - Premium MERN Stack E-Commerce Marketplace

[![Vite](https://img.shields.io/badge/Vite-8.x-purple.svg?style=flat&logo=vite)](https://vite.dev)
[![React](https://img.shields.io/badge/React-19.x-blue.svg?style=flat&logo=react)](https://react.dev)
[![Node](https://img.shields.io/badge/Node.js-20.x-green.svg?style=flat&logo=node.js)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5.x-lightgrey.svg?style=flat&logo=express)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-emerald.svg?style=flat&logo=mongodb)](https://www.mongodb.com/cloud/atlas)
[![License](https://img.shields.io/badge/License-ISC-blue.svg?style=flat)](https://opensource.org/licenses/ISC)

**Shopezz** is a modern, high-performance, and feature-rich E-Commerce marketplace application built using the MERN stack. Designed with a dual-portal architecture, it provides an interactive shopping experience for customers and a full-fledged control panel for administrators. The application uses a custom-tailored theme system featuring smooth dark/light mode transitions, premium micro-animations, and fluid responsiveness across all screens.

---

## 🚀 Key Features

### 👤 Customer Experience
*   **Secure Authentication**: Fully encrypted sign-up and log-in mechanisms using [bcryptjs](https://github.com/dcodeIO/bcrypt.js) and token-based state preservation via [JWT](https://jwt.io). Includes specialized middleware to guard protected pages.
*   **Interactive Search & Advanced Filters**: Real-time keyword search coupled with dynamic filtering by category, price boundaries, star ratings, and custom sorting (price high-to-low, low-to-high, new arrivals, best sellers).
*   **Intuitive Shopping Cart**: Add, update quantities, or delete products. The cart synchronizes dynamically with the MongoDB database for persistent retrieval.
*   **Personal Wishlist**: A dedicated space to save favorite items for future checkouts.
*   **Direct "Buy Now" Action**: Skip the cart steps to purchase a single product immediately.
*   **Structured Checkout & Order Placement**: Apply valid coupon codes, review order summaries, specify shipping/billing addresses, and finalize orders.
*   **Comprehensive Order Tracking**: Track the lifecycle of placed orders (Processing, Shipped, Delivered, Cancelled) with cancellation options for customers.
*   **User Profile Hub**: Manage personal details, review past purchases, and track order histories.

### 👑 Administrator Console
*   **Analytical Admin Dashboard**: Real-time indicators showing metrics such as Total Sales (Revenue), Cumulative Orders, User Registrations, and Active Inventory.
*   **Product Management (CRUD)**: Create, edit, and delete products including detailed technical specifications, image lists, stock inventory thresholds, and pricing.
*   **Category Management**: Add, update, and manage categories to structure product catalogs cleanly.
*   **Order & Status Handling**: View all orders, update fulfillment status (Processing ➔ Shipped ➔ Delivered), or execute cancellations.
*   **User Role Auditing**: Monitor registered accounts and toggle permissions (Customer ➔ Admin).

### 🎨 Responsive & Fluid Layouts
*   **Modern UI Engine**: Built using modern CSS variables with premium themes, Google Fonts (Inter), smooth state-based transition effects, and dynamic loading skeletons.
*   **Cross-Device Optimization**: Designed from the ground up to render beautifully on mobile, tablet, desktop, and widescreen displays.

---

## 🛠️ Tech Stack

*   **Frontend Library**: [React.js](https://react.dev) (v19)
*   **Development Build Tool**: [Vite](https://vite.dev) (v8)
*   **Styling & Themes**: Modern Custom CSS Variables (supporting system light & dark themes) and utility-driven styles.
*   **Backend Server**: [Node.js](https://nodejs.org) & [Express.js](https://expressjs.com) (v5)
*   **Database Cloud System**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) with [Mongoose](https://mongoosejs.com) (v9) ORM
*   **Security Protocol**: [JWT (JSON Web Token)](https://jwt.io) authentication with secure HTTP requests managed via [Axios](https://axios-http.com) interceptors

---

## 📂 Project Structure

```
my-project/
├── client/                 # Frontend Vite-React App
│   ├── public/             # Static public assets
│   ├── src/                # Frontend source code
│   │   ├── assets/         # Images, logos, and brand icons
│   │   ├── components/     # Reusable React components (Navbar, ProductCard, etc.)
│   │   ├── context/        # Global context engines (Auth, Cart, Wishlist, Theme)
│   │   ├── hooks/          # Custom utility React hooks
│   │   ├── layouts/        # Application wrappers (MainLayout, AdminLayout)
│   │   ├── pages/          # Primary page views (Home, Products, Checkout, etc.)
│   │   ├── services/       # Backend API communication handlers
│   │   ├── styles/         # Custom styling directories
│   │   └── utils/          # General helpers (mockData, formatters)
│   └── package.json        # Frontend configuration & dependencies
├── server/                 # Backend Node-Express API
│   ├── config/             # DB connector and app configurations
│   ├── controllers/        # Request controllers containing business logic
│   ├── middleware/         # JWT parsing and permission middlewares
│   ├── models/             # Mongoose Schemas (User, Product, Order, Category, etc.)
│   ├── routes/             # REST API endpoint definitions
│   └── server.js           # Server application startup entry point
├── mern-phase-wise/        # Phase-wise templates and project documentation
├── video-demo/             # Demo videos and recordings
├── README.md               # Main project overview and instructions
└── package.json            # Root project metadata & workspace orchestrator
```

---

## ⚙️ Installation & Running Steps

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/your-username/shopez-mern-stack.git
cd shopez-mern-stack
```

### 2️⃣ Install Dependencies
You can install dependencies for the root orchestrator, frontend client, and backend server all at once using:
```bash
npm run install-all
```
*Alternatively, you can navigate to the `client/` and `server/` directories individually and run `npm install`.*

### 3️⃣ Configure Environment Variables
You must set up environment files in both the client and server projects.

#### Server Environment Configurations
Create a `.env` file inside the [server/](file:///home/rguktrkvalley/Desktop/my-mern-project/server) directory:
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/shopez?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_here
```

#### Client Environment Configurations
Create a `.env` file inside the [client/](file:///home/rguktrkvalley/Desktop/my-mern-project/client) directory:
```env
VITE_API_URL=http://127.0.0.1:5000
```

### 4️⃣ Seed Database & Initialize Admin (Optional)
The backend provides helper scripts to inspect data consistency and seed a default administrator account.

To create the default admin user account (`admin@shopezz.com` with password `Admin@123`), run:
```bash
node server/check_admin.js
```

To run a data audit (verifying category mappings and counting products):
```bash
node server/inspect_data.js
```

### 5️⃣ Run the Application
Start both the Express backend and Vite frontend concurrently from the root directory:
```bash
npm run dev
```

The application will be served at:
*   **Frontend**: `http://localhost:5173` (Vite)
*   **Backend Server**: `http://localhost:5000` (Express API)

---

## 🔐 Environment Variables

The project requires the following environment configurations to load successfully:

| Module | Variable Name | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Server** | `PORT` | No | `5000` | Port on which the Express server listens. |
| **Server** | `MONGO_URI` | Yes | - | MongoDB Atlas Connection String URL. |
| **Server** | `JWT_SECRET` | Yes | - | Cryptographic key string to sign JSON Web Tokens. |
| **Client** | `VITE_API_URL` | No | `http://127.0.0.1:5000` | Base URL of the backend API endpoints. |

---

## 🛣️ API Routes Overview

All backend endpoints are prefixed with `/api` and are handled in the [server/routes/](file:///home/rguktrkvalley/Desktop/my-mern-project/server/routes) directory.

### 🔑 Authentication (`/api/auth`)
Defined in [authRoutes.js](file:///home/rguktrkvalley/Desktop/my-mern-project/server/routes/authRoutes.js)

| HTTP Method | Route | Authentication | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/register` | Public | Register a new user account. |
| `POST` | `/login` | Public | Verify login credentials and retrieve JWT. |

### 📦 Products (`/api/products`)
Defined in [productRoutes.js](file:///home/rguktrkvalley/Desktop/my-mern-project/server/routes/productRoutes.js)

| HTTP Method | Route | Authentication | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Public | Retrieve products with search, pagination, and filter queries. |
| `POST` | `/` | Admin Only | Create a new product. |
| `GET` | `/trending` | Public | Fetch trending/popular products. |
| `GET` | `/new-arrivals` | Public | Fetch newly arrived products. |
| `GET` | `/best-sellers` | Public | Fetch top selling products. |
| `GET` | `/featured` | Public | Fetch custom featured products. |
| `GET` | `/:id` | Public | Get details of a single product. |
| `PUT` | `/:id` | Admin Only | Update an existing product. |
| `DELETE` | `/:id` | Admin Only | Delete a product from inventory. |

### 🛒 Shopping Cart (`/api/cart`)
Defined in [cartRoutes.js](file:///home/rguktrkvalley/Desktop/my-mern-project/server/routes/cartRoutes.js)

| HTTP Method | Route | Authentication | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Customer | Fetch the current customer's shopping cart items. |
| `POST` | `/` | Customer | Add a product or increase its count in the cart. |
| `PUT` | `/:productId` | Customer | Adjust quantity of a product in the cart. |
| `DELETE` | `/:productId` | Customer | Remove a product from the cart. |

### ❤️ Wishlist (`/api/wishlist`)
Defined in [wishlistRoutes.js](file:///home/rguktrkvalley/Desktop/my-mern-project/server/routes/wishlistRoutes.js)

| HTTP Method | Route | Authentication | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Customer | Fetch items saved in the user's wishlist. |
| `POST` | `/` | Customer | Add a product to the user's wishlist. |
| `DELETE` | `/:productId` | Customer | Remove a product from the wishlist. |

### 📜 Orders & Checkout (`/api/orders`)
Defined in [orderRoutes.js](file:///home/rguktrkvalley/Desktop/my-mern-project/server/routes/orderRoutes.js)

| HTTP Method | Route | Authentication | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | Customer | Place a new order with cart items and shipping details. |
| `GET` | `/myorders` | Customer | Retrieve all orders placed by the current user. |
| `GET` | `/:id` | Customer | Fetch invoice and tracking detail of an order. |
| `PUT` | `/:id/cancel` | Customer | Cancel a pending/processing order. |
| `PUT` | `/:id/deliver` | Admin Only | Mark an order as delivered. |
| `PUT` | `/:id/status` | Admin Only | Manually update order fulfillment status. |

### 🏷️ Category Management (`/api/categories`)
Defined in [categoryRoutes.js](file:///home/rguktrkvalley/Desktop/my-mern-project/server/routes/categoryRoutes.js)

| HTTP Method | Route | Authentication | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Public | Fetch all database product categories. |
| `POST` | `/` | Admin Only | Create a new category category structure. |
| `PUT` | `/:id` | Admin Only | Edit category details. |
| `DELETE` | `/:id` | Admin Only | Delete an existing category category. |

### 🎟️ Coupons (`/api/coupons`)
Defined in [couponRoutes.js](file:///home/rguktrkvalley/Desktop/my-mern-project/server/routes/couponRoutes.js)

| HTTP Method | Route | Authentication | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/apply` | Customer | Apply discount code at order summary. |
| `GET` | `/` | Admin Only | Fetch all existing coupon codes. |
| `POST` | `/` | Admin Only | Insert a new promotional discount coupon code. |
| `PUT` | `/:id` | Admin Only | Modify a coupon's constraints or discount rate. |
| `DELETE` | `/:id` | Admin Only | Remove/Expire a coupon code. |

### ⭐️ Product Reviews (`/api/reviews`)
Defined in [reviewRoutes.js](file:///home/rguktrkvalley/Desktop/my-mern-project/server/routes/reviewRoutes.js)

| HTTP Method | Route | Authentication | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/product/:productId` | Public | Get all reviews and ratings for a product. |
| `POST` | `/` | Customer | Post a rating and review for a purchased product. |
| `PUT` | `/:id` | Customer | Edit a review you previously submitted. |
| `DELETE` | `/:id` | Customer | Remove a submitted review. |

### 🛡️ Administration Dashboard (`/api/admin`)
Defined in [adminRoutes.js](file:///home/rguktrkvalley/Desktop/my-mern-project/server/routes/adminRoutes.js)

| HTTP Method | Route | Authentication | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/users` | Admin Only | List all registered user accounts. |
| `DELETE` | `/users/:id` | Admin Only | Ban/Delete a user profile. |
| `PUT` | `/users/:id/role` | Admin Only | Upgrade or downgrade a user's permissions. |
| `GET` | `/orders` | Admin Only | Read fulfillment sheets for all store orders. |
| `GET` | `/dashboard` | Admin Only | Request core metrics and monthly charts data. |
| `GET` | `/analytics` | Admin Only | Retrieve details about traffic and category sales. |
| `GET` | `/notifications` | Admin Only | Fetch real-time dashboard notifications. |

---

## 📁 Source Code Folder Structure Detail

Here is the key workspace files structure mapping:

### 💻 Client Codebase
*   **[client/src/main.jsx](file:///home/rguktrkvalley/Desktop/my-mern-project/client/src/main.jsx)**: Global app mounting and default configuration setups (e.g. Axios `baseURL` mappings).
*   **[client/src/App.jsx](file:///home/rguktrkvalley/Desktop/my-mern-project/client/src/App.jsx)**: Configures pages lazy-loading paths and routing layouts.
*   **[client/src/index.css](file:///home/rguktrkvalley/Desktop/my-mern-project/client/src/index.css)**: Holds global palette themes, CSS variables, dark/light theme classes, typography fonts, and general layouts.
*   **[client/src/context/](file:///home/rguktrkvalley/Desktop/my-mern-project/client/src/context)**: Includes authorization states ([AuthContext.jsx](file:///home/rguktrkvalley/Desktop/my-mern-project/client/src/context/AuthContext.jsx)), persistent items cart ([CartContext.jsx](file:///home/rguktrkvalley/Desktop/my-mern-project/client/src/context/CartContext.jsx)), wishlists ([WishlistContext.jsx](file:///home/rguktrkvalley/Desktop/my-mern-project/client/src/context/WishlistContext.jsx)), and theme configurations ([ThemeContext.jsx](file:///home/rguktrkvalley/Desktop/my-mern-project/client/src/context/ThemeContext.jsx)).
*   **[client/src/pages/](file:///home/rguktrkvalley/Desktop/my-mern-project/client/src/pages)**: Contains dashboard engines ([AdminDashboard.jsx](file:///home/rguktrkvalley/Desktop/my-mern-project/client/src/pages/AdminDashboard.jsx)), product search matrices ([Products.jsx](file:///home/rguktrkvalley/Desktop/my-mern-project/client/src/pages/Products.jsx)), product detail viewers ([ProductDetails.jsx](file:///home/rguktrkvalley/Desktop/my-mern-project/client/src/pages/ProductDetails.jsx)), cart manager ([Cart.jsx](file:///home/rguktrkvalley/Desktop/my-mern-project/client/src/pages/Cart.jsx)), and multi-phase checkouts ([Checkout.jsx](file:///home/rguktrkvalley/Desktop/my-mern-project/client/src/pages/Checkout.jsx)).

### 🖥️ Server Codebase
*   **[server/server.js](file:///home/rguktrkvalley/Desktop/my-mern-project/server/server.js)**: Configures API CORS, JSON middlewares, mounts routing tables, runs db connections, and boots the port listener.
*   **[server/models/](file:///home/rguktrkvalley/Desktop/my-mern-project/server/models)**: Houses MongoDB Mongoose model files for [User.js](file:///home/rguktrkvalley/Desktop/my-mern-project/server/models/User.js), [Product.js](file:///home/rguktrkvalley/Desktop/my-mern-project/server/models/Product.js), [Order.js](file:///home/rguktrkvalley/Desktop/my-mern-project/server/models/Order.js), [Category.js](file:///home/rguktrkvalley/Desktop/my-mern-project/server/models/Category.js), [Cart.js](file:///home/rguktrkvalley/Desktop/my-mern-project/server/models/Cart.js), [Wishlist.js](file:///home/rguktrkvalley/Desktop/my-mern-project/server/models/Wishlist.js), [Coupon.js](file:///home/rguktrkvalley/Desktop/my-mern-project/server/models/Coupon.js), and [Review.js](file:///home/rguktrkvalley/Desktop/my-mern-project/server/models/Review.js).
*   **[server/controllers/](file:///home/rguktrkvalley/Desktop/my-mern-project/server/controllers)**: Includes request-response database drivers (e.g. order flows, admin analysis calculators, categories CRUD operations).

---

## 🖼️ Screenshots

*Below are UI walkthrough placements for the application. Replacements can be added under `/client/public/screenshots/`.*

| Client Main Homepage | Product Filters & Search |
|:---:|:---:|
| ![Homepage Placeholder](https://placehold.co/600x400/1a73e8/ffffff?text=Shopezz+Homepage) | ![Product Search & Filter](https://placehold.co/600x400/4f5e7b/ffffff?text=Product+Search+%26+Filtering) |

| Shopping Cart & Checkout | Admin Analytics Dashboard |
|:---:|:---:|
| ![Cart & Checkouts](https://placehold.co/600x400/188038/ffffff?text=Checkout+and+Coupon+Application) | ![Admin Dashboard Console](https://placehold.co/600x400/d93025/ffffff?text=Admin+Dashboard+Charts+%26+Statistics) |

---

## 🔮 Future Enhancements

*   💳 **Integrated Credit Card Gateways**: Implementation of checkout processing platforms like Stripe and PayPal.
*   ☁️ **Cloudinary Image Storage**: Moving away from local links to cloud database image hosting for product creation.
*   📧 **Transactional Emails**: Auto email dispatch (using Nodemailer / SendGrid) notifying users on registration, orders, and shipment updates.
*   🔍 **Elasticsearch Autocomplete**: Multi-collection autocomplete fuzzy search engine logic.
*   🗺️ **Localization (i18n)**: Setting up multiple languages and currency systems (USD, INR, EUR) for global scalability.

---

## ✍️ Author

*   **Your Name** - *Full-Stack Developer* - [GitHub Profile](https://github.com/your-username)
*   For questions or collaborations, reach out via email: `developer@example.com`

---

## 📄 License

This project is licensed under the **ISC License** - see the [package.json](file:///home/rguktrkvalley/Desktop/my-mern-project/server/package.json) file for details.
