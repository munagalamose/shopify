const bcrypt = require('bcryptjs');

async function testBcrypt() {
    try {
        console.log('Testing bcrypt with admin123...');
        const hash = '$2a$10$wt4wFwr.FJb7C.JuRPubUOdn5v/o1iY41S1VlGXnrJGEbm6GrpJnO';
        const password = 'admin123';
        
        const result = await bcrypt.compare(password, hash);
        console.log('Password match:', result);
        
        // Also test JWT_SECRET
        console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
        console.log('JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);
        
    } catch (error) {
        console.error('Error:', error);
    }
}

testBcrypt();
