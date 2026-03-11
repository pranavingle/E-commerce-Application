# ShopEZ API Documentation

## Base URL
```
http://localhost:5000/api
```

## Headers
All requests should include:
```
Content-Type: application/json
```

For protected endpoints, include:
```
Authorization: Bearer <your_jwt_token>
```

---

## 🔐 Authentication Endpoints

### Register User
**POST** `/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user"  // or "seller", default: "user"
}
```

**Response:**
```json
{
  "_id": "ObjectId",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Status:** 201 Created

---

### Login User
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "_id": "ObjectId",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "avatar": "image_url",
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Status:** 200 OK

---

### Get Current User Profile
**GET** `/auth/me` 🔒

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "_id": "ObjectId",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "phone": "+919876543210",
  "address": {
    "street": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "zip": "400001",
    "country": "India"
  },
  "avatar": "image_url",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Status:** 200 OK

---

### Update Profile
**PUT** `/auth/profile` 🔒

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "newemail@example.com",
  "phone": "+919876543210",
  "avatar": "image_url",
  "password": "newpassword123",  // optional
  "address": {
    "street": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "zip": "400001",
    "country": "India"
  }
}
```

**Response:** User object with updated token

**Status:** 200 OK

---

## 📦 Product Endpoints

### Get All Products
**GET** `/products`

**Query Parameters:**
```
keyword=phone        // Search term
category=Electronics // Product category
sort=price_asc       // Sort option: price_asc, price_desc, rating
minPrice=1000        // Minimum price
maxPrice=50000       // Maximum price
page=1               // Page number (default: 1)
limit=12             // Items per page (default: 12)
```

**Example:**
```
GET /products?keyword=phone&category=Electronics&sort=price_asc&page=1
```

**Response:**
```json
{
  "products": [
    {
      "_id": "ObjectId",
      "name": "iPhone 15",
      "description": "Latest iPhone model",
      "price": 79999,
      "discountPrice": 69999,
      "category": "Electronics",
      "brand": "Apple",
      "images": ["url1", "url2"],
      "stock": 50,
      "seller": {
        "_id": "ObjectId",
        "name": "Apple Store",
        "email": "apple@shopez.com"
      },
      "ratings": 4.5,
      "numReviews": 120,
      "isFeatured": true
    }
  ],
  "total": 45,
  "page": 1,
  "pages": 4
}
```

**Status:** 200 OK

---

### Get Single Product
**GET** `/products/:id`

**URL Parameters:**
```
id: ObjectId of product
```

