# 🛍️ Shopify Analytics Dashboard

A comprehensive multi-tenant Shopify analytics platform with interactive dashboard, product catalog management, and real-time data insights. Built with Node.js, React, SQLite, and modern web technologies.

## 🚀 Features

### ✅ Core Features
- **Multi-tenant Architecture**: Isolated data storage and processing for multiple Shopify stores
- **Interactive Dashboard**: Beautiful React-based analytics dashboard with real-time charts
- **Product Catalog Management**: Complete product management with images and descriptions
- **Customer Analytics**: Customer insights, order tracking, and revenue analytics
- **Email Authentication**: Secure login system with JWT tokens
- **RESTful API**: Comprehensive API endpoints for data access and management
- **Real-time Data Processing**: Webhook endpoints for live data synchronization

### 🎯 Analytics & Insights
- **Revenue Dashboard**: Total customers, orders, and revenue tracking with visual charts
- **Order Analytics**: Orders by date with interactive date range filtering
- **Customer Insights**: Top customers by spend, customer acquisition trends
- **Product Catalog**: Complete product management with images, descriptions, and inventory
- **Performance Metrics**: Product performance analytics and sales trends
- **Custom Events**: Cart abandonment tracking and checkout behavior analysis

### 🔧 Technical Stack
- **Backend**: Node.js, Express.js, SQLite3
- **Frontend**: React 18, Custom Chart Components, Tailwind CSS
- **Authentication**: JWT tokens, bcryptjs password hashing
- **Database**: SQLite with multi-tenant schema and sample data
- **Security**: Helmet.js, CORS, Rate limiting, Input validation
- **Development**: Hot reload, fallback server for cross-platform compatibility

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Git

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** (optional, for cloning)

### 🖥️ Setup for New Laptop/Computer

