# Smart Attendance System Backend

This is the backend server for the Smart Attendance System, built with Flask and MySQL.

## Setup Instructions

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set up MySQL database:
   - Create a new MySQL database named `smart_attendance`
   - Update the `.env` file with your MySQL credentials

4. Initialize the database:
   ```bash
   flask db upgrade
   ```

5. Run the server:
   ```bash
   python app.py
   ```

## API Endpoints

### Students
- GET `/api/students` - Get all students
- POST `/api/students` - Add a new student

### Attendance
- POST `/api/attendance` - Mark attendance
- GET `/api/attendance/today` - Get today's attendance

### Testing
- POST `/api/simulate-card` - Simulate card detection (for testing without ESP32)

## WebSocket Events

The server uses Socket.IO for real-time updates:
- `attendance_marked` - Emitted when new attendance is marked