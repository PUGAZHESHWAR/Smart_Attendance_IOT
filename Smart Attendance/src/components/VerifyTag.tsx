import React, { useState, useEffect } from 'react';
import { Camera, CheckCircle, X, Upload, UserCheck, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';

interface Student {
  id: string;
  Name: string;
  Roll_No: string;
  DOB: string;
  Blood_Group: string;
  Phone: string;
  Dept: string;
  Batch: string;
  Card_Id: string;
}

export default function VerifyTag({ ip }: { ip: string }) {
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [unassignedCards, setUnassignedCards] = useState<string[]>([]);
  const [student, setStudent] = useState<Student | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    const newSocket = io(`http://${ip}:5000`);
    setSocket(newSocket);
    
    newSocket.on('connect', () => {
      console.log('Connected to server');
    });

    newSocket.on('camera_frame', (data) => {
      setImageUrl(`data:image/jpeg;base64,${data.image}`);
    });

    newSocket.on('image_captured', (data) => {
      setSuccess('Image captured and saved successfully');
      setShowCamera(false);
      setLoading(false);
      fetchUnassignedCards();
    });

    newSocket.on('camera_error', (data) => {
      setError(data.message);
      setLoading(false);
      setShowCamera(false);
    });

    fetchUnassignedCards();

    return () => {
      newSocket.disconnect();
    };
  }, [ip]);

  const fetchUnassignedCards = async () => {
    try {
      const response = await axios.get(`http://${ip}:5000/api/unassigned-cards`);
      setUnassignedCards(response.data);
    } catch (err) {
      setError('Failed to fetch unassigned cards');
      console.error('Error fetching unassigned cards:', err);
    }
  };

  const handleCardSelect = async (cardId: string) => {
    setSelectedCardId(cardId);
    setIsVerified(false);
    setError('');
    setSuccess('');
    setShowCamera(false);
    
    try {
      const response = await axios.get(`http://${ip}:5000/api/students`);
      const students = response.data;
      const selectedStudent = students.find((s: Student) => s.Card_Id === cardId);
      if (selectedStudent) {
        setStudent(selectedStudent);
      }
    } catch (err) {
      setError('Failed to fetch student details');
      console.error('Error fetching student details:', err);
    }
  };

  const handleVerify = () => {
    setIsVerified(true);
    setSuccess('Student details verified successfully');
  };

  const startCamera = async () => {
    try {
      setLoading(true);
      setError('');
      await axios.post(`http://${ip}:5000/api/start-camera`);
      setShowCamera(true);
    } catch (err) {
      setError('Failed to start camera');
      console.error('Error starting camera:', err);
    } finally {
      setLoading(false);
    }
  };

  const captureImage = async () => {
    try {
      setLoading(true);
      await axios.post(`http://${ip}:5000/api/capture-image`, {
        card_id: selectedCardId
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to capture image');
      setLoading(false);
    }
  };

  const stopCamera = async () => {
    try {
      await axios.post(`http://${ip}:5000/api/stop-camera`);
      setShowCamera(false);
      setImageUrl('');
    } catch (err) {
      console.error('Error stopping camera:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Card Selection */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
          <UserCheck className="w-6 h-6 mr-2 text-indigo-600" />
          Assign Image to Card
        </h2>
        
        <div className="space-y-6">
          <div>
            <label htmlFor="cardId" className="block text-sm font-medium text-gray-700 mb-2">
              Select Unassigned Card ID
            </label>
            <select
              id="cardId"
              value={selectedCardId}
              onChange={(e) => handleCardSelect(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select a card ID</option>
              {unassignedCards.map(cardId => (
                <option key={cardId} value={cardId}>{cardId}</option>
              ))}
            </select>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                <p className="text-green-700">{success}</p>
              </div>
            </div>
          )}

          {student && (
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Student Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Name: <span className="font-medium text-gray-900">{student.Name}</span></p>
                  <p className="text-sm text-gray-600">Roll No: <span className="font-medium text-gray-900">{student.Roll_No}</span></p>
                  <p className="text-sm text-gray-600">Department: <span className="font-medium text-gray-900">{student.Dept}</span></p>
                  <p className="text-sm text-gray-600">Batch: <span className="font-medium text-gray-900">{student.Batch}</span></p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">DOB: <span className="font-medium text-gray-900">{student.DOB}</span></p>
                  <p className="text-sm text-gray-600">Blood Group: <span className="font-medium text-gray-900">{student.Blood_Group}</span></p>
                  <p className="text-sm text-gray-600">Phone: <span className="font-medium text-gray-900">{student.Phone}</span></p>
                  <p className="text-sm text-gray-600">Card ID: <span className="font-medium text-gray-900">{student.Card_Id}</span></p>
                </div>
              </div>
              
              <div className="mt-6">
                <button
                  onClick={handleVerify}
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Verify Details
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Camera Section */}
      {isVerified && (
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Camera className="w-6 h-6 mr-2 text-indigo-600" />
            Capture Image
          </h3>
          
          <div className="space-y-4">
            {!showCamera ? (
              <button
                onClick={startCamera}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Camera className="w-5 h-5 mr-2" />
                Start Camera
              </button>
            ) : (
              <div className="space-y-4">
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt="Camera Feed"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={captureImage}
                    disabled={loading}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    {loading ? 'Processing...' : 'Capture Image'}
                  </button>
                  <button
                    onClick={stopCamera}
                    disabled={loading}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="w-5 h-5 mr-2" />
                    Stop Camera
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}