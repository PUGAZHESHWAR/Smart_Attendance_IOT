from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime,date
from sqlalchemy import and_
import os
import face_recognition
from dotenv import load_dotenv
import numpy as np
import random
import cv2
import platform
# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

rand_id = []
# Path to images folder


# Path to images folder
images_path = "Images"

# Dictionary to store face encodings
data_dict = {}

# Process each image in the folder
for image_name in os.listdir(images_path):
    if image_name.endswith(('.jpg', '.png', '.jpeg')):
        card_id = os.path.splitext(image_name)[0]  # Extract card_id from filename
        image_path = os.path.join(images_path, image_name)
        image = face_recognition.load_image_file(image_path)
        face_encodings = face_recognition.face_encodings(image)
        
        # Store encodings if a face is found
        if face_encodings:
            if card_id not in data_dict:
                data_dict[card_id] = []
            data_dict[card_id].append(face_encodings[0])

# Convert encodings to list format for saving
for key in data_dict:
    data_dict[key] = [encoding.tolist() for encoding in data_dict[key]]


# def face_compare(card_id):
#     if card_id not in data_dict:
#         print("Card ID not found.")
#         return False
    
#     cap = cv2.VideoCapture(0)
    
#     while True:
#         ret, frame = cap.read()
#         if not ret:
#             break
        
#         rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
#         face_locations = face_recognition.face_locations(rgb_frame)
#         face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)
        
#         for face_encoding in face_encodings:
#             matches = face_recognition.compare_faces([np.array(enc) for enc in data_dict[card_id]], face_encoding, tolerance=0.5)
#             if any(matches):
#                 cap.release()
#                 cv2.destroyAllWindows()
#                 print("Face matched. Continuing...")
#                 return True
        
#         # Ensure imshow() only runs if GUI is supported
#         if platform.system() != "Darwin":  
#             cv2.imshow("Face Recognition", frame)
#             cv2.waitKey(1)

#         if cv2.waitKey(1) & 0xFF == ord('q'):
#             print("Face not matched. Exiting...")
#             break
    
#     cap.release()
#     cv2.destroyAllWindows()
#     return False


import time

def face_compare():
    if not data_dict:
        print("No face data available.")
        return None
    
    cap = cv2.VideoCapture(0)
    start_time = time.time()
    frame_count = 0
    max_frames = 10
    match_found = None

    # Create a list of (filename, encoding) pairs
    all_encodings = []
    encoding_to_filename = {}

    for filename, encodings in data_dict.items():
        for enc in encodings:
            all_encodings.append(np.array(enc))
            encoding_to_filename[len(all_encodings) - 1] = filename  # Map index to filename

    while time.time() - start_time < 3 and frame_count < max_frames:
        ret, frame = cap.read()
        if not ret:
            break
        
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        face_locations = face_recognition.face_locations(rgb_frame)
        face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)
        
        for face_encoding in face_encodings:
            matches = face_recognition.compare_faces(all_encodings, face_encoding, tolerance=0.3)
            if any(matches):
                matched_index = matches.index(True)  # Get the first matching index
                match_found = encoding_to_filename[matched_index]  # Retrieve filename
                print(f"Face matched with {match_found} on frame {frame_count + 1}")
                break

        frame_count += 1
        time.sleep(0.3)  # Delay to maintain 10 shots in 3 seconds
        
        if match_found:
            break
    
    cap.release()
    cv2.destroyAllWindows()
    
    if match_found:
        print(f"Face matched with {match_found}. Continuing...")
        return match_found  # Return the filename of the matched face
    else:
        print("Face not matched. Exiting...")
        return None



# Database configuration (using pymysql instead of MySQLdb)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'mysql+pymysql://mac:mac123@172.20.10.3/smart_attendance')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Models
class Student(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    Name = db.Column(db.String(20), nullable=False)
    Roll_No = db.Column(db.String(10), unique=True, nullable=False)
    DOB = db.Column(db.Date, unique = False, nullable = False)
    Blood_Group = db.Column(db.String(5), unique = False, nullable = False)
    Phone = db.Column(db.String(10), unique = True, nullable = False)
    Dept = db.Column(db.String(10), unique = False, nullable = False)
    Batch = db.Column(db.String(15), unique = False, nullable = False)
    Card_Id = db.Column(db.String(10), unique=True, nullable=False)
    Created_At = db.Column(db.DateTime, default=datetime.utcnow)
    attendances = db.relationship('Attendance', backref='student', lazy=True)

class Attendance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('student.id'), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.now())
    status = db.Column(db.String(20), default='present')

# Routes
@app.route('/api/students', methods=['GET'])
def get_students():
    students = Student.query.all()
    return jsonify([{
        'id': student.id,
        'Name': student.Name,
        'Roll_No': student.Roll_No,
        'DOB': student.DOB,
        'Blood_Group': student.Blood_Group,
        'Phone': student.Phone,
        'Dept': student.Dept,
        'Batch': student.Batch,    
        'Card_Id': student.Card_Id,
    } for student in students])

