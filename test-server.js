const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://your-domain.com'] 
        : ['http://localhost:3000'],
    credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Test routes without database
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        message: 'Shopify Insights Service is running'
    });
});

// Mock authentication endpoint
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    if (email === 'admin@xenoanalytics.com' && password === 'admin123') {
        res.json({
            token: 'mock-jwt-token',
            user: {
                id: 1,
                email: email,
                role: 'admin',
                tenant: {
                    id: 1,
                    name: 'Demo Store',
                    shopify_domain: 'demo-store.myshopify.com'
                }
            }
        });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Mock dashboard data
app.get('/api/data/dashboard', (req, res) => {
    res.json({
        overview: {
            totalCustomers: 150,
            totalOrders: 89,
            totalProducts: 25,
            totalRevenue: 12450.75,
            recentOrders: 23
        }
    });
});

// Mock webhook endpoint
app.post('/api/webhooks/test', (req, res) => {
    console.log('Test webhook received:', req.body);
    res.json({ success: true, message: 'Webhook received successfully' });
});

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
    console.log(`🚀 Test Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
    console.log(`✅ Health Check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
