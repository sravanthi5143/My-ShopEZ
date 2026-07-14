const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');
const Category = require('./models/Category');
const Cart = require('./models/Cart');
const Order = require('./models/Order');

dotenv.config();

async function run() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.\n');

    // 1. Audit Categories vs Products
    console.log('--- AUDITING CATEGORIES & PRODUCTS ---');
    const dbCategories = await Category.find({});
    console.log(`Categories in DB (${dbCategories.length}):`);
    dbCategories.forEach(c => console.log(`- name: "${c.name}", parent: "${c.parent}"`));

    const productCategories = await Product.distinct('category');
    console.log(`\nUnique categories used in Products collection (${productCategories.length}):`);
    productCategories.forEach(c => console.log(`- "${c}"`));

    // Check matches
    console.log('\nChecking if product categories exist in categories collection:');
    for (const pCat of productCategories) {
      const exists = dbCategories.some(c => c.name.toLowerCase() === pCat.toLowerCase());
      console.log(`- "${pCat}": ${exists ? 'MATCHED' : 'NOT FOUND IN CATEGORIES'}`);
    }

    // 2. Audit Carts
    console.log('\n--- AUDITING CARTS ---');
    const carts = await Cart.find({});
    console.log(`Total carts: ${carts.length}`);
    for (const cart of carts) {
      console.log(`Cart for User ID: ${cart.user}`);
      console.log(`Items count: ${cart.items.length}, Total Price: ${cart.totalPrice}`);
      for (const item of cart.items) {
        const prod = await Product.findById(item.product);
        console.log(`  - Product ID: ${item.product}, Qty: ${item.quantity}, Exists in DB: ${!!prod}`);
      }
    }

    // 3. Audit Orders
    console.log('\n--- AUDITING ORDERS ---');
    const orders = await Order.find({});
    console.log(`Total orders: ${orders.length}`);
    for (const order of orders) {
      console.log(`Order ID: ${order._id}`);
      console.log(`- User ID: ${order.user}`);
      console.log(`- Status: "${order.orderStatus}"`);
      console.log(`- Items count: ${order.orderItems.length}`);
      for (const item of order.orderItems) {
        const prod = await Product.findById(item.product);
        console.log(`  - Product ID: ${item.product}, Qty: ${item.quantity}, Exists in DB: ${!!prod}`);
      }
    }

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.connection.close();
    console.log('\nDisconnected.');
  }
}

run();
