'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Upload {
  id: string;
  title: string | null;
  name: string;
  imagePath: string;
  fileType: string;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  uploadCount: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) {
      router.push('/login');
      return;
    }

    fetchUserUploads(userEmail);
  }, [router]);

  // Redirect if not logged in
  if (typeof window !== 'undefined' && !localStorage.getItem('userEmail')) {
    router.push('/login');
    return null;
  }

  const fetchUserUploads = async (userEmail: string) => {
    try {
      const response = await fetch('/api/get-uploads', {
        headers: {
          'x-user-email': userEmail,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setUploads(data.uploads);
      } else {
        console.error('Failed to fetch uploads');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    router.push('/login');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openImageModal = (imagePath: string, fileType: string) => {
    setSelectedImage(imagePath);
    setShowImageModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold text-gray-900">My Documents</h1>
            <p className="text-gray-600 mt-2">
              Welcome back, <span className="truncate block">{user?.name}</span>! You have {user?.uploadCount} documents.
            </p>
          </div>
          <div className="flex gap-4 flex-shrink-0">
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-800 px-4 py-3 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Documents</p>
                <p className="text-2xl font-bold text-gray-900">{user?.uploadCount || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Recent Activity</p>
                <p className="text-2xl font-bold text-gray-900">
                  {uploads.length > 0 ? formatDate(uploads[0].createdAt).split(',')[0] : 'None'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="ml-4 min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600">Account</p>
                <p className="text-2xl font-bold text-gray-900 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Uploads Grid */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">My Documents</h2>
          </div>
          
          {uploads.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No documents yet</h3>
              <p className="mt-2 text-gray-600">Documents will appear here once they are uploaded by an administrator.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {uploads.map((upload) => (
                <div key={upload.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div 
                    className="aspect-w-16 aspect-h-9 mb-4 cursor-pointer"
                    onClick={() => openImageModal(upload.imagePath, upload.fileType)}
                  >
                    {upload.fileType === 'VIDEO' ? (
                      <div className="relative">
                        <video
                          src={upload.imagePath}
                          className="w-full h-48 object-cover rounded-lg"
                          controls
                          preload="metadata"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded-lg">
                          <div className="bg-white bg-opacity-90 rounded-full p-2">
                            <svg className="h-6 w-6 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={upload.imagePath}
                        alt={upload.title || upload.name}
                        className="w-full h-48 object-cover rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik02MCAxMDBDODAgODAgMTIwIDgwIDE0MCAxMDBDMTYwIDEyMCAxNDAgMTQwIDEyMCAxNDBDMTAwIDE0MCA4MCAxMjAgNjAgMTAwWiIgZmlsbD0iI0QxRDVEM0YiLz4KPC9zdmc+';
                        }}
                      />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 truncate">
                      {upload.title || upload.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(upload.createdAt)}
                    </p>
                    {upload.fileType === 'VIDEO' && (
                      <p className="text-xs text-blue-600 mt-1">📹 Video</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Image/Video Modal */}
      {showImageModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-2 sm:p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative w-full h-full max-w-7xl max-h-full flex items-center justify-center">
            {/* Video Player */}
            {selectedImage.includes('.mp4') || selectedImage.includes('.mov') || selectedImage.includes('.avi') || selectedImage.includes('.webm') ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <video
                  src={selectedImage}
                  className="w-full h-full max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  controls
                  autoPlay
                  preload="metadata"
                  onClick={(e) => e.stopPropagation()}
                  controlsList="nodownload"
                  style={{
                    maxHeight: 'calc(100vh - 2rem)',
                    maxWidth: 'calc(100vw - 2rem)'
                  }}
                />
                {/* Video Controls Overlay */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm">
                  📹 Video Player
                </div>
              </div>
            ) : (
              /* Image Viewer */
              <img
                src={selectedImage}
                alt="Full size"
                className="w-full h-full max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
                style={{
                  maxHeight: 'calc(100vh - 2rem)',
                  maxWidth: 'calc(100vw - 2rem)'
                }}
              />
            )}
            
            {/* Close Button */}
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 sm:p-3 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110"
              aria-label="Close modal"
            >
              <svg className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Mobile-friendly Backdrop Click Hint */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded-full sm:hidden">
              Tap outside to close
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
