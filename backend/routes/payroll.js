const express = require('express');
const { pool } = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const router = express.Router();

// Get payroll information
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { employeeId } = req.query;

        let query = `
            SELECT p.*, e.first_name, e.last_name, e.employee_id as emp_id, e.designation, e.department
            FROM payroll p 
            LEFT JOIN employees e ON p.employee_id = e.id 
            WHERE 1=1
        `;
        const params = [];

        // If not admin, only show own payroll
        if (req.user.role !== 'admin' && req.user.role !== 'hr') {
            const [employees] = await pool.query('SELECT id FROM employees WHERE user_id = ?', [req.user.userId]);
            if (employees.length === 0) {
                return res.status(404).json({ success: false, message: 'Employee profile not found' });
            }
            query += ' AND p.employee_id = ?';
            params.push(employees[0].id);
        } else if (employeeId) {
            query += ' AND p.employee_id = ?';
            params.push(employeeId);
        }

        query += ' ORDER BY p.effective_from DESC';

        const [payroll] = await pool.query(query, params);

        res.json({ 
            success: true, 
            data: payroll 
        });
    } catch (error) {
        console.error('Get payroll error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching payroll',
            error: error.message 
        });
    }
});

// Get salary slips
router.get('/slips', authMiddleware, async (req, res) => {
    try {
        const { employeeId, month, year } = req.query;

        let query = `
            SELECT s.*, e.first_name, e.last_name, e.employee_id as emp_id, e.designation, e.department
            FROM salary_slips s 
            LEFT JOIN employees e ON s.employee_id = e.id 
            WHERE 1=1
        `;
        const params = [];

        // If not admin, only show own salary slips
        if (req.user.role !== 'admin' && req.user.role !== 'hr') {
            const [employees] = await pool.query('SELECT id FROM employees WHERE user_id = ?', [req.user.userId]);
            if (employees.length === 0) {
                return res.status(404).json({ success: false, message: 'Employee profile not found' });
            }
            query += ' AND s.employee_id = ?';
            params.push(employees[0].id);
        } else if (employeeId) {
            query += ' AND s.employee_id = ?';
            params.push(employeeId);
        }

        if (month) {
            query += ' AND s.month = ?';
            params.push(month);
        }

        if (year) {
            query += ' AND s.year = ?';
            params.push(year);
        }

        query += ' ORDER BY s.year DESC, s.month DESC LIMIT 50';

        const [slips] = await pool.query(query, params);

        res.json({ 
            success: true, 
            data: slips 
        });
    } catch (error) {
        console.error('Get salary slips error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching salary slips',
            error: error.message 
        });
    }
});

