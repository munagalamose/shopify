const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Fix trust proxy for Render deployment (MUST be before other middleware)
app.set('trust proxy', 1);

// Use environment port or fallback
const PORT = process.env.PORT || 5000;

// In-memory data store (fallback for SQLite issues) - Comprehensive Shopify Store Data
const mockData = {
  users: [
    {
      id: 1,
      email: 'admin@xenoanalytics.com',
      password_hash: '$2a$10$wt4wFwr.FJb7C.JuRPubUOdn5v/o1iY41S1VlGXnrJGEbm6GrpJnO', // admin123
      role: 'admin',
      tenant_id: 1
    }
  ],
  tenants: [
    {
      id: 1,
      name: 'XenoAnalytics Demo Store',
      shopify_domain: 'xenoanalytics-demo.myshopify.com',
      is_active: 1
    }
  ],
  customers: [
    {
      id: 1,
      tenant_id: 1,
      shopify_customer_id: 'cust_001',
      email: 'john.doe@example.com',
      first_name: 'John',
      last_name: 'Doe',
      phone: '+1-555-0123',
      total_spent: 1850.00,
      orders_count: 7,
      created_at: '2024-01-15 10:30:00',
      accepts_marketing: 1,
      state: 'enabled',
      tags: 'VIP,Electronics'
    },
    {
      id: 2,
      tenant_id: 1,
      shopify_customer_id: 'cust_002',
      email: 'jane.smith@example.com',
      first_name: 'Jane',
      last_name: 'Smith',
      phone: '+1-555-0124',
      total_spent: 1290.50,
      orders_count: 5,
      created_at: '2024-02-20 14:15:00',
      accepts_marketing: 1,
      state: 'enabled',
      tags: 'Fashion,Frequent'
    },
    {
      id: 3,
      tenant_id: 1,
      shopify_customer_id: 'cust_003',
      email: 'bob.johnson@example.com',
      first_name: 'Bob',
      last_name: 'Johnson',
      phone: '+1-555-0125',
      total_spent: 2750.75,
      orders_count: 12,
      created_at: '2024-01-10 09:45:00',
      accepts_marketing: 0,
      state: 'enabled',
      tags: 'HighValue,Tech'
    },
    {
      id: 4,
      tenant_id: 1,
      shopify_customer_id: 'cust_004',
      email: 'sarah.wilson@example.com',
      first_name: 'Sarah',
      last_name: 'Wilson',
      phone: '+1-555-0126',
      total_spent: 675.25,
      orders_count: 3,
      created_at: '2024-03-05 16:20:00',
      accepts_marketing: 1,
      state: 'enabled',
      tags: 'NewCustomer,Fashion'
    },
    {
      id: 5,
      tenant_id: 1,
      shopify_customer_id: 'cust_005',
      email: 'mike.brown@example.com',
      first_name: 'Mike',
      last_name: 'Brown',
      phone: '+1-555-0127',
      total_spent: 1425.00,
      orders_count: 6,
      created_at: '2024-01-25 11:15:00',
      accepts_marketing: 1,
      state: 'enabled',
      tags: 'Sports,Regular'
    },
    {
      id: 6,
      tenant_id: 1,
      shopify_customer_id: 'cust_006',
      email: 'emily.davis@example.com',
      first_name: 'Emily',
      last_name: 'Davis',
      phone: '+1-555-0128',
      total_spent: 950.00,
      orders_count: 4,
      created_at: '2024-02-10 13:45:00',
      accepts_marketing: 0,
      state: 'enabled',
      tags: 'Home,Decor'
    }
  ],
  products: [
    // Electronics Category
    {
      id: 1,
      tenant_id: 1,
      shopify_product_id: 'prod_001',
      title: 'Premium Wireless Headphones',
      handle: 'premium-wireless-headphones',
      vendor: 'AudioTech',
      product_type: 'Electronics',
      price: 199.99,
      compare_at_price: 249.99,
      inventory_quantity: 45,
      status: 'active',
      tags: 'wireless,audio,premium',
      created_at: '2024-01-01 00:00:00'
    },
    {
      id: 2,
      tenant_id: 1,
      shopify_product_id: 'prod_002',
      title: 'Smart Fitness Watch',
      handle: 'smart-fitness-watch',
      vendor: 'FitTech',
      product_type: 'Electronics',
      price: 299.99,
      compare_at_price: 349.99,
      inventory_quantity: 32,
      status: 'active',
      tags: 'fitness,smartwatch,health',
      created_at: '2024-01-01 00:00:00'
    },
    {
      id: 3,
      tenant_id: 1,
      shopify_product_id: 'prod_003',
      title: 'Bluetooth Speaker',
      handle: 'bluetooth-speaker',
      vendor: 'SoundWave',
      product_type: 'Electronics',
      price: 89.99,
      compare_at_price: 119.99,
      inventory_quantity: 78,
      status: 'active',
      tags: 'bluetooth,speaker,portable',
      created_at: '2024-01-01 00:00:00'
    },
    // Fashion Category
    {
      id: 4,
      tenant_id: 1,
      shopify_product_id: 'prod_004',
      title: 'Organic Cotton T-Shirt',
      handle: 'organic-cotton-tshirt',
      vendor: 'EcoWear',
      product_type: 'Clothing',
      price: 29.99,
      compare_at_price: 39.99,
      inventory_quantity: 150,
      status: 'active',
      tags: 'organic,cotton,sustainable',
      created_at: '2024-01-01 00:00:00'
    },
    {
      id: 5,
      tenant_id: 1,
      shopify_product_id: 'prod_005',
      title: 'Designer Jeans',
      handle: 'designer-jeans',
      vendor: 'DenimCo',
      product_type: 'Clothing',
      price: 89.99,
      compare_at_price: 120.00,
      inventory_quantity: 65,
      status: 'active',
      tags: 'denim,designer,fashion',
      created_at: '2024-01-01 00:00:00'
    },
    {
      id: 6,
      tenant_id: 1,
      shopify_product_id: 'prod_006',
      title: 'Leather Jacket',
      handle: 'leather-jacket',
      vendor: 'StyleCraft',
      product_type: 'Clothing',
      price: 249.99,
      compare_at_price: 299.99,
      inventory_quantity: 25,
      status: 'active',
      tags: 'leather,jacket,premium',
      created_at: '2024-01-01 00:00:00'
    },
    // Home & Living
    {
      id: 7,
      tenant_id: 1,
      shopify_product_id: 'prod_007',
      title: 'Ceramic Coffee Mug Set',
      handle: 'ceramic-coffee-mug-set',
      vendor: 'HomeEssentials',
      product_type: 'Home & Garden',
      price: 39.99,
      compare_at_price: 49.99,
      inventory_quantity: 120,
      status: 'active',
      tags: 'ceramic,coffee,kitchen',
      created_at: '2024-01-01 00:00:00'
    },
    {
      id: 8,
      tenant_id: 1,
      shopify_product_id: 'prod_008',
      title: 'Scented Candle Collection',
      handle: 'scented-candle-collection',
      vendor: 'AromaLife',
      product_type: 'Home & Garden',
      price: 59.99,
      compare_at_price: 79.99,
      inventory_quantity: 85,
      status: 'active',
      tags: 'candles,scented,relaxation',
      created_at: '2024-01-01 00:00:00'
    },
    // Sports & Outdoors
    {
      id: 9,
      tenant_id: 1,
      shopify_product_id: 'prod_009',
      title: 'Yoga Mat Premium',
      handle: 'yoga-mat-premium',
      vendor: 'ZenFit',
      product_type: 'Sports & Recreation',
      price: 49.99,
      compare_at_price: 69.99,
      inventory_quantity: 95,
      status: 'active',
      tags: 'yoga,fitness,mat',
      created_at: '2024-01-01 00:00:00'
    },
    {
      id: 10,
      tenant_id: 1,
      shopify_product_id: 'prod_010',
      title: 'Water Bottle Insulated',
      handle: 'water-bottle-insulated',
      vendor: 'HydroGear',
      product_type: 'Sports & Recreation',
      price: 24.99,
      compare_at_price: 34.99,
      inventory_quantity: 200,
      status: 'active',
      tags: 'water,bottle,insulated',
      created_at: '2024-01-01 00:00:00'
    },
    {
      id: 11,
      tenant_id: 1,
      shopify_product_id: 'prod_011',
      title: 'iPhone 17',
      handle: 'iphone-17',
      vendor: 'Apple',
      product_type: 'Electronics',
      price: 1299.00,
      compare_at_price: 1399.00,
      inventory_quantity: 50,
      status: 'active',
      tags: 'iphone,apple,smartphone,premium',
      body_html: '<p>The most advanced iPhone yet. Featuring the latest A18 Pro chip, enhanced camera system, and all-day battery life.</p>',
      image_url: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-17-finish-select-202409-6-7inch_AV1?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1693086290312',
      created_at: '2024-01-01 00:00:00'
    },
    {
      id: 12,
      tenant_id: 1,
      shopify_product_id: 'prod_012',
      title: 'MacBook Pro 16"',
      handle: 'macbook-pro-16',
      vendor: 'Apple',
      product_type: 'Electronics',
      price: 2499.00,
      compare_at_price: 2699.00,
      inventory_quantity: 25,
      status: 'active',
      tags: 'macbook,apple,laptop,professional',
      body_html: '<p>Supercharged by M3 Pro and M3 Max chips. Up to 22 hours of battery life.</p>',
      image_url: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp16-spacegray-select-202310?wid=904&hei=840&fmt=jpeg&qlt=90&.v=1697311054290',
      created_at: '2024-01-01 00:00:00'
    },
    {
      id: 13,
      tenant_id: 1,
      shopify_product_id: 'prod_013',
      title: 'Nike Air Max 270',
      handle: 'nike-air-max-270',
      vendor: 'Nike',
      product_type: 'Footwear',
      price: 150.00,
      compare_at_price: 180.00,
      inventory_quantity: 85,
      status: 'active',
      tags: 'nike,sneakers,airmax,sports',
      body_html: '<p>Nike Air Max 270 delivers visible Air cushioning from heel to toe.</p>',
      image_url: 'https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/awjogtdnqxniqqk0wpgf/air-max-270-shoes-KkLcGR.png',
      created_at: '2024-01-01 00:00:00'
    },
    {
      id: 14,
      tenant_id: 1,
      shopify_product_id: 'prod_014',
      title: 'Samsung Galaxy S24 Ultra',
      handle: 'samsung-galaxy-s24-ultra',
      vendor: 'Samsung',
      product_type: 'Electronics',
      price: 1199.99,
      compare_at_price: 1299.99,
      inventory_quantity: 40,
      status: 'active',
      tags: 'samsung,galaxy,smartphone,android',
      body_html: '<p>Galaxy S24 Ultra with S Pen. 200MP camera, titanium build, and Galaxy AI features.</p>',
      image_url: 'https://images.samsung.com/is/image/samsung/p6pim/us/2401/gallery/us-galaxy-s24-s928-sm-s928uzkeue-thumb-539573016',
      created_at: '2024-01-01 00:00:00'
    },
    {
      id: 15,
      tenant_id: 1,
      shopify_product_id: 'prod_015',
      title: 'Sony WH-1000XM5 Headphones',
      handle: 'sony-wh-1000xm5',
      vendor: 'Sony',
      product_type: 'Electronics',
      price: 399.99,
      compare_at_price: 449.99,
      inventory_quantity: 60,
      status: 'active',
      tags: 'sony,headphones,wireless,noise-canceling',
      body_html: '<p>Industry-leading noise canceling with Dual Noise Sensor technology. Up to 30-hour battery life.</p>',
      image_url: 'https://www.sony.com/image/5d02da5df552836db894c04bbc24bb8b?fmt=pjpeg&wid=330&bgcolor=FFFFFF&bgc=FFFFFF',
      created_at: '2024-01-01 00:00:00'
    }
  ],
  orders: [
    // John Doe's orders (VIP Electronics customer)
    {
      id: 1,
      tenant_id: 1,
      shopify_order_id: 'order_001',
      customer_id: 1,
      order_number: '1001',
      email: 'john.doe@example.com',
      total_price: 199.99,
      subtotal_price: 199.99,
      tax_amount: 0.00,
      shipping_amount: 0.00,
      financial_status: 'paid',
      fulfillment_status: 'fulfilled',
      created_at: '2024-01-20 10:30:00',
      processed_at: '2024-01-20 10:35:00'
    },
    {
      id: 2,
      tenant_id: 1,
      shopify_order_id: 'order_002',
      customer_id: 1,
      order_number: '1002',
      email: 'john.doe@example.com',
      total_price: 389.98,
      subtotal_price: 389.98,
      tax_amount: 0.00,
      shipping_amount: 0.00,
      financial_status: 'paid',
      fulfillment_status: 'fulfilled',
      created_at: '2024-02-15 14:20:00',
      processed_at: '2024-02-15 14:25:00'
    },
    // Jane Smith's orders (Fashion enthusiast)
    {
      id: 3,
      tenant_id: 1,
      shopify_order_id: 'order_003',
      customer_id: 2,
      order_number: '1003',
      email: 'jane.smith@example.com',
      total_price: 119.98,
      subtotal_price: 119.98,
      tax_amount: 0.00,
      shipping_amount: 0.00,
      financial_status: 'paid',
      fulfillment_status: 'fulfilled',
      created_at: '2024-02-25 16:45:00',
      processed_at: '2024-02-25 16:50:00'
    },
    {
      id: 4,
      tenant_id: 1,
      shopify_order_id: 'order_004',
      customer_id: 2,
      order_number: '1004',
      email: 'jane.smith@example.com',
      total_price: 249.99,
      subtotal_price: 249.99,
      tax_amount: 0.00,
      shipping_amount: 0.00,
      financial_status: 'paid',
      fulfillment_status: 'fulfilled',
      created_at: '2024-03-10 11:30:00',
      processed_at: '2024-03-10 11:35:00'
    },
    // Bob Johnson's orders (High-value tech customer)
    {
      id: 5,
      tenant_id: 1,
      shopify_order_id: 'order_005',
      customer_id: 3,
      order_number: '1005',
      email: 'bob.johnson@example.com',
      total_price: 599.97,
      subtotal_price: 599.97,
      tax_amount: 0.00,
      shipping_amount: 0.00,
      financial_status: 'paid',
      fulfillment_status: 'fulfilled',
      created_at: '2024-01-15 09:15:00',
      processed_at: '2024-01-15 09:20:00'
    },
    {
      id: 6,
      tenant_id: 1,
      shopify_order_id: 'order_006',
      customer_id: 3,
      order_number: '1006',
      email: 'bob.johnson@example.com',
      total_price: 89.99,
      subtotal_price: 89.99,
      tax_amount: 0.00,
      shipping_amount: 0.00,
      financial_status: 'paid',
      fulfillment_status: 'fulfilled',
      created_at: '2024-02-20 13:45:00',
      processed_at: '2024-02-20 13:50:00'
    },
    // Sarah Wilson's orders (New customer)
    {
      id: 7,
      tenant_id: 1,
      shopify_order_id: 'order_007',
      customer_id: 4,
      order_number: '1007',
      email: 'sarah.wilson@example.com',
      total_price: 99.98,
      subtotal_price: 99.98,
      tax_amount: 0.00,
      shipping_amount: 0.00,
      financial_status: 'paid',
      fulfillment_status: 'fulfilled',
      created_at: '2024-03-08 15:20:00',
      processed_at: '2024-03-08 15:25:00'
    },
    // Mike Brown's orders (Sports enthusiast)
    {
      id: 8,
      tenant_id: 1,
      shopify_order_id: 'order_008',
      customer_id: 5,
      order_number: '1008',
      email: 'mike.brown@example.com',
      total_price: 74.98,
      subtotal_price: 74.98,
      tax_amount: 0.00,
      shipping_amount: 0.00,
      financial_status: 'paid',
      fulfillment_status: 'fulfilled',
      created_at: '2024-02-01 12:10:00',
      processed_at: '2024-02-01 12:15:00'
    },
    // Emily Davis's orders (Home decor)
    {
      id: 9,
      tenant_id: 1,
      shopify_order_id: 'order_009',
      customer_id: 6,
      order_number: '1009',
      email: 'emily.davis@example.com',
      total_price: 99.98,
      subtotal_price: 99.98,
      tax_amount: 0.00,
      shipping_amount: 0.00,
      financial_status: 'paid',
      fulfillment_status: 'fulfilled',
      created_at: '2024-02-14 10:30:00',
      processed_at: '2024-02-14 10:35:00'
    },
    // Recent orders (March 2024)
    {
      id: 10,
      tenant_id: 1,
      shopify_order_id: 'order_010',
      customer_id: 1,
      order_number: '1010',
      email: 'john.doe@example.com',
      total_price: 299.99,
      subtotal_price: 299.99,
      tax_amount: 0.00,
      shipping_amount: 0.00,
      financial_status: 'paid',
      fulfillment_status: 'pending',
      created_at: '2024-03-12 16:45:00',
      processed_at: '2024-03-12 16:50:00'
    }
  ],
  customEvents: [
    {
      id: 1,
      tenant_id: 1,
      event_type: 'cart_abandonment',
      customer_id: 2,
      event_data: JSON.stringify({
        cart_token: 'cart_abc123',
        abandoned_checkout_url: 'https://demo-store.myshopify.com/cart/abc123',
        line_items: [
          { product_id: 'prod_005', quantity: 1, price: 89.99, title: 'Designer Jeans' }
        ],
        total_price: 89.99
      }),
      created_at: '2024-03-11 14:30:00'
    },
    {
      id: 2,
      tenant_id: 1,
      event_type: 'checkout_started',
      customer_id: 4,
      event_data: JSON.stringify({
        checkout_token: 'checkout_def456',
        line_items: [
          { product_id: 'prod_008', quantity: 1, price: 59.99, title: 'Scented Candle Collection' }
        ],
        total_price: 59.99
      }),
      created_at: '2024-03-13 10:15:00'
    },
    {
      id: 3,
      tenant_id: 1,
      event_type: 'product_view',
      customer_id: 1,
      event_data: JSON.stringify({
        product_id: 'prod_002',
        product_title: 'Smart Fitness Watch',
        referrer: 'google.com'
      }),
      created_at: '2024-03-12 16:00:00'
    }
  ]
};

