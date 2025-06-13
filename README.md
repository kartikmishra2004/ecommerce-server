# E-Commerce REST API

A professional, production-ready REST API for e-commerce applications built with Express.js, MongoDB, and JWT authentication. This API provides comprehensive user management, product catalog, and authentication features with proper security measures and best practices.

## 🚀 Features

### Authentication & Authorization
- **JWT-based authentication** with access and refresh tokens
- **User registration and login** with email validation
- **Role-based access control** (User/Admin)
- **Password encryption** using bcrypt
- **Token refresh mechanism** for seamless user experience
- **Secure logout** with token invalidation

### User Management
- **Complete user CRUD operations**
- **Profile management** with address and contact information
- **User status management** (Active/Inactive)
- **Admin dashboard statistics**
- **User search and filtering**
- **Pagination support**

### Product Catalog
- **Comprehensive product management**
- **Advanced filtering and search** (category, brand, price range, stock status)
- **Product categorization** with multiple categories
- **Inventory management** with stock tracking
- **Featured products** for promotions
- **Image management** with primary image selection
- **SEO-friendly** URLs and metadata
- **Product specifications** and tags

### Security & Performance
- **Rate limiting** to prevent abuse
- **Data sanitization** to prevent injection attacks
- **CORS protection** for cross-origin requests
- **Helmet.js** for security headers
- **Input validation** using Joi
- **Comprehensive error handling**
- **Request logging** and monitoring
- **Database indexing** for optimal performance

## 🛠️ Technology Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Joi** - Data validation
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing
- **express-rate-limit** - Rate limiting
- **compression** - Response compression

## 📁 Project Structure

```
├── controllers/          # Business logic
│   ├── authController.js
│   ├── userController.js
│   └── productController.js
├── middleware/           # Custom middleware
│   ├── auth.js
│   ├── validation.js
│   ├── errorHandler.js
│   └── logger.js
├── models/              # Database models
│   ├── User.js
│   └── Product.js
├── routes/              # API routes
│   ├── auth.js
│   ├── users.js
│   └── products.js
├── utils/               # Utility functions
│   ├── errorHandler.js
│   └── tokenUtils.js
├── .env                 # Environment variables
├── server.js           # Main server file
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ecommerce-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/ecommerce-api
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRE=7d
   JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key
   JWT_REFRESH_EXPIRE=30d
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

5. **Run the application**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

The API will be available at `http://localhost:5000`

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123",
  "phone": "+1234567890",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  }
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "Password123"
}
```

#### Refresh Token
```http
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <your-access-token>
```

#### Change Password
```http
PUT /api/auth/change-password
Authorization: Bearer <your-access-token>
Content-Type: application/json

