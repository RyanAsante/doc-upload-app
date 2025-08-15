'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type Upload = {
  id: string;
  title: string | null;
  name: string;
  imagePath: string;
  fileType: string;
  createdAt: string;
};

export default function ManagerUserPage() {
  const { userId } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [editingId, setEditingId] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (userId) {
      fetch(`/api/admin/user/${userId}`)
        .then((res) => res.json())
        .then((data) => {
          setUser(data.user);
          setUploads(data.uploads);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [userId]);

  const startCamera = async () => {
    try {
      setCameraStarting(true);
      setUploadStatus('Starting camera...');
      
      // Check if video element exists
      if (!videoRef.current) {
        console.error('Video element not found, waiting for element...');
        // Wait for video element to be ready
        await new Promise(resolve => setTimeout(resolve, 500));
        if (!videoRef.current) {
          throw new Error('Video element not found. Please refresh the page and try again.');
        }
      }
      
      // Check if camera is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser');
      }
      
      console.log('Video element found:', videoRef.current);
      
      // Request camera access with back camera preference and document-friendly dimensions
      let stream;
      try {
        // First try to get back camera with higher quality settings
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            width: { ideal: 1920, min: 1280 }, // 1080p preferred, 720p minimum
            height: { ideal: 1080, min: 720 },
            facingMode: 'environment', // Prefer back camera
            aspectRatio: { ideal: 1.4 }, // Closer to A4 paper ratio
            frameRate: { ideal: 30, min: 24 } // Smooth video
          } 
        });
      } catch (err) {
        console.log('Back camera not available, trying front camera...');
        // Fallback to front camera if back camera fails with same quality
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            width: { ideal: 1920, min: 1280 }, // 1080p preferred, 720p minimum
            height: { ideal: 1080, min: 720 },
            facingMode: 'user', // Front camera fallback
            aspectRatio: { ideal: 1.4 },
            frameRate: { ideal: 30, min: 24 } // Smooth video
          } 
        });
      }
      
      console.log('Camera stream obtained:', stream);
      
      const video = videoRef.current;
      
      // Set the stream as the video source
      video.srcObject = stream;
      
      // Ensure video is visible
      video.style.display = 'block';
      video.style.backgroundColor = '#000';
      
      // Wait for video to be ready
      video.onloadedmetadata = () => {
        console.log('Video metadata loaded, dimensions:', video.videoWidth, 'x', video.videoHeight);
        
        // Force video to play
        video.play().then(() => {
          console.log('Video playing successfully');
          setCameraOn(true);
          setCameraStarting(false);
          setUploadStatus('Camera ready! Position document in view.');
          
          // Clear status after 3 seconds
          setTimeout(() => setUploadStatus(''), 3000);
        }).catch((err) => {
          console.error('Error playing video:', err);
          setCameraStarting(false);
          setUploadStatus('Error playing video. Please try again.');
        });
      };
      
      // Handle video errors
      video.onerror = (err) => {
        console.error('Video error:', err);
        setCameraStarting(false);
        setUploadStatus('Camera error. Please try again.');
      };
      
      // Handle video load start
      video.onloadstart = () => {
        console.log('Video load started');
      };
      
      // Handle video can play
      video.oncanplay = () => {
        console.log('Video can play');
      };
      
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraStarting(false);
      setUploadStatus(`Camera error: ${err instanceof Error ? err.message : 'Unknown error'}. Please use file upload instead.`);
      // Clear status after 5 seconds
      setTimeout(() => setUploadStatus(''), 5000);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setCameraOn(false);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `captured_${Date.now()}.jpg`, { type: 'image/jpeg' });
            handleFileUpload(file);
          }
        }, 'image/jpeg');
      }
    }
  };

  const handleFileUpload = async (file: File | React.ChangeEvent<HTMLInputElement>) => {
    let selectedFile: File | undefined;
    
    if (file instanceof File) {
      selectedFile = file;
    } else {
      selectedFile = file.target.files?.[0];
    }

    if (!selectedFile || !user) return;

    setUploading(true);
    setUploadStatus('Uploading file...');

    const formData = new FormData();
    formData.append('document', selectedFile);
    formData.append('customerEmail', user.email); // Customer the file is for

    try {
      const response = await fetch('/api/manager/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setUploadStatus('File uploaded successfully!');
        // Refresh the uploads list
        const userResponse = await fetch(`/api/admin/user/${userId}`);
        const userData = await userResponse.json();
        setUploads(userData.uploads);
        setUser(userData.user);
      } else {
        setUploadStatus('Upload failed. Please try again.');
      }
    } catch {
      setUploadStatus('An error occurred during upload.');
    } finally {
      setUploading(false);
      setTimeout(() => setUploadStatus(''), 3000);
    }
  };

  const handleDeleteFile = async (uploadId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    
    try {
      const response = await fetch(`/api/admin/upload/${uploadId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          deletedBy: user?.id // Pass the manager's ID for activity logging
        }),
      });
      
      if (response.ok) {
        setUploads(uploads.filter(upload => upload.id !== uploadId));
        setUploadStatus('File deleted successfully!');
        setTimeout(() => setUploadStatus(''), 3000);
      } else {
        setUploadStatus('Failed to delete file.');
      }
    } catch {
      setUploadStatus('An error occurred while deleting.');
    }
  };

  const handleUpdateTitle = async (uploadId: string, newTitle: string) => {
    try {
      const response = await fetch(`/api/admin/upload/${uploadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: newTitle,
          updatedBy: user?.id // Pass the manager's ID for activity logging
        }),
      });
      
      if (response.ok) {
        setUploads(uploads.map(upload => 
          upload.id === uploadId ? { ...upload, title: newTitle } : upload
        ));
        setEditingId('');
        setEditingTitle('');
        setUploadStatus('Title updated successfully!');
        setTimeout(() => setUploadStatus(''), 3000);
      } else {
        setUploadStatus('Failed to update title.');
      }
    } catch {
      setUploadStatus('An error occurred while updating title.');
    }
  };

  const openImageModal = (imagePath: string) => {
    setSelectedImage(imagePath);
    setShowImageModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">User not found</h2>
          <button
            onClick={() => router.push('/manager')}
            className="text-emerald-600 hover:text-emerald-700"
          >
            Back to Manager Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <button onClick={() => router.push('/')} className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">V</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">User Details</h1>
                <p className="text-sm text-gray-500">View user information and uploads</p>
              </div>
            </button>
            <button onClick={() => router.push('/manager')} className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Manager Dashboard</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-emerald-100 rounded-lg">
                <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Name</p>
                <p className="text-lg font-semibold text-gray-900">{user.name}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-teal-100 rounded-lg">
                <svg className="h-6 w-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Email</p>
                <p className="text-lg font-semibold text-gray-900">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Uploads</p>
                <p className="text-lg font-semibold text-gray-900">{uploads.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* File Upload Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Document for {user.name}</h2>
          
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
                display: cameraOn ? 'block' : 'none'
                // Removed transform: 'scaleX(-1)' to fix orientation
              }}
            />
            
            {!cameraOn ? (
              <div className="space-y-4">
                <button
                  onClick={startCamera}
                  disabled={cameraStarting}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                    cameraStarting
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {cameraStarting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Starting Camera...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Open Camera</span>
                    </>
                  )}
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
                    onClick={captureImage}
                    className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    </svg>
                    <span>📸 Capture & Upload</span>
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
                  disabled={uploading}
                  accept="video/*"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
                {uploading && (
                  <div className="flex items-center space-x-2 text-emerald-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                    <span>Uploading...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Document Upload Section */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-2">📄 Document Upload</h4>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  accept="image/*,.pdf,.doc,.docx"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                />
                {uploading && (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    <span>Uploading...</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {uploadStatus && (
            <div className={`mt-3 p-3 rounded-lg ${
              uploadStatus.includes('successfully')
                ? 'bg-green-50 border border-green-200 text-green-700'
                : uploadStatus.includes('failed') || uploadStatus.includes('error')
                ? 'bg-red-50 border border-red-200 text-red-700'
                : 'bg-blue-50 border border-blue-200 text-blue-700'
            }`}>
              {uploadStatus}
            </div>
          )}
        </div>

        {/* Uploads Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Uploaded Documents</h2>
          </div>
          
          {uploads.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No uploads yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                This user hasn&apos;t uploaded any documents.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {uploads.map((upload) => (
                <div key={upload.id} className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200/50 hover:shadow-lg transition-shadow duration-200">
                  <div 
                    className="aspect-w-16 aspect-h-9 cursor-pointer"
                    onClick={() => openImageModal(upload.imagePath)}
                  >
                    {upload.fileType === 'VIDEO' ? (
                      <video
                        src={upload.imagePath}
                        className="w-full h-48 object-cover"
                        controls
                      />
                    ) : (
                      <img
                        src={upload.imagePath}
                        alt={upload.title || upload.name}
                        className="w-full h-48 object-cover"
                      />
                    )}
                  </div>
                  <div className="p-4">
                    {/* Title editing */}
                    {editingId === upload.id ? (
                      <div className="mb-2">
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-gray-900 placeholder-gray-400"
                          placeholder="Enter title..."
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleUpdateTitle(upload.id, editingTitle)}
                            className="text-xs bg-emerald-600 text-white px-2 py-1 rounded hover:bg-emerald-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingId('');
                              setEditingTitle('');
                            }}
                            className="text-xs bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">
                            {upload.title || 'Untitled'}
                          </span>
                          <button
                            onClick={() => {
                              setEditingId(upload.id);
                              setEditingTitle(upload.title || '');
                            }}
                            className="text-xs text-emerald-600 hover:text-emerald-700"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center">
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(upload.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <button
                        onClick={() => handleDeleteFile(upload.id)}
                        className="text-red-600 hover:text-red-700 text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div className="max-w-4xl max-h-full">
            <img
              src={selectedImage}
              alt="Full size"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
