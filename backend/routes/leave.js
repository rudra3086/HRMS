const express = require('express');
const { pool } = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const router = express.Router();

// Apply for leave
router.post('/apply', authMiddleware, async (req, res) => {
    try {
        const { leaveType, startDate, endDate, reason } = req.body;

        if (!leaveType || !startDate || !endDate) {
            return res.status(400).json({ 
                success: false, 
                message: 'Leave type, start date, and end date are required' 
            });
        }

        const [employees] = await pool.query('SELECT id FROM employees WHERE user_id = ?', [req.user.userId]);
        
        if (employees.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Employee profile not found' 
            });
        }

        const employeeId = employees[0].id;

        // Calculate total days
        const start = new Date(startDate);
        const end = new Date(endDate);
        const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

        if (totalDays <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid date range' 
            });
        }

        // Create leave request
        await pool.query(
            'INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, total_days, reason, status) VALUES (?, ?, ?, ?, ?, ?, "pending")',
            [employeeId, leaveType, startDate, endDate, totalDays, reason]
        );

        res.json({ 
            success: true, 
            message: 'Leave request submitted successfully' 
        });
    } catch (error) {
        console.error('Apply leave error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error applying for leave',
            error: error.message 
        });
    }
});

// Get leave requests
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { status, employeeId } = req.query;

        let query = `
            SELECT lr.*, e.first_name, e.last_name, e.employee_id as emp_id,
                   u.email as approver_email
            FROM leave_requests lr 
            LEFT JOIN employees e ON lr.employee_id = e.id 
            LEFT JOIN users u ON lr.approved_by = u.id
            WHERE 1=1
        `;
        const params = [];

        // If not admin, only show own leave requests
        if (req.user.role !== 'admin' && req.user.role !== 'hr') {
            const [employees] = await pool.query('SELECT id FROM employees WHERE user_id = ?', [req.user.userId]);
            if (employees.length === 0) {
                return res.status(404).json({ success: false, message: 'Employee profile not found' });
            }
            query += ' AND lr.employee_id = ?';
            params.push(employees[0].id);
        } else if (employeeId) {
            query += ' AND lr.employee_id = ?';
            params.push(employeeId);
        }

        if (status) {
            query += ' AND lr.status = ?';
            params.push(status);
        }

        query += ' ORDER BY lr.created_at DESC';

        const [leaveRequests] = await pool.query(query, params);

        res.json({ 
            success: true, 
            data: leaveRequests 
        });
    } catch (error) {
        console.error('Get leave requests error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching leave requests',
            error: error.message 
        });
    }
});

// Get leave balance
router.get('/balance', authMiddleware, async (req, res) => {
    try {
        const [employees] = await pool.query('SELECT id FROM employees WHERE user_id = ?', [req.user.userId]);
        
        if (employees.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Employee profile not found' 
            });
        }

        const employeeId = employees[0].id;
        const currentYear = new Date().getFullYear();

        const [balance] = await pool.query(
            'SELECT * FROM leave_balance WHERE employee_id = ? AND year = ?',
            [employeeId, currentYear]
        );

        // If no balance exists, create default balance
        if (balance.length === 0) {
            const leaveTypes = ['paid', 'sick', 'casual'];
            for (const type of leaveTypes) {
                await pool.query(
                    'INSERT INTO leave_balance (employee_id, leave_type, total_leaves, used_leaves, remaining_leaves, year) VALUES (?, ?, 15, 0, 15, ?)',
                    [employeeId, type, currentYear]
                );
            }

            const [newBalance] = await pool.query(
                'SELECT * FROM leave_balance WHERE employee_id = ? AND year = ?',
                [employeeId, currentYear]
            );

            return res.json({ 
                success: true, 
                data: newBalance 
            });
        }

        res.json({ 
            success: true, 
            data: balance 
        });
    } catch (error) {
        console.error('Get leave balance error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching leave balance',
            error: error.message 
        });
    }
});

// Approve/Reject leave (Admin only)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const leaveId = req.params.id;
        const { status, adminComments } = req.body;

        if (!status || !['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Valid status (approved/rejected) is required' 
            });
        }

        const [leave] = await pool.query(
            'SELECT * FROM leave_requests WHERE id = ?',
            [leaveId]
        );

        if (leave.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Leave request not found' 
            });
        }

        // Update leave request
        await pool.query(
            'UPDATE leave_requests SET status = ?, approved_by = ?, approved_at = NOW(), admin_comments = ? WHERE id = ?',
            [status, req.user.userId, adminComments, leaveId]
        );

        // If approved, update leave balance and mark attendance
        if (status === 'approved') {
            const currentYear = new Date().getFullYear();
            
            // Update leave balance
            await pool.query(
                `UPDATE leave_balance 
                 SET used_leaves = used_leaves + ?, 
                     remaining_leaves = remaining_leaves - ?
                 WHERE employee_id = ? AND leave_type = ? AND year = ?`,
                [leave[0].total_days, leave[0].total_days, leave[0].employee_id, leave[0].leave_type, currentYear]
            );

            // Mark attendance as leave for the date range
            const start = new Date(leave[0].start_date);
            const end = new Date(leave[0].end_date);
            
            for (let date = start; date <= end; date.setDate(date.getDate() + 1)) {
                const dateStr = date.toISOString().split('T')[0];
                
                const [existing] = await pool.query(
                    'SELECT id FROM attendance WHERE employee_id = ? AND attendance_date = ?',
                    [leave[0].employee_id, dateStr]
                );

                if (existing.length > 0) {
                    await pool.query(
                        'UPDATE attendance SET status = "leave" WHERE id = ?',
                        [existing[0].id]
                    );
                } else {
                    await pool.query(
                        'INSERT INTO attendance (employee_id, attendance_date, status) VALUES (?, ?, "leave")',
                        [leave[0].employee_id, dateStr]
                    );
                }
            }
        }

        res.json({ 
            success: true, 
            message: `Leave request ${status} successfully` 
        });
    } catch (error) {
        console.error('Update leave request error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating leave request',
            error: error.message 
        });
    }
});

// Cancel leave request
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const leaveId = req.params.id;

        const [leave] = await pool.query(
            'SELECT * FROM leave_requests WHERE id = ?',
            [leaveId]
        );

        if (leave.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Leave request not found' 
            });
        }

        // Check if user owns this leave request or is admin
        const [employees] = await pool.query('SELECT id FROM employees WHERE user_id = ?', [req.user.userId]);
        
        if (req.user.role !== 'admin' && req.user.role !== 'hr' && 
            (employees.length === 0 || employees[0].id !== leave[0].employee_id)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied' 
            });
        }

        // Can only cancel pending requests
        if (leave[0].status !== 'pending') {
            return res.status(400).json({ 
                success: false, 
                message: 'Can only cancel pending leave requests' 
            });
        }

        await pool.query('DELETE FROM leave_requests WHERE id = ?', [leaveId]);

        res.json({ 
            success: true, 
            message: 'Leave request cancelled successfully' 
        });
    } catch (error) {
        console.error('Cancel leave request error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error cancelling leave request',
            error: error.message 
        });
    }
});

module.exports = router;
