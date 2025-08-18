'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [message, setMessage] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({ isValid: false, errors: [] });
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    
    // Check password strength in real-time
    if (e.target.name === 'password') {
      const password = e.target.value;
      const errors = [];
      
      if (password.length < 8) {
        errors.push('At least 8 characters long');
      }
      
      if (!/[A-Z]/.test(password)) {
        errors.push('One uppercase letter (A-Z)');
      }
      
      if (!/[a-z]/.test(password)) {
        errors.push('One lowercase letter (a-z)');
      }
      
      if (!/\d/.test(password)) {
        errors.push('One number (0-9)');
      }
      
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('One special character (!@#$%^&*)');
      }
      
      setPasswordStrength({
        isValid: errors.length === 0,
        errors: errors
      });
    }
  };

  const handleSubmit = async () => {
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        // Show verification message instead of auto-login
        if (data.emailSent) {
          setMessage(`✅ ${data.message}\n\nPlease check your email and click the verification link to activate your account.`);
          // Clear form after successful signup
          setForm({ name: '', email: '', password: '' });
        } else {
          setMessage(`✅ Account created but verification email failed to send. Please contact support.`);
        }
      } else {
        // Handle different types of errors
        if (data.error && data.details) {
          // Password strength error with details
          setMessage(`❌ ${data.error}\n\nRequirements:\n${data.details.map(req => `• ${req}`).join('\n')}`);
        } else if (data.error) {
          setMessage(`❌ ${data.error}`);
        } else {
          setMessage(`❌ ${data.message || 'Signup failed'}`);
        }
      }
    } catch {
      setMessage('❌ Something went wrong');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <button
            onClick={() => router.push('/')}
            className="flex items-center justify-center space-x-2 mb-4 hover:opacity-80 transition-opacity mx-auto"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
              <img 
                src="/uploads/AIS.jpg" 
                alt="Asante International Shipping Logo" 
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent whitespace-nowrap">
              Asante International Shipping
            </span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create your account</h1>
                      <p className="text-gray-600">Join thousands of users who trust Asante International Shipping</p>
        </div>

        {/* Form */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200/50">
          <form className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email"
                type="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Create a strong password"
                type="password"
                onFocus={() => setShowPasswordRequirements(true)}
                onBlur={() => setShowPasswordRequirements(false)}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 ${
                  form.password ? (passwordStrength.isValid ? 'border-green-300 focus:ring-green-500' : 'border-red-300 focus:ring-red-500') : 'border-gray-300 focus:ring-teal-500'
                }`}
              />
              
              {/* Password Requirements */}
              {showPasswordRequirements && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-800 mb-2">Password Requirements:</p>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li className={`flex items-center ${form.password.length >= 8 ? 'text-green-600' : ''}`}>
                      {form.password.length >= 8 ? '✅' : '⭕'} At least 8 characters
                    </li>
                    <li className={`flex items-center ${/[A-Z]/.test(form.password) ? 'text-green-600' : ''}`}>
                      {/[A-Z]/.test(form.password) ? '✅' : '⭕'} One uppercase letter (A-Z)
                    </li>
                    <li className={`flex items-center ${/[a-z]/.test(form.password) ? 'text-green-600' : ''}`}>
                      {/[a-z]/.test(form.password) ? '✅' : '⭕'} One lowercase letter (a-z)
                    </li>
                    <li className={`flex items-center ${/\d/.test(form.password) ? 'text-green-600' : ''}`}>
                      {/\d/.test(form.password) ? '✅' : '⭕'} One number (0-9)
                    </li>
                    <li className={`flex items-center ${/[!@#$%^&*(),.?":{}|<>]/.test(form.password) ? 'text-green-600' : ''}`}>
                      {/[!@#$%^&*(),.?":{}|<>]/.test(form.password) ? '✅' : '⭕'} One special character (!@#$%^&*)
                    </li>
                  </ul>
                </div>
              )}
              
              {/* Password Strength Indicator */}
              {form.password && (
                <div className={`mt-2 p-2 rounded-lg text-sm ${
                  passwordStrength.isValid 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {passwordStrength.isValid ? (
                    <span className="flex items-center">✅ Password meets all requirements</span>
                  ) : (
                    <span className="flex items-center">⚠️ Password needs: {passwordStrength.errors.join(', ')}</span>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!passwordStrength.isValid || !form.name || !form.email}
              className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg ${
                passwordStrength.isValid && form.name && form.email
                  ? 'bg-black text-white hover:bg-gray-800'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Create account
            </button>
            
            {message && (
              <div className={`rounded-xl p-4 whitespace-pre-line ${
                message.includes('❌') 
                  ? 'bg-red-50 border border-red-200' 
                  : 'bg-green-50 border border-green-200'
              }`}>
                <p className={`text-sm ${
                  message.includes('❌') ? 'text-red-600' : 'text-green-600'
                }`}>
                  {message}
                </p>
              </div>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => router.push('/login')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}