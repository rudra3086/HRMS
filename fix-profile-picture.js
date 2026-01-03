const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixProfilePictureColumn() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'dayflow_hrms'
        });

        console.log('Connected to database...');
        
        // Alter the profile_picture column to LONGTEXT
        await connection.execute(
            'ALTER TABLE employees MODIFY COLUMN profile_picture LONGTEXT'
        );
        
        console.log('✓ Successfully changed profile_picture column to LONGTEXT');
        console.log('✓ You can now upload profile pictures up to 4GB in size');
        
    } catch (error) {
        console.error('Error fixing profile_picture column:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

fixProfilePictureColumn();
