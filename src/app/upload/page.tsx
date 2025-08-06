'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

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
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      console.log("Stream started:", stream);
  
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

  const captureImage = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (canvas && video) {
      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const capturedFile = new File([blob], 'captured.jpg', { type: 'image/jpeg' });
          setFile(capturedFile);
          setStatus('Photo captured!');
          stopCamera();
        }
      }, 'image/jpeg');
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
    <div className="p-10 max-w-2xl mx-auto space-y-4">
    <div className="flex justify-end">
      <button
        onClick={handleLogout}
        className="text-sm text-gray-600 underline hover:text-black"
      >
        Logout
      </button>
    </div>
        
      <h1 className="text-2xl font-bold mb-4">Upload Document</h1>

      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="w-full"
      />

      {!cameraOn ? (
        <button
          onClick={startCamera}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Open Camera
        </button>
      ) : (
        <>
          <video ref={videoRef} className="w-full max-w-sm rounded border" 
           autoPlay
           playsInline
           muted
          />
          <canvas ref={canvasRef} hidden />
          <div className="flex gap-4 mt-2">
            <button
              onClick={captureImage}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Capture Photo
            </button>
            <button
              onClick={stopCamera}
              className="bg-red-600 text-white px-4 py-2 rounded"
            >
              Cancel Camera
            </button>
          </div>
        </>
      )}

      <button
        onClick={handleSubmit}
        className="bg-black text-white px-4 py-2 rounded mt-4"
      >
        Upload
      </button>

      {status && <p className="mt-2 text-sm text-gray-700">{status}</p>}
    </div>
  );
}