// Create/Update payroll (Admin only)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { 
            employeeId, 
            basicSalary, 
            hra, 
            transportAllowance, 
            medicalAllowance, 
            otherAllowances,
            pfDeduction,
            taxDeduction,
            otherDeductions,
            effectiveFrom
        } = req.body;

        if (!employeeId || !basicSalary || !effectiveFrom) {
            return res.status(400).json({ 
                success: false, 
                message: 'Employee ID, basic salary, and effective date are required' 
            });
        }

        await pool.query(
            `INSERT INTO payroll (
                employee_id, basic_salary, hra, transport_allowance, medical_allowance, 
                other_allowances, pf_deduction, tax_deduction, other_deductions, effective_from
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                employeeId, basicSalary, hra || 0, transportAllowance || 0, medicalAllowance || 0,
                otherAllowances || 0, pfDeduction || 0, taxDeduction || 0, otherDeductions || 0, effectiveFrom
            ]
        );

        res.json({ 
            success: true, 
            message: 'Payroll created successfully' 
        });
    } catch (error) {
        console.error('Create payroll error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error creating payroll',
            error: error.message 
        });
    }
});

// Update payroll (Admin only)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const payrollId = req.params.id;
        const { 
            basicSalary, 
            hra, 
            transportAllowance, 
            medicalAllowance, 
            otherAllowances,
            pfDeduction,
            taxDeduction,
            otherDeductions
        } = req.body;

        await pool.query(
            `UPDATE payroll SET 
                basic_salary = ?, hra = ?, transport_allowance = ?, medical_allowance = ?, 
                other_allowances = ?, pf_deduction = ?, tax_deduction = ?, other_deductions = ?
            WHERE id = ?`,
            [
                basicSalary, hra || 0, transportAllowance || 0, medicalAllowance || 0,
                otherAllowances || 0, pfDeduction || 0, taxDeduction || 0, otherDeductions || 0, payrollId
            ]
        );

        res.json({ 
            success: true, 
            message: 'Payroll updated successfully' 
        });
    } catch (error) {
        console.error('Update payroll error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating payroll',
            error: error.message 
        });
    }
});

// Generate salary slip (Admin only)
router.post('/generate-slip', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { employeeId, month, year } = req.body;

        if (!employeeId || !month || !year) {
            return res.status(400).json({ 
                success: false, 
                message: 'Employee ID, month, and year are required' 
            });
        }

        // Check if slip already exists
        const [existing] = await pool.query(
            'SELECT id FROM salary_slips WHERE employee_id = ? AND month = ? AND year = ?',
            [employeeId, month, year]
        );

        if (existing.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Salary slip already exists for this period' 
            });
        }

        // Get latest payroll
        const [payroll] = await pool.query(
            'SELECT * FROM payroll WHERE employee_id = ? ORDER BY effective_from DESC LIMIT 1',
            [employeeId]
        );

        if (payroll.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'No payroll information found for this employee' 
            });
        }

        // Calculate working days and present days
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        const workingDays = endDate.getDate();

        const [attendance] = await pool.query(
            `SELECT COUNT(*) as present_count FROM attendance 
             WHERE employee_id = ? AND attendance_date >= ? AND attendance_date <= ? 
             AND status IN ('present', 'half_day')`,
            [employeeId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
        );

        const presentDays = attendance[0].present_count || 0;

        const [leaves] = await pool.query(
            `SELECT SUM(total_days) as leave_count FROM leave_requests 
             WHERE employee_id = ? AND status = 'approved' 
             AND ((start_date >= ? AND start_date <= ?) OR (end_date >= ? AND end_date <= ?))`,
            [employeeId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0],
             startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
        );

        const leavesTaken = leaves[0].leave_count || 0;

        // Simple calculation: basic_salary - (leaves * 100)
        const payData = payroll[0];
        const basicSalary = parseFloat(payData.basic_salary);
        const leaveDeduction = leavesTaken * 100;
        const netSalary = Math.max(0, basicSalary - leaveDeduction);

        // Insert salary slip
        await pool.query(
            `INSERT INTO salary_slips (
                employee_id, payroll_id, month, year, working_days, present_days, leaves_taken,
                basic_salary, hra, transport_allowance, medical_allowance, other_allowances,
                pf_deduction, tax_deduction, other_deductions, gross_salary, net_salary
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                employeeId, payData.id, month, year, workingDays, presentDays, leavesTaken,
                basicSalary, 0, 0, 0, 0,
                0, 0, leaveDeduction, basicSalary, netSalary
            ]
        );

        res.json({ 
            success: true, 
            message: 'Salary slip generated successfully' 
        });
    } catch (error) {
        console.error('Generate salary slip error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error generating salary slip',
            error: error.message 
        });
    }
});

// Get current month payroll summary with leaves deduction (for simplified view)
router.get('/monthly-summary', authMiddleware, async (req, res) => {
    try {
        const { employeeId } = req.query;

        let targetEmployeeId = employeeId;

        // If not admin, only show own payroll
        if (req.user.role !== 'admin' && req.user.role !== 'hr') {
            const [employees] = await pool.query('SELECT id FROM employees WHERE user_id = ?', [req.user.userId]);
            if (employees.length === 0) {
                return res.status(404).json({ success: false, message: 'Employee profile not found' });
            }
            targetEmployeeId = employees[0].id;
        }

        if (!targetEmployeeId) {
            return res.status(400).json({ success: false, message: 'Employee ID required' });
        }

        // Get latest payroll
        const [payroll] = await pool.query(
            `SELECT p.*, e.first_name, e.last_name, e.employee_id as emp_id, e.designation, e.department
             FROM payroll p
             LEFT JOIN employees e ON p.employee_id = e.id
             WHERE p.employee_id = ?
             ORDER BY p.effective_from DESC LIMIT 1`,
            [targetEmployeeId]
        );

        if (payroll.length === 0) {
            return res.json({ 
                success: true, 
                data: null
            });
        }

        // Get current month leaves
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const [leaves] = await pool.query(
            `SELECT COALESCE(SUM(total_days), 0) as leave_count 
             FROM leave_requests 
             WHERE employee_id = ? AND status = 'approved' 
             AND ((start_date >= ? AND start_date <= ?) OR (end_date >= ? AND end_date <= ?))`,
            [targetEmployeeId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0],
             startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
        );

        const leavesTaken = parseInt(leaves[0].leave_count) || 0;
        const monthlySalary = parseFloat(payroll[0].basic_salary);
        const leaveDeduction = leavesTaken * 100; // Rs 100 per leave
        const netPayroll = monthlySalary - leaveDeduction;

        res.json({ 
            success: true, 
            data: {
                ...payroll[0],
                leaves_taken: leavesTaken,
                leave_deduction: leaveDeduction,
                net_payroll: netPayroll,
                current_month: now.getMonth() + 1,
                current_year: now.getFullYear()
            }
        });
    } catch (error) {
        console.error('Get monthly summary error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching monthly summary',
            error: error.message 
        });
    }
});

module.exports = router;
