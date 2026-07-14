const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const gis = require('g-i-s');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
const Product = require('../models/Product');

const mockDataPath = path.resolve(__dirname, '../../client/src/utils/mockData.js');

function searchImage(query) {
  return new Promise((resolve, reject) => {
    gis(query + ' official product high resolution white background', (error, results) => {
      if (error) {
        reject(error);
      } else if (results && results.length > 0) {
        // Filter for secure URLs and avoid problematic domains if necessary
        const validImages = results.filter(r => r.url.startsWith('https://') && !r.url.includes('placehold'));
        if (validImages.length > 0) {
          resolve(validImages[0].url);
        } else {
          resolve(results[0].url);
        }
      } else {
        resolve(null);
      }
    });
  });
}

async function run() {
  try {
    console.log('Connecting to Local Database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Database Connected.');

    console.log('Reading mockData.js...');
    let mockDataContent = fs.readFileSync(mockDataPath, 'utf8');
    
    // Extract products array using regex
    const productsMatch = mockDataContent.match(/export const products = (\[[\s\S]*?\]);/);
    if (!productsMatch) {
      throw new Error('Could not parse products from mockData.js');
    }
    
    const products = eval(productsMatch[1]);
    console.log(`Found ${products.length} products to update.`);

    let updatedCount = 0;

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      console.log(`[${i+1}/${products.length}] Fetching image for: ${product.name}...`);
      
      try {
        const imageUrl = await searchImage(product.name);
        if (imageUrl) {
          console.log(`  -> Found: ${imageUrl}`);
          
          // 1. Update in the array
          product.image = imageUrl;
          
          // 2. Update in MongoDB
          await Product.updateOne(
            { name: product.name },
            { $set: product },
            { upsert: true }
          );
          
          updatedCount++;
        } else {
          console.log(`  -> No image found.`);
        }
      } catch (err) {
        console.error(`  -> Error fetching image: ${err.message}`);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(res => setTimeout(res, 1000));
    }

    // Rewrite mockData.js
    console.log('Saving updated images to mockData.js...');
    const newProductsString = JSON.stringify(products, null, 2).replace(/"([^"]+)":/g, '$1:');
    mockDataContent = mockDataContent.replace(/export const products = \[[\s\S]*?\];/, `export const products = ${newProductsString};`);
    fs.writeFileSync(mockDataPath, mockDataContent, 'utf8');

    console.log(`Successfully updated ${updatedCount} product images in Database and mockData.js!`);
    
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected.');
  }
}

run();
