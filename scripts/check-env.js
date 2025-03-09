require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Helper function to log with colors
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Helper function to log errors
function logError(message) {
  log(`❌ ${message}`, colors.red);
}

// Helper function to log success
function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

// Helper function to log info
function logInfo(message) {
  log(`ℹ️ ${message}`, colors.blue);
}

// Helper function to log warning
function logWarning(message) {
  log(`⚠️ ${message}`, colors.yellow);
}

// Required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET',
];

// Optional environment variables
const optionalEnvVars = [
  'COOKIE_DOMAIN',
  'NODE_ENV',
];

// Check if .env.local file exists
function checkEnvFile() {
  logInfo('Checking .env.local file...');
  
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    logSuccess('.env.local file exists');
    
    // Read the file content
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Check for required variables in the file
    for (const envVar of requiredEnvVars) {
      if (envContent.includes(`${envVar}=`)) {
        logSuccess(`${envVar} found in .env.local file`);
      } else {
        logError(`${envVar} not found in .env.local file`);
      }
    }
    
    // Check for optional variables in the file
    for (const envVar of optionalEnvVars) {
      if (envContent.includes(`${envVar}=`)) {
        logSuccess(`${envVar} found in .env.local file`);
      } else {
        logWarning(`${envVar} not found in .env.local file (optional)`);
      }
    }
  } else {
    logError('.env.local file not found');
  }
}

// Check if environment variables are loaded
function checkEnvVars() {
  logInfo('Checking environment variables...');
  
  // Check required variables
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      logSuccess(`${envVar} is defined in process.env`);
    } else {
      logError(`${envVar} is not defined in process.env`);
    }
  }
  
  // Check optional variables
  for (const envVar of optionalEnvVars) {
    if (process.env[envVar]) {
      logSuccess(`${envVar} is defined in process.env`);
    } else {
      logWarning(`${envVar} is not defined in process.env (optional)`);
    }
  }
}

// Check JWT_SECRET specifically
function checkJwtSecret() {
  logInfo('Checking JWT_SECRET...');
  
  const jwtSecret = process.env.JWT_SECRET;
  
  if (!jwtSecret) {
    logError('JWT_SECRET is not defined');
    return;
  }
  
  if (jwtSecret.length < 32) {
    logWarning(`JWT_SECRET is defined but might be too short (${jwtSecret.length} characters)`);
  } else {
    logSuccess(`JWT_SECRET is defined and has sufficient length (${jwtSecret.length} characters)`);
  }
  
  if (jwtSecret === 'your_jwt_secret_key_for_access_tokens') {
    logWarning('JWT_SECRET is using the default value. Consider changing it for production.');
  }
}

// Check Supabase credentials
function checkSupabaseCredentials() {
  logInfo('Checking Supabase credentials...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl) {
    logError('NEXT_PUBLIC_SUPABASE_URL is not defined');
  } else if (supabaseUrl === 'https://mock-supabase-url.supabase.co') {
    logWarning('NEXT_PUBLIC_SUPABASE_URL is using the default mock value');
  } else {
    logSuccess('NEXT_PUBLIC_SUPABASE_URL is defined');
  }
  
  if (!supabaseAnonKey) {
    logError('NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined');
  } else if (supabaseAnonKey === 'mock-anon-key') {
    logWarning('NEXT_PUBLIC_SUPABASE_ANON_KEY is using the default mock value');
  } else {
    logSuccess('NEXT_PUBLIC_SUPABASE_ANON_KEY is defined');
  }
  
  if (!supabaseServiceKey) {
    logError('SUPABASE_SERVICE_ROLE_KEY is not defined');
  } else if (supabaseServiceKey === 'mock-service-role-key') {
    logWarning('SUPABASE_SERVICE_ROLE_KEY is using the default mock value');
  } else {
    logSuccess('SUPABASE_SERVICE_ROLE_KEY is defined');
  }
}

// Main function
function main() {
  log('\n🔍 Environment Variables Check 🔍\n', colors.cyan);
  
  checkEnvFile();
  log('');
  checkEnvVars();
  log('');
  checkJwtSecret();
  log('');
  checkSupabaseCredentials();
  
  log('\n🏁 Environment Variables Check Completed 🏁\n', colors.cyan);
}

// Run the checks
main(); 