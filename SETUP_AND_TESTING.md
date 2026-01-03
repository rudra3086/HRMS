# Complete Setup and Testing Guide

## 🚀 COMPLETE SETUP PROCESS

### Prerequisites Check
✅ Node.js installed (v14+)
✅ MySQL installed (v8.0+)
✅ npm installed
✅ Text editor (VS Code recommended)
✅ Web browser (Chrome/Firefox/Edge)

---

## 📝 STEP-BY-STEP INSTALLATION

### 1️⃣ Install Dependencies (2 minutes)

Open PowerShell in project directory:
```powershell
cd d:\Projects\Odoo
npm install
```

**Expected output:**
```
added 150 packages in 45s
```

**If you see errors:**
```powershell
# Clear npm cache and retry
npm cache clean --force
npm install
```

---

### 2️⃣ Setup MySQL Database (3 minutes)

**Option A: Using MySQL Workbench (Recommended)**

1. Open MySQL Workbench
2. Connect to your local MySQL server
3. Click "File" → "Open SQL Script"
4. Navigate to `d:\Projects\Odoo\database\schema.sql`
5. Click Execute (⚡ icon or Ctrl+Shift+Enter)
6. Refresh schemas - you should see `dayflow_hrms`

**Option B: Using MySQL Command Line**

```powershell
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE dayflow_hrms;

# Exit MySQL
exit

# Import schema
mysql -u root -p dayflow_hrms < database/schema.sql
```

**Verify database creation:**
```sql
USE dayflow_hrms;
SHOW TABLES;
-- Should show 9 tables
```

---

### 3️⃣ Configure Environment (1 minute)

The `.env` file is already created. Just update it:

1. Open `.env` file in text editor
2. Update `DB_PASSWORD` with your MySQL root password
3. Save the file

**Example .env:**
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=YourMySQLPassword  ← UPDATE THIS
DB_NAME=dayflow_hrms
DB_PORT=3306

PORT=3000
NODE_ENV=development

JWT_SECRET=dayflow_hrms_secret_key_change_this_in_production_12345
JWT_EXPIRES_IN=24h
```

---

### 4️⃣ Start the Server (1 minute)

```powershell
npm run dev
```

**Expected output:**
```
[nodemon] starting `node backend/server.js`
✓ Database connected successfully

🚀 Dayflow HRMS Server running on port 3000
📱 Frontend: http://localhost:3000
🔌 API: http://localhost:3000/api
📊 Environment: development
```

**If you see errors:**

**Error: "Port 3000 already in use"**
```powershell
# Find and kill the process
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

# Or change port in .env
PORT=3001
```

**Error: "Database connection failed"**
- Check MySQL is running
- Verify DB_PASSWORD in .env
- Ensure database exists

---

### 5️⃣ Access the Application (30 seconds)

1. Open browser
2. Go to: `http://localhost:3000`
3. You should see the Dayflow landing page

---

## 🧪 COMPLETE TESTING GUIDE

### Test 1: Admin Login (2 minutes)

1. Click "Sign In"
2. Enter credentials:
   - Email: `admin@dayflow.com`
   - Password: `Admin@123`
3. Click "Sign In"

**✅ Expected:** Redirect to Admin Dashboard

**❌ If fails:** Check database was imported correctly

---

### Test 2: Create Employee Account (3 minutes)

1. From Admin Dashboard, click "Logout"
2. Go to Sign Up page
3. Fill in the form:
   ```
   First Name: John
   Last Name: Doe
   Employee ID: EMP002
   Email: john.doe@company.com
   Password: Test@123
   Confirm Password: Test@123
   Department: IT
   Designation: Software Engineer
   Role: Employee
   ```
4. Click "Sign Up"

**✅ Expected:** Success message, redirect to login

**❌ Common errors:**
- "User already exists" - Use different Employee ID/Email
- "Password requirements" - Ensure: 8+ chars, uppercase, lowercase, number, special char

---

### Test 3: Employee Login (1 minute)

1. Login with:
   - Email: `john.doe@company.com`
   - Password: `Test@123`

**✅ Expected:** Redirect to Employee Dashboard

---

### Test 4: Attendance Check-in (1 minute)

1. On Employee Dashboard
2. Click "Check In" button in "Today's Attendance" card
3. Observe the success message

**✅ Expected:** 
- Success message appears
- Check-in time displayed
- "Check Out" button appears

