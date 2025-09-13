const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

class Database {
    constructor(dbPath = './database.sqlite') {
        this.dbPath = dbPath;
        this.db = null;
    }

    async connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error opening database:', err);
                    reject(err);
                } else {
                    console.log('Connected to SQLite database');
                    resolve();
                }
            });
        });
    }

    async initializeSchema() {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        return new Promise((resolve, reject) => {
            this.db.exec(schema, (err) => {
                if (err) {
                    console.error('Error initializing schema:', err);
                    reject(err);
                } else {
                    console.log('Database schema initialized');
                    resolve();
                }
            });
        });
    }

    async seedData() {
        try {
            // Create default admin user
            const adminEmail = process.env.ADMIN_EMAIL || 'admin@xenoanalytics.com';
            const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
            const hashedPassword = await bcrypt.hash(adminPassword, 10);

            // Check if admin user already exists
            const existingUser = await this.get('SELECT * FROM users WHERE email = ?', [adminEmail]);
            
            if (!existingUser) {
                await this.run(
                    'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
                    [adminEmail, hashedPassword, 'admin']
                );
                console.log('Admin user created:', adminEmail);
            }

            // Create sample tenant
            const existingTenant = await this.get('SELECT * FROM tenants WHERE shopify_domain = ?', ['demo-store.myshopify.com']);
            
            if (!existingTenant) {
                const tenantId = await this.run(
                    'INSERT INTO tenants (name, shopify_domain, is_active) VALUES (?, ?, ?)',
                    ['Demo Store', 'demo-store.myshopify.com', 1]
                );

                // Create sample data for demo tenant
                await this.seedSampleData(tenantId.lastID);
                console.log('Sample tenant and data created');
            }

        } catch (error) {
            console.error('Error seeding data:', error);
        }
    }

    async seedSampleData(tenantId) {
        // Comprehensive customer profiles
        const customers = [
            {
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
        ];

        for (const customer of customers) {
            await this.run(
                `INSERT INTO customers (tenant_id, shopify_customer_id, email, first_name, last_name, 
                 phone, total_spent, orders_count, created_at, accepts_marketing, state, tags) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [tenantId, customer.shopify_customer_id, customer.email, customer.first_name, 
                 customer.last_name, customer.phone, customer.total_spent, customer.orders_count, 
                 customer.created_at, customer.accepts_marketing, customer.state, customer.tags]
            );
        }

        // Comprehensive product catalog
        const products = [
            // Electronics Category
            {
                shopify_product_id: 'prod_001',
                title: 'Premium Wireless Headphones',
                handle: 'premium-wireless-headphones',
                vendor: 'AudioTech',
                product_type: 'Electronics',
                price: 199.99,
                compare_at_price: 249.99,
                inventory_quantity: 45,
                status: 'active',
                tags: 'wireless,audio,premium'
            },
            {
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
                body_html: '<p>Advanced fitness tracking with heart rate monitoring, GPS, and 7-day battery life. Track workouts, sleep, and health metrics.</p>',
                image_url: 'https://m.media-amazon.com/images/I/616jllf33ZL._UY1000_.jpg'
            },
            {
                shopify_product_id: 'prod_003',
                title: 'Bluetooth Speaker',
                handle: 'bluetooth-speaker',
                vendor: 'SoundWave',
                product_type: 'Electronics',
                price: 89.99,
                compare_at_price: 119.99,
                inventory_quantity: 78,
                status: 'active',
                tags: 'bluetooth,speaker,portable'
            },
            // Fashion Category
            {
                shopify_product_id: 'prod_004',
                title: 'Organic Cotton T-Shirt',
                handle: 'organic-cotton-tshirt',
                vendor: 'EcoWear',
                product_type: 'Clothing',
                price: 29.99,
                compare_at_price: 39.99,
                inventory_quantity: 150,
                status: 'active',
                tags: 'organic,cotton,sustainable'
            },
            {
                shopify_product_id: 'prod_005',
                title: 'Designer Jeans',
                handle: 'designer-jeans',
                vendor: 'DenimCo',
                product_type: 'Clothing',
                price: 89.99,
                compare_at_price: 120.00,
                inventory_quantity: 65,
                status: 'active',
                tags: 'denim,designer,fashion'
            },
            {
                shopify_product_id: 'prod_006',
                title: 'Leather Jacket',
                handle: 'leather-jacket',
                vendor: 'StyleCraft',
                product_type: 'Clothing',
                price: 249.99,
                compare_at_price: 299.99,
                inventory_quantity: 25,
                status: 'active',
                tags: 'leather,jacket,premium'
            },
            // Home & Living
            {
                shopify_product_id: 'prod_007',
                title: 'Ceramic Coffee Mug Set',
                handle: 'ceramic-coffee-mug-set',
                vendor: 'HomeEssentials',
                product_type: 'Home & Garden',
                price: 39.99,
                compare_at_price: 49.99,
                inventory_quantity: 120,
                status: 'active',
                tags: 'ceramic,coffee,kitchen'
            },
            {
                shopify_product_id: 'prod_008',
                title: 'Scented Candle Collection',
                handle: 'scented-candle-collection',
                vendor: 'AromaLife',
                product_type: 'Home & Garden',
                price: 59.99,
                compare_at_price: 79.99,
                inventory_quantity: 85,
                status: 'active',
                tags: 'candles,scented,relaxation'
            },
            // Sports & Outdoors
            {
                shopify_product_id: 'prod_009',
                title: 'Yoga Mat Premium',
                handle: 'yoga-mat-premium',
                vendor: 'ZenFit',
                product_type: 'Sports & Recreation',
                price: 49.99,
                compare_at_price: 69.99,
                inventory_quantity: 95,
                status: 'active',
                tags: 'yoga,fitness,mat'
            },
            {
                shopify_product_id: 'prod_010',
                title: 'Water Bottle Insulated',
                handle: 'water-bottle-insulated',
                vendor: 'HydroGear',
                product_type: 'Sports & Recreation',
                price: 24.99,
                compare_at_price: 34.99,
                inventory_quantity: 200,
                status: 'active',
                tags: 'water,bottle,insulated'
            },
            {
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
                body_html: '<p>The most advanced iPhone yet. Featuring the latest A18 Pro chip, enhanced camera system, and all-day battery life. Available in multiple colors including White, Black, Blue, Green, and Purple.</p>',
                image_url: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-17-finish-select-202409-6-7inch_AV1?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1693086290312'
            },
            {
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
                body_html: '<p>Supercharged by M3 Pro and M3 Max chips. Up to 22 hours of battery life. Liquid Retina XDR display.</p>',
                image_url: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp16-spacegray-select-202310?wid=904&hei=840&fmt=jpeg&qlt=90&.v=1697311054290'
            },
            {
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
                body_html: '<p>Nike Air Max 270 delivers visible Air cushioning from heel to toe. Lightweight and comfortable for all-day wear.</p>',
                image_url: 'https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/awjogtdnqxniqqk0wpgf/air-max-270-shoes-KkLcGR.png'
            },
            {
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
                image_url: 'https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/awjogtdnqxniqqk0wpgf/air-max-270-shoes-KkLcGR.png'
            },
            {
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
                image_url: 'https://www.sony.com/image/5d02da5df552836db894c04bbc24bb8b?fmt=pjpeg&wid=330&bgcolor=FFFFFF&bgc=FFFFFF'
            }
        ];

        for (const product of products) {
            await this.run(
                `INSERT INTO products (tenant_id, shopify_product_id, title, handle, vendor, 
                 product_type, price, compare_at_price, inventory_quantity, status, tags, body_html, image_url, created_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [tenantId, product.shopify_product_id, product.title, product.handle, 
                 product.vendor, product.product_type, product.price, product.compare_at_price,
                 product.inventory_quantity, product.status, product.tags, product.body_html || '', 
                 product.image_url || '', new Date().toISOString()]
            );
        }

        // Comprehensive order data with realistic purchase patterns
        const orders = [
            // John Doe's orders (VIP Electronics customer)
            {
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
        ];

        for (const order of orders) {
            await this.run(
                `INSERT INTO orders (tenant_id, shopify_order_id, customer_id, order_number, 
                 email, total_price, subtotal_price, tax_amount, shipping_amount, financial_status, 
                 fulfillment_status, created_at, processed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [tenantId, order.shopify_order_id, order.customer_id, order.order_number, 
                 order.email, order.total_price, order.subtotal_price, order.tax_amount, 
                 order.shipping_amount, order.financial_status, order.fulfillment_status, 
                 order.created_at, order.processed_at]
            );
        }

        // Add comprehensive order line items for realistic product-order relationships
        const orderLineItems = [
            // Order 1: John's Premium Headphones
            { order_id: 1, product_id: 1, quantity: 1, price: 199.99, title: 'Premium Wireless Headphones' },
            
            // Order 2: John's Electronics Bundle
            { order_id: 2, product_id: 2, quantity: 1, price: 299.99, title: 'Smart Fitness Watch' },
            { order_id: 2, product_id: 3, quantity: 1, price: 89.99, title: 'Bluetooth Speaker' },
            
            // Order 3: Jane's Fashion Items
            { order_id: 3, product_id: 4, quantity: 2, price: 29.99, title: 'Organic Cotton T-Shirt' },
            { order_id: 3, product_id: 7, quantity: 1, price: 59.99, title: 'Ceramic Coffee Mug Set' },
            
            // Order 4: Jane's Designer Jacket
            { order_id: 4, product_id: 6, quantity: 1, price: 249.99, title: 'Leather Jacket' },
            
            // Order 5: Bob's Tech Bundle
            { order_id: 5, product_id: 1, quantity: 1, price: 199.99, title: 'Premium Wireless Headphones' },
            { order_id: 5, product_id: 2, quantity: 1, price: 299.99, title: 'Smart Fitness Watch' },
            { order_id: 5, product_id: 3, quantity: 1, price: 89.99, title: 'Bluetooth Speaker' },
            
            // Order 6: Bob's Speaker
            { order_id: 6, product_id: 3, quantity: 1, price: 89.99, title: 'Bluetooth Speaker' },
            
            // Order 7: Sarah's Fashion Start
            { order_id: 7, product_id: 4, quantity: 1, price: 29.99, title: 'Organic Cotton T-Shirt' },
            { order_id: 7, product_id: 5, quantity: 1, price: 69.99, title: 'Designer Jeans' },
            
            // Order 8: Mike's Fitness Gear
            { order_id: 8, product_id: 9, quantity: 1, price: 49.99, title: 'Yoga Mat Premium' },
            { order_id: 8, product_id: 10, quantity: 1, price: 24.99, title: 'Water Bottle Insulated' },
            
            // Order 9: Emily's Home Decor
            { order_id: 9, product_id: 7, quantity: 1, price: 39.99, title: 'Ceramic Coffee Mug Set' },
            { order_id: 9, product_id: 8, quantity: 1, price: 59.99, title: 'Scented Candle Collection' },
            
            // Order 10: John's Latest Watch
            { order_id: 10, product_id: 2, quantity: 1, price: 299.99, title: 'Smart Fitness Watch' }
        ];

        for (const lineItem of orderLineItems) {
            await this.run(
                `INSERT INTO order_line_items (tenant_id, order_id, product_id, quantity, price, title) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [tenantId, lineItem.order_id, lineItem.product_id, lineItem.quantity, 
                 lineItem.price, lineItem.title]
            );
        }

        // Add sample custom events for cart abandonment and checkout tracking
        const customEvents = [
            {
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
                event_type: 'product_view',
                customer_id: 1,
                event_data: JSON.stringify({
                    product_id: 'prod_002',
                    product_title: 'Smart Fitness Watch',
                    referrer: 'google.com'
                }),
                created_at: '2024-03-12 16:00:00'
            }
        ];

        for (const event of customEvents) {
            await this.run(
                `INSERT INTO custom_events (tenant_id, event_type, customer_id, event_data, created_at) 
                 VALUES (?, ?, ?, ?, ?)`,
                [tenantId, event.event_type, event.customer_id, event.event_data, event.created_at]
            );
        }

        console.log('✅ Comprehensive Shopify store data seeded successfully!');
        console.log('📊 Created:');
        console.log(`   • ${customers.length} customers with detailed profiles`);
        console.log(`   • ${products.length} products across multiple categories`);
        console.log(`   • ${orders.length} orders with realistic purchase patterns`);
        console.log(`   • ${orderLineItems.length} order line items`);
        console.log(`   • ${customEvents.length} custom tracking events`);
    }

    async run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ lastID: this.lastID, changes: this.changes });
                }
            });
        });
    }

    async get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    async all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err);
                } else {
                    console.log('Database connection closed');
                }
            });
        }
    }
}

module.exports = Database;
