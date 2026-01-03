const express = require('express');
const { pool } = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const router = express.Router();

// Check-in
router.post('/checkin', authMiddleware, async (req, res) => {
    try {
        const [employees] = await pool.query('SELECT id FROM employees WHERE user_id = ?', [req.user.userId]);
        
        if (employees.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Employee profile not found' 
            });
        }

        const employeeId = employees[0].id;
        const today = new Date().toISOString().split('T')[0];

        // Check if already checked in today
        const [existing] = await pool.query(
            'SELECT * FROM attendance WHERE employee_id = ? AND attendance_date = ?',
            [employeeId, today]
        );

        if (existing.length > 0 && existing[0].check_in_time) {
            return res.status(400).json({ 
                success: false, 
                message: 'Already checked in today' 
            });
        }

        // Create or update attendance record
        if (existing.length > 0) {
            await pool.query(
                'UPDATE attendance SET check_in_time = NOW(), status = "present" WHERE id = ?',
                [existing[0].id]
            );
        } else {
            await pool.query(
                'INSERT INTO attendance (employee_id, attendance_date, check_in_time, status) VALUES (?, ?, NOW(), "present")',
                [employeeId, today]
            );
        }

        res.json({ 
            success: true, 
            message: 'Checked in successfully',
            checkInTime: new Date().toISOString()
        });
    } catch (error) {
        console.error('Check-in error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error during check-in',
            error: error.message 
        });
    }
});

// Check-out
router.post('/checkout', authMiddleware, async (req, res) => {
    try {
        const [employees] = await pool.query('SELECT id FROM employees WHERE user_id = ?', [req.user.userId]);
        
        if (employees.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Employee profile not found' 
            });
        }

        const employeeId = employees[0].id;
        const today = new Date().toISOString().split('T')[0];

        const [attendance] = await pool.query(
            'SELECT * FROM attendance WHERE employee_id = ? AND attendance_date = ?',
            [employeeId, today]
        );

        if (attendance.length === 0 || !attendance[0].check_in_time) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please check in first' 
            });
        }

        if (attendance[0].check_out_time) {
            return res.status(400).json({ 
                success: false, 
                message: 'Already checked out today' 
            });
        }

        // Calculate working hours
        const checkInTime = new Date(attendance[0].check_in_time);
        const checkOutTime = new Date();
        const workingHours = ((checkOutTime - checkInTime) / (1000 * 60 * 60)).toFixed(2);

        await pool.query(
            'UPDATE attendance SET check_out_time = NOW(), working_hours = ? WHERE id = ?',
            [workingHours, attendance[0].id]
        );

        res.json({ 
            success: true, 
            message: 'Checked out successfully',
            checkOutTime: checkOutTime.toISOString(),
            workingHours: workingHours
        });
    } catch (error) {
        console.error('Check-out error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error during check-out',
            error: error.message 
        });
    }
});

// Get attendance records
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { employeeId, startDate, endDate } = req.query;

        let query = `
            SELECT a.*, e.first_name, e.last_name, e.employee_id 
            FROM attendance a 
            LEFT JOIN employees e ON a.employee_id = e.id 
            WHERE 1=1
        `;
        const params = [];

        // If not admin, only show own attendance
        if (req.user.role !== 'admin' && req.user.role !== 'hr') {
            const [employees] = await pool.query('SELECT id FROM employees WHERE user_id = ?', [req.user.userId]);
            if (employees.length === 0) {
                return res.status(404).json({ success: false, message: 'Employee profile not found' });
            }
            query += ' AND a.employee_id = ?';
            params.push(employees[0].id);
        } else if (employeeId) {
            query += ' AND a.employee_id = ?';
            params.push(employeeId);
        }

        if (startDate) {
            query += ' AND a.attendance_date >= ?';
            params.push(startDate);
        }

        if (endDate) {
            query += ' AND a.attendance_date <= ?';
            params.push(endDate);
        }

        query += ' ORDER BY a.attendance_date DESC LIMIT 100';

        const [attendance] = await pool.query(query, params);

        res.json({ 
            success: true, 
            data: attendance 
        });
    } catch (error) {
        console.error('Get attendance error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching attendance',
            error: error.message 
        });
    }
});

// Get today's attendance status
router.get('/today', authMiddleware, async (req, res) => {
    try {
        const [employees] = await pool.query('SELECT id FROM employees WHERE user_id = ?', [req.user.userId]);
        
        if (employees.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Employee profile not found' 
            });
        }

        const employeeId = employees[0].id;
        const today = new Date().toISOString().split('T')[0];

        const [attendance] = await pool.query(
            'SELECT * FROM attendance WHERE employee_id = ? AND attendance_date = ?',
            [employeeId, today]
        );

        res.json({ 
            success: true, 
            data: attendance.length > 0 ? attendance[0] : null
        });
    } catch (error) {
        console.error('Get today attendance error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching today\'s attendance',
            error: error.message 
        });
    }
});

// Mark attendance (Admin only) - supports both /mark and / endpoints
router.post(['/mark', '/'], authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { employeeId, date, status, remarks, checkInTime, checkOutTime } = req.body;

        if (!employeeId || !date || !status) {
            return res.status(400).json({ 
                success: false, 
                message: 'Employee ID, date, and status are required' 
            });
        }

        // Calculate working hours if both times provided
        let workingHours = null;
        if (checkInTime && checkOutTime) {
            const checkIn = new Date(checkInTime);
            const checkOut = new Date(checkOutTime);
            workingHours = ((checkOut - checkIn) / (1000 * 60 * 60)).toFixed(2);
        }

        // Check if attendance already exists
        const [existing] = await pool.query(
            'SELECT id FROM attendance WHERE employee_id = ? AND attendance_date = ?',
            [employeeId, date]
        );

        if (existing.length > 0) {
            await pool.query(
                'UPDATE attendance SET status = ?, check_in_time = ?, check_out_time = ?, working_hours = ?, remarks = ? WHERE id = ?',
                [status, checkInTime || null, checkOutTime || null, workingHours, remarks || null, existing[0].id]
            );
        } else {
            await pool.query(
                'INSERT INTO attendance (employee_id, attendance_date, status, check_in_time, check_out_time, working_hours, remarks) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [employeeId, date, status, checkInTime || null, checkOutTime || null, workingHours, remarks || null]
            );
        }

        res.json({ 
            success: true, 
            message: 'Attendance marked successfully' 
        });
    } catch (error) {
        console.error('Mark attendance error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error marking attendance',
            error: error.message 
        });
    }
});

module.exports = router;