// Security middleware
app.use(helmet());
app.use(cors({
    origin: true, // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Routes
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        message: 'Shopify Insights Service is running (Fallback Mode)'
    });
});

// Test endpoint for debugging
app.post('/api/test/login', (req, res) => {
    try {
        console.log('=== TEST LOGIN ENDPOINT ===');
        console.log('Request body:', JSON.stringify(req.body));
        console.log('Content-Type:', req.headers['content-type']);
        console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
        console.log('mockData.users length:', mockData.users.length);
        console.log('First user email:', mockData.users[0]?.email);
        
        res.json({
            success: true,
            message: 'Test endpoint working',
            bodyReceived: req.body,
            jwtSecretExists: !!process.env.JWT_SECRET,
            usersCount: mockData.users.length
        });
    } catch (error) {
        console.error('Test endpoint error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Authentication endpoints
app.post('/api/auth/login', async (req, res) => {
    try {
        console.log('=== LOGIN ATTEMPT ===');
        console.log('Request body:', JSON.stringify(req.body));
        console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
        console.log('JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);
        
        const { email, password } = req.body;

        if (!email || !password) {
            console.log('Missing email or password');
            return res.status(400).json({ error: 'Email and password are required' });
        }

        console.log('Looking for user with email:', email);
        const user = mockData.users.find(u => u.email === email);
        if (!user) {
            console.log('User not found');
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        console.log('User found, checking password...');
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        console.log('Password valid:', isValidPassword);
        
        if (!isValidPassword) {
            console.log('Invalid password');
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        console.log('Finding tenant...');
        const tenant = mockData.tenants.find(t => t.id === user.tenant_id);
        console.log('Tenant found:', !!tenant);

        console.log('Creating JWT token...');
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is not set!');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        const token = jwt.sign(
            { 
                userId: user.id, 
                email: user.email, 
                role: user.role,
                tenantId: user.tenant_id 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('JWT token created successfully');
        console.log('=== LOGIN SUCCESS ===');

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                tenant: tenant
            }
        });

    } catch (error) {
        console.error('=== LOGIN ERROR ===');
        console.error('Error details:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('=== END LOGIN ERROR ===');
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

app.get('/api/auth/verify', authenticateToken, (req, res) => {
    res.json({ valid: true, user: req.user });
});

// Dashboard data endpoint
app.get('/api/data/dashboard', authenticateToken, (req, res) => {
    const tenantId = req.user.tenantId;
    
    const customers = mockData.customers.filter(c => c.tenant_id === tenantId);
    const orders = mockData.orders.filter(o => o.tenant_id === tenantId);
    
    const totalRevenue = orders.reduce((sum, order) => sum + order.total_price, 0);
    
    res.json({
        overview: {
            totalCustomers: customers.length,
            totalOrders: orders.length,
            totalProducts: 25, // Mock value
            totalRevenue: totalRevenue,
            recentOrders: orders.filter(o => new Date(o.created_at) > new Date(Date.now() - 30*24*60*60*1000)).length
        }
    });
});

// Products endpoint
app.get('/api/data/products', authenticateToken, (req, res) => {
    const tenantId = req.user.tenantId;
    
    const products = mockData.products.filter(p => p.tenant_id === tenantId);
    
    res.json({ products: products });
});

// Top customers endpoint
app.get('/api/data/top-customers', authenticateToken, (req, res) => {
    const tenantId = req.user.tenantId;
    const limit = parseInt(req.query.limit) || 5;
    
    const customers = mockData.customers
        .filter(c => c.tenant_id === tenantId)
        .sort((a, b) => b.total_spent - a.total_spent)
        .slice(0, limit);
    
    res.json({ topCustomers: customers });
});

// Orders by date endpoint
app.get('/api/data/orders-by-date', authenticateToken, (req, res) => {
    const tenantId = req.user.tenantId;
    
    const orders = mockData.orders.filter(o => o.tenant_id === tenantId);
    const ordersByDate = orders.map(order => ({
        date: order.created_at.split(' ')[0],
        order_count: 1,
        revenue: order.total_price
    }));
    
    res.json({ ordersByDate });
});

// Revenue trends endpoint
app.get('/api/data/revenue-trends', authenticateToken, (req, res) => {
    const tenantId = req.user.tenantId;
    
    const orders = mockData.orders.filter(o => o.tenant_id === tenantId);
    const trends = orders.map(order => ({
        date: order.created_at.split(' ')[0],
        revenue: order.total_price,
        orders: 1
    }));
    
    res.json({ revenueTrends: trends });
});

// Customer acquisition endpoint
app.get('/api/data/customer-acquisition', authenticateToken, (req, res) => {
    const tenantId = req.user.tenantId;
    
    const customers = mockData.customers.filter(c => c.tenant_id === tenantId);
    const acquisition = customers.map(customer => ({
        date: customer.created_at.split(' ')[0],
        new_customers: 1
    }));
    
    res.json({ customerAcquisition: acquisition });
});

// Customers list endpoint
app.get('/api/data/customers', authenticateToken, (req, res) => {
    const tenantId = req.user.tenantId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const customers = mockData.customers.filter(c => c.tenant_id === tenantId);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    res.json({
        customers: customers.slice(startIndex, endIndex),
        pagination: {
            page,
            limit,
            total: customers.length,
            totalPages: Math.ceil(customers.length / limit)
        }
    });
});

// Orders list endpoint
app.get('/api/data/orders', authenticateToken, (req, res) => {
    const tenantId = req.user.tenantId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const orders = mockData.orders.filter(o => o.tenant_id === tenantId);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    res.json({
        orders: orders.slice(startIndex, endIndex),
        pagination: {
            page,
            limit,
            total: orders.length,
            totalPages: Math.ceil(orders.length / limit)
        }
    });
});

// Webhook endpoints
app.post('/api/webhooks/customers/create', (req, res) => {
    console.log('Customer webhook received:', req.body);
    res.json({ success: true });
});

app.post('/api/webhooks/orders/create', (req, res) => {
    console.log('Order webhook received:', req.body);
    res.json({ success: true });
});

app.post('/api/webhooks/products/create', (req, res) => {
    console.log('Product webhook received:', req.body);
    res.json({ success: true });
});

app.post('/api/webhooks/carts/create', (req, res) => {
    console.log('Cart abandonment webhook received:', req.body);
    
    // Add to custom events
    const cartEvent = {
        id: mockData.customEvents.length + 1,
        tenant_id: 1,
        event_type: 'cart_abandonment',
        customer_id: req.body.customer ? req.body.customer.id : null,
        event_data: JSON.stringify({
            cart_token: req.body.cart_token,
            total_price: req.body.total_price,
            line_items: req.body.line_items || []
        }),
        created_at: new Date().toISOString()
    };
    
    mockData.customEvents.push(cartEvent);
    res.json({ success: true });
});

app.post('/api/webhooks/checkouts/create', (req, res) => {
    console.log('Checkout started webhook received:', req.body);
    
    // Add to custom events
    const checkoutEvent = {
        id: mockData.customEvents.length + 1,
        tenant_id: 1,
        event_type: 'checkout_started',
        customer_id: req.body.customer ? req.body.customer.id : null,
        event_data: JSON.stringify({
            checkout_token: req.body.checkout_token,
            total_price: req.body.total_price,
            line_items: req.body.line_items || []
        }),
        created_at: new Date().toISOString()
    };
    
    mockData.customEvents.push(checkoutEvent);
    res.json({ success: true });
});

app.post('/api/webhooks/test', (req, res) => {
    console.log('Test webhook received:', req.body);
    res.json({ success: true, message: 'Webhook received successfully' });
});

// Serve React build files in production
if (process.env.NODE_ENV === 'production') {
    // Serve static files from React build
    app.use(express.static(path.join(__dirname, 'client/build')));
    
    // Serve React app for all non-API routes
    app.get('*', (req, res) => {
        // Skip API routes
        if (req.path.startsWith('/api')) {
            return next();
        }
        res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
    });
} else {
    // Development: serve static files from public directory
    app.use(express.static(path.join(__dirname, 'public')));
    
    // Serve the dashboard HTML for root path
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(`🚀 Shopify Insights Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
    console.log(`✅ Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🔑 Login: POST http://localhost:${PORT}/api/auth/login`);
    console.log(`📈 Dashboard: GET http://localhost:${PORT}/api/data/dashboard`);
    console.log(`🔐 JWT_SECRET configured: ${!!process.env.JWT_SECRET}`);
    console.log(`📦 Deployment timestamp: ${new Date().toISOString()}`);
    console.log(`🔄 Force redeploy trigger: ${Math.random().toString(36).substring(7)}`);
});

module.exports = app;
