const express = require('express');
const authRoutes = require('./auth');
const authenticateToken = authRoutes.authenticateToken;
const router = express.Router();

// Get all tenants (admin only)
router.get('/', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const tenants = await req.db.all(`
            SELECT id, name, shopify_domain, created_at, updated_at, is_active
            FROM tenants
            ORDER BY created_at DESC
        `);

        res.json({ tenants });

    } catch (error) {
        console.error('Get tenants error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single tenant
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const tenantId = req.params.id;
        
        // Users can only access their own tenant, admins can access any
        if (req.user.role !== 'admin' && req.user.tenantId != tenantId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const tenant = await req.db.get(`
            SELECT id, name, shopify_domain, created_at, updated_at, is_active
            FROM tenants
            WHERE id = ?
        `, [tenantId]);

        if (!tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }

        res.json({ tenant });

    } catch (error) {
        console.error('Get tenant error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new tenant (admin only)
router.post('/', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { name, shopifyDomain, shopifyAccessToken, shopifyApiKey, shopifyApiSecret, webhookSecret } = req.body;

        if (!name || !shopifyDomain) {
            return res.status(400).json({ error: 'Name and Shopify domain are required' });
        }

        // Check if domain already exists
        const existingTenant = await req.db.get(
            'SELECT id FROM tenants WHERE shopify_domain = ?',
            [shopifyDomain]
        );

        if (existingTenant) {
            return res.status(409).json({ error: 'Tenant with this domain already exists' });
        }

        const result = await req.db.run(`
            INSERT INTO tenants 
            (name, shopify_domain, shopify_access_token, shopify_api_key, shopify_api_secret, webhook_secret, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [name, shopifyDomain, shopifyAccessToken, shopifyApiKey, shopifyApiSecret, webhookSecret, 1]);

        res.status(201).json({
            message: 'Tenant created successfully',
            tenantId: result.lastID
        });

    } catch (error) {
        console.error('Create tenant error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update tenant
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const tenantId = req.params.id;
        
        // Users can only update their own tenant, admins can update any
        if (req.user.role !== 'admin' && req.user.tenantId != tenantId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const { name, shopifyAccessToken, shopifyApiKey, shopifyApiSecret, webhookSecret, isActive } = req.body;

        const updates = [];
        const values = [];

        if (name !== undefined) {
            updates.push('name = ?');
            values.push(name);
        }
        if (shopifyAccessToken !== undefined) {
            updates.push('shopify_access_token = ?');
            values.push(shopifyAccessToken);
        }
        if (shopifyApiKey !== undefined) {
            updates.push('shopify_api_key = ?');
            values.push(shopifyApiKey);
        }
        if (shopifyApiSecret !== undefined) {
            updates.push('shopify_api_secret = ?');
            values.push(shopifyApiSecret);
        }
        if (webhookSecret !== undefined) {
            updates.push('webhook_secret = ?');
            values.push(webhookSecret);
        }
        if (isActive !== undefined) {
            updates.push('is_active = ?');
            values.push(isActive ? 1 : 0);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(tenantId);

        await req.db.run(`
            UPDATE tenants SET ${updates.join(', ')}
            WHERE id = ?
        `, values);

        res.json({ message: 'Tenant updated successfully' });

    } catch (error) {
        console.error('Update tenant error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete tenant (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const tenantId = req.params.id;

        // Check if tenant exists
        const tenant = await req.db.get('SELECT id FROM tenants WHERE id = ?', [tenantId]);
        if (!tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }

        // Delete all related data (cascade delete)
        await req.db.run('DELETE FROM custom_events WHERE tenant_id = ?', [tenantId]);
        await req.db.run('DELETE FROM order_line_items WHERE order_id IN (SELECT id FROM orders WHERE tenant_id = ?)', [tenantId]);
        await req.db.run('DELETE FROM orders WHERE tenant_id = ?', [tenantId]);
        await req.db.run('DELETE FROM products WHERE tenant_id = ?', [tenantId]);
        await req.db.run('DELETE FROM customers WHERE tenant_id = ?', [tenantId]);
        await req.db.run('DELETE FROM webhook_logs WHERE tenant_id = ?', [tenantId]);
        await req.db.run('DELETE FROM users WHERE tenant_id = ?', [tenantId]);
        await req.db.run('DELETE FROM tenants WHERE id = ?', [tenantId]);

        res.json({ message: 'Tenant deleted successfully' });

    } catch (error) {
        console.error('Delete tenant error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get tenant statistics
router.get('/:id/stats', authenticateToken, async (req, res) => {
    try {
        const tenantId = req.params.id;
        
        // Users can only access their own tenant stats, admins can access any
        if (req.user.role !== 'admin' && req.user.tenantId != tenantId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const [customers, orders, products, events] = await Promise.all([
            req.db.get('SELECT COUNT(*) as count FROM customers WHERE tenant_id = ?', [tenantId]),
            req.db.get('SELECT COUNT(*) as count FROM orders WHERE tenant_id = ?', [tenantId]),
            req.db.get('SELECT COUNT(*) as count FROM products WHERE tenant_id = ?', [tenantId]),
            req.db.get('SELECT COUNT(*) as count FROM custom_events WHERE tenant_id = ?', [tenantId])
        ]);

        res.json({
            stats: {
                customers: customers.count,
                orders: orders.count,
                products: products.count,
                events: events.count
            }
        });

    } catch (error) {
        console.error('Get tenant stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
