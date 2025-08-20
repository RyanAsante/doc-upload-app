'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ManagerLoginPage() {
  const router = useRouter();
  
  // Form state management
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  /**
   * Handles the manager login form submission
   * - Validates credentials against the API
   * - Stores manager email in localStorage for file access authentication
   * - Redirects to manager dashboard on success
   * - Displays error messages on failure
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Send login request to manager authentication API
      const res = await fetch('/api/manager/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Store manager email in localStorage for file access authentication
        // This is used by the secure file API to verify manager permissions
        localStorage.setItem('manager-email', data.email);
        
        // Verify the email was stored correctly before proceeding
        const storedEmail = localStorage.getItem('manager-email');
        
        if (storedEmail === data.email) {
          // Redirect to manager dashboard on successful login
          router.push('/manager');
        } else {
          // Handle localStorage storage failure
          setError('Failed to store login information');
        }
      } else {
        // Display API error message
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      // Handle network or unexpected errors
      setError('An error occurred during login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      {/* Main login container with glassmorphism effect */}
      <div className="w-full max-w-md">
        {/* Header section with logo and title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center overflow-hidden">
              <img 
                src="/AIS.jpg" 
                alt="Asante International Shipping Logo" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manager Login</h1>
          <p className="text-gray-600">Access your manager dashboard</p>
        </div>

        {/* Login form with error handling */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email input field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-black placeholder-gray-400"
                placeholder="Enter your email"
              />
            </div>

            {/* Password input field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-black placeholder-gray-400"
                placeholder="Enter your password"
              />
            </div>

            {/* Error message display */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              className="w-full bg-emerald-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-emerald-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Sign In
            </button>
          </form>

          {/* Navigation links */}
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-emerald-600 hover:text-emerald-700 text-sm"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}