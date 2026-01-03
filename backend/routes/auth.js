const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const router = express.Router();

// Sign Up
router.post('/signup', async (req, res) => {
    try {
        const { email, password, role, firstName, lastName, department, designation } = req.body;

        // Validation
        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({ 
                success: false, 
                message: 'All required fields must be provided' 
            });
        }

        // Check if trying to create admin - only allow one admin
        if (role === 'admin') {
            const [existingAdmins] = await pool.query('SELECT id FROM users WHERE role = ?', ['admin']);
            if (existingAdmins.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'An admin already exists in the system. Only one admin is allowed.' 
                });
            }
        }

        // Password validation
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password must be at least 8 characters with uppercase, lowercase, number and special character' 
            });
        }

        // Check if user already exists
        const [existingUsers] = await pool.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'User with this email already exists' 
            });
        }

        // Auto-generate employee ID
        const [lastEmployee] = await pool.query(
            'SELECT employee_id FROM users ORDER BY id DESC LIMIT 1'
        );
        
        let employeeId;
        if (lastEmployee.length > 0) {
            // Extract number from last employee ID (e.g., EMP001 -> 1)
            const lastNum = parseInt(lastEmployee[0].employee_id.replace('EMP', ''));
            const nextNum = lastNum + 1;
            employeeId = 'EMP' + nextNum.toString().padStart(3, '0');
        } else {
            employeeId = 'EMP001';
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const [userResult] = await pool.query(
            'INSERT INTO users (employee_id, email, password_hash, role, is_verified) VALUES (?, ?, ?, ?, ?)',
            [employeeId, email, passwordHash, role || 'employee', true]
        );

        const userId = userResult.insertId;

        // Create employee profile
        await pool.query(
            `INSERT INTO employees (user_id, employee_id, first_name, last_name, email, department, designation, date_of_joining, employment_status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE(), 'active')`,
            [userId, employeeId, firstName, lastName, email, department || 'General', designation || 'Employee']
        );

        res.status(201).json({ 
            success: true, 
            message: `User registered successfully with Employee ID: ${employeeId}. Please login.`,
            employeeId: employeeId
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error creating user account',
            error: error.message 
        });
    }
});

// Sign In
router.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email and password are required' 
            });
        }

        // Get user
        const [users] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }

        const user = users[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }

        // Get employee details
        const [employees] = await pool.query(
            'SELECT * FROM employees WHERE user_id = ?',
            [user.id]
        );

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user.id, 
                employeeId: user.employee_id, 
                email: user.email, 
                role: user.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({ 
            success: true, 
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                employeeId: user.employee_id,
                email: user.email,
                role: user.role,
                name: employees.length > 0 ? `${employees[0].first_name} ${employees[0].last_name}` : ''
            }
        });

    } catch (error) {
        console.error('Signin error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error during login',
            error: error.message 
        });
    }
});

// Verify Token
router.get('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'No token provided' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const [users] = await pool.query(
            'SELECT u.id, u.employee_id, u.email, u.role, e.first_name, e.last_name FROM users u LEFT JOIN employees e ON u.id = e.user_id WHERE u.id = ?',
            [decoded.userId]
        );

        if (users.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        const user = users[0];

        res.json({ 
            success: true, 
            user: {
                id: user.id,
                employeeId: user.employee_id,
                email: user.email,
                role: user.role,
                name: `${user.first_name} ${user.last_name}`
            }
        });

    } catch (error) {
        res.status(401).json({ 
            success: false, 
            message: 'Invalid token',
            error: error.message 
        });
    }
});

module.exports = router;
