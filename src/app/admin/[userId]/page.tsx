'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';

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
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

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

  // Ensure video element is properly initialized
  useEffect(() => {
    if (videoRef.current) {
      console.log('Video element initialized:', videoRef.current);
      setVideoReady(true);
    }
  }, []);

  const startCamera = async () => {
    try {
      setCameraStarting(true);
      setUploadStatus('Starting camera...');
      
      // Check if video element is ready
      if (!videoReady || !videoRef.current) {
        console.error('Video not ready, waiting for element...');
        // Wait for video element to be ready
        await new Promise(resolve => setTimeout(resolve, 500));
        if (!videoRef.current) {
          throw new Error('Video element not ready. Please refresh the page and try again.');
        }
      }
      
      // Check if camera is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser');
      }
      
      console.log('Video element found:', videoRef.current);
      
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
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

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'x-user-email': user.email,
        },
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
      // Clear status after 3 seconds
      setTimeout(() => setUploadStatus(''), 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading user data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 rounded-full p-4 mx-auto w-fit">
            <svg className="h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">User not found</h3>
          <p className="mt-2 text-gray-500">The requested user could not be found.</p>
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
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/')}
                className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
              >
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">V</span>
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">User Details</h1>
                  <p className="text-sm text-gray-500">View user information and uploads</p>
                </div>
              </button>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Users</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200/50">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Name</p>
                <p className="text-lg font-semibold text-gray-900">{user.name}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200/50">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Email</p>
                <p className="text-lg font-semibold text-gray-900">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200/50">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            {!cameraOn ? (
              <button
                onClick={startCamera}
                disabled={cameraStarting || !videoReady}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                  cameraStarting || !videoReady
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {cameraStarting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Starting Camera...</span>
                  </>
                ) : !videoReady ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
                    <span>Initializing...</span>
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
            ) : (
              <div className="space-y-4">
                {/* Camera Preview Box */}
                <div className="bg-gray-100 rounded-xl p-4 border-2 border-dashed border-gray-300">
                  <video 
                    ref={videoRef} 
                    className="w-full h-64 object-cover rounded-lg border border-gray-300 bg-black" 
                    autoPlay
                    playsInline
                    muted
                    style={{ minHeight: '256px', display: 'block' }}
                  />
                  <div className="mt-2 text-center text-sm text-gray-500">
                    Camera is active - position document in view
                  </div>
                  {/* Debug info */}
                  <div className="mt-2 text-xs text-gray-400 text-center">
                    Video element should show camera feed above
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
            <div className="flex items-center space-x-4">
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={uploading}
                accept="image/*,.pdf,.doc,.docx"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {uploading && (
                <div className="flex items-center space-x-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>Uploading...</span>
                </div>
              )}
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
                  <div className="aspect-w-16 aspect-h-9">
                    <img
                      src={upload.imagePath}
                      alt="Uploaded document"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center text-sm text-gray-500">
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}