'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Upload {
  id: string;
  title: string | null;
  name: string;
  imagePath: string;
  fileType: string;
  createdAt: string;
}

export default function AdminUserPage({ params }: { params: Promise<{ userId: string }> }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<Upload | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isManager, setIsManager] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const resolvedParams = await params;
        const response = await fetch(`/api/admin/user/${resolvedParams.userId}`);
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setUploads(data.uploads);
          setIsManager(data.user.role === 'MANAGER');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [params]);

  const startCamera = async () => {
    try {
      // Check if video element exists
      const video = videoRef.current;
      if (!video) {
        console.error('Video element not found. Please refresh the page and try again.');
        return;
      }

      // Set video display to block to ensure it's visible
      video.style.display = 'block';
      video.style.backgroundColor = '#000';

      // Try to get camera access with back camera preference
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' }, // Prefer back camera
            width: { ideal: 1280 },
            height: { ideal: 720 },
            aspectRatio: { ideal: 1.4 }
          }
        });
      } catch {
        console.log('Back camera failed, trying front camera...');
        // Fallback to front camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
            aspectRatio: { ideal: 1.4 }
          }
        });
      }

      video.srcObject = stream;
      
      video.onloadedmetadata = () => {
        video.play().then(() => {
          console.log('Video playing successfully');
          setCameraOn(true);
        }).catch((err) => {
          console.error('Error playing video:', err);
        });
      };

      video.onerror = () => {
        console.error('Video error occurred');
      };
      
    } catch (error) {
      console.error('Camera access error:', error);
    }
  };

  const stopCamera = () => {
    if (videoRef.current) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setCameraOn(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the video frame to canvas
    context.drawImage(video, 0, 0);
    
    // Convert canvas to blob and upload
    canvas.toBlob(async (blob) => {
      if (blob) {
        const file = new File([blob], 'captured.jpg', { type: 'image/jpeg' });
        // Create a mock event object for the file upload
        const mockEvent = {
          target: { files: [file] }
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        await handleFileUpload(mockEvent);
        stopCamera();
      }
    }, 'image/jpeg');
  };

  const captureVideo = () => {
    // For now, just show a message that video recording isn't implemented
    alert('Video recording feature coming soon!');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile || !user) return;

    const formData = new FormData();
    formData.append('document', selectedFile);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'x-user-email': user.email,
        },
        body: formData,
      });

      if (response.ok) {
        // Refresh the uploads list
        const userResponse = await fetch(`/api/admin/user/${user.id}`);
        const userData = await userResponse.json();
        setUploads(userData.uploads);
        setUser(userData.user);
      }
    } catch {
      console.error('Upload failed');
    }
  };

  const handleDeleteFile = async (uploadId: string) => {
    try {
      const response = await fetch(`/api/admin/upload/${uploadId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUploads(uploads.filter(upload => upload.id !== uploadId));
      }
    } catch {
      console.error('Delete failed');
    }
  };

  const handleUpdateTitle = async (uploadId: string) => {
    try {
      const response = await fetch(`/api/admin/upload/${uploadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editingTitle }),
      });
      
      if (response.ok) {
        setUploads(uploads.map(upload => 
          upload.id === uploadId ? { ...upload, title: editingTitle } : upload
        ));
        setEditingId(null);
        setEditingTitle('');
      }
    } catch {
      console.error('Title update failed');
    }
  };

  const openImageModal = (image: Upload) => {
    setSelectedImage(image);
    setShowImageModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">Error</p>
            <p>User not found</p>
          </div>
          <button
            onClick={() => router.push('/admin')}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
          >
            Back to Admin Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-sm border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/admin')}
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
              >
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">V</span>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  VaultDrop
                </span>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">User Details</h1>
                <p className="text-gray-600">{user.name} ({user.email})</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="bg-gray-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-gray-700 transition-all duration-200"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* User Info */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-200/50 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">User Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Name</p>
              <p className="text-lg text-gray-900">{user.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-lg text-gray-900">{user.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Role</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                user.role === 'MANAGER' ? 'bg-blue-100 text-blue-800' :
                'bg-green-100 text-green-800'
              }`}>
                {user.role}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Uploads</p>
              <p className="text-lg text-gray-900">{uploads.length}</p>
            </div>
          </div>
        </div>

        {/* File Upload Section - Only show for CUSTOMER users */}
        {!isManager && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-200/50 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Upload Files for {user.name}</h2>
            
            {/* Camera Section */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">📷 Quick Camera Capture</h3>
              
              {/* Always render video element but hide when not in use */}
              <video 
                ref={videoRef} 
                className={`w-full rounded-lg border border-gray-300 bg-black transition-opacity duration-300 ${
                  cameraOn ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                autoPlay
                playsInline
                muted
                style={{ 
                  height: '400px', 
                  display: cameraOn ? 'block' : 'none',
                  transform: 'scaleX(-1)' // Mirror the video for better UX
                }}
              />
              
              {!cameraOn ? (
                <div className="space-y-4">
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Open Camera</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Camera Preview Box */}
                  <div className="bg-gray-100 rounded-xl p-4 border-2 border-dashed border-gray-300">
                    <div className="text-center text-sm text-gray-500 mb-2">
                      📄 Position your document in the camera view above
                    </div>
                    <div className="text-xs text-gray-400 text-center">
                      💡 Tip: Hold the camera steady and ensure good lighting for best results
                    </div>
                  </div>
                  
                  <canvas ref={canvasRef} hidden />
                  
                  <div className="flex gap-3">
                    <button
                      onClick={capturePhoto}
                      className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      </svg>
                      <span>📸 Capture & Upload</span>
                    </button>
                    <button
                      onClick={captureVideo}
                      className="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>🎥 Start Video</span>
                    </button>
                    <button
                      onClick={stopCamera}
                      className="bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>❌ Close Camera</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* File Upload Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">📁 File Upload</h3>
              
              {/* Video Upload Section */}
              <div className="mb-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <h4 className="text-sm font-medium text-emerald-900 mb-2">🎥 Video Upload</h4>
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    accept="video/*"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  />
                </div>
              </div>

              {/* Document Upload Section */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-2">📄 Document Upload</h4>
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    accept="image/*,.pdf,.doc,.docx"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Manager Activity Section - Only show for MANAGER users */}
        {isManager && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-200/50 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Manager Activity</h2>
            <p className="text-gray-600 mb-4">
              This manager&apos;s activity will be logged here. Admins cannot upload files for managers.
            </p>
            {/* You can add manager activity logs here later */}
          </div>
        )}

        {/* Uploads Display */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-200/50">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {isManager ? 'Manager Files' : 'User Files'}
          </h2>
          
          {uploads.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No files uploaded yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {uploads.map((upload) => (
                <div key={upload.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                  <div className="aspect-square mb-3 overflow-hidden rounded-lg">
                    {upload.fileType === 'VIDEO' ? (
                      <video
                        src={upload.imagePath}
                        controls
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => openImageModal(upload)}
                      />
                    ) : (
                      <img
                        src={upload.imagePath}
                        alt={upload.title || upload.name}
                        className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => openImageModal(upload)}
                      />
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      {editingId === upload.id ? (
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                            placeholder="Enter title"
                          />
                          <button
                            onClick={() => handleUpdateTitle(upload.id)}
                            className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-emerald-700 transition-all duration-200"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditingTitle('');
                            }}
                            className="bg-gray-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-700 transition-all duration-200"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <p className="text-gray-900 font-medium">
                            {upload.title || upload.name}
                          </p>
                          <button
                            onClick={() => {
                              setEditingId(upload.id);
                              setEditingTitle(upload.title || '');
                            }}
                            className="text-emerald-600 hover:text-emerald-700 text-sm"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        upload.fileType === 'VIDEO' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {upload.fileType}
                      </span>
                      
                      {!isManager && (
                        <button
                          onClick={() => handleDeleteFile(upload.id)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-500">
                      {new Date(upload.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Image/Video Modal */}
      {showImageModal && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-10"
            >
              ×
            </button>
            {selectedImage.fileType === 'VIDEO' ? (
              <video
                src={selectedImage.imagePath}
                controls
                autoPlay
                className="max-w-full max-h-full rounded-lg"
              />
            ) : (
              <img
                src={selectedImage.imagePath}
                alt={selectedImage.title || selectedImage.name}
                className="max-w-full max-h-full rounded-lg"
              />
            )}
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded">
              <p className="font-medium">{selectedImage.title || selectedImage.name}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}