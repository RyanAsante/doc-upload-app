'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

type User = {
    id: string;
    name: string;
    email: string;
  };
  
  type Upload = {
    id: string;
    imagePath: string;
    createdAt: string;
  };

export default function AdminUserPage() {
  const { userId } = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);

  useEffect(() => {
    if (userId) {
      fetch(`/api/admin/user/${userId}`)
        .then((res) => res.json())
        .then((data) => {
          setUser(data.user);
          setUploads(data.uploads);
        });
    }
  }, [userId]);

  if (!user) return <div className="p-10">Loading user data...</div>;

  return (
    <div className="p-10 space-y-8">
      <h1 className="text-2xl font-bold">User: {user.name}</h1>
      <p><strong>Email:</strong> {user.email}</p>

      <h2 className="text-xl font-semibold mt-6">Uploaded Images</h2>
      {uploads.length === 0 && <p>No uploads yet.</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {uploads.map((upload: any) => (
          <div key={upload.id} className="border rounded p-2">
            <img
              src={upload.imagePath}
              alt="Uploaded"
              className="w-full h-auto object-cover rounded"
            />
            <p className="text-sm mt-2">Uploaded: {new Date(upload.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}