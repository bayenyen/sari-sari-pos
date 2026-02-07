# 🆕 NEW FEATURES ADDED

## Version 2.0 - Enhanced Features

### 1. 💳 Customer Debt/Credit System (UTANG)

**What it does:**
- Customers can now buy on credit when they don't have cash
- Track customer debts automatically
- Set credit limits per customer

**How it works:**

#### For Cashiers (POS):
1. When checking out, select the customer from dropdown
2. Choose payment method:
   - **CASH** - Full payment in cash
   - **DEBT (Utang)** - Add full amount to customer's debt
   - **PARTIAL** - Customer pays some cash, rest goes to debt
3. System automatically checks if customer's credit limit allows the purchase
4. Debt is tracked on customer's account

#### For Admins:
- New **💳 Debts** tab shows all customers with outstanding debt
- View total debt amount across all customers
- Record debt payments when customers pay
- Set individual credit limits per customer (default: ₱1,000)

**Example Scenarios:**
```
Customer wants to buy ₱150 worth of goods but has no cash:
- Cashier selects customer
- Chooses "Full Debt (Utang)"
- ₱150 added to customer's debt
- Customer can pay later

Customer has ₱50 but needs ₱150 worth of goods:
- Cashier selects customer  
- Chooses "Partial Payment"
- Enters ₱50 as amount paid
- Remaining ₱100 added to debt
```

### 2. 📦 Product Restock History

**What it does:**
- Track when products are restocked
- Record cost per unit and total cost
- Track suppliers
- View complete restock history per product

**How to use:**
1. Go to **Products** tab
2. Click **📦** (restock button) on any product
3. Enter:
   - Quantity to add
   - Cost per unit (how much you paid)
   - Supplier name (optional)
   - Notes (optional)
4. System automatically:
   - Updates stock level
   - Saves restock record
   - Calculates total cost

**Benefits:**
- Know how much you spent restocking
- Track which suppliers you use
- Monitor restocking patterns
- Calculate profit margins

### 3. 📋 Product Purchase History

**What it does:**
- See who bought each product
- Track purchase patterns
- Monitor product popularity

**How to use:**
1. Go to **Products** tab
2. Click **📋** (purchase history button)
3. View complete list showing:
   - Customer name
   - Date purchased
   - Quantity bought
   - Price at time of purchase
   - Which cashier processed it

**Benefits:**
- Identify your best-selling products
- See which customers buy what
- Track seasonal patterns
- Better inventory planning

### 4. 📊 Restock History View

**What it does:**
- View all restocking events for a product
- See total money spent on restocking
- Track average cost per unit over time

**How to use:**
1. Go to **Products** tab
2. Click **📊** (restock history button)
3. View:
   - All restock events
   - Dates and quantities
   - Costs and suppliers
   - Total investment in that product

### 5. 👤 Customer Purchase History

**What it does:**
- View all purchases by a specific customer
- See customer's total spending
- Track their debt/credit status

**How to use:**
1. Go to **Users** tab or **Debts** tab
2. Click **📋 History** button next to customer
3. View:
   - All their transactions
   - Total amount spent
   - Current debt/credit balance
   - Credit limit

## NEW ADMIN FEATURES

### Debts Management Tab
- View all customers with debt
- See total outstanding debt amount
- Pay/record debt payments
- Monitor credit limits

### Enhanced User Management
- Set credit limits per customer
- Track balance (positive = credit, negative = debt)
- View customer purchase history from user list

### Product Management Enhancements
- Quick restock buttons
- View purchase and restock history
- Better tracking of inventory costs

## UPDATED CASHIER POS

### Customer Selection
- Dropdown showing all customers
- Shows current debt next to customer name
- Easy selection for debt transactions

### Payment Options
1. **CASH** - Traditional cash payment
2. **FULL DEBT** - Everything goes to customer's debt
3. **PARTIAL** - Mix of cash and debt

### Debt Warnings
- Shows customer's current balance
- Displays credit limit
- Warns if purchase would exceed limit
- Shows new debt amount before completing

## DATABASE CHANGES

### User Model
- Added `creditLimit` field (default: 1000)
- Balance can now be negative (debt)

### Product Model
- Added `restockHistory` array
- Tracks all restock events with costs

### Transaction Model
- Updated payment methods: CASH, DEBT, PARTIAL
- Better customer tracking

## HOW TO USE NEW FEATURES

### Setting Up Customers for Debt:

1. **Create Customer Account:**
   - Admin → Users → Add User
   - Role: Customer
   - Set Credit Limit (e.g., ₱1,000)
   - Save

2. **Customer Buys on Credit:**
   - Cashier scans products
   - Click Checkout
   - Select customer from dropdown
   - Choose "Full Debt (Utang)" or "Partial Payment"
   - Complete sale

3. **Customer Pays Debt:**
   - Admin → Debts tab
   - Find customer
   - Click "💰 Pay" button
   - Enter amount paid
   - Record payment

4. **Track Everything:**
   - View customer history
   - Monitor total debts
   - Check product sales patterns
   - Analyze restock costs

## BENEFITS OF NEW FEATURES

✅ **No lost sales** - Customers can buy even without cash
✅ **Better tracking** - Know exactly who owes what
✅ **Cost monitoring** - Track how much you spend restocking
✅ **Customer insights** - See buying patterns
✅ **Profit analysis** - Compare selling price vs restock cost
✅ **Credit control** - Set limits to manage risk

## IMPORTANT NOTES

⚠️ **Credit Limits:**
- Default is ₱1,000 per customer
- Adjust based on trust level
- System blocks purchases that exceed limit

⚠️ **Debt Tracking:**
- Negative balance = customer owes you
- Positive balance = customer has store credit
- Zero = all settled

⚠️ **History:**
- All restock and purchase history is permanent
- Use for analysis and record-keeping
- Cannot be deleted (for accuracy)

---

**Everything else from the original system remains the same!**
- Barcode scanning
- Inventory management  
- Transaction reports
- User roles and permissions
