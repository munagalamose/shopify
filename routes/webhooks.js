const express = require('express');
const crypto = require('crypto');
const router = express.Router();

// Middleware to verify Shopify webhook
const verifyShopifyWebhook = (req, res, next) => {
    const hmac = req.get('X-Shopify-Hmac-Sha256');
    const body = JSON.stringify(req.body);
    const hash = crypto
        .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET || 'default_secret')
        .update(body, 'utf8')
        .digest('base64');

    if (hash !== hmac) {
        console.log('Webhook verification failed');
        // In development, we'll allow webhooks without verification
        if (process.env.NODE_ENV === 'production') {
            return res.status(401).json({ error: 'Unauthorized' });
        }
    }
    next();
};

// Get tenant by shop domain
const getTenantByDomain = async (db, shopDomain) => {
    return await db.get(
        'SELECT * FROM tenants WHERE shopify_domain = ?',
        [shopDomain]
    );
};

// Log webhook for debugging
const logWebhook = async (db, tenantId, webhookType, payload, error = null) => {
    try {
        await db.run(
            'INSERT INTO webhook_logs (tenant_id, webhook_type, payload, processed, error_message) VALUES (?, ?, ?, ?, ?)',
            [tenantId, webhookType, JSON.stringify(payload), error ? 0 : 1, error]
        );
    } catch (logError) {
        console.error('Error logging webhook:', logError);
    }
};

