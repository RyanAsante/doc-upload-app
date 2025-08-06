'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminPage() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch('/api/admin/users')
      .then((res) => res.json())
      .then((data) => setUsers(data.users));
  }, []);

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-6">Admin: All User Accounts</h1>
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

