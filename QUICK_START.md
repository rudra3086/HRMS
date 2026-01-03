# Quick Setup Guide - Dayflow HRMS

## ⚡ Quick Start (5 Minutes)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Setup Database

1. Open MySQL and create database:
```sql
CREATE DATABASE dayflow_hrms;
```

2. Import schema:
```bash
mysql -u root -p dayflow_hrms < database/schema.sql
```

### Step 3: Configure Environment

1. Copy environment file:
```bash
copy .env.example .env
```

2. Edit `.env` file:
```env
DB_PASSWORD=your_mysql_password
JWT_SECRET=change_this_to_random_string
```

### Step 4: Start Server
```bash
npm run dev
```

### Step 5: Access Application

Open browser: `http://localhost:3000`

**Default Admin Login:**
- Email: `admin@dayflow.com`
- Password: `Admin@123`

## 📝 First Steps After Login

### As Admin:
1. Change default password in profile settings
2. Create employee accounts via Sign Up
3. Set up payroll for employees
4. Configure leave balances

### As Employee:
1. Complete your profile information
2. Check-in for attendance
3. View your leave balance
4. Check payroll details

## 🔍 Testing the System

### Test Employee Account:
1. Go to Sign Up page
2. Create test employee:
   - Employee ID: `EMP002`
   - Email: `test@company.com`
   - Password: `Test@123`
   - First Name: `Test`
   - Last Name: `User`
   - Department: `IT`
   - Role: `employee`

3. Login and explore employee features

### Test Features:
- ✅ Check-in/Check-out
- ✅ Apply for leave
- ✅ View profile
- ✅ Check attendance history

### Admin Features:
- ✅ Approve leave requests
- ✅ View all employees
- ✅ Mark attendance
- ✅ Generate salary slips

## 🛠️ Useful Commands

```bash
# Install dependencies
npm install

# Run in development mode (auto-reload)
npm run dev

# Run in production mode
npm start

# Access MySQL
mysql -u root -p

# View database tables
USE dayflow_hrms;
SHOW TABLES;

# Check running Node processes
# Windows:
tasklist | findstr node

# Linux/Mac:
ps aux | grep node
```

## 🚨 Common Issues & Quick Fixes

### Database won't connect?
```bash
# Check MySQL is running
# Windows: services.msc → MySQL
# Linux: sudo systemctl status mysql
```

### Port 3000 in use?
```env
# Change in .env file
PORT=3001
```

### Forgot admin password?
```sql
-- Reset in MySQL
USE dayflow_hrms;
-- Password: Admin@123
UPDATE users SET password_hash = '$2a$10$rGZ6Z9Y9Y9Y9Y9Y9Y9Y9Y.9Y9Y9Y9Y9Y9Y9Y9Y9Y9Y9Y9Y9Y9Y9' WHERE email = 'admin@dayflow.com';
```

### Clear all data and restart?
```sql
DROP DATABASE dayflow_hrms;
CREATE DATABASE dayflow_hrms;
-- Then re-import schema.sql
```

## 📱 Access URLs

- **Frontend:** http://localhost:3000
- **API:** http://localhost:3000/api
- **Health Check:** http://localhost:3000/api/health

## 🎯 Next Steps

1. ✅ Setup complete
2. 📖 Read full README.md for detailed documentation
3. 🔧 Customize for your organization
4. 🚀 Deploy to production

## 📞 Need Help?

- Check README.md for detailed documentation
- Review API documentation section
- Check troubleshooting section

---

**Happy HR Management! 🎉**
