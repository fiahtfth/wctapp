import bcrypt from 'bcryptjs';

const passwordHash = '$2b$10$z7i5UQJ3MmRDplvdfYABwOD0qgtOyfltfDzXr903Ku8jKwm5AENpW';

// Array of potential passwords to test
const passwordCandidates = [
    'your_password_hereadmin123',
    'admin123',
    'admin',
    'password',
    'admin@example.com',
    'Admin_2025!'
];

async function verifyPasswords() {
    for (const password of passwordCandidates) {
        try {
            const isMatch = await bcrypt.compare(password, passwordHash);
            console.log(`Password '${password}': ${isMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
        } catch (error) {
            console.error(`Error checking password '${password}':`, error);
        }
    }
}

verifyPasswords();
