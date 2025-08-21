'use client';

import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="px-4 sm:px-6 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center overflow-hidden">
              <img 
                src="/AIS.jpg" 
                alt="Asante International Shipping Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-2xl sm:text-xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">
              Asante International Shipping
            </span>
          </div>
          <div className="flex flex-wrap justify-center sm:justify-end gap-3 sm:gap-4">
            <button
              onClick={() => router.push('/manager/login')}
              className="text-emerald-600 hover:text-emerald-700 transition-colors px-3 py-2 rounded-lg hover:bg-emerald-50"
            >
              Manager
            </button>
            <button
              onClick={() => router.push('/admin/login')}
              className="text-blue-600 hover:text-blue-700 transition-colors px-3 py-2 rounded-lg hover:bg-blue-50"
            >
              Admin
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-teal-600/10 to-teal-700/10"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-teal-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Store your documents
              <span className="block bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">
                with confidence
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-8 sm:mb-12 leading-relaxed px-4">
              Access your documents securely from anywhere. 
              Built for security, designed for simplicity.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 sm:mb-16 px-4">
              <button
                onClick={() => router.push('/signup')}
                className="bg-black text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-base sm:text-lg font-semibold hover:bg-gray-800 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Get started →
              </button>
              {/* Sign In Button */}
              <button
                onClick={() => router.push('/login')}
                className="px-8 py-3 bg-white/20 backdrop-blur-sm text-gray-800 font-semibold rounded-xl hover:bg-white/30 transition-all duration-300 transform hover:scale-105 border border-white/30 shadow-lg hover:shadow-xl"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
          <div className="text-center p-6 sm:p-8 rounded-2xl bg-white/50 backdrop-blur-sm border border-gray-200/50 hover:shadow-lg transition-all duration-300">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Secure Document Access</h3>
            <p className="text-gray-600">Access your documents securely from anywhere, uploaded by administrators.</p>
          </div>
          
          <div className="text-center p-8 rounded-2xl bg-white/50 backdrop-blur-sm border border-gray-200/50 hover:shadow-lg transition-all duration-300">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Secure Storage</h3>
            <p className="text-gray-600">Your documents are encrypted and stored securely in the cloud.</p>
          </div>
          
          <div className="text-center p-8 rounded-2xl bg-white/50 backdrop-blur-sm border border-gray-200/50 hover:shadow-lg transition-all duration-300">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Instant Access</h3>
            <p className="text-gray-600">Access your documents from anywhere, anytime with our modern dashboard.</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 py-20">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to get started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of users who trust Asante International Shipping for their document management needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/signup')}
              className="bg-white text-teal-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Create your account
            </button>
            <button
              onClick={() => router.push('/admin/login')}
              className="border-2 border-white/30 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white/10 transition-all duration-200 transform hover:scale-105"
            >
              Admin Access
            </button>
            <button
              onClick={() => router.push('/manager/register')}
              className="border-2 border-white/30 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white/10 transition-all duration-200 transform hover:scale-105"
            >
              Become a Manager
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-6 h-6 rounded flex items-center justify-center overflow-hidden">
              <img 
                src="/AIS.jpg" 
                alt="Asante International Shipping Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-lg font-semibold text-gray-900">Asante International Shipping</span>
          </div>
          <p className="text-gray-600">
            Secure document management for the modern world.
          </p>
        </div>
      </footer>
    </div>
  );
}
