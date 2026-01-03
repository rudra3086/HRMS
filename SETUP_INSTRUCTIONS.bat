@echo off
echo ====================================
echo  Dayflow HRMS - Setup Instructions
echo ====================================
echo.

echo Step 1: Install Node.js dependencies
echo -------------------------------------
echo Run: npm install
echo.

echo Step 2: Setup MySQL Database
echo -------------------------------------
echo 1. Open MySQL Command Line or MySQL Workbench
echo 2. Run: CREATE DATABASE dayflow_hrms;
echo 3. Import schema: mysql -u root -p dayflow_hrms ^< database/schema.sql
echo.

echo Step 3: Configure Environment
echo -------------------------------------
echo 1. A .env file has been created for you
echo 2. Edit .env file and update:
echo    - DB_PASSWORD with your MySQL password
echo    - JWT_SECRET with a random string
echo.

echo Step 4: Start the Server
echo -------------------------------------
echo Run: npm run dev
echo.

echo Step 5: Access Application
echo -------------------------------------
echo Open browser: http://localhost:3000
echo.
echo Default Admin Login:
echo   Email: admin@dayflow.com
echo   Password: Admin@123
echo.

echo ====================================
echo  Ready to start? Follow the steps!
echo ====================================
echo.

pause