**Response:**
```json
{
  "product": {
    "_id": "ObjectId",
    "name": "iPhone 15",
    "description": "Latest iPhone model",
    "price": 79999,
    "discountPrice": 69999,
    "category": "Electronics",
    "brand": "Apple",
    "images": ["url1", "url2"],
    "stock": 50,
    "seller": { /* seller details */ },
    "ratings": 4.5,
    "numReviews": 120
  },
  "reviews": [
    {
      "_id": "ObjectId",
      "user": { "name": "John Doe", "avatar": "url" },
      "rating": 5,
      "comment": "Great product!",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Status:** 200 OK

---

### Get Featured Products
**GET** `/products/featured`

**Response:**
```json
[
  {
    "_id": "ObjectId",
    "name": "Featured Product",
    // ... product details
  }
]
```

**Status:** 200 OK

---

### Create Product
**POST** `/products` 🔒 (Seller/Admin)

**Request Body:**
```json
{
  "name": "iPhone 15",
  "description": "Latest iPhone model",
  "price": 79999,
  "discountPrice": 69999,
  "category": "Electronics",
  "brand": "Apple",
  "stock": 50,
  "images": ["url1", "url2"],
  "tags": ["phone", "premium"]
}
```

**Response:** Created product object

**Status:** 201 Created

---

### Update Product
**PUT** `/products/:id` 🔒 (Seller/Admin)

**URL Parameters:**
```
id: ObjectId of product
```

**Request Body:**
```json
{
  "name": "iPhone 15 Pro",
  "price": 99999,
  "discountPrice": 89999,
  "stock": 40
}
```

**Response:** Updated product object

**Status:** 200 OK

---

### Delete Product
**DELETE** `/products/:id` 🔒 (Seller/Admin)

**Response:**
```json
{
  "message": "Product removed"
}
```

**Status:** 200 OK

---

### Add Review
**POST** `/products/:id/reviews` 🔒

**Request Body:**
```json
{
  "rating": 5,
  "comment": "Excellent product! Highly recommended.",
  "name": "John Doe"  // auto-filled from user
}
```

**Response:**
```json
{
  "_id": "ObjectId",
  "product": "ObjectId",
  "user": "ObjectId",
  "name": "John Doe",
  "rating": 5,
  "comment": "Excellent product! Highly recommended.",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Status:** 201 Created

---

## 🛒 Order Endpoints

### Create Order
**POST** `/orders` 🔒

**Request Body:**
```json
{
  "orderItems": [
    {
      "product": "ObjectId",
      "name": "iPhone 15",
      "image": "url",
      "price": 69999,
      "quantity": 1
    }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "zip": "400001",
    "country": "India"
  },
  "paymentMethod": "COD",  // COD, UPI, Card, NetBanking
  "itemsPrice": 69999,
  "shippingPrice": 0,
  "taxPrice": 12600,
  "totalPrice": 82599
}
```

**Response:**
```json
{
  "_id": "ObjectId",
  "user": "ObjectId",
  "orderItems": [ /* items */ ],
  "shippingAddress": { /* address */ },
  "paymentMethod": "COD",
  "itemsPrice": 69999,
  "shippingPrice": 0,
  "taxPrice": 12600,
  "totalPrice": 82599,
  "status": "pending",
  "isPaid": false,
  "isDelivered": false,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Status:** 201 Created

---

### Get My Orders
**GET** `/orders/myorders` 🔒

**Response:**
```json
[
  {
    "_id": "ObjectId",
    "user": "ObjectId",
    "orderItems": [ /* items */ ],
    "status": "processing",
    "totalPrice": 82599,
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

**Status:** 200 OK

---

### Get Order Details
**GET** `/orders/:id` 🔒

**URL Parameters:**
```
id: ObjectId of order
```

**Response:**
```json
{
  "_id": "ObjectId",
  "user": {
    "_id": "ObjectId",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "orderItems": [ /* items with product details */ ],
  "shippingAddress": { /* address */ },
  "paymentMethod": "COD",
  "itemsPrice": 69999,
  "shippingPrice": 0,
  "taxPrice": 12600,
  "totalPrice": 82599,
  "status": "shipped",
  "isPaid": false,
  "paidAt": null,
  "isDelivered": true,
  "deliveredAt": "2024-01-20T15:30:00Z",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Status:** 200 OK

---

### Update Order to Paid
**PUT** `/orders/:id/pay` 🔒

**Request Body:**
```json
{
  "id": "payment_transaction_id",
  "status": "COMPLETED",
  "update_time": "2024-01-15T10:30:00Z",
  "payer": {
    "email_address": "payer@example.com"
  }
}
```

**Response:** Updated order object

**Status:** 200 OK

---

### Update Order Status
**PUT** `/orders/:id/status` 🔒 (Admin)

**Request Body:**
```json
{
  "status": "shipped"  // pending, processing, shipped, delivered, cancelled
}
```

**Response:** Updated order object

**Status:** 200 OK

---

### Get All Orders
**GET** `/orders` 🔒 (Admin)

**Response:**
```json
[
  {
    "_id": "ObjectId",
    "user": { /* user details */ },
    "status": "delivered",
    "totalPrice": 82599
  }
]
```

**Status:** 200 OK

---

## 👥 Admin Endpoints

### Get Dashboard Stats
**GET** `/admin/stats` 🔒 (Admin)

**Response:**
```json
{
  "totalUsers": 150,
  "totalSellers": 20,
  "totalProducts": 450,
  "totalOrders": 320,
  "totalRevenue": 2500000,
  "recentOrders": [ /* 5 recent orders */ ],
  "topProducts": [ /* 5 top products */ ]
}
```

**Status:** 200 OK

---

### Get All Users
**GET** `/admin/users` 🔒 (Admin)

**Response:**
```json
[
  {
    "_id": "ObjectId",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

**Status:** 200 OK

---

### Update User
**PUT** `/admin/users/:id` 🔒 (Admin)

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "newemail@example.com",
  "role": "seller",  // user, seller, admin
  "isActive": true
}
```

**Response:**
```json
{
  "_id": "ObjectId",
  "name": "John Doe",
  "email": "newemail@example.com",
  "role": "seller",
  "isActive": true
}
```

**Status:** 200 OK

---

### Delete User
**DELETE** `/admin/users/:id` 🔒 (Admin)

**Response:**
```json
{
  "message": "User removed"
}
```

**Status:** 200 OK

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "Invalid request data"
}
```

### 401 Unauthorized
```json
{
  "message": "Not authorized, token failed"
}
```

### 403 Forbidden
```json
{
  "message": "Not authorized as admin"
}
```

### 404 Not Found
```json
{
  "message": "Product not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Server error message"
}
```

---

## 🔒 Protected Routes
Routes marked with 🔒 require authentication via JWT token in Authorization header.

Roles:
- **user**: Regular buyer
- **seller**: Can manage products and view orders
- **admin**: Full platform access

---

## Rate Limiting
Currently no rate limiting implemented. Consider adding for production.

## CORS
All endpoints have CORS enabled for cross-origin requests.

---

**Last Updated:** March 8, 2024
