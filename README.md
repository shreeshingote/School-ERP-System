# 🏫 School ERP System

A full-stack **School Enterprise Resource Planning (ERP)** web application designed for managing K-12 schools (1st to 12th Standard). It features three role-based portals — **Admin**, **Teacher**, and **Student** — each with dedicated dashboards and functionality.

Built with **React + Vite** on the frontend, **Node.js + Express** on the backend, and **MongoDB Atlas** as the database. Fully containerized with **Docker Compose** for easy deployment.

---

## ✨ Features

### 🔐 Authentication & Authorization
- Secure **JWT-based authentication** for all three roles
- Role-based route protection via Express middleware
- Login via **Email** or **Employee/Student ID** (e.g., `EMP1001`, `STU1001`)
- Passwords hashed with **bcryptjs**

---

### 🛡️ Admin Portal
| Feature | Description |
|---|---|
| 📊 Dashboard Stats | Overview of total students, teachers, classes, attendance logs, marks entries, and pending fees |
| 👩‍🎓 Student Management | Register new students with auto-generated IDs (`STU1001`, `STU1002`...), assign to classes, update fees, delete accounts |
| 👨‍🏫 Teacher Management | Register faculty with auto-generated IDs (`EMP1001`, `EMP1002`...), assign as class teachers or subject teachers |
| 🏛️ Class Management | 36 classes auto-seeded (1st-A through 12th-C), create new divisions, assign/unassign class teachers |
| 📚 Subject Management | Add subjects per standard, assign subject teachers per class |
| 💸 Fee Management | View and update pending fees for individual students |
| 🗓️ Academic Year | Manage academic year cycles (e.g., 2026-27) |
| 🗑️ User Deletion | Remove student/teacher accounts (with self-delete protection for admin) |

---

### 👨‍🏫 Teacher Portal
| Feature | Description |
|---|---|
| 🏠 My Class | View assigned class details and enrolled student roster |
| ✅ Mark Attendance | Record individual or **bulk attendance** by date and subject with auto percentage recalculation |
| 📝 Upload Marks | Enter exam marks per student with subject, exam name, and total marks |
| 📋 Attendance Log | View recent attendance records (latest 100) |
| 📊 Marks Log | View recent marks entries (latest 100) |

---

### 🎓 Student Portal
| Feature | Description |
|---|---|
| 👤 My Profile | View personal details — name, email, class, attendance percentage, pending fees |
| 📅 My Attendance | Full attendance history with subject-wise breakdown and overall percentage |
| 📝 My Report Card | View marks per subject and exam |
| 💳 Pay Fees | Simulate online fee payment with real-time balance update and transaction ID |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite 6, Axios, Vanilla CSS |
| **Backend** | Node.js, Express.js 4 |
| **Database** | MongoDB Atlas (Mongoose 8 ODM) |
| **Authentication** | JSON Web Tokens (JWT) + bcryptjs |
| **Dev Tools** | Nodemon, ESLint |
| **Containerization** | Docker, Docker Compose |

---

## 📁 Project Structure

```
student-management/
│
├── backend/
│   ├── middleware/
│   │   └── auth.js                        # JWT verification & role authorization
│   ├── models/
│   │   ├── AcademicYear.js                # Academic year schema
│   │   ├── Attendance.js                  # Student attendance records
│   │   ├── Class.js                       # Class (Standard + Division + Year)
│   │   ├── Division.js                    # Division (A, B, C...)
│   │   ├── Marks.js                       # Exam marks records
│   │   ├── Standard.js                    # School standards (1st–12th)
│   │   ├── Student.js                     # Student base schema
│   │   ├── StudentProfile.js             # Extended student profile
│   │   ├── Subject.js                     # Subject per standard
│   │   ├── SubjectTeacherAssignment.js   # Teacher ↔ Subject ↔ Class mapping
│   │   ├── Teacher.js                     # Teacher base schema
│   │   └── User.js                        # Unified user model (all roles)
│   ├── routes/
│   │   ├── adminRoutes.js                 # Admin-only CRUD APIs
│   │   ├── authRoutes.js                  # Login / Authentication
│   │   ├── studentRoutes.js               # Student self-service APIs
│   │   └── teacherRoutes.js               # Teacher management APIs
│   ├── Dockerfile
│   ├── package.json
│   └── server.js                          # Express entry point + DB seed logic
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                        # Main application (all UI pages)
│   │   ├── App.css                        # Component styles
│   │   ├── index.css                      # Global styles
│   │   └── main.jsx                       # React entry point
│   ├── public/
│   ├── Dockerfile
│   ├── vite.config.js
│   └── package.json
│
├── docker-compose.yml                     # Multi-service container setup
├── .gitignore
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites

- **Node.js** v18 or higher — [Download](https://nodejs.org/)
- **MongoDB Atlas** account — [Sign up](https://www.mongodb.com/cloud/atlas) (or use a local MongoDB instance)
- **Docker & Docker Compose** (optional) — [Download](https://www.docker.com/)

---

### 🔧 Environment Variables

Create a `.env` file inside the `backend/` directory:

```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/schoolERPDB?retryWrites=true&w=majority
PORT=5001
JWT_SECRET=your_super_secret_jwt_key
```

> ⚠️ **Never commit your `.env` file.** It is already excluded via `.gitignore`.

---

### 🖥️ Option 1: Run Locally

**1. Clone the repository**

```bash
git clone https://github.com/<your-username>/student-management.git
cd student-management
```

**2. Start the Backend**

```bash
cd backend
npm install
npm run dev
```

> Backend runs at: **http://localhost:5001**

**3. Start the Frontend** (in a new terminal)

```bash
cd frontend
npm install
npm run dev
```

> Frontend runs at: **http://localhost:5173**

---

### 🐳 Option 2: Run with Docker Compose

```bash
docker-compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5001 |