**Test Check-out:**
1. Wait a few seconds
2. Click "Check Out"
3. Observe working hours calculated

---

### Test 5: Apply for Leave (2 minutes)

1. Click "Leave" in navigation
2. Scroll to "Apply for Leave" section
3. Fill form:
   ```
   Leave Type: Paid Leave
   Start Date: [Tomorrow's date]
   End Date: [Date 2 days from now]
   Reason: Personal work
   ```
4. Click "Submit Leave Request"

**✅ Expected:**
- Success message
- Leave appears in "Leave Requests" table with status "PENDING"
- Leave balance should show at top

---

### Test 6: Admin Approve Leave (2 minutes)

1. Logout from employee account
2. Login as admin (`admin@dayflow.com` / `Admin@123`)
3. On Admin Dashboard, see pending leave in table
4. Click "Review" button
5. Add comment: "Approved for personal work"
6. Click "Approve"

**✅ Expected:**
- Success message
- Leave disappears from pending list
- Statistics update

**Verify as Employee:**
1. Logout, login as employee
2. Go to Leave page
3. See leave status changed to "APPROVED"

---

### Test 7: View Attendance Records (1 minute)

1. Login as employee
2. Click "Attendance" in navigation
3. View attendance history

**✅ Expected:**
- See today's check-in/out record
- See working hours
- Status shows "PRESENT"

---

### Test 8: Profile Management (2 minutes)

**As Employee:**
1. Click "Profile"
2. Click "Edit Profile"
3. Update:
   - Phone: 9876543210
   - Address: 123 Main Street, City
4. Click "Save Changes"

**✅ Expected:**
- Success message
- Values updated in view mode

**As Admin:**
1. Login as admin
2. Go to Employees list (add to nav or direct: `/employees.html`)
3. Click "View" on any employee
4. Click "Edit Profile"
5. Update all fields including department, designation
6. Save

**✅ Expected:**
- All fields editable for admin
- Changes saved successfully

---

### Test 9: Payroll Setup (Admin Only) (3 minutes)

**Using API directly (since no UI form created):**

1. Open browser developer tools (F12)
2. Go to Console tab
3. Run this code (with employee logged in to get token):

```javascript
// First, get employee ID
const emp = await api.get('/employees/profile/me');
console.log('Employee ID:', emp.data.id);

// Then create payroll (must be admin)
const payroll = await api.post('/payroll', {
    employeeId: emp.data.id,
    basicSalary: 50000,
    hra: 10000,
    transportAllowance: 5000,
    medicalAllowance: 3000,
    otherAllowances: 2000,
    pfDeduction: 5000,
    taxDeduction: 8000,
    otherDeductions: 1000,
    effectiveFrom: '2024-01-01'
});
console.log('Payroll created:', payroll);
```

**✅ Expected:**
- Success response
- Payroll visible in Payroll page

---

### Test 10: Generate Salary Slip (Admin Only) (2 minutes)

**Using API:**

```javascript
const slip = await api.post('/payroll/generate-slip', {
    employeeId: 2,  // Replace with actual employee ID
    month: 1,
    year: 2024
});
console.log('Salary slip generated:', slip);
```

**Then view as employee:**
1. Login as employee
2. Go to Payroll page
3. See salary slip in table

**✅ Expected:**
- Salary slip appears
- All calculations correct
- Shows present days, leaves, earnings, deductions

---

## 📊 VERIFICATION CHECKLIST

Run through this checklist to ensure everything works:

### Backend API
- [ ] Server starts without errors
- [ ] Database connection successful
- [ ] All routes accessible
- [ ] JWT authentication working
- [ ] Role-based access working

### Frontend Pages
- [ ] Landing page loads
- [ ] Login page works
- [ ] Signup page works
- [ ] Employee dashboard loads
- [ ] Admin dashboard loads
- [ ] Profile page works
- [ ] Attendance page displays data
- [ ] Leave page functions correctly
- [ ] Payroll page shows information
- [ ] Navigation works correctly

### Features
- [ ] User registration works
- [ ] User login works
- [ ] Check-in/check-out works
- [ ] Leave application works
- [ ] Leave approval works (admin)
- [ ] Profile editing works
- [ ] Attendance tracking works
- [ ] Payroll viewing works
- [ ] Role permissions enforced

---

## 🔍 DATABASE VERIFICATION

### Check Data in MySQL

