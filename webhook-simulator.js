#!/usr/bin/env node

/**
 * Shopify Webhook Simulator
 * Simulates real Shopify webhook events for testing the analytics system
 */

const axios = require('axios');
const crypto = require('crypto');

const BASE_URL = 'http://localhost:5000';
const WEBHOOK_SECRET = 'your_webhook_secret_here';

// Sample webhook payloads based on Shopify's actual webhook structure
const webhookPayloads = {
  customer_create: {
    id: 7,
    email: 'test.customer@example.com',
    first_name: 'Test',
    last_name: 'Customer',
    phone: '+1-555-0199',
    total_spent: '0.00',
    orders_count: 0,
    state: 'enabled',
    tags: 'TestCustomer,Simulation',
    accepts_marketing: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  order_create: {
    id: 11,
    order_number: '1011',
    email: 'test.customer@example.com',
    total_price: '149.99',
    subtotal_price: '149.99',
    total_tax: '0.00',
    currency: 'USD',
    financial_status: 'paid',
    fulfillment_status: null,
    customer: {
      id: 7,
      email: 'test.customer@example.com',
      first_name: 'Test',
      last_name: 'Customer'
    },
    line_items: [
      {
        id: 1,
        product_id: 5,
        title: 'Designer Jeans',
        quantity: 1,
        price: '89.99'
      },
      {
        id: 2,
        product_id: 7,
        title: 'Ceramic Coffee Mug Set',
        quantity: 1,
        price: '39.99'
      }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    processed_at: new Date().toISOString()
  },

  product_create: {
    id: 11,
    title: 'Wireless Gaming Mouse',
    handle: 'wireless-gaming-mouse',
    vendor: 'GameTech',
    product_type: 'Electronics',
    status: 'active',
    tags: 'gaming,wireless,mouse',
    variants: [
      {
        id: 1,
        price: '79.99',
        compare_at_price: '99.99',
        inventory_quantity: 50
      }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  cart_abandonment: {
    cart_token: 'simulation_cart_123',
    abandoned_checkout_url: 'https://xenoanalytics-demo.myshopify.com/cart/simulation_cart_123',
    email: 'test.customer@example.com',
    customer: {
      id: 7,
      email: 'test.customer@example.com',
      first_name: 'Test',
      last_name: 'Customer'
    },
    line_items: [
      {
        product_id: 2,
        title: 'Smart Fitness Watch',
        quantity: 1,
        price: '299.99'
      }
    ],
    total_price: '299.99',
    created_at: new Date().toISOString()
  },

  checkout_started: {
    checkout_token: 'simulation_checkout_456',
    email: 'test.customer@example.com',
    customer: {
      id: 7,
      email: 'test.customer@example.com',
      first_name: 'Test',
      last_name: 'Customer'
    },
    line_items: [
      {
        product_id: 9,
        title: 'Yoga Mat Premium',
        quantity: 2,
        price: '49.99'
      }
    ],
    total_price: '99.98',
    created_at: new Date().toISOString()
  }
};

// Generate HMAC signature for webhook verification
function generateSignature(payload, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  return hmac.digest('base64');
}

// Send webhook to the server
async function sendWebhook(eventType, payload, tenantDomain = 'xenoanalytics-demo.myshopify.com') {
  try {
    const signature = generateSignature(payload, WEBHOOK_SECRET);
    
    const response = await axios.post(`${BASE_URL}/api/webhooks/${eventType}`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Topic': eventType.replace('_', '/'),
        'X-Shopify-Shop-Domain': tenantDomain,
        'X-Shopify-Hmac-Sha256': signature,
        'User-Agent': 'Shopify Webhook Simulator'
      }
    });

    console.log(`✅ ${eventType} webhook sent successfully`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to send ${eventType} webhook:`);
    console.error(`   Error: ${error.message}`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return null;
  }
}

// Simulate a complete customer journey
async function simulateCustomerJourney() {
  console.log('\n🎬 Starting Customer Journey Simulation...\n');

  // Step 1: New customer registration
  console.log('📝 Step 1: Customer Registration');
  await sendWebhook('customers/create', webhookPayloads.customer_create);
  await delay(2000);

  // Step 2: Product browsing (cart abandonment)
  console.log('\n🛒 Step 2: Cart Abandonment');
  await sendWebhook('carts/create', webhookPayloads.cart_abandonment);
  await delay(2000);

  // Step 3: Return and start checkout
  console.log('\n💳 Step 3: Checkout Started');
  await sendWebhook('checkouts/create', webhookPayloads.checkout_started);
  await delay(2000);

  // Step 4: Complete purchase
  console.log('\n🎉 Step 4: Order Completion');
  await sendWebhook('orders/create', webhookPayloads.order_create);
  await delay(1000);

  console.log('\n✨ Customer Journey Simulation Complete!\n');
}

// Simulate new product addition
async function simulateProductAddition() {
  console.log('\n📦 Simulating New Product Addition...\n');
  await sendWebhook('products/create', webhookPayloads.product_create);
  console.log('\n✨ Product Addition Simulation Complete!\n');
}

// Utility function for delays
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log('🚀 Shopify Webhook Simulator');
  console.log('============================');

  switch (command) {
    case 'customer':
      await sendWebhook('customers/create', webhookPayloads.customer_create);
      break;
    
    case 'order':
      await sendWebhook('orders/create', webhookPayloads.order_create);
      break;
    
    case 'product':
      await sendWebhook('products/create', webhookPayloads.product_create);
      break;
    
    case 'cart-abandon':
      await sendWebhook('carts/create', webhookPayloads.cart_abandonment);
      break;
    
    case 'checkout':
      await sendWebhook('checkouts/create', webhookPayloads.checkout_started);
      break;
    
    case 'journey':
      await simulateCustomerJourney();
      break;
    
    case 'product-add':
      await simulateProductAddition();
      break;
    
    case 'all':
      console.log('\n🎯 Running All Webhook Simulations...\n');
      await simulateCustomerJourney();
      await delay(3000);
      await simulateProductAddition();
      break;
    
    default:
      console.log('\nUsage: node webhook-simulator.js <command>');
      console.log('\nAvailable commands:');
      console.log('  customer      - Simulate customer creation');
      console.log('  order         - Simulate order creation');
      console.log('  product       - Simulate product creation');
      console.log('  cart-abandon  - Simulate cart abandonment');
      console.log('  checkout      - Simulate checkout started');
      console.log('  journey       - Simulate complete customer journey');
      console.log('  product-add   - Simulate new product addition');
      console.log('  all           - Run all simulations');
      console.log('\nExamples:');
      console.log('  node webhook-simulator.js journey');
      console.log('  node webhook-simulator.js customer');
      console.log('  node webhook-simulator.js all');
      break;
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error.message);
  process.exit(1);
});

// Run the simulator
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  sendWebhook,
  simulateCustomerJourney,
  simulateProductAddition,
  webhookPayloads
};
