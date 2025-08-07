'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if admin is authenticated
    const isAuthenticated = localStorage.getItem('adminAuthenticated');
    
    if (!isAuthenticated) {
      router.push('/admin/login');
      return;
    }

    // Fetch users if authenticated
    fetch('/api/admin/users')
      .then((res) => res.json())
      .then((data) => {
        setUsers(data.users);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return (
      <div className="p-10">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin: All User Accounts</h1>
        <button
          onClick={() => {
            localStorage.removeItem('adminAuthenticated');
            router.push('/admin/login');
          }}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>
      <ul className="space-y-4">
        {users.map((user:{ id: string; name: string; email: string; } ) => (
          <li key={user.id} className="border p-4 rounded">
            <p><strong>{user.name}</strong> ({user.email})</p>
            <Link href={`/admin/${user.id}`} className="text-blue-600 underline">
              View Account
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

