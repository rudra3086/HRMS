# Dayflow - Human Resource Management System

![Dayflow HRMS](https://img.shields.io/badge/Dayflow-HRMS-blue)
![Version](https://img.shields.io/badge/version-1.0.0-green)
![License](https://img.shields.io/badge/license-ISC-orange)

**Every workday, perfectly aligned.**

A comprehensive Human Resource Management System (HRMS) built with Node.js, Express, MySQL, and vanilla JavaScript. Streamline your HR operations with employee management, attendance tracking, leave management, and payroll processing.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Usage Guide](#usage-guide)
- [Default Credentials](#default-credentials)
- [Screenshots](#screenshots)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

### Authentication & Authorization
- ✅ Secure user registration and login
- ✅ JWT-based authentication
- ✅ Role-based access control (Admin, HR, Employee)
- ✅ Password encryption with bcrypt
- ✅ Email verification support

### Employee Management
- 👤 Complete employee profile management
- 📝 Personal and employment details
- 📄 Document management
- 🖼️ Profile picture support
- 📊 Employee status tracking

### Attendance Management
- ⏰ Daily check-in/check-out system
- 📅 Weekly and monthly attendance views
- 📈 Working hours calculation
- 📊 Attendance status tracking (Present, Absent, Half-day, Leave)
- 🔍 Attendance reports and analytics

### Leave Management
- 🏖️ Multiple leave types (Paid, Sick, Casual, Unpaid)
- 📝 Leave application with date range selection
- ✅ Approval/rejection workflow for admins
- 💼 Leave balance tracking
- 📧 Status notifications
- 📊 Leave history and reports

### Payroll Management
- 💰 Comprehensive salary structure
- 📊 Earnings and deductions breakdown
- 📄 Salary slip generation
- 📈 Payroll history tracking
- 🧮 Automatic calculations (Gross, Net salary)
- 📅 Month-wise salary records

### Admin Dashboard
- 📊 Real-time statistics
- 👥 Employee management
- ✅ Leave approval workflow
- 📈 Attendance overview
- 📋 Quick access to pending tasks

### Employee Dashboard
- 🏠 Personalized dashboard
- ⏰ Quick check-in/check-out
- 📊 Leave balance overview
- 💰 Salary information
- 📈 Recent activity tracking

## 🛠️ Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MySQL** - Relational database
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Nodemailer** - Email notifications (optional)

### Frontend
- **HTML5** - Structure
- **CSS3** - Styling with custom design system
- **Vanilla JavaScript** - Client-side logic
- **Fetch API** - HTTP requests

### Development Tools
- **Nodemon** - Development server
- **dotenv** - Environment configuration

## 📁 Project Structure

```
dayflow-hrms/
├── backend/
│   ├── config/
│   │   └── database.js          # Database connection
│   ├── middleware/
│   │   └── auth.js              # Authentication middleware
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── employee.js          # Employee management routes
│   │   ├── attendance.js        # Attendance routes
│   │   ├── leave.js             # Leave management routes
│   │   └── payroll.js           # Payroll routes
│   └── server.js                # Main server file
├── frontend/
│   ├── css/
│   │   └── style.css            # Main stylesheet
│   ├── js/
│   │   └── app.js               # Common JavaScript utilities
│   ├── index.html               # Landing page
│   ├── login.html               # Login page
│   ├── signup.html              # Registration page
│   ├── employee-dashboard.html  # Employee dashboard
│   ├── admin-dashboard.html     # Admin dashboard
│   ├── profile.html             # Profile management
│   ├── attendance.html          # Attendance management
│   ├── leave.html               # Leave management
│   └── payroll.html             # Payroll viewing
├── database/
│   └── schema.sql               # Database schema
├── uploads/                     # File uploads directory
├── .env.example                 # Environment variables template
├── .gitignore                   # Git ignore file
├── package.json                 # Dependencies
└── README.md                    # This file
```

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **MySQL** (v8.0 or higher) - [Download](https://dev.mysql.com/downloads/)
- **npm** (comes with Node.js)
- A code editor (VS Code recommended)
- A web browser (Chrome, Firefox, Edge, etc.)

## 🚀 Installation

### Step 1: Clone or Download the Project

Navigate to your project directory:
```bash
cd d:\Projects\Odoo
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages:
- express
- mysql2
- bcryptjs
- jsonwebtoken
- dotenv
- cors
- multer
- nodemailer

## ⚙️ Configuration

### Step 1: Create Environment File

Create a `.env` file in the root directory:

```bash
copy .env.example .env
```

### Step 2: Configure Environment Variables

Edit the `.env` file with your settings:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=dayflow_hrms
DB_PORT=3306

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Secret (Change this to a random string)
JWT_SECRET=your_very_secret_key_change_this_in_production
JWT_EXPIRES_IN=24h

# Email Configuration (Optional - for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=Dayflow HRMS <noreply@dayflow.com>
```

**Important:** 
- Change `JWT_SECRET` to a long, random string
- Update `DB_PASSWORD` with your MySQL root password
- Email configuration is optional and used for notifications

## 🗄️ Database Setup

### Step 1: Create MySQL Database

Open MySQL Command Line or MySQL Workbench and run:

```sql
CREATE DATABASE dayflow_hrms;
```

### Step 2: Import Database Schema

**Option A: Using MySQL Command Line**
```bash
mysql -u root -p dayflow_hrms < database/schema.sql
```

**Option B: Using MySQL Workbench**
1. Open MySQL Workbench
2. Connect to your MySQL server
3. File → Open SQL Script
4. Navigate to `database/schema.sql`
5. Execute the script (⚡ icon or Ctrl+Shift+Enter)

### Step 3: Verify Database Creation

```sql
USE dayflow_hrms;
SHOW TABLES;
```

You should see the following tables:
- users
- employees
- attendance
- leave_requests
- leave_balance
- payroll
- salary_slips
- notifications
- documents

## 🏃 Running the Application

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The application will start on `http://localhost:3000`

You should see:
```
✓ Database connected successfully

🚀 Dayflow HRMS Server running on port 3000
📱 Frontend: http://localhost:3000
🔌 API: http://localhost:3000/api
📊 Environment: development
```

## 🔌 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication Endpoints

#### Sign Up
```http
POST /api/auth/signup
Content-Type: application/json

{
  "employeeId": "EMP002",
  "email": "john.doe@company.com",
  "password": "Password@123",
  "firstName": "John",
  "lastName": "Doe",
  "department": "IT",
  "designation": "Software Engineer",
  "role": "employee"
}
```

#### Sign In
```http
POST /api/auth/signin
Content-Type: application/json

{
  "email": "john.doe@company.com",
  "password": "Password@123"
}

Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "employeeId": "EMP002",
    "email": "john.doe@company.com",
    "role": "employee",
    "name": "John Doe"
  }
}
```

#### Verify Token
```http
GET /api/auth/verify
Authorization: Bearer <token>
```

### Employee Endpoints

#### Get All Employees (Admin only)
```http
GET /api/employees
Authorization: Bearer <token>
```

#### Get Employee by ID
```http
GET /api/employees/:id
Authorization: Bearer <token>
```

#### Get Current User Profile
```http
GET /api/employees/profile/me
Authorization: Bearer <token>
```

#### Update Employee
```http
PUT /api/employees/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "1234567890",
  "address": "123 Main St",
  "dateOfBirth": "1990-01-01",
  "department": "IT",
  "designation": "Senior Software Engineer"
}
```

### Attendance Endpoints

#### Check In
```http
POST /api/attendance/checkin
Authorization: Bearer <token>
```

#### Check Out
```http
POST /api/attendance/checkout
Authorization: Bearer <token>
```

#### Get Attendance Records
```http
GET /api/attendance?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>
```

#### Get Today's Attendance
```http
GET /api/attendance/today
Authorization: Bearer <token>
```

#### Mark Attendance (Admin only)
```http
POST /api/attendance/mark
Authorization: Bearer <token>
Content-Type: application/json

{
  "employeeId": 1,
  "date": "2024-01-15",
  "status": "present",
  "remarks": "On time"
}
```

### Leave Endpoints

#### Apply for Leave
```http
POST /api/leave/apply
Authorization: Bearer <token>
Content-Type: application/json

{
  "leaveType": "paid",
  "startDate": "2024-02-01",
  "endDate": "2024-02-03",
  "reason": "Personal work"
}
```

#### Get Leave Requests
```http
GET /api/leave?status=pending
Authorization: Bearer <token>
```

#### Get Leave Balance
```http
GET /api/leave/balance
Authorization: Bearer <token>
```

#### Approve/Reject Leave (Admin only)
```http
PUT /api/leave/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "approved",
  "adminComments": "Approved for personal work"
}
```

#### Cancel Leave Request
```http
DELETE /api/leave/:id
Authorization: Bearer <token>
```

### Payroll Endpoints

#### Get Payroll Information
```http
GET /api/payroll
Authorization: Bearer <token>
```

#### Get Salary Slips
```http
GET /api/payroll/slips?month=1&year=2024
Authorization: Bearer <token>
```

#### Create/Update Payroll (Admin only)
```http
POST /api/payroll
Authorization: Bearer <token>
Content-Type: application/json

{
  "employeeId": 1,
  "basicSalary": 50000,
  "hra": 10000,
  "transportAllowance": 5000,
  "medicalAllowance": 3000,
  "otherAllowances": 2000,
  "pfDeduction": 5000,
  "taxDeduction": 8000,
  "otherDeductions": 1000,
  "effectiveFrom": "2024-01-01"
}
```

#### Generate Salary Slip (Admin only)
```http
POST /api/payroll/generate-slip
Authorization: Bearer <token>
Content-Type: application/json

{
  "employeeId": 1,
  "month": 1,
  "year": 2024
}
```

## 📖 Usage Guide

### For Employees

1. **Sign Up / Login**
   - Navigate to `http://localhost:3000`
   - Click "Sign Up" to create an account
   - Fill in required details (Employee ID must be unique)
   - Login with your credentials

2. **Dashboard**
   - View quick stats and recent activities
   - Check-in/Check-out for attendance
   - View leave balance

3. **Attendance**
   - Check-in when you start work
   - Check-out when you finish
   - View attendance history

4. **Leave Management**
   - View leave balance
   - Apply for leave with date range
   - Track leave request status

5. **Profile**
   - View personal and employment details
   - Edit limited fields (phone, address)

6. **Payroll**
   - View current salary structure
   - Download salary slips

### For Admin/HR

1. **Admin Dashboard**
   - View organization statistics
   - Monitor pending leave requests
   - Track today's attendance

2. **Employee Management**
   - View all employees
   - Edit employee details
   - Manage employee status

3. **Leave Approval**
   - Review pending leave requests
   - Approve or reject with comments
   - View leave history

4. **Attendance Management**
   - View attendance reports
   - Mark attendance manually
   - Generate attendance reports

5. **Payroll Management**
   - Set up employee payroll
   - Generate monthly salary slips
   - View payroll reports

## 🔑 Default Credentials

A default admin account is created automatically:

```
Email: admin@dayflow.com
Password: Admin@123
Employee ID: EMP001
Role: Admin
```

**⚠️ Important:** Change the default admin password immediately after first login!

## 📸 Screenshots

### Landing Page
The welcome screen with features overview and call-to-action buttons.

### Login Page
Secure login with email and password authentication.

### Employee Dashboard
Personalized dashboard with quick access to all features.

### Admin Dashboard
Comprehensive overview with statistics and pending tasks.

### Attendance Management
Track check-in/check-out and view attendance history.

### Leave Management
Apply for leave and track approval status.

### Payroll View
View salary structure and download salary slips.

## 🔧 Troubleshooting

### Database Connection Error

**Error:** `Database connection failed`

**Solution:**
1. Verify MySQL is running
2. Check database credentials in `.env`
3. Ensure database exists: `CREATE DATABASE dayflow_hrms;`
4. Test connection: `mysql -u root -p`

### Port Already in Use

**Error:** `Port 3000 is already in use`

**Solution:**
1. Change port in `.env`: `PORT=3001`
2. Or kill the process using port 3000:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   
   # Linux/Mac
   lsof -ti:3000 | xargs kill
   ```

### JWT Token Errors

**Error:** `Invalid or expired token`

**Solution:**
1. Clear browser localStorage
2. Login again
3. Check JWT_SECRET in `.env` hasn't changed

### Password Validation Errors

**Error:** `Password must be at least 8 characters...`

**Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character (@$!%*?&)

Example valid password: `Password@123`

### Module Not Found Errors

**Error:** `Cannot find module 'express'`

**Solution:**
```bash
npm install
```

### CORS Errors

**Error:** `CORS policy blocked`

**Solution:**
- Ensure backend is running
- Check API_URL in `frontend/js/app.js` points to correct backend URL
- CORS is already configured in `backend/server.js`

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👨‍💻 Support

For support, please open an issue in the repository or contact the development team.

## 🎯 Future Enhancements

- [ ] Email notifications for leave approvals
- [ ] Advanced reporting and analytics
- [ ] Document upload and management
- [ ] Performance review module
- [ ] Training and development tracking
- [ ] Mobile application
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Export data to Excel/PDF
- [ ] Integration with biometric devices

---

**Made with ❤️ for better HR management**

**Dayflow HRMS** - Every workday, perfectly aligned.
# HRMS
