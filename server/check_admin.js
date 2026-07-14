const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

// Load environment variables
dotenv.config();

async function run() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Database connected successfully.');

    // Look for all users to see what accounts exist
    const allUsers = await User.find({}, 'name email role');
    console.log('Current users in database:', allUsers);

    // Look for the requested admin account
    const adminEmail = 'admin@shopezz.com';
    const adminUser = await User.findOne({ email: adminEmail });

    if (adminUser) {
      console.log('Admin user already exists:', {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        passwordHash: adminUser.password
      });
    } else {
      console.log('Admin user does not exist. Creating admin user...');
      const newAdmin = await User.create({
        name: 'Admin',
        email: adminEmail,
        password: 'Admin@123',
        role: 'admin'
      });
      console.log('Admin user created successfully:', {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
        passwordHash: newAdmin.password
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

run();