---

## 🔑 Default Test Accounts

These accounts are **auto-seeded** on first server startup:

| Role | Login ID / Email | Password |
|---|---|---|
| 🛡️ **Admin** | `admin@school.com` | `admin123` |
| 👨‍🏫 **Teacher** | `EMP1001` or `teacher@school.com` | `password123` |
| 🎓 **Student** | `STU1001` or `student@school.com` | `password123` |

> The seed script also creates: 12 standards, 3 divisions (A/B/C), 36 classes, sample attendance records, and sample exam marks.

---

## 📡 REST API Reference

### 🔐 Auth — `/api/auth`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/login` | Login with email/ID and password, returns JWT |

### 🛡️ Admin — `/api/admin` *(requires admin role)*

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/stats` | Dashboard overview metrics |
| `GET` | `/classes` | List all classes with student counts |
| `POST` | `/classes` | Create a new class division |
| `PUT` | `/classes/:id/class-teacher` | Assign or unassign class teacher |
| `GET` | `/standards` | List all 12 standards |
| `GET` | `/subjects` | List all subjects |
| `POST` | `/subjects` | Add a subject to a standard |
| `GET` | `/subject-teachers` | List subject-teacher assignments |
| `POST` | `/subject-teachers` | Assign a subject teacher |
| `GET` | `/users` | List all users |
| `POST` | `/create-student` | Register a new student |
| `POST` | `/create-teacher` | Register a new teacher |
| `POST` | `/assign-student-class` | Assign/reassign student to a class |
| `PUT` | `/users/:id/fee` | Update student's pending fees |
| `DELETE` | `/users/:id` | Delete a user account |

### 👨‍🏫 Teacher — `/api/teacher` *(requires teacher/admin role)*

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/my-class` | View assigned class and enrolled students |
| `GET` | `/students` | List students in assigned class |
| `POST` | `/attendance` | Mark attendance for one student |
| `POST` | `/attendance/bulk` | Bulk mark attendance for entire class |
| `GET` | `/attendance` | Get attendance records log |
| `POST` | `/marks` | Upload marks for a student |
| `GET` | `/marks` | Get marks records log |

### 🎓 Student — `/api/student` *(requires student/admin role)*

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/profile` | View own profile information |
| `GET` | `/my-attendance` | View attendance history and percentage |
| `GET` | `/my-marks` | View marks / report card |
| `POST` | `/pay-fee` | Simulate a fee payment |

---

## 🗄️ Database Models

| Model | Key Fields | Description |
|---|---|---|
| **User** | customId, name, email, password, role | Unified model for Admin, Teacher, Student |
| **StudentProfile** | userId, admissionNo, rollNo, classId, dob, parentName | Extended student information |
| **AcademicYear** | year, startDate, endDate, isCurrent | Academic year cycle |
| **Standard** | name, code | School grade (1st–12th) |
| **Division** | name, code | Section identifier (A, B, C) |
| **Class** | name, standardId, divisionId, classTeacherId, capacity | Standard + Division combination per year |
| **Subject** | name, standardId, description | Subject linked to a standard |
| **SubjectTeacherAssignment** | classId, subjectId, teacherId, academicYearId | Maps teachers to subjects per class |
| **Attendance** | studentId, date, subject, status | Daily attendance record |
| **Marks** | studentId, subject, examName, marksObtained, totalMarks | Exam performance record |

---

## 🤝 Contributing

Contributions are welcome! Here's how:

1. **Fork** the repository
2. **Create** your feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

---

## 📄 License

This project is licensed under the **ISC License**.

---

## 👨‍💻 Author

**Shree Shingote**

---

*⭐ If you found this project helpful, please give it a star on GitHub!*
