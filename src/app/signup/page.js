'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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
        // ✅ Auto-login: store email in localStorage
        localStorage.setItem('userEmail', form.email);

        // ✅ Redirect to dashboard
        router.push('/dashboard');
      } else {
        setMessage(`❌ ${data.message}`);
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
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">V</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap">
              VaultDrop
            </span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create your account</h1>
          <p className="text-gray-600">Join thousands of users who trust VaultDrop</p>
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
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
                placeholder="Create a password"
                type="password"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
              />
            </div>

            <button
              onClick={handleSubmit}
              className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Create account
            </button>
            
            {message && (
              <div className={`rounded-xl p-4 ${
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