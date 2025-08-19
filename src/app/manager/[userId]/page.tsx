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
  console.log('🔄 ManagerUserPage component loaded - START');
  
  // Check localStorage immediately
  const managerEmail = localStorage.getItem('manager-email');
  console.log('🔄 localStorage check on component load:', { managerEmail });
  
  console.log('🔄 ManagerUserPage component loaded - END');
  
  // Test localStorage functionality
  const testLocalStorage = () => {
    console.log('🧪 Testing localStorage...');
    localStorage.setItem('test-key', 'test-value');
    const testValue = localStorage.getItem('test-key');
    console.log('🧪 Test localStorage result:', testValue);
    
    // Check all localStorage items
    console.log('🧪 All localStorage items:');
    Object.keys(localStorage).forEach(key => {
      console.log(`  ${key}: ${localStorage.getItem(key)}`);
    });
  };
  
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
      console.log('🔄 convertToDataUrl called with:', { imagePath, uploadId });
      
      // Get the current manager's email from localStorage
      const managerEmail = localStorage.getItem('manager-email');
      console.log('🔄 Manager email from localStorage:', managerEmail);
      
      if (!managerEmail) {
        console.error('❌ Manager email not found in localStorage');
        return;
      }

      // Handle different file path types
      let fileName: string;
      let secureFileUrl: string;
      
      if (imagePath.includes('supabase.co')) {
        // This is a Supabase URL - extract the filename from the end
        console.log('⚠️ Detected Supabase URL, extracting filename from end');
        fileName = imagePath.split('/').pop() || 'unknown';
        // For Supabase URLs, we need to use the full URL directly
        secureFileUrl = imagePath;
      } else if (imagePath.startsWith('/api/secure-file/')) {
        // This is a secure-file path - extract filename
        fileName = imagePath.replace('/api/secure-file/', '');
        secureFileUrl = `/api/secure-file/${fileName}`;
      } else {
        // Unknown path format
        console.log('⚠️ Unknown file path format:', imagePath);
        fileName = 'unknown';
        secureFileUrl = imagePath;
      }
      
      console.log('🔄 Converting file to data URL:', { uploadId, imagePath, fileName, secureFileUrl, managerEmail });

      const response = await fetch(secureFileUrl, {
        headers: {
          'x-user-email': managerEmail
        }
      });

      console.log('🔄 Fetch response received:', { uploadId, status: response.status, statusText: response.statusText });

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
    console.log('🔄 useEffect triggered with userId:', userId);
    console.log('🔄 useEffect dependencies:', { userId, userIdType: typeof userId });
    
    if (userId) {
      console.log('🔄 Fetching user data from:', `/api/admin/user/${userId}`);
      fetch(`/api/admin/user/${userId}`)
        .then((res) => {
          console.log('🔄 Response status:', res.status);
          console.log('🔄 Response headers:', Object.fromEntries(res.headers.entries()));
          return res.json();
        })
        .then((data) => {
          console.log('🔄 Received data:', { 
            user: data.user, 
            uploadsCount: data.uploads?.length || 0,
            uploads: data.uploads 
          });
          
          setUser(data.user);
          setUploads(data.uploads);
          
          // Convert all files to data URLs (both IMAGE and VIDEO)
          console.log('🔄 Starting to convert uploads:', data.uploads?.length || 0);
          if (data.uploads && data.uploads.length > 0) {
            data.uploads.forEach((upload: Upload) => {
              console.log('🔄 Processing upload:', { id: upload.id, fileType: upload.fileType, imagePath: upload.imagePath });
              
              // Process both IMAGE and VIDEO files
              if (upload.fileType === 'IMAGE' || upload.fileType === 'VIDEO') {
                // Only convert if not already converted
                if (!imageDataUrls[upload.id]) {
                  console.log('🔄 Calling convertToDataUrl for', upload.fileType, ':', upload.id);
                  convertToDataUrl(upload.imagePath, upload.id);
                } else {
                  console.log('🔄 File already converted, skipping:', upload.id);
                }
              } else {
                console.log('🔄 Skipping unsupported file type:', { id: upload.id, fileType: upload.fileType });
              }
            });
          } else {
            console.log('🔄 No uploads found in data');
          }
          
          // Debug: Check if imageDataUrls state is being updated
          console.log('🔄 Current imageDataUrls state:', imageDataUrls);
          
          setLoading(false);
        })
        .catch((error) => {
          console.error('❌ Error fetching user data:', error);
          setLoading(false);
        });
    } else {
      console.log('🔄 No userId provided');
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
      
      const video = videoRef.current;
      
      // Set the stream as the video source
      video.srcObject = stream;
      
      // Ensure video is visible
      video.style.display = 'block';
      video.style.backgroundColor = '#000';
      
      // Wait for video to be ready
      video.onloadedmetadata = () => {
        // Force video to play
        video.play().then(() => {
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

  // Video recording functions
  const startVideoRecording = () => {
    if (!videoRef.current || !videoRef.current.srcObject) {
      setUploadStatus('Camera must be on to start recording');
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
        
        handleFileUpload(file);
        setRecordedChunks([]);
        setIsRecording(false);
        setRecordingTime(0);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordedChunks(chunks);
      setUploadStatus('Recording started... Press Stop Recording to finish.');

      // Start recording timer
      const timer = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Store timer reference
      (recorder as MediaRecorder & { timer?: NodeJS.Timeout }).timer = timer;

    } catch (error) {
      console.error('Error starting recording:', error);
      setUploadStatus('Failed to start recording. Please try again.');
    }
  };

  const stopVideoRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      
      // Clear timer
      if ((mediaRecorder as MediaRecorder & { timer?: NodeJS.Timeout }).timer) {
        clearInterval((mediaRecorder as MediaRecorder & { timer?: NodeJS.Timeout }).timer);
      }
      
      setUploadStatus('Processing recorded video...');
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
      setIsProcessingVideo(false);
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
          
          {/* Debug button for testing localStorage */}
          <div className="mt-2">
            <button 
              onClick={testLocalStorage}
              className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
            >
              🧪 Test localStorage
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
              <div className="p-3 bg-emerald-100 rounded-lg flex-shrink-0">
                <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="ml-4 min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600">Name</p>
                <p className="text-lg font-semibold text-gray-900 truncate">{user.name}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-teal-100 rounded-lg flex-shrink-0">
                <svg className="h-6 w-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4 min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600">Email</p>
                <p className="text-lg font-semibold text-gray-900 truncate">{user.email}</p>
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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Document for <span className="truncate block">{user.name}</span></h2>
          
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
                      <span className="text-blue-700 font-medium">Processing video... This may take some time</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

            {/* File Upload Section - Updated with enhanced UI components */}
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
                    onClick={() => {
                      // Use data URL if available, otherwise use the original path
                      const imageSource = imageDataUrls[upload.id] || upload.imagePath;
                      setSelectedImage(imageSource);
                      setShowImageModal(true);
                    }}
                  >
                    {upload.fileType === 'VIDEO' ? (
                      <video
                        src={imageDataUrls[upload.id] || upload.imagePath}
                        className="w-full h-48 object-cover"
                        controls
                      />
                    ) : (
                      <img
                        src={imageDataUrls[upload.id] || upload.imagePath}
                        alt={upload.title || upload.name}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMjAwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI0YzRjRGNiIvPgo8cGF0aCBkPSJNNjAgMTAwQzgwIDgwIDEyMCA4MCAxNDAgMTAwQzE2MCAxMjAgMTQwIDE0MCAxMjAgMTQwQzEwMCAxNDAgODAgMTIwIDYwIDEwMFoiIGZpbGw9IiNEMUQ1RDNCIi8+Cjwvc3ZnPg==';
                        }}
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
                          <span className="text-sm font-medium text-gray-900 truncate max-w-xs">
                            {upload.title || 'Untitled'}
                          </span>
                          <button
                            onClick={() => {
                              setEditingId(upload.id);
                              setEditingTitle(upload.title || '');
                            }}
                            className="text-xs text-emerald-600 hover:text-emerald-700 flex-shrink-0 ml-2"
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
