const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Product = require('../models/Product');
const connectDB = require('../config/db');
require('dotenv').config();

const seedUsers = [
  {
    name: 'Admin User',
    email: 'admin@shopez.com',
    password: 'admin123',
    role: 'admin',
    isActive: true,
  },
  {
    name: 'Seller User',
    email: 'seller@shopez.com',
    password: 'seller123',
    role: 'seller',
    isActive: true,
  },
  {
    name: 'Regular User',
    email: 'user@shopez.com',
    password: 'password123',
    role: 'user',
    isActive: true,
  },
];

const seedProducts = [
  {
    name: 'Wireless Bluetooth Headphones',
    description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life.',
    price: 99.99,
    category: 'Electronics',
    brand: 'AudioTech',
    countInStock: 50,
    images: ['https://via.placeholder.com/300x300?text=Headphones'],
    seller: null, // Will be set after user creation
    isFeatured: true,
  },
  {
    name: 'Smartphone Case',
    description: 'Protective case for smartphones with anti-slip grip and card holder.',
    price: 19.99,
    category: 'Accessories',
    brand: 'CasePro',
    countInStock: 100,
    images: ['https://via.placeholder.com/300x300?text=Phone+Case'],
    seller: null,
    isFeatured: true,
  },
];

const importData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany();
    await Product.deleteMany();

    // Create users (hashed passwords)
    const usersWithHashedPasswords = await Promise.all(
      seedUsers.map(async (user) => ({
        ...user,
        password: await bcrypt.hash(user.password, 10),
      }))
    );

    const createdUsers = await User.insertMany(usersWithHashedPasswords);
    console.log('Users imported successfully');

    // Set seller for products
    const seller = createdUsers.find(user => user.role === 'seller');
    seedProducts.forEach(product => {
      product.seller = seller._id;
    });

    // Create products
    await Product.insertMany(seedProducts);
    console.log('Products imported successfully');

    console.log('Data Import Success!');
    process.exit();
  } catch (error) {
    console.error('Data Import Error:', error);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await connectDB();

    await User.deleteMany();
    await Product.deleteMany();

    console.log('Data Destroyed!');
    process.exit();
  } catch (error) {
    console.error('Data Destroy Error:', error);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}