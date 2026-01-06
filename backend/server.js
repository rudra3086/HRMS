import { initDB } from "./dbInit.js";

initDB();

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { testConnection } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employee');
const attendanceRoutes = require('./routes/attendance');
const leaveRoutes = require('./routes/leave');
const payrollRoutes = require('./routes/payroll');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for profile pictures
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/payroll', payrollRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Dayflow HRMS API is running',
        timestamp: new Date().toISOString()
    });
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false, 
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
const startServer = async () => {
    try {
        await testConnection();
        app.listen(PORT, () => {
            console.log(`\n🚀 Dayflow HRMS Server running on port ${PORT}`);
            console.log(`📱 Frontend: http://localhost:${PORT}`);
            console.log(`🔌 API: http://localhost:${PORT}/api`);
            console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}\n`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
