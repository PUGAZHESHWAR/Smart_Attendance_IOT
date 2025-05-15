import React, { useEffect, useState } from 'react';
import { BarChart, Users, UserCheck, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';

interface Student {
  id: number;
  Roll_No: string;
  Dept: string;
  Name: string;
}

interface Attendance {
  id: number;
  student_id: number;
  student_name: string;
  timestamp: string;
  status: string;
}

export default function Dashboard({ip}) {
  const [students, setStudents] = useState<Student[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<Attendance[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const studentsRes = await axios.get(`http://${ip}:5000/api/students`);
        const attendanceRes = await axios.get(`http://${ip}:5000/api/attendance/today`);
        
        setStudents(studentsRes.data);
        setTodayAttendance(attendanceRes.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Merge attendance data with student details
  let i = 0;
  const presentStudents = todayAttendance.map((record) => {
    const student = students.find((s) => s.id === record.student_id);
    return student
      ? {
          ...record,
          S_No: i++,
          Roll_No: student.Roll_No,
          Dept: student.Dept,
        }
      : record;
  });

  // Find absent students
  const absentStudents = students
    .filter((student) => !todayAttendance.some((att) => att.student_id === student.id))
    .map((student) => ({
      id: student.id,
      S_No: i++,
      Roll_No: student.Roll_No,
      student_name: student.Name,
      Dept: student.Dept,
      timestamp: "-",
      status: "Absent",
    }));

  // Combine both lists
  const attendanceList = [...presentStudents, ...absentStudents];

  return (
    <div className="p-6 space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Total Students</p>
              <p className="text-2xl font-semibold text-blue-900">{students.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <UserCheck className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Present Today</p>
              <p className="text-2xl font-semibold text-green-900">{todayAttendance.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <BarChart className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-600">Attendance Rate</p>
              <p className="text-2xl font-semibold text-purple-900">
                {students.length ? Math.round((todayAttendance.length / students.length) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Attendance */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Today's Attendance
          </h2>
          {attendanceList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      S.No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Roll No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dept
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendanceList.map((record,index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.S_No+1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.Roll_No}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {record.student_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.Dept}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.timestamp !== "-" ? format(new Date(record.timestamp), "h:mm a") : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${record.status === "Absent" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>No attendance records for today</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
