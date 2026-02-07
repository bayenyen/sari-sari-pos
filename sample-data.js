// Sample Data Script
// Run this after starting the server to add sample products

const sampleProducts = [
  {
    barcode: "1234567890123",
    name: "Lucky Me Pancit Canton",
    category: "Instant Noodles",
    price: 15.00,
    stock: 100,
    lowStockThreshold: 20
  },
  {
    barcode: "2345678901234",
    name: "Skyflakes Crackers",
    category: "Snacks",
    price: 8.00,
    stock: 75,
    lowStockThreshold: 15
  },
  {
    barcode: "3456789012345",
    name: "Royal Softdrink 1.5L",
    category: "Beverages",
    price: 45.00,
    stock: 50,
    lowStockThreshold: 10
  },
  {
    barcode: "4567890123456",
    name: "Alaska Condensada",
    category: "Canned Goods",
    price: 35.00,
    stock: 60,
    lowStockThreshold: 15
  },
  {
    barcode: "5678901234567",
    name: "Century Tuna Flakes",
    category: "Canned Goods",
    price: 28.00,
    stock: 80,
    lowStockThreshold: 20
  },
  {
    barcode: "6789012345678",
    name: "Argentina Corned Beef",
    category: "Canned Goods",
    price: 42.00,
    stock: 55,
    lowStockThreshold: 15
  },
  {
    barcode: "7890123456789",
    name: "Tide Detergent Powder 50g",
    category: "Household",
    price: 12.00,
    stock: 90,
    lowStockThreshold: 25
  },
  {
    barcode: "8901234567890",
    name: "Milo Powder 33g",
    category: "Beverages",
    price: 10.00,
    stock: 120,
    lowStockThreshold: 30
  },
  {
    barcode: "9012345678901",
    name: "Bear Brand 33ml",
    category: "Beverages",
    price: 13.00,
    stock: 100,
    lowStockThreshold: 25
  },
  {
    barcode: "0123456789012",
    name: "Lucky Me Instant Mami",
    category: "Instant Noodles",
    price: 14.00,
    stock: 85,
    lowStockThreshold: 20
  },
  {
    barcode: "1111111111111",
    name: "Chippy BBQ",
    category: "Snacks",
    price: 7.00,
    stock: 95,
    lowStockThreshold: 20
  },
  {
    barcode: "2222222222222",
    name: "Nova Chips",
    category: "Snacks",
    price: 7.00,
    stock: 90,
    lowStockThreshold: 20
  },
  {
    barcode: "3333333333333",
    name: "Coca-Cola 1L",
    category: "Beverages",
    price: 50.00,
    stock: 40,
    lowStockThreshold: 10
  },
  {
    barcode: "4444444444444",
    name: "C2 Green Tea",
    category: "Beverages",
    price: 25.00,
    stock: 70,
    lowStockThreshold: 15
  },
  {
    barcode: "5555555555555",
    name: "Joy Dishwashing Liquid 40ml",
    category: "Household",
    price: 8.00,
    stock: 65,
    lowStockThreshold: 15
  }
];

// Instructions to add sample data:
// 1. Login as admin (username: admin, password: admin123)
// 2. Go to Products tab
// 3. Click "Add Product" for each item
// 4. Or use the API directly:

/*
For developers - API endpoint to add sample data:

POST http://localhost:5000/api/products
Headers: {
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_TOKEN_HERE"
}
Body: (one product at a time from the array above)

Or copy this code into browser console after logging in:

const token = localStorage.getItem('token');
const API_URL = window.location.origin + '/api';

async function addSampleData() {
  const products = [paste sampleProducts array here];
  
  for (const product of products) {
    try {
      const response = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(product)
      });
      
      if (response.ok) {
        console.log(`✅ Added: ${product.name}`);
      } else {
        console.log(`❌ Failed: ${product.name}`);
      }
    } catch (error) {
      console.error(`Error adding ${product.name}:`, error);
    }
  }
  
  console.log('Sample data import complete!');
}

addSampleData();
*/

module.exports = sampleProducts;
