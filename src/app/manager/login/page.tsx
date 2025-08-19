'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ManagerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/manager/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        console.log('🔄 Manager login successful, received data:', data);
        
        // Store manager email in localStorage for file access
        if (data.email) {
          console.log('🔄 Storing manager email in localStorage:', data.email);
          localStorage.setItem('manager-email', data.email);
          
          // Verify it was stored
          const storedEmail = localStorage.getItem('manager-email');
          console.log('🔄 Verified stored email:', storedEmail);
        } else {
          console.error('❌ No email received in login response');
        }
        
        router.push('/manager');
      } else {
        console.error('❌ Manager login failed:', data.error);
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => router.push('/')}
            className="flex items-center justify-center space-x-2 mb-4 hover:opacity-80 transition-opacity mx-auto"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden">
              <img 
                src="/AIS.jpg" 
                alt="Asante International Shipping Logo" 
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent whitespace-nowrap">
              Asante International Shipping
            </span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manager Access</h1>
          <p className="text-gray-600">Sign in with your approved manager account</p>
        </div>

        {/* Form */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200/50">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in as Manager'}
            </button>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
          </form>

          <div className="mt-6 text-center space-y-3">
            <p className="text-gray-600">
              <button
                onClick={() => router.push('/admin/login')}
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Admin Access
              </button>
              {' '}or{' '}
              <button
                onClick={() => router.push('/')}
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Back to Home
              </button>
            </p>
            <p className="text-gray-600">
              <button
                onClick={() => router.push('/forgot-password')}
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Forgot your password?
              </button>
            </p>
            <div className="pt-4 border-t border-gray-200">
              <p className="text-gray-600 text-sm">
                Don&apos;t have a manager account?{' '}
                <button
                  onClick={() => router.push('/manager/register')}
                  className="text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Apply here
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}