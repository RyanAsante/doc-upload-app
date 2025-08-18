'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json()

    if (res.ok) {
      localStorage.setItem('userEmail', email);
      router.push('/dashboard')
    } else {
      setError(data.error || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <button
            onClick={() => router.push('/')}
            className="flex items-center justify-center space-x-2 mb-4 hover:opacity-80 transition-opacity mx-auto"
          >
            <div className="w-10 h-10 bg-gradient-to-r from-teal-600 to-teal-700 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent whitespace-nowrap">
              Asante International Shipping
            </span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
          <p className="text-gray-600">Sign in to your account to continue</p>
        </div>

        {/* Form */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200/50">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
              />
            </div>

            <button 
              type="submit" 
              className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Sign in
            </button>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
          </form>

          <div className="mt-6 text-center space-y-3">
            <p className="text-gray-600">
              Don&apos;t have an account?{' '}
              <button
                onClick={() => router.push('/signup')}
                className="text-teal-600 hover:text-teal-700 font-medium"
              >
                Sign up
              </button>
            </p>
            <p className="text-gray-600">
              <button
                onClick={() => router.push('/forgot-password')}
                className="text-teal-600 hover:text-teal-700 font-medium"
              >
                Forgot your password?
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}