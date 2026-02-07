# 🏪 Sari-Sari Store POS System

<!-- node scripts/reset-all-records.js -->


A modern, full-featured Point of Sale system designed specifically for sari-sari stores in the Philippines.

## ✨ Features

### 👥 Three User Roles
- **ADMIN** - Full system control, inventory management, user management, and reports
- **CASHIER** - POS checkout, barcode scanning, transaction processing
- **CUSTOMER** - View balance and purchase history

### 📦 Inventory Management
- Add, edit, and delete products
- Barcode support for quick scanning
- Real-time stock updates
- Low stock alerts
- Category organization

### 💳 Point of Sale
- Fast barcode scanning
- Manual product search
- Cart management
- Cash and credit payment methods
- Automatic change calculation
- Transaction history

### 📊 Reports & Analytics
- Daily and monthly sales reports
- Top-selling products
- Revenue tracking
- Transaction history

## 🚀 Quick Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud - MongoDB Atlas)

### Installation Steps

1. **Extract the ZIP file**
   ```bash
   unzip sari-sari-pos.zip
   cd sari-sari-pos
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure MongoDB**
   - Copy `.env.example` to `.env`
   ```bash
   cp .env.example .env
   ```
   
   - Edit `.env` and add your MongoDB connection URL:
   ```
   MONGODB_URI=your_mongodb_connection_url_here
   ```

   **Getting MongoDB URL:**
   - **Local MongoDB:** `mongodb://localhost:27017/sari-sari-pos`
   - **MongoDB Atlas (Free Cloud):**
     1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
     2. Sign up for free
     3. Create a cluster
     4. Click "Connect" → "Connect your application"
     5. Copy the connection string
     6. Replace `<password>` with your database password

4. **Start the Server**
   ```bash
   npm start
   ```

5. **Access the System**
   Open your browser and go to: `http://localhost:5000`

## 🔐 Default Login Credentials

**Admin Account:**
- Username: `admin`
- Password: `admin123`

⚠️ **Important:** Change the default admin password immediately after first login!

## 📱 User Guide

### For Admins

1. **Dashboard** - View sales statistics and low stock alerts
2. **Products** - Manage inventory
   - Click "Add Product" to create new products
   - Enter barcode, name, price, stock, and category
   - Edit or delete existing products
3. **Users** - Manage cashiers and customers
   - Create cashier accounts for employees
   - Create customer accounts with store credit
   - Activate/deactivate users
4. **Reports** - View daily and monthly sales data

### For Cashiers

1. **Barcode Scanning**
   - Click on the barcode input field
   - Scan product barcode with scanner
   - Product automatically adds to cart

2. **Manual Entry**
   - Use the search box to find products
   - Click on product to add to cart

3. **Processing Sales**
   - Review cart items
   - Click "Checkout"
   - Enter amount paid
   - System calculates change
   - Complete sale

### For Customers

- View current store credit balance
- Check purchase history
- Monitor transactions

## 🔧 Configuration

### Environment Variables

Edit the `.env` file:

```env
# MongoDB Connection
MONGODB_URI=your_mongodb_url

# Server Port
PORT=5000

# Security (change this!)
JWT_SECRET=your-random-secret-key

# Default Admin
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=admin123
```

### Barcode Scanner Setup

The system supports standard USB barcode scanners that work as keyboard input devices:

1. Connect your barcode scanner to your computer
2. Open the POS system
3. Click on the barcode input field
4. Scan products - they will automatically be added to cart

**Compatible Scanners:**
- Most USB barcode scanners
- Wireless barcode scanners
- Smartphone barcode scanner apps (with keyboard input mode)

## 📊 Database Structure

### Collections
- **users** - Admin, cashier, and customer accounts
- **products** - Inventory items with barcodes
- **transactions** - Sales records

## 🛠️ Troubleshooting

### MongoDB Connection Issues
```
Error: MongoDB Connection Error
```
**Solution:** 
- Check your MongoDB URL in `.env`
- Ensure MongoDB is running (if using local)
- Check network connectivity (if using cloud)
- Whitelist your IP in MongoDB Atlas

### Port Already in Use
```
Error: Port 5000 is already in use
```
**Solution:** 
- Change the PORT in `.env` to another number (e.g., 3000)
- Or stop the other application using port 5000

### Products Not Scanning
**Solution:**
- Ensure barcode scanner is properly connected
- Click on the barcode input field first
- Test scanner in a text editor to verify it works
- Check that product barcode exists in inventory

## 🔒 Security Recommendations

1. **Change Default Credentials**
   - Immediately change admin password
   - Use strong passwords

2. **Secure Your MongoDB**
   - Enable authentication
   - Use strong database passwords
   - Whitelist only necessary IP addresses

3. **Use HTTPS in Production**
   - Set up SSL/TLS certificates
   - Never run in production without HTTPS

4. **Regular Backups**
   - Backup your MongoDB database regularly
   - Store backups securely

## 📁 Project Structure

```
sari-sari-pos/
├── models/           # Database schemas
│   ├── User.js
│   ├── Product.js
│   └── Transaction.js
├── routes/           # API endpoints
│   ├── auth.js
│   ├── users.js
│   ├── products.js
│   └── transactions.js
├── middleware/       # Authentication middleware
│   └── auth.js
├── public/           # Frontend files
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   └── js/
│       └── app.js
├── .env.example      # Environment template
├── server.js         # Main server file
└── package.json      # Dependencies
```

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the MongoDB connection setup
3. Ensure all dependencies are installed
4. Check that Node.js version is 14 or higher

## 📝 License

MIT License - Free to use and modify

## 🎯 Features Roadmap

- [ ] Receipt printing
- [ ] Multi-store support
- [ ] Advanced reporting
- [ ] Product images
- [ ] Discount system
- [ ] Loyalty program
- [ ] SMS notifications

---

**Made for Filipino Sari-Sari Stores with ❤️**
