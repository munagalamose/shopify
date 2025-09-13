const express = require('express');
const authRoutes = require('./auth');
const authenticateToken = authRoutes.authenticateToken;
const router = express.Router();

// Get dashboard overview data
router.get('/dashboard', authenticateToken, async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        
        if (!tenantId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Tenant access required' });
        }

        // If admin without tenant, get aggregated data
        const whereClause = tenantId ? 'WHERE tenant_id = ?' : '';
        const params = tenantId ? [tenantId] : [];

        // Get basic counts
        const [customerCount, orderCount, productCount] = await Promise.all([
            req.db.get(`SELECT COUNT(*) as count FROM customers ${whereClause}`, params),
            req.db.get(`SELECT COUNT(*) as count FROM orders ${whereClause}`, params),
            req.db.get(`SELECT COUNT(*) as count FROM products ${whereClause}`, params)
        ]);

        // Get total revenue
        const revenue = await req.db.get(
            `SELECT SUM(total_price) as total FROM orders ${whereClause}`, 
            params
        );

        // Get recent orders (last 30 days)
        const recentOrders = await req.db.get(`
            SELECT COUNT(*) as count 
            FROM orders 
            ${whereClause} ${whereClause ? 'AND' : 'WHERE'} 
            created_at >= datetime('now', '-30 days')
        `, params);

        res.json({
            overview: {
                totalCustomers: customerCount.count,
                totalOrders: orderCount.count,
                totalProducts: productCount.count,
                totalRevenue: revenue.total || 0,
                recentOrders: recentOrders.count
            }
        });

    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get products
router.get('/products', authenticateToken, async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        
        if (!tenantId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Tenant access required' });
        }

        const whereClause = tenantId ? 'WHERE tenant_id = ?' : '';
        const params = tenantId ? [tenantId] : [];

        const products = await req.db.all(`
            SELECT * FROM products ${whereClause} ORDER BY created_at DESC
        `, params);

        res.json({
            products: products || []
        });

    } catch (error) {
        console.error('Products error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get orders by date with filtering
router.get('/orders-by-date', authenticateToken, async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { startDate, endDate, groupBy = 'day' } = req.query;

        if (!tenantId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Tenant access required' });
        }

        let dateFormat;
        switch (groupBy) {
            case 'month':
                dateFormat = '%Y-%m';
                break;
            case 'week':
                dateFormat = '%Y-%W';
                break;
            default:
                dateFormat = '%Y-%m-%d';
        }

        let query = `
            SELECT 
                strftime('${dateFormat}', created_at) as date,
                COUNT(*) as order_count,
                SUM(total_price) as revenue
            FROM orders
        `;

        const params = [];
        const conditions = [];

        if (tenantId) {
            conditions.push('tenant_id = ?');
            params.push(tenantId);
        }

        if (startDate) {
            conditions.push('created_at >= ?');
            params.push(startDate);
        }

        if (endDate) {
            conditions.push('created_at <= ?');
            params.push(endDate);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' GROUP BY date ORDER BY date';

        const results = await req.db.all(query, params);

        res.json({ ordersByDate: results });

    } catch (error) {
        console.error('Orders by date error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get top customers by spend
router.get('/top-customers', authenticateToken, async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const limit = parseInt(req.query.limit) || 5;

        if (!tenantId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Tenant access required' });
        }

        const whereClause = tenantId ? 'WHERE tenant_id = ?' : '';
        const params = tenantId ? [tenantId, limit] : [limit];

        const topCustomers = await req.db.all(`
            SELECT 
                first_name,
                last_name,
                email,
                total_spent,
                orders_count
            FROM customers
            ${whereClause}
            ORDER BY total_spent DESC
            LIMIT ?
        `, params);

        res.json({ topCustomers });

    } catch (error) {
        console.error('Top customers error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get revenue trends
router.get('/revenue-trends', authenticateToken, async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { period = '30' } = req.query;

        if (!tenantId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Tenant access required' });
        }

        const whereClause = tenantId ? 'WHERE tenant_id = ?' : '';
        const params = tenantId ? [tenantId, period] : [period];

        const trends = await req.db.all(`
            SELECT 
                strftime('%Y-%m-%d', created_at) as date,
                SUM(total_price) as revenue,
                COUNT(*) as orders
            FROM orders
            ${whereClause} ${whereClause ? 'AND' : 'WHERE'} 
            created_at >= datetime('now', '-' || ? || ' days')
            GROUP BY date
            ORDER BY date
        `, params);

        res.json({ revenueTrends: trends });

    } catch (error) {
        console.error('Revenue trends error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get product performance
router.get('/product-performance', authenticateToken, async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const limit = parseInt(req.query.limit) || 10;

        if (!tenantId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Tenant access required' });
        }

        let query = `
            SELECT 
                p.title,
                p.price,
                p.inventory_quantity,
                COUNT(oli.id) as times_ordered,
                SUM(oli.quantity) as total_quantity_sold,
                SUM(oli.price * oli.quantity) as total_revenue
            FROM products p
            LEFT JOIN order_line_items oli ON p.id = oli.product_id
        `;

        const params = [];
        if (tenantId) {
            query += ' WHERE p.tenant_id = ?';
            params.push(tenantId);
        }

        query += `
            GROUP BY p.id
            ORDER BY total_revenue DESC
            LIMIT ?
        `;
        params.push(limit);

        const productPerformance = await req.db.all(query, params);

        res.json({ productPerformance });

    } catch (error) {
        console.error('Product performance error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get customer acquisition trends
router.get('/customer-acquisition', authenticateToken, async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { period = '90' } = req.query;

        if (!tenantId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Tenant access required' });
        }

        const whereClause = tenantId ? 'WHERE tenant_id = ?' : '';
        const params = tenantId ? [tenantId, period] : [period];

        const acquisition = await req.db.all(`
            SELECT 
                strftime('%Y-%m-%d', created_at) as date,
                COUNT(*) as new_customers
            FROM customers
            ${whereClause} ${whereClause ? 'AND' : 'WHERE'} 
            created_at >= datetime('now', '-' || ? || ' days')
            GROUP BY date
            ORDER BY date
        `, params);

        res.json({ customerAcquisition: acquisition });

    } catch (error) {
        console.error('Customer acquisition error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get custom events analytics (bonus feature)
router.get('/custom-events', authenticateToken, async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const { eventType, period = '30' } = req.query;

        if (!tenantId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Tenant access required' });
        }

        let query = `
            SELECT 
                event_type,
                strftime('%Y-%m-%d', created_at) as date,
                COUNT(*) as event_count
            FROM custom_events
        `;

        const params = [];
        const conditions = [];

        if (tenantId) {
            conditions.push('tenant_id = ?');
            params.push(tenantId);
        }

        if (eventType) {
            conditions.push('event_type = ?');
            params.push(eventType);
        }

        conditions.push('created_at >= datetime(\'now\', \'-\' || ? || \' days\')');
        params.push(period);

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' GROUP BY event_type, date ORDER BY date, event_type';

        const events = await req.db.all(query, params);

        // Also get event type summary
        let summaryQuery = `
            SELECT 
                event_type,
                COUNT(*) as total_count
            FROM custom_events
        `;

        const summaryParams = [];
        const summaryConditions = [];

        if (tenantId) {
            summaryConditions.push('tenant_id = ?');
            summaryParams.push(tenantId);
        }

        summaryConditions.push('created_at >= datetime(\'now\', \'-\' || ? || \' days\')');
        summaryParams.push(period);

        if (summaryConditions.length > 0) {
            summaryQuery += ' WHERE ' + summaryConditions.join(' AND ');
        }

        summaryQuery += ' GROUP BY event_type ORDER BY total_count DESC';

        const eventSummary = await req.db.all(summaryQuery, summaryParams);

        res.json({ 
            customEvents: events,
            eventSummary: eventSummary
        });

    } catch (error) {
        console.error('Custom events error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all customers with pagination
router.get('/customers', authenticateToken, async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        if (!tenantId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Tenant access required' });
        }

        const whereClause = tenantId ? 'WHERE tenant_id = ?' : '';
        const params = tenantId ? [tenantId, limit, offset] : [limit, offset];

        const customers = await req.db.all(`
            SELECT 
                id, email, first_name, last_name, total_spent, 
                orders_count, created_at, accepts_marketing
            FROM customers
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `, params);

        const countParams = tenantId ? [tenantId] : [];
        const totalCount = await req.db.get(`
            SELECT COUNT(*) as count FROM customers ${whereClause}
        `, countParams);

        res.json({
            customers,
            pagination: {
                page,
                limit,
                total: totalCount.count,
                totalPages: Math.ceil(totalCount.count / limit)
            }
        });

    } catch (error) {
        console.error('Get customers error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all orders with pagination
router.get('/orders', authenticateToken, async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        if (!tenantId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Tenant access required' });
        }

        const whereClause = tenantId ? 'WHERE o.tenant_id = ?' : '';
        const params = tenantId ? [tenantId, limit, offset] : [limit, offset];

        const orders = await req.db.all(`
            SELECT 
                o.id, o.order_number, o.email, o.total_price, 
                o.financial_status, o.created_at,
                c.first_name, c.last_name
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            ${whereClause}
            ORDER BY o.created_at DESC
            LIMIT ? OFFSET ?
        `, params);

        const countParams = tenantId ? [tenantId] : [];
        const totalCount = await req.db.get(`
            SELECT COUNT(*) as count FROM orders ${whereClause.replace('o.tenant_id', 'tenant_id')}
        `, countParams);

        res.json({
            orders,
            pagination: {
                page,
                limit,
                total: totalCount.count,
                totalPages: Math.ceil(totalCount.count / limit)
            }
        });

    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