#### Step 1: Install Node.js
1. Download Node.js from [nodejs.org](https://nodejs.org/)
2. Install the LTS version (includes npm)
3. Verify installation:
```bash
node --version
npm --version
```

#### Step 2: Get the Project
```bash
# If you have the project folder already:
cd path/to/Shopify

# Or clone from repository:
git clone <repository-url>
cd shopify-insights
```

#### Step 3: Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

#### Step 4: Start the Application
```bash
# Method 1: Start both servers manually (RECOMMENDED)
# Terminal 1 - Backend Server:
node server-fallback.js

# Terminal 2 - React Frontend:
cd client
npm start
```

#### Step 5: Access Your Dashboard
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:5000
- **Login Credentials**:
  - Email: `admin@xenoanalytics.com`
  - Password: `admin123`

### 🔄 Restarting Servers

If you need to restart the servers:

**Windows:**
```bash
# Stop all Node processes
taskkill /f /im node.exe

# Restart backend
node server-fallback.js

# Restart frontend (new terminal)
cd client
npm start
```

**Mac/Linux:**
```bash
# Stop servers with Ctrl+C in each terminal
# Then restart with the commands above
```

### 🎯 Demo Store Data

The system includes a comprehensive **XenoAnalytics Demo Store** with:
- **6 diverse customer profiles** with realistic purchase patterns
- **15+ products** across 4 categories with high-quality product images:
  - 📱 **Electronics**: Smart Fitness Watch, Samsung Galaxy S24 Ultra, Sony Headphones
  - 👕 **Fashion**: Designer T-Shirts, Premium Jeans, Luxury Handbags
  - 🏠 **Home & Garden**: Scented Candles, Kitchen Appliances
  - ⚽ **Sports**: Nike Air Max, Yoga Mats, Fitness Equipment
- **10+ orders** with complete transaction history and line items
- **Product Images**: Real product images from major brands (Nike, Samsung, etc.)
- **Custom events** (cart abandonment, checkout tracking, product views)
- **Multi-tenant data isolation** and security

See `SHOPIFY_STORE_SETUP.md` for detailed store data documentation.

### 🔧 Webhook Testing

Test webhook integration with the included simulator:

```bash
# Test complete customer journey
node webhook-simulator.js journey

# Test individual webhooks
node webhook-simulator.js customer
node webhook-simulator.js order
node webhook-simulator.js cart-abandon
node webhook-simulator.js checkout

# Run all simulations
node webhook-simulator.js all
```

## 🛠️ Architecture & Features

### 🏗️ System Architecture
- **Multi-tenant SaaS architecture** with tenant data isolation
- **RESTful API** with comprehensive endpoint coverage
- **Real-time webhook processing** for Shopify events
- **JWT-based authentication** with role-based access control
- **Responsive dashboard** with interactive analytics

### 📊 Analytics Features
- **Revenue Dashboard**: Interactive charts showing total revenue, orders, and customers
- **Customer Analytics**: Top customers by spend, customer acquisition trends
- **Product Catalog**: Visual product grid with images, prices, and inventory levels
- **Order Management**: Complete order history with customer details and line items
- **Real-time Updates**: Live data synchronization across all dashboard components
- **Custom Events**: Cart abandonment tracking and checkout behavior analysis
- **Visual Charts**: Custom-built chart components for better performance

### 🔒 Security Features
- **Helmet.js** security headers
- **CORS** configuration for cross-origin requests
- **Rate limiting** (100 requests per 15 minutes)
- **Webhook signature verification**
- **Password hashing** with bcryptjs
- **JWT token authentication**

## 📁 Project Structure

```
Shopify/
├── client/                    # React Frontend Application
│   ├── public/               # Static assets (favicon, index.html)
│   ├── src/                  # React source code
│   │   ├── components/       # Reusable React components
│   │   ├── contexts/         # React Context providers
│   │   ├── App.js           # Main React application
│   │   └── index.js         # React entry point
│   ├── package.json         # Frontend dependencies
│   └── .env                 # Frontend environment variables
├── database/                 # Database Management
│   ├── init.js              # Database initialization and sample data
│   └── schema.sql           # Database schema definition
├── routes/                   # Backend API Routes
│   ├── api.js               # Main API endpoints
│   ├── auth.js              # Authentication routes
│   ├── tenants.js           # Multi-tenant management
│   └── webhooks.js          # Shopify webhook handlers
├── public/                   # Static Dashboard (Legacy)
│   └── index.html           # Static HTML dashboard
├── server.js                # Main server (SQLite)
├── server-fallback.js       # Fallback server (In-memory, RECOMMENDED)
├── webhook-simulator.js     # Webhook testing utilities
├── package.json             # Backend dependencies
├── .env                     # Backend environment variables
├── database.sqlite          # SQLite database file
├── README.md               # This documentation
├── ARCHITECTURE.md         # Detailed technical architecture
└── SHOPIFY_STORE_SETUP.md  # Sample data documentation
```

## 🧪 Testing & Development

### Manual Testing
1. **Dashboard Access**: Login and explore analytics
2. **API Testing**: Use Postman or curl for endpoint testing
3. **Webhook Simulation**: Use the included webhook simulator

### Webhook Endpoints
- `POST /api/webhooks/customers/create` - Customer creation
- `POST /api/webhooks/orders/create` - Order processing
- `POST /api/webhooks/products/create` - Product updates
- `POST /api/webhooks/carts/create` - Cart abandonment
- `POST /api/webhooks/checkouts/create` - Checkout tracking

## 🚀 Deployment

### 🌐 Deploy to Render (Recommended)

Render is a modern cloud platform that makes deployment simple and free for small projects.

#### Prerequisites
1. **GitHub Account**: Your code needs to be in a GitHub repository
2. **Render Account**: Sign up at [render.com](https://render.com)

#### Step 1: Prepare Your Repository
```bash
# Make sure all files are committed
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

#### Step 2: Deploy on Render
1. **Go to [render.com](https://render.com)** and sign in with GitHub
2. **Click "New +"** → **"Web Service"**
3. **Connect your GitHub repository**
4. **Configure the service:**
   - **Name**: `shopify-analytics-dashboard`
   - **Environment**: `Node`
   - **Build Command**: `npm run render-build`
   - **Start Command**: `node server-fallback.js`
   - **Plan**: `Free` (or upgrade as needed)

#### Step 3: Environment Variables
Add these environment variables in Render dashboard:
```env
NODE_ENV=production
PORT=10000
JWT_SECRET=your_secure_random_string_here
DB_PATH=./database.sqlite
ADMIN_EMAIL=admin@xenoanalytics.com
ADMIN_PASSWORD=admin123
```

#### Step 4: Deploy
- Click **"Create Web Service"**
- Render will automatically build and deploy your app
- Your app will be available at: `https://your-app-name.onrender.com`

#### 🎯 Quick Deploy with render.yaml
We've included a `render.yaml` file for one-click deployment:
1. Push your code to GitHub
2. In Render, choose **"Blueprint"** instead of **"Web Service"**
3. Connect your repository
4. Render will automatically configure everything!

### 🔧 Alternative Deployment Options

#### Heroku Deployment
```bash
# Install Heroku CLI
npm install -g heroku

# Login and create app
heroku login
heroku create your-app-name

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_secure_secret

# Deploy
git push heroku main
```

#### Docker Deployment
```bash
# Build and run with Docker
docker build -t shopify-insights .
docker run -p 5000:5000 shopify-insights
```

## 📈 Business Value

### For E-commerce Businesses
- **Revenue Optimization**: Identify top-performing products and customers
- **Customer Retention**: Analyze purchase patterns and lifecycle
- **Inventory Management**: Track stock levels and demand forecasting
- **Marketing ROI**: Measure campaign effectiveness and customer acquisition

### For SaaS Providers
- **Multi-tenant Architecture**: Scalable solution for multiple clients
- **White-label Ready**: Customizable branding and features
- **API-first Design**: Easy integration with existing systems
- **Real-time Analytics**: Live data processing and insights

## 🔮 Future Roadmap

### Phase 1 (Current)
- ✅ Multi-tenant data ingestion
- ✅ Real-time analytics dashboard
- ✅ Webhook processing
- ✅ Customer and order management

### Phase 2 (Planned)
- 🔄 Machine learning recommendations
- 🔄 Advanced customer segmentation
- 🔄 Predictive analytics
- 🔄 Mobile app support

### Phase 3 (Future)
- 📋 Multi-channel integration
- 📋 Advanced reporting and exports
- 📋 Automated marketing campaigns
- 📋 Enterprise features and compliance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support & Troubleshooting

### Common Issues
- **SQLite binding errors**: Use `node server-fallback.js`
- **CORS errors**: Check origin configuration in server settings
- **Authentication issues**: Verify JWT secret and token expiry
- **Webhook failures**: Check endpoint URLs and signature verification

### Getting Help
- Check `ARCHITECTURE.md` for detailed technical documentation
- Review `SHOPIFY_STORE_SETUP.md` for data structure details
- Use the webhook simulator for testing integration
- Enable debug logging for troubleshooting

---

**Built with ❤️ for the Shopify ecosystem**
npm install
```

### 3. Install Frontend Dependencies
```bash
cd client
npm install
cd ..
```

### 4. Environment Configuration
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_here
DB_PATH=./database.sqlite
ADMIN_EMAIL=admin@xenoanalytics.com
ADMIN_PASSWORD=admin123
```

### 5. Start the Application

#### Development Mode
```bash
# Start backend server
npm run dev

# In another terminal, start frontend
cd client
npm start
```

#### Production Mode
```bash
npm run build
npm start
```

## 🏗️ Architecture

### High-Level Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Shopify Store │────│  Webhook Events │────│   Node.js API   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │◄───│  REST API Calls │────│  SQLite Database│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Multi-Tenant Data Flow

```
Shopify Store A ──┐
                  ├──► Webhook Router ──► Tenant Isolation ──► Database
Shopify Store B ──┘                                             │
                                                                 ▼
User Dashboard ◄─── Authentication ◄─── API Endpoints ◄─────────┘
```

## 📊 Database Schema

### Core Tables

#### `tenants`
- Multi-tenant configuration and Shopify store credentials
- Isolation key for all data operations

#### `customers`
- Customer data with tenant isolation
- Tracks spending, order count, and marketing preferences

#### `orders`
- Order data with customer relationships
- Financial status, fulfillment tracking

#### `products`
- Product catalog with pricing and inventory
- Variant support through line items

#### `custom_events`
- Bonus feature for cart abandonment and checkout tracking
- Flexible JSON event data storage

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User authentication
- `GET /api/auth/profile` - Get user profile
- `GET /api/auth/verify` - Verify JWT token

### Webhooks (Shopify Integration)
- `POST /api/webhooks/customers/create` - Customer created
- `POST /api/webhooks/customers/update` - Customer updated
- `POST /api/webhooks/orders/create` - Order created
- `POST /api/webhooks/products/create` - Product created
- `POST /api/webhooks/carts/create` - Cart abandonment (bonus)
- `POST /api/webhooks/checkouts/create` - Checkout started (bonus)

### Analytics Data
- `GET /api/data/dashboard` - Overview metrics
- `GET /api/data/orders-by-date` - Orders with date filtering
- `GET /api/data/top-customers` - Top customers by spend
- `GET /api/data/revenue-trends` - Revenue analytics
- `GET /api/data/customer-acquisition` - Customer growth
- `GET /api/data/customers` - Customer list with pagination
- `GET /api/data/orders` - Order list with pagination

### Tenant Management
- `GET /api/tenants` - List all tenants (admin)
- `POST /api/tenants` - Create new tenant (admin)
- `PUT /api/tenants/:id` - Update tenant
- `DELETE /api/tenants/:id` - Delete tenant (admin)

## 🔐 Authentication & Security

### JWT Authentication
- Secure token-based authentication
- 24-hour token expiration
- Role-based access control (admin/user)

### Security Features
- Helmet.js for security headers
- CORS configuration
- Rate limiting (100 requests per 15 minutes)
- Input validation and sanitization
- Webhook signature verification

## 🎨 Frontend Features

### Dashboard Components
- **Overview**: Key metrics and quick actions
- **Analytics**: Interactive charts and trends
- **Customers**: Paginated customer list with search
- **Orders**: Order management with status tracking

### UI/UX Features
- Responsive design with Tailwind CSS
- Loading states and error handling
- Intuitive navigation with sidebar
- Real-time data updates

## 🧪 Testing the System

### 1. Start the Application
```bash
npm run dev
cd client && npm start
```

### 2. Access the Dashboard
- Open http://localhost:3000
- Login with: `admin@xenoanalytics.com` / `admin123`

### 3. Test Webhook Endpoints
```bash
# Test customer webhook
curl -X POST http://localhost:5000/api/webhooks/customers/create \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Shop-Domain: demo-store.myshopify.com" \
  -d '{
    "id": "12345",
    "email": "test@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "total_spent": "150.00",
    "orders_count": 2
  }'
```

### 4. Sample Data
The system includes pre-seeded sample data:
- Demo tenant: `demo-store.myshopify.com`
- 3 sample customers with order history
- 3 sample products
- Multiple orders with line items

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
JWT_SECRET=secure_production_secret
DB_PATH=./production.sqlite
```

### Build for Production
```bash
npm run build
```

### Deploy to Heroku
```bash
heroku create your-app-name
git push heroku main
```

## 📈 Next Steps for Production

### Scalability Improvements
1. **Database Migration**: Move from SQLite to PostgreSQL/MySQL
2. **Caching Layer**: Implement Redis for session management and caching
3. **Message Queue**: Add Redis/RabbitMQ for webhook processing
4. **Microservices**: Split into separate services for auth, data, and analytics

### Security Enhancements
1. **OAuth Integration**: Implement Shopify OAuth flow
2. **API Rate Limiting**: Per-tenant rate limiting
3. **Data Encryption**: Encrypt sensitive data at rest
4. **Audit Logging**: Comprehensive audit trail

### Feature Additions
1. **Real-time Notifications**: WebSocket integration
2. **Advanced Analytics**: Machine learning insights
3. **Export Functionality**: CSV/PDF report generation
4. **Multi-store Management**: Enhanced tenant management UI

### Monitoring & Observability
1. **Application Monitoring**: New Relic/DataDog integration
2. **Error Tracking**: Sentry integration
3. **Performance Metrics**: Custom dashboards
4. **Health Checks**: Comprehensive system health monitoring

## 🐛 Known Limitations

1. **SQLite Limitations**: Not suitable for high-concurrency production use
2. **Chart.js Dependencies**: Custom chart implementation due to dependency issues
3. **Webhook Verification**: Simplified verification for development
4. **File Storage**: No file upload/storage implementation
5. **Email Services**: No email notification system

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 📞 Support

For questions or support, please contact:
- Email: support@xenoanalytics.com
- Documentation: [Link to detailed docs]
- Issues: [GitHub Issues URL]

---

**Built with ❤️ by the Xeno Analytics Team**