// Customer created/updated webhook
router.post('/customers/create', verifyShopifyWebhook, async (req, res) => {
    try {
        const customer = req.body;
        const shopDomain = req.get('X-Shopify-Shop-Domain');
        
        const tenant = await getTenantByDomain(req.db, shopDomain);
        if (!tenant) {
            await logWebhook(req.db, null, 'customer_create', customer, 'Tenant not found');
            return res.status(404).json({ error: 'Tenant not found' });
        }

        // Insert or update customer
        await req.db.run(`
            INSERT OR REPLACE INTO customers 
            (tenant_id, shopify_customer_id, email, first_name, last_name, phone, 
             total_spent, orders_count, created_at, updated_at, accepts_marketing, state, tags)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            tenant.id,
            customer.id.toString(),
            customer.email,
            customer.first_name,
            customer.last_name,
            customer.phone,
            parseFloat(customer.total_spent || 0),
            customer.orders_count || 0,
            customer.created_at,
            customer.updated_at,
            customer.accepts_marketing ? 1 : 0,
            customer.state,
            customer.tags ? customer.tags.join(',') : null
        ]);

        await logWebhook(req.db, tenant.id, 'customer_create', customer);
        res.status(200).json({ success: true });

    } catch (error) {
        console.error('Customer webhook error:', error);
        await logWebhook(req.db, null, 'customer_create', req.body, error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/customers/update', verifyShopifyWebhook, async (req, res) => {
    try {
        const customer = req.body;
        const shopDomain = req.get('X-Shopify-Shop-Domain');
        
        const tenant = await getTenantByDomain(req.db, shopDomain);
        if (!tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }

        await req.db.run(`
            UPDATE customers SET 
            email = ?, first_name = ?, last_name = ?, phone = ?, 
            total_spent = ?, orders_count = ?, updated_at = ?, 
            accepts_marketing = ?, state = ?, tags = ?
            WHERE tenant_id = ? AND shopify_customer_id = ?
        `, [
            customer.email,
            customer.first_name,
            customer.last_name,
            customer.phone,
            parseFloat(customer.total_spent || 0),
            customer.orders_count || 0,
            customer.updated_at,
            customer.accepts_marketing ? 1 : 0,
            customer.state,
            customer.tags ? customer.tags.join(',') : null,
            tenant.id,
            customer.id.toString()
        ]);

        await logWebhook(req.db, tenant.id, 'customer_update', customer);
        res.status(200).json({ success: true });

    } catch (error) {
        console.error('Customer update webhook error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Order created/updated webhook
router.post('/orders/create', verifyShopifyWebhook, async (req, res) => {
    try {
        const order = req.body;
        const shopDomain = req.get('X-Shopify-Shop-Domain');
        
        const tenant = await getTenantByDomain(req.db, shopDomain);
        if (!tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }

        // Find customer if exists
        let customerId = null;
        if (order.customer && order.customer.id) {
            const customer = await req.db.get(
                'SELECT id FROM customers WHERE tenant_id = ? AND shopify_customer_id = ?',
                [tenant.id, order.customer.id.toString()]
            );
            customerId = customer ? customer.id : null;
        }

        // Insert order
        const orderResult = await req.db.run(`
            INSERT OR REPLACE INTO orders 
            (tenant_id, shopify_order_id, customer_id, order_number, email, 
             total_price, subtotal_price, total_tax, currency, financial_status, 
             fulfillment_status, created_at, updated_at, tags)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            tenant.id,
            order.id.toString(),
            customerId,
            order.order_number || order.name,
            order.email,
            parseFloat(order.total_price || 0),
            parseFloat(order.subtotal_price || 0),
            parseFloat(order.total_tax || 0),
            order.currency || 'USD',
            order.financial_status,
            order.fulfillment_status,
            order.created_at,
            order.updated_at,
            order.tags ? order.tags.join(',') : null
        ]);

        // Insert line items
        if (order.line_items && order.line_items.length > 0) {
            for (const item of order.line_items) {
                // Find product if exists
                let productId = null;
                if (item.product_id) {
                    const product = await req.db.get(
                        'SELECT id FROM products WHERE tenant_id = ? AND shopify_product_id = ?',
                        [tenant.id, item.product_id.toString()]
                    );
                    productId = product ? product.id : null;
                }

                await req.db.run(`
                    INSERT INTO order_line_items 
                    (order_id, product_id, shopify_variant_id, title, quantity, price, total_discount)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [
                    orderResult.lastID,
                    productId,
                    item.variant_id ? item.variant_id.toString() : null,
                    item.title,
                    item.quantity,
                    parseFloat(item.price || 0),
                    parseFloat(item.total_discount || 0)
                ]);
            }
        }

        await logWebhook(req.db, tenant.id, 'order_create', order);
        res.status(200).json({ success: true });

    } catch (error) {
        console.error('Order webhook error:', error);
        await logWebhook(req.db, null, 'order_create', req.body, error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Product created/updated webhook
router.post('/products/create', verifyShopifyWebhook, async (req, res) => {
    try {
        const product = req.body;
        const shopDomain = req.get('X-Shopify-Shop-Domain');
        
        const tenant = await getTenantByDomain(req.db, shopDomain);
        if (!tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }

        // Get price from first variant
        let price = 0;
        let compareAtPrice = 0;
        let inventoryQuantity = 0;

        if (product.variants && product.variants.length > 0) {
            const firstVariant = product.variants[0];
            price = parseFloat(firstVariant.price || 0);
            compareAtPrice = parseFloat(firstVariant.compare_at_price || 0);
            inventoryQuantity = firstVariant.inventory_quantity || 0;
        }

        await req.db.run(`
            INSERT OR REPLACE INTO products 
            (tenant_id, shopify_product_id, title, handle, vendor, product_type, 
             price, compare_at_price, inventory_quantity, created_at, updated_at, status, tags)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            tenant.id,
            product.id.toString(),
            product.title,
            product.handle,
            product.vendor,
            product.product_type,
            price,
            compareAtPrice,
            inventoryQuantity,
            product.created_at,
            product.updated_at,
            product.status,
            product.tags ? product.tags.join(',') : null
        ]);

        await logWebhook(req.db, tenant.id, 'product_create', product);
        res.status(200).json({ success: true });

    } catch (error) {
        console.error('Product webhook error:', error);
        await logWebhook(req.db, null, 'product_create', req.body, error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Cart abandonment webhook (bonus feature)
router.post('/carts/create', verifyShopifyWebhook, async (req, res) => {
    try {
        const cart = req.body;
        const shopDomain = req.get('X-Shopify-Shop-Domain');
        
        const tenant = await getTenantByDomain(req.db, shopDomain);
        if (!tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }

        // Find customer if exists
        let customerId = null;
        if (cart.customer && cart.customer.id) {
            const customer = await req.db.get(
                'SELECT id FROM customers WHERE tenant_id = ? AND shopify_customer_id = ?',
                [tenant.id, cart.customer.id.toString()]
            );
            customerId = customer ? customer.id : null;
        }

        // Log cart abandonment event
        await req.db.run(`
            INSERT INTO custom_events 
            (tenant_id, customer_id, event_type, event_data)
            VALUES (?, ?, ?, ?)
        `, [
            tenant.id,
            customerId,
            'cart_abandoned',
            JSON.stringify({
                cart_id: cart.id,
                total_price: cart.total_price,
                line_items_count: cart.line_items ? cart.line_items.length : 0,
                abandoned_checkout_url: cart.abandoned_checkout_url
            })
        ]);

        await logWebhook(req.db, tenant.id, 'cart_create', cart);
        res.status(200).json({ success: true });

    } catch (error) {
        console.error('Cart webhook error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Checkout started webhook (bonus feature)
router.post('/checkouts/create', verifyShopifyWebhook, async (req, res) => {
    try {
        const checkout = req.body;
        const shopDomain = req.get('X-Shopify-Shop-Domain');
        
        const tenant = await getTenantByDomain(req.db, shopDomain);
        if (!tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }

        // Find customer if exists
        let customerId = null;
        if (checkout.customer && checkout.customer.id) {
            const customer = await req.db.get(
                'SELECT id FROM customers WHERE tenant_id = ? AND shopify_customer_id = ?',
                [tenant.id, checkout.customer.id.toString()]
            );
            customerId = customer ? customer.id : null;
        }

        // Log checkout started event
        await req.db.run(`
            INSERT INTO custom_events 
            (tenant_id, customer_id, event_type, event_data)
            VALUES (?, ?, ?, ?)
        `, [
            tenant.id,
            customerId,
            'checkout_started',
            JSON.stringify({
                checkout_id: checkout.id,
                total_price: checkout.total_price,
                line_items_count: checkout.line_items ? checkout.line_items.length : 0,
                email: checkout.email
            })
        ]);

        await logWebhook(req.db, tenant.id, 'checkout_create', checkout);
        res.status(200).json({ success: true });

    } catch (error) {
        console.error('Checkout webhook error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Test webhook endpoint for development
router.post('/test', async (req, res) => {
    try {
        console.log('Test webhook received:', req.body);
        await logWebhook(req.db, null, 'test', req.body);
        res.status(200).json({ success: true, message: 'Test webhook received' });
    } catch (error) {
        console.error('Test webhook error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
