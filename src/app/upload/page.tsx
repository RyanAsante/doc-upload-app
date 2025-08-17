'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import FileUpload from '@/components/FileUpload';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState('');
  const [cameraOn, setCameraOn] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const router = useRouter();

useEffect(() => {
  const email = localStorage.getItem('userEmail');
  if (!email) {
    router.push('/login'); // Redirect if no session
  }
}, [router]);

const handleLogout = () => {
    localStorage.removeItem('userEmail');
    router.push('/login');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const startCamera = async () => {
    try {
      setCameraOn(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 1920, min: 1280 }, // 1080p preferred, 720p minimum
          height: { ideal: 1080, min: 720 },
          frameRate: { ideal: 30, min: 24 } // Smooth video
        } 
      });
  
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error starting camera:", err);
      setStatus("Camera access failed.");
    }
  };
  const stopCamera = () => {
    setCameraOn(false);
    const stream = videoRef.current?.srcObject as MediaStream | null;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  const captureImage = async () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (canvas && video) {
      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      canvas.toBlob(async (blob) => {
        if (blob) {
          const capturedFile = new File([blob], 'captured.jpg', { type: 'image/jpeg' });
          setFile(capturedFile);
          setStatus('Photo captured! Uploading...');
          stopCamera();
          
          // Auto-upload the captured image
          await uploadCapturedImage(capturedFile);
        }
      }, 'image/jpeg');
    }
  };

  const uploadCapturedImage = async (file: File) => {
    const formData = new FormData();
    formData.append('document', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'x-user-email': localStorage.getItem('userEmail') || '', 
        },
        body: formData,
      });

      if (res.ok) {
        setStatus('✅ Photo uploaded successfully!');
        setFile(null);
      } else {
        setStatus('❌ Upload failed.');
      }
    } catch (err) {
      console.error(err);
      setStatus('❌ An error occurred during upload.');
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setStatus('Please select or capture a document.');
      return;
    }


    const formData = new FormData();
    formData.append('document', file);

    try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'x-user-email': localStorage.getItem('userEmail') || '', 
    },
        body: formData,
     });

      if (res.ok) {
        setStatus('Document uploaded successfully.');
        setFile(null);
      } else {
        setStatus('Upload failed.');
      }
    } catch (err) {
      console.error(err);
      setStatus('An error occurred during upload.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Documents</h1>
            <p className="text-gray-600">Drag and drop your files or use the camera to capture documents</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 underline hover:text-black"
          >
            Logout
          </button>
        </div>

        {/* Camera Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Camera Capture</h2>
          
          {!cameraOn ? (
            <button
              onClick={startCamera}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              📷 Open Camera
            </button>
          ) : (
            <div className="space-y-4">
              <video 
                ref={videoRef} 
                className="w-full max-w-md rounded-lg border border-gray-300" 
                autoPlay
                playsInline
                muted
              />
              <canvas ref={canvasRef} hidden />
              <div className="flex gap-4">
                <button
                  onClick={captureImage}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                >
                  📸 Capture Photo
                </button>
                <button
                  onClick={stopCamera}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
                >
                  ❌ Cancel Camera
                </button>
              </div>
            </div>
          )}
          
          {status && (
            <div className="mt-4 p-3 rounded-lg bg-gray-50 border">
              <p className="text-sm text-gray-700">{status}</p>
            </div>
          )}
        </div>

        {/* Drag & Drop Upload Section */}
        <FileUpload />
        
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
