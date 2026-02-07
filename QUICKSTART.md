# ⚡ Quick Start Guide

## Setup in 3 Simple Steps

### Step 1: Install Dependencies
Open terminal/command prompt in the project folder and run:
```bash
npm install
```

### Step 2: Configure MongoDB
1. Rename `.env.example` to `.env`
2. Open `.env` file in a text editor
3. Replace the MongoDB URL with yours:

**Option A: Local MongoDB**
```
MONGODB_URI=mongodb://localhost:27017/sari-sari-pos
```

**Option B: MongoDB Atlas (Free Cloud)**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sari-sari-pos
```

Get MongoDB Atlas URL:
- Visit: https://www.mongodb.com/cloud/atlas
- Sign up for free
- Create a cluster
- Click "Connect" → "Connect your application"
- Copy the connection string

### Step 3: Start the System
```bash
npm start
```

Visit: http://localhost:5000

## First Login

**Username:** admin  
**Password:** admin123

## Next Steps

1. Change admin password in settings
2. Add products with barcodes
3. Create cashier accounts
4. Start selling!

## Need Help?

Check the main README.md file for detailed instructions and troubleshooting.
