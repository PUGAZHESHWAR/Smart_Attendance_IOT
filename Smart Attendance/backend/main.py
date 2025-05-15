from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, date
from sqlalchemy import and_
import os
import face_recognition
from dotenv import load_dotenv
import numpy as np
import random
import cv2
import platform
import time
import base64
import threading

load_dotenv()

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

rand_id = []

images_path = "Images"
if not os.path.exists(images_path):
    os.makedirs(images_path)

data_dict = {}

for image_name in os.listdir(images_path):
    if image_name.endswith(('.jpg', '.png', '.jpeg')):
        card_id = os.path.splitext(image_name)[0]  
        image_path = os.path.join(images_path, image_name)
        image = face_recognition.load_image_file(image_path)
        face_encodings = face_recognition.face_encodings(image)

        if face_encodings:
            if card_id not in data_dict:
                data_dict[card_id] = []
            data_dict[card_id].append(face_encodings[0])

for key in data_dict:
    data_dict[key] = [encoding.tolist() for encoding in data_dict[key]]

camera = None
camera_thread = None
stop_camera = False

def camera_stream():
    global camera, stop_camera
    while not stop_camera:
        if camera is not None:
            success, frame = camera.read()
            if success:
                ret, buffer = cv2.imencode('.jpg', frame)
                if ret:
                    frame_bytes = base64.b64encode(buffer).decode('utf-8')
                    socketio.emit('camera_frame', {'image': frame_bytes})
        time.sleep(0.1)

def face_compare():
    if not data_dict:
        print("No face data available.")
        return None

    cap = cv2.VideoCapture(0)
    start_time = time.time()
    match_found = None

    all_encodings = []
    encoding_to_filename = {}

    for filename, encodings in data_dict.items():
        for enc in encodings:
            all_encodings.append(np.array(enc))
            encoding_to_filename[len(all_encodings) - 1] = filename  

    while time.time() - start_time < 2: 
        ret, frame = cap.read()
        if not ret:
            break
        
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        face_locations = face_recognition.face_locations(rgb_frame)
        face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)
        
        for face_encoding in face_encodings:
            matches = face_recognition.compare_faces(all_encodings, face_encoding, tolerance=0.4)
            matched_indices = np.where(matches)[0] 
            
            if len(matched_indices) > 0:
                matched_index = matched_indices[0] 
                match_found = encoding_to_filename[matched_index]
                print(f"Face matched with {match_found}")
                cap.release()
                cv2.destroyAllWindows()
                return match_found

    cap.release()
    cv2.destroyAllWindows()
    print("Face not matched within time limit.")
    return None

@app.route('/api/start-camera', methods=['POST'])
def start_camera():
    global camera, camera_thread, stop_camera
    try:
        if camera is None:
            camera = cv2.VideoCapture(0)
            if not camera.isOpened():
                return jsonify({'error': 'Failed to open camera'}), 500
            stop_camera = False
            camera_thread = threading.Thread(target=camera_stream)
            camera_thread.start()
        return jsonify({'message': 'Camera started successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stop-camera', methods=['POST'])
def stop_camera_route():
    global camera, camera_thread, stop_camera
    try:
        if camera is not None:
            stop_camera = True
            if camera_thread is not None:
                camera_thread.join()
            camera.release()
            camera = None
        return jsonify({'message': 'Camera stopped successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/capture-image', methods=['POST'])
def capture_image():
    global camera
    try:
        data = request.json
        card_id = data.get('card_id')
        
        if not card_id:
            return jsonify({'error': 'Card ID is required'}), 400
            
        if camera is None:
            return jsonify({'error': 'Camera is not started'}), 400
            
        success, frame = camera.read()
        if not success:
            return jsonify({'error': 'Failed to capture image'}), 500

        image_path = os.path.join(images_path, f"{card_id}.jpg")
        cv2.imwrite(image_path, frame)
        camera.release()

        image = face_recognition.load_image_file(image_path)
        face_encodings = face_recognition.face_encodings(image)
        
        if face_encodings:
            if card_id not in data_dict:
                data_dict[card_id] = []
            data_dict[card_id].append(face_encodings[0].tolist())
            socketio.emit('image_captured', {'success': True})
            return jsonify({'message': 'Image captured and saved successfully'}), 200
        else:
            os.remove(image_path) 
            return jsonify({'error': 'No face detected in the captured image'}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/unassigned-cards', methods=['GET'])
def get_unassigned_cards():
    assigned_cards = {os.path.splitext(f)[0] for f in os.listdir(images_path) 
                     if f.endswith(('.jpg', '.png', '.jpeg'))}
    all_students = Student.query.all()
    unassigned_cards = [student.Card_Id for student in all_students 
                       if student.Card_Id not in assigned_cards]
    return jsonify(unassigned_cards)

@app.route('/api/assign-image', methods=['POST'])
def assign_image():
    try:
        data = request.json
        card_id = data.get('card_id')
        image_data = data.get('image') 

        if not card_id or not image_data:
            return jsonify({'error': 'Card ID and image data are required'}), 400

        if 'base64,' in image_data:
            image_data = image_data.split('base64,')[1]

        image_bytes = base64.b64decode(image_data)

        image_path = os.path.join(images_path, f"{card_id}.jpg")
        with open(image_path, 'wb') as f:
            f.write(image_bytes)

        image = face_recognition.load_image_file(image_path)
        face_encodings = face_recognition.face_encodings(image)
        
        if face_encodings:
            if card_id not in data_dict:
                data_dict[card_id] = []
            data_dict[card_id].append(face_encodings[0].tolist())
            return jsonify({'message': 'Image assigned successfully'}), 200
        else:
            os.remove(image_path)
            return jsonify({'error': 'No face detected in the image'}), 400

    except Exception as e:
        return jsonify({'error': str(e)}), 500

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'mysql+pymysql://mac:mac123@localhost/smart_attendance')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

class Student(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    Name = db.Column(db.String(20), nullable=False)
    Roll_No = db.Column(db.String(10), unique=True, nullable=False)
    DOB = db.Column(db.Date, unique=False, nullable=False)
    Blood_Group = db.Column(db.String(5), unique=False, nullable=False)
    Phone = db.Column(db.String(10), unique=True, nullable=False)
    Dept = db.Column(db.String(10), unique=False, nullable=False)
    Batch = db.Column(db.String(15), unique=False, nullable=False)
    Card_Id = db.Column(db.String(10), unique=True, nullable=False)
    Created_At = db.Column(db.DateTime, default=datetime.utcnow)
    attendances = db.relationship('Attendance', backref='student', lazy=True)

class Attendance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('student.id'), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.now())
    status = db.Column(db.String(20), default='present')

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
            new_num = random.randint(10**9, 10**10-1)
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
    try:
        data['card_id'] = face_compare()
        student = Student.query.filter_by(Card_Id=data['card_id']).first()
        if not student:
            return jsonify({'error': 'Student not found'}), 404
        
        detected = True if len(data['card_id']) > 5 else False
        today = date.today()
        
        existing_attendance = Attendance.query.filter(
            and_(
                Attendance.student_id == student.id,
                db.cast(Attendance.timestamp, db.Date) == today
            )
        ).first()
        
        if existing_attendance:
            return jsonify({'message': 'Attendance already marked for today'}), 200
        
        if not detected:
            return jsonify({'message': 'Attendance Face Not Matched'}), 200

        attendance = Attendance(student_id=student.id)
        db.session.add(attendance)
        db.session.commit()

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
    card_id = data.get('card_id')
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

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    socketio.run(app, host='0.0.0.0', debug=True, port=5000)