const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

async function run() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Database connected successfully.');

    const adminEmail = 'admin@shopezz.com';
    let adminUser = await User.findOne({ email: adminEmail });

    if (adminUser) {
      console.log('Found existing admin user. Updating password to "Admin@123" and name to "Admin"...');
      adminUser.name = 'Admin';
      adminUser.password = 'Admin@123';
      adminUser.role = 'admin';
      await adminUser.save();
      console.log('Admin user updated successfully.');
    } else {
      console.log('Admin user not found. Creating a new one...');
      const newAdmin = await User.create({
        name: 'Admin',
        email: adminEmail,
        password: 'Admin@123',
        role: 'admin'
      });
      console.log('Admin user created successfully.');
    }

    // Double check password match
    adminUser = await User.findOne({ email: adminEmail });
    const isMatch = await adminUser.matchPassword('Admin@123');
    console.log('Verification: Does the updated password match "Admin@123"?', isMatch);

  } catch (error) {
    console.error('Error updating admin user:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

run();
