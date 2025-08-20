'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        const data = await res.json();
        // Store admin email in localStorage for file access
        if (data.email) {
          localStorage.setItem('admin-email', data.email);
        }
        // Redirect to admin page (authentication is handled by middleware)
        router.push('/admin');
      } else {
        setError('Invalid admin password');
      }
    } catch {
      setError('Something went wrong');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header section with logo and title - moved to top */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center overflow-hidden">
              <img 
                src="/AIS.jpg" 
                alt="Asante International Shipping Logo" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-teal-800 mb-2">Asante International Shipping</h1>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-2">Admin Access</h2>
            <p className="text-gray-600">Sign in with your admin credentials</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
                placeholder="Enter admin password"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Access Admin Panel
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
