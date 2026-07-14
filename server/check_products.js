const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');

dotenv.config();

async function run() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    const count = await Product.countDocuments({});
    console.log(`Total products in database: ${count}`);

    const products = await Product.find({}).limit(10);
    console.log('Sample Products:');
    products.forEach(p => {
      console.log(`- ID: ${p._id}, Name: ${p.name}, Price: ${p.price}, Category: ${p.category}, Tag: ${p.tag}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected.');
  }
}
run();