{
  "currentPassword": "Password123",
  "newPassword": "NewPassword123"
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <your-access-token>
```

### User Endpoints

#### Get All Users (Admin Only)
```http
GET /api/users?page=1&limit=10&search=john&role=user&isActive=true
Authorization: Bearer <admin-access-token>
```

#### Get User by ID
```http
GET /api/users/:id
Authorization: Bearer <your-access-token>
```

#### Update User Profile
```http
PUT /api/users/:id
Authorization: Bearer <your-access-token>
Content-Type: application/json

{
  "name": "John Smith",
  "phone": "+1234567890",
  "address": {
    "street": "456 Oak St",
    "city": "Boston",
    "state": "MA",
    "zipCode": "02101",
    "country": "USA"
  }
}
```

#### Delete User Account
```http
DELETE /api/users/:id
Authorization: Bearer <your-access-token>
```

#### Toggle User Status (Admin Only)
```http
PATCH /api/users/:id/status
Authorization: Bearer <admin-access-token>
Content-Type: application/json

{
  "isActive": false
}
```

#### Get User Statistics (Admin Only)
```http
GET /api/users/stats
Authorization: Bearer <admin-access-token>
```

### Product Endpoints

#### Get All Products
```http
GET /api/products?category=electronics&brand=apple&minPrice=100&maxPrice=1000&page=1&limit=12&sort=-createdAt&search=iphone&inStock=true&featured=true
```

#### Get Product by ID
```http
GET /api/products/:id
```

#### Get Featured Products
```http
GET /api/products/featured?limit=8
```

#### Get Products by Category
```http
GET /api/products/category/electronics?page=1&limit=12
```

#### Create Product (Admin Only)
```http
POST /api/products
Authorization: Bearer <admin-access-token>
Content-Type: application/json

{
  "name": "iPhone 15 Pro",
  "description": "Latest iPhone with advanced features",
  "price": 999.99,
  "comparePrice": 1099.99,
  "category": "electronics",
  "brand": "Apple",
  "sku": "IPH15PRO001",
  "stock": 50,
  "images": [
    {
      "url": "https://example.com/iphone-main.jpg",
      "alt": "iPhone 15 Pro main image",
      "isPrimary": true
    }
  ],
  "specifications": {
    "Screen Size": "6.1 inches",
    "Storage": "128GB",
    "Color": "Natural Titanium"
  },
  "tags": ["smartphone", "apple", "5g", "titanium"],
  "weight": 187,
  "dimensions": {
    "length": 146.6,
    "width": 70.6,
    "height": 8.25
  },
  "isFeatured": true,
  "seoTitle": "iPhone 15 Pro - Advanced Titanium Design",
  "seoDescription": "Experience the power of iPhone 15 Pro with titanium design and advanced camera system."
}
```

#### Update Product (Admin Only)
```http
PUT /api/products/:id
Authorization: Bearer <admin-access-token>
Content-Type: application/json

{
  "price": 899.99,
  "stock": 45,
  "isFeatured": false
}
```

#### Delete Product (Admin Only)
```http
DELETE /api/products/:id
Authorization: Bearer <admin-access-token>
```

#### Toggle Product Status (Admin Only)
```http
PATCH /api/products/:id/status
Authorization: Bearer <admin-access-token>
Content-Type: application/json

{
  "isActive": false
}
```

#### Update Product Stock (Admin Only)
```http
PATCH /api/products/:id/stock
Authorization: Bearer <admin-access-token>
Content-Type: application/json

{
  "stock": 25,
  "operation": "set"
}
```

#### Get Product Statistics (Admin Only)
```http
GET /api/products/admin/stats
Authorization: Bearer <admin-access-token>
```

### Health Check
```http
GET /api/health
```

## 🔒 Security Features

### Authentication & Authorization
- JWT tokens with configurable expiration
- Refresh token rotation for enhanced security
- Role-based access control (RBAC)
- Password hashing with bcrypt (cost factor: 12)

### Data Protection
- Input validation using Joi schemas
- MongoDB injection prevention
- XSS protection through data sanitization
- Rate limiting to prevent brute force attacks

### Security Headers
- Helmet.js for setting security headers
- CORS configuration for cross-origin requests
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)

## 📊 Error Handling

The API implements comprehensive error handling with standardized error responses:

```json
{
  "success": false,
  "error": {
    "message": "Detailed error message",
    "statusCode": 400
  }
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `429` - Too Many Requests
- `500` - Internal Server Error

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your-production-jwt-secret
JWT_REFRESH_SECRET=your-production-refresh-secret
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### MongoDB Indexes

The API automatically creates the following indexes for optimal performance:

**User Collection:**
- `email` (unique)
- `createdAt` (descending)

**Product Collection:**
- Text index on `name`, `description`, `tags`
- `category`, `brand`, `price`, `sku` (unique)
- `createdAt`, `isActive`, `isFeatured`

## 🧪 Testing

To test the API endpoints, you can use tools like:
- **Postman** - Import the provided collection
- **cURL** - Command line testing
- **Thunder Client** - VS Code extension
- **Insomnia** - REST client

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

For support, email your-email@example.com or create an issue in the repository.

## 🔄 Version History

- **v1.0.0** - Initial release with complete authentication, user management, and product catalog features