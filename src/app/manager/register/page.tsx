'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ManagerRegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{ isValid: boolean; errors: string[] }>({ isValid: false, errors: [] });
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password strength
    if (!passwordStrength.isValid) {
      setError('Password does not meet security requirements');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/manager/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(data.message);
        setFormData({ name: '', email: '', password: '', confirmPassword: '' });
        // Redirect to login after 3 seconds
        setTimeout(() => router.push('/manager/login'), 3000);
      } else {
        // Handle different types of errors
        if (data.error && data.details) {
          // Password strength error with details
          setError(`${data.error}\n\nRequirements:\n${data.details.map((req: string) => `• ${req}`).join('\n')}`);
        } else if (data.error) {
          setError(data.error);
        } else {
          setError('Registration failed');
        }
      }
    } catch (err) {
      setError('An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    
    // Check password strength in real-time
    if (e.target.name === 'password') {
      const password = e.target.value;
      const errors: string[] = [];
      
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <button
            onClick={() => router.push('/')}
            className="flex items-center justify-center space-x-2 mb-4 hover:opacity-80 transition-opacity mx-auto"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden">
              <img 
                src="/uploads/AIS.jpg" 
                alt="Asante International Shipping Logo" 
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent whitespace-nowrap">
              Asante International Shipping
            </span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manager Application</h1>
          <p className="text-gray-600">Submit your application to become a manager (requires admin approval)</p>
        </div>

        {/* Form */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleChange}
                required
                onFocus={() => setShowPasswordRequirements(true)}
                onBlur={() => setShowPasswordRequirements(false)}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 ${
                  formData.password ? (passwordStrength.isValid ? 'border-green-300 focus:ring-green-500' : 'border-red-300 focus:ring-emerald-500') : 'border-gray-300 focus:ring-emerald-500'
                }`}
              />
              
              {/* Password Requirements */}
              {showPasswordRequirements && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-800 mb-2">Password Requirements:</p>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li className={`flex items-center ${formData.password.length >= 8 ? 'text-green-600' : ''}`}>
                      {formData.password.length >= 8 ? '✅' : '⭕'} At least 8 characters
                    </li>
                    <li className={`flex items-center ${/[A-Z]/.test(formData.password) ? 'text-green-600' : ''}`}>
                      {/[A-Z]/.test(formData.password) ? '✅' : '⭕'} One uppercase letter (A-Z)
                    </li>
                    <li className={`flex items-center ${/[a-z]/.test(formData.password) ? 'text-green-600' : ''}`}>
                      {/[a-z]/.test(formData.password) ? '✅' : '⭕'} One lowercase letter (a-z)
                    </li>
                    <li className={`flex items-center ${/\d/.test(formData.password) ? 'text-green-600' : ''}`}>
                      {/\d/.test(formData.password) ? '✅' : '⭕'} One number (0-9)
                    </li>
                    <li className={`flex items-center ${/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'text-green-600' : ''}`}>
                      {/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? '✅' : '⭕'} One special character (!@#$%^&*)
                    </li>
                  </ul>
                </div>
              )}
              
              {/* Password Strength Indicator */}
              {formData.password && (
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

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 ${
                  formData.confirmPassword ? (formData.password === formData.confirmPassword ? 'border-green-300' : 'border-red-300') : 'border-gray-300'
                }`}
              />
              
              {/* Password Match Indicator */}
              {formData.confirmPassword && (
                <div className={`mt-2 p-2 rounded-lg text-sm ${
                  formData.password === formData.confirmPassword
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {formData.password === formData.confirmPassword ? (
                    <span className="flex items-center">✅ Passwords match</span>
                  ) : (
                    <span className="flex items-center">❌ Passwords do not match</span>
                  )}
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={loading || !passwordStrength.isValid || !formData.name || !formData.email || formData.password !== formData.confirmPassword}
              className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting Application...' : 'Submit Manager Application'}
            </button>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 whitespace-pre-line">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-green-600 text-sm">{success}</p>
                <p className="text-green-500 text-xs mt-1">Redirecting to login...</p>
              </div>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have a manager account?{' '}
              <button
                onClick={() => router.push('/manager/login')}
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Sign in here
              </button>
            </p>
            <button
              onClick={() => router.push('/')}
              className="text-emerald-600 hover:text-emerald-700 font-medium mt-2"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
