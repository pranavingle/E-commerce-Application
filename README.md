# ShopEZ - E-Commerce Platform

A full-stack MERN (MongoDB, Express.js, React.js, Node.js) e-commerce application with secure authentication, role-based access control, and a comprehensive product management system.

## 🎯 Features

### For Buyers
- ✨ Browse products with advanced filtering and search
- 🛒 Add products to cart and checkout
- 💳 Multiple payment methods (COD, UPI, Card, Net Banking)
- 📦 Order tracking and management
- ⭐ Product reviews and ratings
- 👤 User profile and address management

### For Sellers
- 🏪 Seller dashboard to manage products
- 📊 Product performance analytics
- 💰 Order management and tracking
- 📈 Sales insights

### For Admins
- 🎛️ Complete admin dashboard
- 👥 User management and moderation
- 🛍️ Product catalog management
- 📋 Order administration
- 📊 Platform analytics and statistics

## 📋 Tech Stack

**Backend:**
- Node.js & Express.js
- MongoDB & Mongoose
- JWT Authentication
- bcryptjs for password hashing
- CORS for cross-origin requests

**Frontend:**
- React.js 18+
- React Router for navigation
- Bootstrap 5 for UI components
- Axios for API calls
- React Icons for icons
- React Toastify for notifications

**Database:**
- MongoDB

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- npm or yarn
- MongoDB (local or Atlas)

### Installation

#### 1. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:
```
MONGO_URI=mongodb://localhost:27017/shopez
JWT_SECRET=your_jwt_secret_key_here
PORT=5000
NODE_ENV=development
```

Start the backend server:
```bash
npm run dev  # with nodemon
# or
npm start   # production
```

Backend runs on `http://localhost:5000`

#### 2. Frontend Setup

```bash
cd frontend
npm install
```

Start the development server:
```bash
npm start
```

Frontend runs on `http://localhost:3000`

## 📁 Project Structure

```
shopez/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── orderController.js
│   │   └── adminController.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   └── Review.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   ├── orderRoutes.js
│   │   └── adminRoutes.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── errorMiddleware.js
│   ├── server.js
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.js
│   │   │   ├── Footer.js
│   │   │   ├── ProductCard.js
│   │   │   ├── Loader.js
│   │   │   └── ProtectedRoute.js
│   │   ├── pages/
│   │   │   ├── HomePage.js
│   │   │   ├── ProductsPage.js
│   │   │   ├── ProductDetailPage.js
│   │   │   ├── CartPage.js
│   │   │   ├── CheckoutPage.js
│   │   │   ├── LoginPage.js
│   │   │   ├── RegisterPage.js
│   │   │   ├── ProfilePage.js
│   │   │   ├── OrdersPage.js
│   │   │   ├── OrderDetailPage.js
│   │   │   ├── SellerDashboard.js
│   │   │   └── AdminDashboard.js
│   │   ├── context/
│   │   │   ├── AuthContext.js
│   │   │   └── CartContext.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.js
│   │   ├── index.js
│   │   ├── index.css
│   │   └── public/
│   │       └── index.html
│   ├── package.json
│   └── .env
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (Protected)
- `PUT /api/auth/profile` - Update profile (Protected)

### Products
- `GET /api/products` - Get all products with filters
- `GET /api/products/:id` - Get product details
- `GET /api/products/featured` - Get featured products
- `POST /api/products` - Create product (Seller/Admin)
- `PUT /api/products/:id` - Update product (Seller/Admin)
- `DELETE /api/products/:id` - Delete product (Seller/Admin)
- `POST /api/products/:id/reviews` - Add review (Protected)

### Orders
- `POST /api/orders` - Create order (Protected)
- `GET /api/orders/myorders` - Get user's orders (Protected)
- `GET /api/orders/:id` - Get order details (Protected)
- `PUT /api/orders/:id/pay` - Mark order as paid (Protected)
- `GET /api/orders` - Get all orders (Admin)
- `PUT /api/orders/:id/status` - Update order status (Admin)

### Admin
- `GET /api/admin/stats` - Get dashboard stats (Admin)
- `GET /api/admin/users` - Get all users (Admin)
- `PUT /api/admin/users/:id` - Update user (Admin)
- `DELETE /api/admin/users/:id` - Delete user (Admin)

## 👥 User Roles

### User (Buyer)
- Browse and search products
- Add products to cart
- Place orders
- Write reviews
- Manage profile

### Seller
- Add and manage products
- View order analytics
- Update product listings
- Access order management

### Admin
- Manage all users
- Manage product catalog
- Manage all orders
- View platform statistics
- User moderation


## 🎨 Key Features Implementation

### Authentication & Security
- JWT token-based authentication
- Password hashing with bcryptjs
- Role-based route protection
- Secure API endpoints with middleware

### Product Management
- Full-text search and filtering
- Category-based browsing
- Product ratings and reviews
- Stock management
- Featured products

### Order Management
- Multi-step checkout process
- Multiple payment methods
- Order status tracking
- Shipping address management
- Order history

### User Experience
- Responsive Bootstrap UI
- Real-time notifications with React Toastify
- Cart persistence (localStorage)
- Session management
- Intuitive navigation

## 📊 Database Models

### User
```javascript
{
  name, email, password, role (user/seller/admin),
  avatar, address, phone, isActive
}
```

### Product
```javascript
{
  name, description, price, discountPrice, category,
  brand, images, stock, seller, ratings, numReviews, isFeatured
}
```

### Order
```javascript
{
  user, orderItems, shippingAddress, paymentMethod,
  itemsPrice, shippingPrice, taxPrice, totalPrice,
  status, isPaid, isDelivered
}
```

### Review
```javascript
{
  product, user, name, rating, comment
}
```

## 🚀 Deployment

### Backend (Heroku/Railway)
1. Create account on hosting platform
2. Add MongoDB Atlas connection string
3. Deploy using git push

### Frontend (Vercel/Netlify)
1. Build the project: `npm run build`
2. Deploy the build folder
3. Set API endpoint in environment variables

 Or terminate process using the port

## 📝 Contributing
Contributions are welcome.
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

👨‍💻 Author
Pranav Ingle

Omkar Surve

GitHub: https://github.com/pranavingle