@app.route('/api/students', methods=['POST'])
def add_student():
    data = request.json
    try:
        new_num = None
        while True:
            new_num = random.randint(10**9,10**10-1)
            if new_num not in rand_id:
                rand_id.append(new_num)
                break
        
        student = Student(
            Name=data['Name'].upper(),
            Roll_No=data['Roll_No'],
            DOB=data['DOB'],
            Blood_Group=data['Blood_Group'],
            Phone=data['Phone'],
            Dept=data['Dept'],
            Batch=data['Batch'],
            Card_Id=new_num
        )
        db.session.add(student)
        db.session.commit()
        return jsonify({
            'message': 'Student added successfully',
            'student': {
        'id': student.id,
        'Name': student.Name,
        'Roll_No': student.Roll_No,
        'DOB': student.DOB,
        'Blood_Group': student.Blood_Group,
        'Phone': student.Phone,
        'Dept': student.Dept,
        'Batch': student.Batch,    
        'Card_Id': student.Card_Id
    }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@app.route('/api/attendance', methods=['POST'])
def mark_attendance():
    data = request.json
    handle_card_scan(data)
    print(data)    
    try:
        data['card_id'] = face_compare()
        print(data)
        student = Student.query.filter_by(Card_Id=data['card_id']).first()
        if not student:
            return jsonify({'error': 'Student not found'}), 404
        # print(date.today())
        # attendance = Attendance(student_id=student.id)
        # db.session.add(attendance)
        # db.session.commit()
        detected = True if len(data['card_id']) > 5 else False
        # existing_attendance = Attendance.query.filter_by(student_id=student.id, timestamp=date.today()).first()
        today = date.today()
        print(today)
        existing_attendance = Attendance.query.filter(
            and_(
                Attendance.student_id == student.id,
                db.cast(Attendance.timestamp, db.Date) == today  # Convert timestamp to date
            )
        ).first()
        if existing_attendance:
            return jsonify({'message': 'Attendance already marked for today'}), 200
        if detected:
            print("Access Granted")
        else:
            return jsonify({'message': 'Attendance Face Not Matched'}), 200

        # If not, mark attendance
        attendance = Attendance(student_id=student.id)
        db.session.add(attendance)
        db.session.commit()


        # Emit real-time update via Socket.IO
        socketio.emit('attendance_marked', {
            'student_id': student.id,
            'name': student.Name,
            'timestamp': attendance.timestamp.isoformat()
        })

        return jsonify({
            'message': 'Attendance marked successfully',
            'attendance': {
                'id': attendance.id,
                'student_id': attendance.student_id,
                'timestamp': attendance.timestamp.isoformat(),
                'status': attendance.status
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@socketio.on('scan_card')
def handle_card_scan(data):
    card_id = data.get('card_id')  # Get card ID from the request
    print(card_id)
    student = Student.query.filter_by(Card_Id=card_id).first()

    if student:
        socketio.emit('card_scanned', {
            'success': True,
            'student': {
                'id': student.id,
                'Name': student.Name,
                'Roll_No': student.Roll_No,
                'DOB': student.DOB.strftime('%Y-%m-%d'),
                'Blood_Group': student.Blood_Group,
                'Phone': student.Phone,
                'Dept': student.Dept,
                'Batch': student.Batch,
                'Card_Id': student.Card_Id
            },
            'message': 'Student found!'
        })
    else:
        socketio.emit('card_scanned', {
            'success': False,
            'message': 'Card not found!'
        })

@app.route('/api/attendance/today', methods=['GET'])
def get_today_attendance():
    today = date.today()
    print(today)
    attendances = Attendance.query.filter(
        db.func.date(Attendance.timestamp) == today
    ).all()
    
    return jsonify([{
        'id': attendance.id,
        'student_id': attendance.student_id,
        'student_name': attendance.student.Name if attendance.student else "Unknown",
        'timestamp': attendance.timestamp.isoformat(),
        'status': attendance.status
    } for attendance in attendances])

# Socket.IO event handlers
@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

# Card detection simulation endpoint (for testing without ESP32)
@app.route('/api/simulate-card', methods=['POST'])
def simulate_card_detection():
    data = request.json
    # print(data)
    card_id = data.get('card_id')
    # print(card_id)
    
    socketio.emit('card_scanned', {
        'student_id': 1,
        'name':"Raghuk",
        'timestamp': "attendance.timestamp.isoformat()"
    })
    
    if not card_id:
        return jsonify({'error': 'Card ID is required'}), 400
        
    return mark_attendance()

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    socketio.run(app, host = '0.0.0.0', debug=True, port=5000)