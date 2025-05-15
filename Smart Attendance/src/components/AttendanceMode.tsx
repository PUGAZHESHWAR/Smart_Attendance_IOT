import React, { useState, useEffect } from 'react';
import { Clock, UserCheck, AlertCircle } from 'lucide-react';
import { io } from 'socket.io-client';
import { format } from 'date-fns';

interface AttendanceRecord {
  student_name: string;
  timestamp: string;
  status: string;
}

export default function AttendanceMode({ip}) {
  const [recentRecords, setRecentRecords] = useState<AttendanceRecord[]>([]);
  const [lastScanned, setLastScanned] = useState<AttendanceRecord | null>(null);

  useEffect(() => {
    const socket = io(`http://${ip}:5000`);

    socket.on('attendance_marked', (data) => {
      console.log(data)
      setLastScanned({
        student_name: data.name,
        timestamp: data.timestamp,
        status: 'present'
      });

      setRecentRecords(prev => [
        {
          student_name: data.name,
          timestamp: data.timestamp,
          status: 'present'
        },
        ...prev.slice(0, 9) // Keep only last 10 records
      ]);

      // Reset last scanned after 5 seconds
      setTimeout(() => {
        setLastScanned(null);
      }, 5000);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Panel - Scanning Status */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center">
            {lastScanned ? (
              <div className="space-y-4">
                <div className="w-24 h-24 bg-green-100 rounded-full mx-auto flex items-center justify-center">
                  <UserCheck className="h-12 w-12 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-green-900">Attendance Marked!</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium text-gray-900">{lastScanned.student_name}</p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(lastScanned.timestamp), 'h:mm a')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="animate-pulse space-y-4">
                <div className="w-24 h-24 bg-indigo-100 rounded-full mx-auto flex items-center justify-center">
                  <Clock className="h-12 w-12 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Waiting for Face</h2>
                <p className="text-gray-500">Make the Face to cover the bounding box</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Recent Records */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Records</h2>
          <div className="space-y-4">
            {recentRecords.length > 0 ? (
              recentRecords.map((record, index) => (
                <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{record.student_name}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(record.timestamp), 'h:mm a')}
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                    {record.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-gray-500">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No recent records</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}