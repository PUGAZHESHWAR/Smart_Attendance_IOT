import React, { useState } from 'react';
import { UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
// import { UserPlus, CheckCircle, AlertCircle } from "lucide-react";
import axios from 'axios';

export default function AddStudent({ip}) {
  const [formData, setFormData] = useState({
    Name: '',
    Roll_No: '510422243',
    DOB : '2004-07-02',
    Blood_Group : '',
    Phone : '',
    Dept : '',
    Batch : '',
    Card_Id: '',

  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.post(`http://${ip}:5000/api/students`, formData);
      setMessage({ type: 'success', text: 'Student added successfully!' });
      setFormData({
        Name: '',
        Roll_No: '510422243',
        DOB : '2004-07-02',
        Blood_Group : '',
        Phone : '',
        Dept : '',
        Batch : '',
        Card_Id: '',
    
      });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Error adding student'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="max-w-3xl mx-auto p-8">
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="flex items-center mb-6">
        <UserPlus className="h-7 w-7 text-indigo-600 mr-3" />
        <h2 className="text-2xl font-bold text-gray-900">Add New Student</h2>
      </div>

      {message.text && (
        <div className={`mb-4 p-4 rounded-lg flex items-center text-sm font-medium ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.type === 'success' ? <CheckCircle className="h-5 w-5 mr-2" /> : <AlertCircle className="h-5 w-5 mr-2" />}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input type="text" name="Name" value={formData.Name} onChange={handleChange} required className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Full Name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Roll Number</label>
            <input type="text" name="Roll_No" value={formData.Roll_No} onChange={handleChange} required className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Roll Number" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">DOB</label>
            <input type="date" name="DOB" value={formData.DOB} onChange={handleChange} required className="@apply w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white appearance-none;" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Blood Group</label>
            <select name="Blood_Group" value={formData.Blood_Group} onChange={handleChange} required className="@apply w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white appearance-none;">
              <option value="">Select Blood Group</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input type="number" name="Phone" value={formData.Phone} onChange={handleChange} required className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Phone Number" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Department</label>
            <select name="Dept" value={formData.Dept} onChange={handleChange} required className="@apply w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white appearance-none;">
              <option value="">Select Department</option>
              <option value="AI&DS">AI&DS</option>
              <option value="AI&ML">AI&ML</option>
              <option value="CSE">CSE</option>
              <option value="CYBER SECURITY">CYBER SECURITY</option>
              <option value="IT">IT</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Batch</label>
            <select name="Batch" value={formData.Batch} onChange={handleChange} required className="@apply w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white appearance-none;">
              <option value="">Select Batch</option>
              <option value="2021-2025">2021-2025</option>
              <option value="2022-2026">2022-2026</option>
              <option value="2023-2027">2023-2027</option>
              <option value="2024-2028">2024-2028</option>
            </select>
          </div>
          {/* <div>
            <label className="block text-sm font-medium text-gray-700">Card ID</label>
            <input type="text" name="Card_Id" value={formData.Card_Id} onChange={handleChange} required className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Card ID" />
          </div> */}
        </div>

        <button type="submit" disabled={isLoading} className={`w-full py-3 text-white font-semibold rounded-lg shadow-md text-lg transition ${isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
          {isLoading ? 'Adding Student...' : 'Add Student'}
        </button>
      </form>
    </div>
  </div>
  );
}