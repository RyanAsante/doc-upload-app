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

interface ManagerActivity {
  id: string;
  action: string;
  details: string;
  createdAt: string;
  managerName: string;
  managerEmail: string;
  managerRole: string;
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
  const [managerActivity, setManagerActivity] = useState<ManagerActivity[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [imageDataUrls, setImageDataUrls] = useState<{[key: string]: string}>({});
  
  // Video recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Convert secure file URLs to base64 data URLs
  const convertToDataUrl = async (imagePath: string, uploadId: string) => {
    try {
      // Get the current admin's email from localStorage
      const adminEmail = localStorage.getItem('admin-email');
      if (!adminEmail) {
        console.error('Admin email not found in localStorage');
        return;
      }

      // Extract filename from the imagePath (remove /api/secure-file/ prefix)
      const fileName = imagePath.replace('/api/secure-file/', '');
      const secureFileUrl = `/api/secure-file/${fileName}`;
      
      console.log('🔄 Converting file to data URL:', { uploadId, imagePath, fileName, secureFileUrl, adminEmail });

      const response = await fetch(secureFileUrl, {
        headers: {
          'x-user-email': adminEmail
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        console.log('✅ File fetched successfully:', { uploadId, blobSize: blob.size, blobType: blob.type });
        
        const reader = new FileReader();
        reader.onloadend = () => {
          console.log('✅ Data URL created for:', uploadId);
          setImageDataUrls(prev => ({
            ...prev,
            [uploadId]: reader.result as string
          }));
        };
        reader.readAsDataURL(blob);
      } else {
        console.error('❌ Failed to fetch file:', { uploadId, status: response.status, statusText: response.statusText, imagePath });
        
        // Try to get more details about the error
        try {
          const errorText = await response.text();
          console.error('❌ Error response body:', errorText);
        } catch (e) {
          console.error('❌ Could not read error response body');
        }
      }
    } catch (error) {
      console.error('❌ Failed to convert image to data URL:', { uploadId, error, imagePath });
    }
  };

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
          setCurrentUserRole(data.user.role); // Set current user's role
          
          // Convert all images to data URLs
          data.uploads?.forEach((upload: Upload) => {
            if (upload.fileType === 'IMAGE') {
              convertToDataUrl(upload.imagePath, upload.id);
            }
          });
          
          // If this is a manager, fetch their activity
          if (data.user.role === 'MANAGER') {
            fetchManagerActivity(resolvedParams.userId);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [params]);

  const fetchManagerActivity = async (managerId: string) => {
    try {
      setLoadingActivity(true);
      const response = await fetch(`/api/admin/manager-activity/${managerId}`);
      if (response.ok) {
        const data = await response.json();
        setManagerActivity(data.managerActivity || []);
      }
    } catch (error) {
      console.error('Error fetching manager activity:', error);
    } finally {
      setLoadingActivity(false);
    }
  };

  // Function to get current manager's ID from cookies
  const getCurrentManagerId = async (): Promise<string | null> => {
    try {
      // Check if we're in a manager context by looking for manager cookies
      const response = await fetch('/api/manager/check-auth');
      
      if (response.ok) {
        const data = await response.json();
        return data.managerId || null;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error checking manager auth:', error);
      return null;
    }
  };

  // Function to check if current user is a manager
  const checkCurrentUserIsManager = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/manager/check-auth');
      
      if (response.ok) {
        return true; // If we can get manager auth, current user is a manager
      } else {
        return false;
      }
    } catch (error) {
      console.error('Error checking current user auth:', error);
      return false;
    }
  };

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

      // Try to get camera access with back camera preference and higher quality
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' }, // Prefer back camera
            width: { ideal: 1920, min: 1280 }, // 1080p preferred, 720p minimum
            height: { ideal: 1080, min: 720 },
            aspectRatio: { ideal: 1.4 },
            frameRate: { ideal: 30, min: 24 } // Smooth video
          }
        });
      } catch {
        // Fallback to front camera with same quality settings
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1920, min: 1280 }, // 1080p preferred, 720p minimum
            height: { ideal: 1080, min: 720 },
            aspectRatio: { ideal: 1.4 },
            frameRate: { ideal: 30, min: 24 } // Smooth video
          }
        });
      }

      video.srcObject = stream;
      
      video.onloadedmetadata = () => {
        video.play().then(() => {
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

  // Video recording functions
  const startVideoRecording = () => {
    if (!videoRef.current || !videoRef.current.srcObject) {
      alert('Camera must be on to start recording');
      return;
    }

    try {
      const stream = videoRef.current.srcObject as MediaStream;
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const file = new File([blob], `recorded_video_${Date.now()}.webm`, { type: 'video/webm' });
        
        // Show processing state
        setIsProcessingVideo(true);
        
        // Create a mock event object for the file upload
        const mockEvent = {
          target: { files: [file] }
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        
        handleFileUpload(mockEvent);
        setRecordedChunks([]);
        setIsRecording(false);
        setRecordingTime(0);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordedChunks(chunks);

      // Start recording timer
      const timer = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Store timer reference
      (recorder as MediaRecorder & { timer?: NodeJS.Timeout }).timer = timer;

    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to start recording. Please try again.');
    }
  };

  const stopVideoRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      
      // Clear timer
      // Clear timer
      if ((mediaRecorder as MediaRecorder & { timer?: NodeJS.Timeout }).timer) {
        clearInterval((mediaRecorder as MediaRecorder & { timer?: NodeJS.Timeout }).timer);
      }
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
    } finally {
      // Hide processing state
      setIsProcessingVideo(false);
    }
  };

  const handleDeleteFile = async (uploadId: string) => {
    try {
      // Check if the current user performing the action is a manager
      const currentUserIsManager = await checkCurrentUserIsManager();
      
      let performerId: string | undefined;
      
      if (currentUserIsManager) {
        // If it's a manager, get their ID from cookies (same as upload)
        const managerId = await getCurrentManagerId();
        if (managerId) {
          performerId = managerId;
        } else {
          return;
        }
      } else {
        // If it's an admin, use the current user ID
        performerId = user?.id;
      }
      
      const response = await fetch(`/api/admin/upload/${uploadId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deletedBy: performerId }),
      });

      if (response.ok) {
        setUploads(uploads.filter(upload => upload.id !== uploadId));
        
        // If this is a manager, refresh their activity
        if (currentUserIsManager && performerId) {
          fetchManagerActivity(performerId);
        }
      }
    } catch {
      console.error('Delete failed');
    }
  };

  const handleUpdateTitle = async (uploadId: string) => {
    try {
      // Check if the current user performing the action is a manager
      const currentUserIsManager = await checkCurrentUserIsManager();
      
      let performerId: string | undefined;
      
      if (currentUserIsManager) {
        // If it's a manager, get their ID from cookies (same as upload)
        const managerId = await getCurrentManagerId();
        if (managerId) {
          performerId = managerId;
        } else {
          return;
        }
      } else {
        // If it's an admin, use the current user ID
        performerId = user?.id;
      }
      
      const response = await fetch(`/api/admin/upload/${uploadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: editingTitle,
          updatedBy: performerId 
        }),
      });
      
      if (response.ok) {
        setUploads(uploads.map(upload => 
          upload.id === uploadId ? { ...upload, title: editingTitle } : upload
        ));
        setEditingId(null);
        setEditingTitle('');
        
        // If this is a manager, refresh their activity
        if (currentUserIsManager && performerId) {
          fetchManagerActivity(performerId);
        }
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
                <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden">
                  <img 
                    src="/AIS.jpg" 
                    alt="Asante International Shipping Logo" 
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Asante International Shipping
                </span>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">User Details</h1>
                <p className="text-gray-600"><span className="truncate block">{user.name}</span> (<span className="truncate block">{user.email}</span>)</p>
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
              <p className="text-lg text-gray-900 truncate">{user.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-lg text-gray-900 truncate">{user.email}</p>
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
            {!isManager && (
              <div>
                <p className="text-sm font-medium text-gray-500">Total Uploads</p>
                <p className="text-lg text-gray-900">{uploads.length}</p>
              </div>
            )}
          </div>
        </div>

        {/* File Upload Section - Only show for CUSTOMER users */}
        {!isManager && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-xl border border-gray-200/50 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Upload Files for <span className="truncate block">{user.name}</span></h2>
            
            {/* Camera Section */}
            <div className="mb-6">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3">📷 Quick Camera Capture</h3>
              
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>📸 Capture Photo</span>
                    </button>
                    
                    {/* Video Recording Buttons */}
                    {!isRecording ? (
                      <button
                        onClick={startVideoRecording}
                        className="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span>🎥 Start Recording</span>
                      </button>
                    ) : (
                      <button
                        onClick={stopVideoRecording}
                        className="bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                        </svg>
                        <span>⏹️ Stop Recording</span>
                      </button>
                    )}
                    
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
                  
                  {/* Recording Timer Display */}
                  {isRecording && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-red-700 font-medium">Recording: {formatRecordingTime(recordingTime)}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Video Processing Indicator */}
                  {isProcessingVideo && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-blue-700 font-medium">Processing video... Please wait</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* File Upload Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">📁 File Upload</h3>
              
              {/* Note: Video upload removed - videos are captured through camera recording */}
              
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
            {loadingActivity ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading activity...</p>
              </div>
            ) : managerActivity.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No activity logged yet for this manager.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Details
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {managerActivity.map((activity) => (
                      <tr key={activity.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {activity.action}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div className="truncate max-w-xs">{activity.details}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(activity.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Uploads Display - Only show for CUSTOMER users */}
        {!isManager && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-200/50">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">User Files</h2>
            
            {uploads.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No files uploaded yet</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {uploads.map((upload) => (
                  <div key={upload.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                    <div className="aspect-square mb-3 overflow-hidden rounded-lg">
                      {upload.fileType === 'VIDEO' ? (
                        <video
                          src={imageDataUrls[upload.id] || upload.imagePath}
                          controls
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => openImageModal(upload)}
                        />
                      ) : (
                        <img
                          src={imageDataUrls[upload.id] || upload.imagePath}
                          alt={upload.title || upload.name}
                          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMjAwIiBmaWxsPSJub25lIiB4bWxucz0iI0YzRjRGNiIvPgo8cGF0aCBkPSJNNjAgMTAwQzgwIDgwIDEyMCA4MCAxNDAgMTAwQzE2MCAxMjAgMTQwIDE0MCAxMjAgMTQwQzEwMCAxNDAgODAgMTIwIDYwIDEwMFoiIGZpbGw9IiNEMUQ1RDNCIi8+Cjwvc3ZnPg==';
                          }}
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
                            <p className="text-gray-900 font-medium truncate max-w-xs">
                              {upload.title || upload.name}
                            </p>
                            <button
                              onClick={() => {
                                setEditingId(upload.id);
                                setEditingTitle(upload.title || '');
                              }}
                              className="text-emerald-600 hover:text-emerald-700 text-sm flex-shrink-0 ml-2"
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
                        
                        <button
                          onClick={() => handleDeleteFile(upload.id)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Delete
                        </button>
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
        )}
      </div>

      {/* Enhanced Image/Video Modal */}
      {showImageModal && selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-2 sm:p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative w-full h-full max-w-7xl max-h-full flex items-center justify-center">
            {/* Video Player */}
            {selectedImage.fileType === 'VIDEO' ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <video
                  src={selectedImage.imagePath}
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
                src={selectedImage.imagePath}
                alt={selectedImage.title || selectedImage.name}
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
            
            {/* File Info Overlay */}
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg">
              <p className="font-medium text-sm sm:text-base">{selectedImage.title || selectedImage.name}</p>
              <p className="text-xs text-gray-300 mt-1">
                {selectedImage.fileType} • {new Date(selectedImage.createdAt).toLocaleDateString()}
              </p>
            </div>
            
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