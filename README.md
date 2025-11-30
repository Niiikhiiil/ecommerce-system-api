# 🚀 E-Commerce Node.js API

A secure Node.js + Express + MySQL based e-commerce backend with **JWT authentication**, **refresh tokens**, **cookie-based login**, **role-based access**, **cart system**, and **Joi validation**.

---

## 📌 Features

* User registration & login (with hashed passwords)
* Access Token + Refresh Token (stored in **httpOnly cookies**)
* Admin & User roles
* Product CRUD (admin only for create)
* Add items to cart
* View cart with total price
* Remove item from cart
* Checkout cart
* Full Joi validation for all inputs

---

## 📁 Project Setup

### 1️⃣ Clone the project

```bash
git clone this-repo-link
cd ecommerce-api
```

---

## 2️⃣ Environment Variables

Copy `.env.example` → `.env`:

```bash
cp .env.example .env
```

Fill the values:

```
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=ecommerce
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
ACCESS_TOKEN_EXPIRES=15m
REFRESH_TOKEN_EXPIRES=7d
PORT=5000
NODE_ENVIRONMENT=development
```

---

## 3️⃣ Install dependencies

```bash
npm install
```

---

## 4️⃣ Run database creattion

Execute `schema.sql` in your MySQL server:

```sql
SOURCE schema.sql;
```

(WorkBench or CLI)

---

## 5️⃣ Run server

```bash
npm run dev
```

Server will start at:

```
http://localhost:5000
```

---

# 📡 API Endpoints

## 🔐 Auth Routes

### **POST /auth/register**

Register user
Body:

```json
{
  "name": "Nikhil",
  "email": "nikhil@mail.com",
  "password": "123456"
}
```

### **POST /auth/login**

Login user
Body:

```json
{
  "email": "nikhil@mail.com",
  "password": "123456"
}
```

✔ Sets `accessToken` & `refreshToken` cookies.

---

### **POST /auth/refresh**

Refresh access token (uses refreshToken cookie)

### **POST /auth/logout**

Clears cookies + removes refresh token from DB.

---

# 🛒 Product Routes

### **GET /products**

Fetch all products.

### **POST /products** (Admin only)

Create product
Body:

```json
{
  "name": "Laptop",
  "description": "Fast laptop",
  "price": 999,
  "stock": 10
}
```

---

# 🛍 Cart Routes (Auth Required)

### **POST /cart/add**

Add item to cart
Body:

```json
{
  "productId": 1,
  "quantity": 2
}
```

---

### **GET /cart**

Returns:

```json
{
  "items": [],
  "totalPrice": 0
}
```

---

### **POST /cart/remove**

Remove cart item
Body:

```json
{
  "cartItemId": 5
}
```

---

### **POST /cart/checkout**

Perform checkout (clears cart).

---

# 🧪 Notes

* Cookies must be enabled in Postman → **Send Cookies** enabled.
* Access token expires after `Added time`.
* Refresh token stays valid for `Added time`.
* Joi validates every request input.
* Only logged-in users can add/remove/checkout cart.
* Only admin can create/delete products.

---

# 🧙 Tech Stack

* Node.js
* Express.js
* MySQL (mysql2/promise)
* JWT Authentication
* Bcrypt password hashing
* Cookie-Parser
* Joi validation
* Nodemon


## Ecommerce System (Table format)

This project uses **JWT Cookie-based Authentication** with bcrypt password hashing, MySQL (via mysql2), and role-based access (user/admin).  
The first registered user automatically becomes **admin**.

| Purpose                        | Method | Endpoint             | Auth Required | Payload Type     | Payload Example                                                                                  | Response Example                                                                                                                                                                                                                   | Explanation                                                                                                                    |
|-------------------------------|--------|----------------------|---------------|------------------|--------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------|
| Register User                 | POST   | `/auth/register`     | No            | JSON Body        | ```json { "name": "User Test", "email": "test1@gmail.com", "password": "123456", "role": "user" } ``` | ```json { "message": "Registered", "user": { "id": 4, "name": "Nikhil Muliya", "email": "nik@gmail.com", "role": "admin" } } ```                                                                                               | User registration. Duplicate email → error. First user becomes **admin** automatically.                                      |
| Login User                    | POST   | `/auth/login`        | No            | JSON Body        | ```json { "email": "nik@gmail.com", "password": "123456" } ```                                   | ```json { "message": "Logged in", "user": { "id": 4, "name": "Nikhil Muliya", "email": "nik@gmail.com", "role": "admin" } } ```                                                                                                  | Login with registered credentials. Sets JWT in HTTP-only cookie.                                                              |
| Refresh Token                 | POST   | `/auth/refresh`      | Yes (cookie)  | None             | -                                                                                                | ```json { "message": "Access token refreshed" } ```                                                                                                                                                                                | Generates new access token when the old one expires (practice implementation).                                                |
| Logout User                   | POST   | `/auth/logout`       | Yes (cookie)  | None             | -                                                                                                | ```json { "message": "Logged out" } ```                                                                                                                                                                                            | Clears JWT cookie.                                                                                                            |
| Get All Products              | GET    | `/products`          | No            | None             | -                                                                                                | ```json [ { "id": 1, "name": "Belt", "description": "leather shine...", "price": "20.00", "stock": 10, "created_at": "2025-11-30T08:33:52.000Z" }, ... ] ```                                                                    | Returns all products added by admin. Anyone can view.                                                                         |
| Add Product (Admin only)      | POST   | `/products`          | Yes (cookie)  | JSON Body        | ```json { "name": "dgfgfdsgds", "description": "leatherfine...", "price": 20, "stock": 1 } ```   | ```json { "message": "Product created", "id": 3 } ```                                                                                                                                                                              | Only admin can create products.                                                                                               |
| Add Product to Cart           | POST   | `/cart/add`          | Yes (cookie)  | JSON Body        | ```json { "productId": 1, "quantity": 2 } ```                                                    | ```json { "message": "Added to cart" } ```                                                                                                                                                                                         | Logged-in users can add products to their cart.                                                                               |
| View Cart                     | GET    | `/cart`              | Yes (cookie)  | None             | -                                                                                                | ```json { "items": [ { "cart_item_id": 1, "product_id": 2, "name": "dgfgfdsgds", "price": 20, "quantity": 9, "lineTotal": 180 } ], "total": 180 } ```                                                                          | Shows current cart contents with line totals and grand total.                                                                 |
| Remove Item from Cart         | DELETE | `/cart/remove`       | Yes (cookie)  | JSON Body        | ```json { "cartItemId": 2 } ```                                                                  | ```json { "message": "Item removed" } ```                                                                                                                                                                                          | Remove a specific item from the cart using cartItemId.                                                                        |
| Checkout Cart                 | POST   | `/cart/checkout`     | Yes (cookie)  | None             | -                                                                                                | ```json { "message": "Checkout successful", "orderId": 1, "total": 180 } ```                                                                                                                                                       | Creates an order, reduces product stock accordingly, and empties the cart.                                                    |

### Notes
- All protected routes use JWT stored in **httpOnly cookie**.
- Role check middleware ensures only **admin** can add products.
- On successful checkout, product `stock` is decreased in the `products` table.

