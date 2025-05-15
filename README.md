# 🎓 Smart Attendance System

An AI-powered attendance management system that uses **Face Recognition**, **RFID Card Detection**, and **Real-Time Communication** to automate and secure attendance tracking in institutions.

---

## 🔍 Overview

The Smart Attendance System aims to replace manual and error-prone attendance processes by leveraging computer vision and IoT technologies. The system ensures accurate student verification and real-time data updates using web technologies and hardware integration.

---

## 🚀 Features

- ✅ Face recognition using OpenCV and `face_recognition` library.
- 🆔 RFID card verification using ESP32 and RF module.
- 🔄 Real-time communication between hardware and server using **Socket.IO**.
- 🖥️ React-based responsive web dashboard.
- 📊 Attendance data stored securely in **MySQL**.
- 🔒 Prevents proxy attendance using dual verification (Face + RFID).

---

## 🧰 Tech Stack

| Component     | Technology                              |
|---------------|------------------------------------------|
| Frontend      | React.js + Vite + Tailwind CSS           |
| Backend       | Python Flask + Socket.IO                 |
| Database      | MySQL (local)                            |
| Hardware      | ESP32 + RFID Module + Camera + NRF       |
| Protocols     | WebSocket (Socket.IO), Serial Communication |
| Face Recognition | OpenCV, `face_recognition` Python library |


## ⚙️ Installation & Setup

### 🔌 Prerequisites

- Python 3.8+
- Node.js & npm
- MySQL Server
- Arduino IDE
- ESP32 drivers

### 📦 Backend Setup (Flask)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
💻 Frontend Setup (React + Vite)
bash
Copy
Edit
cd frontend
npm install
npm run dev
🔧 ESP32 Setup
Open main.ino in Arduino IDE.

Install required libraries (e.g., MFRC522, WiFi, SPI).

Connect your ESP32 board and upload the code.

🧠 How It Works
Student taps RFID card → UID is sent to backend.

Camera is activated → Face recognition verifies student.

If both RFID and Face match → Attendance is marked.

Data is stored in MySQL and reflected in the dashboard.

Admin can view live attendance updates.

👥 Team
Pugal – Frontend Developer,Backend,Embedded Systems Engineer

📄 License
This project is licensed under the MIT License. See the LICENSE file for more information.

💬 Feedback & Contributions
We welcome contributions! Feel free to fork this project, raise issues, and submit pull requests.
