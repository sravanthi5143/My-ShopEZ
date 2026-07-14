const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Product = require('../models/Product');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const mockDataPath = path.resolve(__dirname, '../../client/src/utils/mockData.js');
const fs = require('fs');

async function seedProducts() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to', process.env.MONGO_URI);

    let mockDataContent = fs.readFileSync(mockDataPath, 'utf8');
    const productsMatch = mockDataContent.match(/export const products = (\[[\s\S]*?\]);/);
    if (!productsMatch) {
      throw new Error('Could not parse products from mockData.js');
    }
    
    // Evaluate the products array string into a real JavaScript array
    const productsArray = eval(productsMatch[1]);
    console.log(`Found ${productsArray.length} realistic products in mockData.js`);

    console.log('Clearing existing products in the local database...');
    await Product.deleteMany({});
    
    console.log('Seeding new products...');
    await Product.insertMany(productsArray);

    console.log('✅ Successfully seeded all realistic products into the database!');

  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

seedProducts();
