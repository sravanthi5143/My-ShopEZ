const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');

let mongoServer;

const seedAdminUser = async () => {
  try {
    const adminEmail = 'admin@shopezz.com';
    const adminExists = await User.findOne({ email: adminEmail });
    if (!adminExists) {
      console.log('No default admin account found. Automatically creating default admin account...');
      await User.create({
        name: 'Admin',
        email: adminEmail,
        password: 'Admin@123',
        role: 'admin',
      });
      console.log('Default admin account created successfully.');
    } else {
      console.log('Default admin account already exists in database.');
    }

    const customerEmail = 'user@shopezz.com';
    const customerExists = await User.findOne({ email: customerEmail });
    if (!customerExists) {
      console.log('No default customer account found. Automatically creating default customer account...');
      await User.create({
        name: 'User',
        email: customerEmail,
        password: 'User@123',
        role: 'customer',
      });
      console.log('Default customer account created successfully.');
    } else {
      console.log('Default customer account already exists in database.');
    }
  } catch (error) {
    console.error(`Error automatically seeding users: ${error.message}`);
  }
};

const seedDefaultCategories = async () => {
  try {
    const count = await Category.countDocuments({});
    if (count <= 1) {
      console.log('No categories or partial categories found. Seeding default categories in MongoDB...');

      const defaultCategories = [
        {
          name: 'Electronics',
          parent: null,
          icon: 'FaLaptop',
          image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&auto=format&fit=crop&q=60',
        },
        {
          name: 'Mobiles',
          parent: 'Electronics',
          icon: 'FaMobileAlt',
          image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&auto=format&fit=crop&q=60',
        },
        {
          name: 'Laptops',
          parent: 'Electronics',
          icon: 'FaLaptop',
          image: 'https://images.unsplash.com/photo-1496181130204-7552cc14f1d0?w=500&auto=format&fit=crop&q=60',
        },
        {
          name: "Men's Fashion",
          parent: null,
          icon: 'FaTshirt',
          image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=500&auto=format&fit=crop&q=60',
        },
        {
          name: "Women's Fashion",
          parent: null,
          icon: 'FaTshirt',
          image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&auto=format&fit=crop&q=60',
        },
        {
          name: 'Footwear',
          parent: null,
          icon: 'FaRunning',
          image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=60',
        },
        {
          name: 'Watches',
          parent: null,
          icon: 'FaClock',
          image: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=500&auto=format&fit=crop&q=60',
        },
        {
          name: 'Home & Kitchen',
          parent: null,
          icon: 'FaCouch',
          image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500&auto=format&fit=crop&q=60',
        },
        {
          name: 'Beauty',
          parent: null,
          icon: 'FaGem',
          image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&auto=format&fit=crop&q=60',
        },
        {
          name: 'Sports',
          parent: null,
          icon: 'FaRunning',
          image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=500&auto=format&fit=crop&q=60',
        },
        {
          name: 'Accessories',
          parent: null,
          icon: 'FaShoppingBag',
          image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&auto=format&fit=crop&q=60',
        }
      ];

      await Category.deleteMany({});
      await Category.create(defaultCategories);
      console.log('Default categories seeded successfully.');
    } else {
      console.log('Categories already seeded in database.');
    }
  } catch (error) {
    console.error(`Error automatically seeding categories: ${error.message}`);
  }
};

const seedProducts = async () => {
  try {
    const existingCount = await Product.countDocuments({});
    if (existingCount > 0) {
      console.log(`Products already exist in the database (${existingCount} found).`);
      return;
    }

    const mockDataPath = path.resolve(__dirname, '../../client/src/utils/mockData.js');
    const mockDataContent = fs.readFileSync(mockDataPath, 'utf8');
    const productsMatch = mockDataContent.match(/export const products = (\[[\s\S]*?\]);/);

    if (!productsMatch) {
      throw new Error('Could not parse products from mockData.js');
    }

    const productsArray = eval(productsMatch[1]);
    await Product.deleteMany({});
    await Product.insertMany(productsArray);
    console.log(`Seeded ${productsArray.length} products successfully.`);
  } catch (error) {
    console.error(`Error automatically seeding products: ${error.message}`);
  }
};

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.warn('MONGO_URI is not set. Starting an embedded MongoDB instance...');
      mongoServer = await MongoMemoryServer.create();
      process.env.MONGO_URI = mongoServer.getUri();
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');
    await seedAdminUser();
    await seedDefaultCategories();
    await seedProducts();
  } catch (error) {
    if (!mongoServer && /ECONNREFUSED|ENOTFOUND|connect/i.test(error.message)) {
      try {
        console.warn(`Falling back to an embedded MongoDB instance because: ${error.message}`);
        mongoServer = await MongoMemoryServer.create();
        process.env.MONGO_URI = mongoServer.getUri();
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected via embedded instance');
        await seedAdminUser();
        await seedDefaultCategories();
        await seedProducts();
      } catch (fallbackError) {
        console.error(`Embedded MongoDB Connection Error: ${fallbackError.message}`);
      }
    } else {
      console.error(`MongoDB Connection Error: ${error.message}`);
    }
  }
};

module.exports = connectDB;
