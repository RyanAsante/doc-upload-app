'use client';

import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md space-y-6 p-8">
        <h1 className="text-4xl font-bold text-gray-900">Welcome to VaultDrop</h1>
        <p className="text-gray-600 text-lg">
          Securely upload, store, and view your documents with ease.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.push('/login')}
            className="bg-black text-white px-6 py-3 rounded hover:bg-gray-900 transition"
          >
            Login
          </button>
          <button
            onClick={() => router.push('/signup')}
            className="border border-gray-400 text-gray-800 px-6 py-3 rounded hover:bg-gray-100 transition"
          >
            Sign Up
          </button>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/admin/login')}
              className="text-gray-500 hover:text-gray-700 text-sm underline"
            >
              Admin Access
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              My Dashboard
            </button>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/admin/login')}
              className="text-gray-500 hover:text-gray-700 text-sm underline"
            >
              Admin Access
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              My Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
