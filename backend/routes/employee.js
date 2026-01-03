const express = require('express');
const { pool } = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const router = express.Router();

// Get all employees (Admin only)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const [employees] = await pool.query(`
            SELECT e.*, u.email, u.role 
            FROM employees e 
            LEFT JOIN users u ON e.user_id = u.id 
            WHERE e.employment_status = 'active'
            ORDER BY e.created_at DESC
        `);

        res.json({ 
            success: true, 
            data: employees 
        });
    } catch (error) {
        console.error('Get employees error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching employees',
            error: error.message 
        });
    }
});

// Get employee by ID
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const employeeId = req.params.id;
        
        // Check if user is admin or accessing their own profile
        if (req.user.role !== 'admin' && req.user.role !== 'hr' && req.user.userId.toString() !== employeeId) {
            const [userEmployee] = await pool.query('SELECT id FROM employees WHERE user_id = ?', [req.user.userId]);
            if (userEmployee.length === 0 || userEmployee[0].id.toString() !== employeeId) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Access denied' 
                });
            }
        }

        const [employees] = await pool.query(`
            SELECT e.*, u.email, u.role 
            FROM employees e 
            LEFT JOIN users u ON e.user_id = u.id 
            WHERE e.id = ?
        `, [employeeId]);

        if (employees.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Employee not found' 
            });
        }

        res.json({ 
            success: true, 
            data: employees[0] 
        });
    } catch (error) {
        console.error('Get employee error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching employee',
            error: error.message 
        });
    }
});

// Get current user's employee profile
router.get('/profile/me', authMiddleware, async (req, res) => {
    try {
        const [employees] = await pool.query(`
            SELECT e.*, u.email, u.role 
            FROM employees e 
            LEFT JOIN users u ON e.user_id = u.id 
            WHERE u.id = ?
        `, [req.user.userId]);

        if (employees.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Employee profile not found' 
            });
        }

        res.json({ 
            success: true, 
            data: employees[0] 
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching profile',
            error: error.message 
        });
    }
});

// Update employee
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const employeeId = req.params.id;
        const { firstName, lastName, phone, address, dateOfBirth, department, designation, managerId, profilePicture } = req.body;

        console.log('Update employee request:', { employeeId, hasProfilePicture: !!profilePicture, role: req.user.role });

        // Check permissions
        if (req.user.role !== 'admin' && req.user.role !== 'hr') {
            // Employees can only update limited fields
            const [userEmployee] = await pool.query('SELECT id FROM employees WHERE user_id = ?', [req.user.userId]);
            if (userEmployee.length === 0 || userEmployee[0].id.toString() !== employeeId) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Access denied' 
                });
            }

            // Update limited fields for employee (including profile picture)
            const updateFields = [];
            const updateValues = [];
            
            if (phone !== undefined) {
                updateFields.push('phone = ?');
                updateValues.push(phone);
            }
            if (address !== undefined) {
                updateFields.push('address = ?');
                updateValues.push(address);
            }
            if (profilePicture !== undefined) {
                updateFields.push('profile_picture = ?');
                updateValues.push(profilePicture);
                console.log('Updating profile picture, length:', profilePicture ? profilePicture.length : 'null');
            }
            
            if (updateFields.length > 0) {
                updateValues.push(employeeId);
                const query = `UPDATE employees SET ${updateFields.join(', ')} WHERE id = ?`;
                console.log('Executing employee update query');
                await pool.query(query, updateValues);
                console.log('Employee update successful');
            }
        } else {
            // Admin can update all fields
            const updateFields = [];
            const updateValues = [];
            
            if (firstName !== undefined) {
                updateFields.push('first_name = ?');
                updateValues.push(firstName);
            }
            if (lastName !== undefined) {
                updateFields.push('last_name = ?');
                updateValues.push(lastName);
            }
            if (phone !== undefined) {
                updateFields.push('phone = ?');
                updateValues.push(phone);
            }
            if (address !== undefined) {
                updateFields.push('address = ?');
                updateValues.push(address);
            }
            if (dateOfBirth !== undefined) {
                updateFields.push('date_of_birth = ?');
                updateValues.push(dateOfBirth || null);
            }
            if (department !== undefined) {
                updateFields.push('department = ?');
                updateValues.push(department);
            }
            if (designation !== undefined) {
                updateFields.push('designation = ?');
                updateValues.push(designation);
            }
            if (managerId !== undefined) {
                updateFields.push('manager_id = ?');
                updateValues.push(managerId);
            }
            if (profilePicture !== undefined) {
                updateFields.push('profile_picture = ?');
                updateValues.push(profilePicture);
            }
            
            if (updateFields.length > 0) {
                updateValues.push(employeeId);
                const query = `UPDATE employees SET ${updateFields.join(', ')} WHERE id = ?`;
                console.log('Executing admin update query');
                await pool.query(query, updateValues);
                console.log('Admin update successful');
            }
        }

        res.json({ 
            success: true, 
            message: 'Employee updated successfully' 
        });
    } catch (error) {
        console.error('Update employee error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating employee',
            error: error.message 
        });
    }
});

// Delete/Deactivate employee (Admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const employeeId = req.params.id;

        await pool.query(`
            UPDATE employees 
            SET employment_status = 'terminated', updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `, [employeeId]);

        res.json({ 
            success: true, 
            message: 'Employee deactivated successfully' 
        });
    } catch (error) {
        console.error('Delete employee error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error deactivating employee',
            error: error.message 
        });
    }
});

module.exports = router;
