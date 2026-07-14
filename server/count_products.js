const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');
const Category = require('./models/Category');

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const dbCategories = await Category.find({});
    for (const cat of dbCategories) {
      const count = await Product.countDocuments({ category: cat.name });
      console.log(`Category: "${cat.name}", Parent: "${cat.parent}", Direct Products count: ${count}`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.connection.close();
  }
}
run();
