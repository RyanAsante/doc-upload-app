// Environment variable validation for security
export function validateEnvironmentVariables() {
  const requiredVars = [
    'DATABASE_URL',
    'DIRECT_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'ADMIN_PASSWORD',
  ];

  const missingVars: string[] = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    console.warn(`⚠️ Missing environment variables: ${missingVars.join(', ')}`);
    // Don't throw error during build, just warn
    return;
  }

  // Validate ADMIN_PASSWORD strength in production
  if (process.env.NODE_ENV === 'production') {
    const adminPassword = process.env.ADMIN_PASSWORD!;
    if (adminPassword && adminPassword.length < 12) {
      console.warn('⚠️ ADMIN_PASSWORD should be at least 12 characters long in production');
    }
  }

  // Validate Supabase URL format
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
    console.warn('⚠️ NEXT_PUBLIC_SUPABASE_URL should use HTTPS');
  }

  console.log('✅ Environment variables validated successfully');
}

// Security configuration
export const SECURITY_CONFIG = {
  // Session configuration
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  MANAGER_SESSION_TIMEOUT: 7 * 24 * 60 * 60 * 1000, // 7 days
  
  // Rate limiting
  MAX_REQUESTS_PER_MINUTE: 100,
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  
  // File upload limits
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_FILES_PER_USER: 100,
  
  // Password requirements
  MIN_PASSWORD_LENGTH: 8, // Strong password requirement for security
  PASSWORD_SALT_ROUNDS: 12,
  
  // CSRF protection
  CSRF_TOKEN_EXPIRY: 60 * 60 * 1000, // 1 hour
} as const;

// Validate environment on import (only warn, don't fail)
if (typeof window === 'undefined') {
  validateEnvironmentVariables();
}