```sql
USE dayflow_hrms;

-- Check users
SELECT * FROM users;

-- Check employees
SELECT * FROM employees;

-- Check attendance
SELECT * FROM attendance ORDER BY attendance_date DESC LIMIT 10;

-- Check leave requests
SELECT * FROM leave_requests;

-- Check payroll
SELECT * FROM payroll;

-- Check salary slips
SELECT * FROM salary_slips;
```

---

## 🐛 COMMON ISSUES & SOLUTIONS

### Issue 1: Cannot login
**Symptoms:** "Invalid email or password"

**Solutions:**
1. Check credentials are correct
2. Verify user exists: `SELECT * FROM users WHERE email = 'your@email.com';`
3. Reset password in database if needed
4. Clear browser localStorage and cookies

### Issue 2: 401 Unauthorized
**Symptoms:** "Access denied" on protected routes

**Solutions:**
1. Check token exists: `localStorage.getItem('token')`
2. Verify token is valid: Go to `/api/auth/verify`
3. Re-login if token expired
4. Check JWT_SECRET hasn't changed

### Issue 3: Attendance not saving
**Symptoms:** Check-in button doesn't work

**Solutions:**
1. Check browser console for errors
2. Verify employee profile exists
3. Check database attendance table
4. Ensure date is today

### Issue 4: Leave approval not working
**Symptoms:** Admin can't approve leaves

**Solutions:**
1. Verify user has admin/hr role
2. Check leave request exists and is pending
3. Check console for errors
4. Verify API endpoint is correct

---

## 📝 SAMPLE TEST DATA

### Create Multiple Test Users

```sql
-- Test Employee 1
INSERT INTO users (employee_id, email, password_hash, role, is_verified) 
VALUES ('EMP003', 'alice@company.com', '$2a$10$rGZ6Z9Y9Y9Y9Y9Y9Y9Y9Y.9Y9Y9Y9Y9Y9Y9Y9Y9Y9Y9Y9Y9Y9Y9', 'employee', TRUE);

INSERT INTO employees (user_id, employee_id, first_name, last_name, email, department, designation, date_of_joining, employment_status)
VALUES (LAST_INSERT_ID(), 'EMP003', 'Alice', 'Smith', 'alice@company.com', 'HR', 'HR Manager', CURDATE(), 'active');

-- Test Employee 2
INSERT INTO users (employee_id, email, password_hash, role, is_verified) 
VALUES ('EMP004', 'bob@company.com', '$2a$10$rGZ6Z9Y9Y9Y9Y9Y9Y9Y9Y.9Y9Y9Y9Y9Y9Y9Y9Y9Y9Y9Y9Y9Y9Y9', 'employee', TRUE);

INSERT INTO employees (user_id, employee_id, first_name, last_name, email, department, designation, date_of_joining, employment_status)
VALUES (LAST_INSERT_ID(), 'EMP004', 'Bob', 'Johnson', 'bob@company.com', 'Finance', 'Accountant', CURDATE(), 'active');
```

**Password for all:** `Admin@123`

---

## 🎯 PERFORMANCE TESTING

### Test Response Times

Open browser DevTools → Network tab

**Expected Response Times:**
- Login: < 500ms
- Dashboard load: < 1000ms
- Attendance check-in: < 300ms
- Leave application: < 500ms
- Data fetching: < 800ms

**If slower:**
- Check database indexes
- Optimize queries
- Check network connection

---

## ✅ PRODUCTION READINESS

Before deploying to production:

1. [ ] Change JWT_SECRET to secure random string
2. [ ] Update default admin password
3. [ ] Set NODE_ENV=production
4. [ ] Enable HTTPS
5. [ ] Set up proper error logging
6. [ ] Configure database backups
7. [ ] Add rate limiting
8. [ ] Set up monitoring
9. [ ] Review security headers
10. [ ] Test on production environment

---

## 📞 GETTING HELP

If you encounter issues:

1. Check console logs (browser F12)
2. Check server logs (terminal)
3. Review MySQL error logs
4. Consult README.md
5. Review API documentation
6. Check database schema

---

## 🎉 SUCCESS!

If all tests pass, congratulations! Your Dayflow HRMS is fully functional.

**Next Steps:**
- Customize for your organization
- Add more employees
- Set up payroll for all employees
- Configure email notifications
- Deploy to production

---

**Happy HR Management! 🚀**
