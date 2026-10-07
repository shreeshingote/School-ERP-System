import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE_URL = 'http://localhost:5001/api';

// Axios global setup with token interceptor
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('erp_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export default function App() {
  // Auth state
  const [user, setUser] = useState(null);
  const [loginTab, setLoginTab] = useState('admin');
  const [identifier, setIdentifier] = useState('admin@school.com');
  const [password, setPassword] = useState('admin123');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  // Global Toast / Notice state
  const [notice, setNotice] = useState(null);

  // Active sub-tab inside dashboards
  const [activeSubTab, setActiveSubTab] = useState('overview');

  // Admin Data state
  const [usersList, setUsersList] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [standardsList, setStandardsList] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  const [subjectAssignments, setSubjectAssignments] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [classFilterStd, setClassFilterStd] = useState('all');
  const [classAssignmentFilter, setClassAssignmentFilter] = useState('all'); // 'all', 'unassigned', 'assigned'
  const [editingUser, setEditingUser] = useState(null);
  const [newFeeValue, setNewFeeValue] = useState('');

  // Admin Create Class Form
  const [showAddClass, setShowAddClass] = useState(false);
  const [newClassForm, setNewClassForm] = useState({ standardId: '', divisionName: '', capacity: 40, classTeacherId: '' });

  // Admin Subject Form
  const [newSubject, setNewSubject] = useState({ name: '', standardId: '', description: '' });

  // Admin Subject-Teacher Assignment Form
  const [subTeachForm, setSubTeachForm] = useState({ classId: '', subjectId: '', teacherId: '' });

  // Admin Create Student form
  const [studentForm, setStudentForm] = useState({
    name: '',
    email: '',
    gradeClass: '5th-C',
    classId: '',
    pendingFees: 1200,
    password: 'password123',
  });

  // Admin Create Faculty form
  const [teacherForm, setTeacherForm] = useState({
    name: '',
    email: '',
    department: 'Computer Science',
    password: 'password123',
  });

  // Teacher Data state
  const [teacherStudents, setTeacherStudents] = useState([]);
  const [myClassInfo, setMyClassInfo] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [marksRecords, setMarksRecords] = useState([]);

  // Teacher Form 1: Attendance (shared date/subject for bulk)
  const [attForm, setAttForm] = useState({
    studentId: '',
    date: new Date().toISOString().split('T')[0],
    subject: 'Computer Science',
    status: 'Present',
  });

  // Bulk attendance state: { [studentId]: 'Present' | 'Absent' }
  const [bulkAttStatus, setBulkAttStatus] = useState({});
  const [bulkAttDate, setBulkAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [bulkAttSubject, setBulkAttSubject] = useState('Computer Science');
  const [bulkAttSubmitting, setBulkAttSubmitting] = useState(false);

  // Admin: assign student to class
  const [assignStudentForm, setAssignStudentForm] = useState({ studentId: '', classId: '' });

  // Teacher Form 2: Marks
  const [marksForm, setMarksForm] = useState({
    studentId: '',
    subject: 'Computer Science',
    examName: 'Midterm 2026',
    marksObtained: 85,
    totalMarks: 100,
  });

  // Student Data state
  const [studentAttendance, setStudentAttendance] = useState({ records: [], percentage: 100, totalClasses: 0, presentClasses: 0 });
  const [studentMarks, setStudentMarks] = useState([]);
  const [payAmount, setPayAmount] = useState('');
  const [lastReceipt, setLastReceipt] = useState(null);

  // Toast message helper
  const showToast = (message, type = 'success') => {
    setNotice({ message, type });
    setTimeout(() => setNotice(null), 5000);
  };

  // Auto-login from saved token
  useEffect(() => {
    const savedUser = localStorage.getItem('erp_user');
    const savedToken = localStorage.getItem('erp_token');
    if (savedUser && savedToken) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        loadDashboardData(parsed);
      } catch (e) {
        handleLogout();
      }
    }
  }, []);

  const loadDashboardData = (currentUser) => {
    if (currentUser.role === 'admin') {
      fetchAdminUsers();
      fetchAdminStats();
      fetchAdminClasses();
      fetchAdminStandards();
      fetchAdminSubjects();
      fetchAdminSubjectTeachers();
      setActiveSubTab('classes');
    } else if (currentUser.role === 'teacher') {
      fetchMyClassInfo();
      fetchTeacherStudents();
      fetchTeacherAttendance();
      fetchTeacherMarks();
      setActiveSubTab('attendance');
      // Initialize bulk attendance statuses
      setBulkAttStatus({});
    } else if (currentUser.role === 'student') {
      fetchStudentProfile();
      fetchStudentAttendance();
      fetchStudentMarks();
      setActiveSubTab('overview');
    }
  };

  // --- ADMIN API CALLS ---
  const fetchAdminUsers = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/users`);
      setUsersList(res.data);
    } catch (err) {
      console.error('Failed fetching users:', err);
    }
  };

  const fetchAdminStats = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/stats`);
      setAdminStats(res.data);
    } catch (err) {
      console.error('Failed fetching admin stats:', err);
    }
  };

  const fetchAdminClasses = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/classes`);
      setClassesList(res.data);
      if (res.data.length > 0) {
        setSubTeachForm((prev) => ({ ...prev, classId: res.data[0]._id }));
      }
    } catch (err) {
      console.error('Failed fetching classes:', err);
    }
  };

  const fetchAdminStandards = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/standards`);
      setStandardsList(res.data);
      if (res.data.length > 0) {
        setNewSubject((prev) => ({ ...prev, standardId: res.data[0]._id }));
        setNewClassForm((prev) => ({ ...prev, standardId: res.data[0]._id }));
      }
    } catch (err) {
      console.error('Failed fetching standards:', err);
    }
  };

  const fetchAdminSubjects = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/subjects`);
      setSubjectsList(res.data);
      if (res.data.length > 0) {
        setSubTeachForm((prev) => ({ ...prev, subjectId: res.data[0]._id }));
      }
    } catch (err) {
      console.error('Failed fetching subjects:', err);
    }
  };

  const fetchAdminSubjectTeachers = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/subject-teachers`);
      setSubjectAssignments(res.data);
    } catch (err) {
      console.error('Failed fetching subject teachers:', err);
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE_URL}/admin/classes`, newClassForm);
      showToast(res.data.message, 'success');
      setNewClassForm({ standardId: standardsList[0]?._id || '', divisionName: '', capacity: 40, classTeacherId: '' });
      setShowAddClass(false);
      fetchAdminClasses();
      fetchAdminStats();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error creating class', 'error');
    }
  };

  const handleAssignClassTeacher = async (classId, teacherId) => {
    try {
      const res = await axios.put(`${API_BASE_URL}/admin/classes/${classId}/class-teacher`, { teacherId });
      showToast(res.data.message, 'success');
      fetchAdminClasses();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed assigning class teacher', 'error');
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE_URL}/admin/subjects`, newSubject);
      showToast(res.data.message, 'success');
      setNewSubject({ name: '', standardId: standardsList[0]?._id || '', description: '' });
      fetchAdminSubjects();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error adding subject', 'error');
    }
  };

  const handleAssignSubjectTeacher = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE_URL}/admin/subject-teachers`, subTeachForm);
      showToast(res.data.message, 'success');
      fetchAdminSubjectTeachers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error assigning subject teacher', 'error');
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      // Send classId along with student form
      const payload = { ...studentForm };
      // classId is stored in studentForm as classId field
      const res = await axios.post(`${API_BASE_URL}/admin/create-student`, payload);
      showToast(`🎉 Student Account Created! Custom ID: ${res.data.user.customId}`, 'success');
      setStudentForm({ name: '', email: '', gradeClass: '5th-C', classId: '', pendingFees: 1200, password: 'password123' });
      fetchAdminUsers();
      fetchAdminStats();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error creating student', 'error');
    }
  };

  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE_URL}/admin/create-teacher`, teacherForm);
      showToast(`🎉 Faculty Account Created! Custom ID: ${res.data.user.customId}`, 'success');
      setTeacherForm({ name: '', email: '', department: 'Computer Science', password: 'password123' });
      fetchAdminUsers();
      fetchAdminStats();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error creating faculty', 'error');
    }
  };

  const handleUpdateFee = async (userId) => {
    try {
      await axios.put(`${API_BASE_URL}/admin/users/${userId}/fee`, { pendingFees: Number(newFeeValue) });
      showToast('✅ Student fee updated successfully', 'success');
      setEditingUser(null);
      setNewFeeValue('');
      fetchAdminUsers();
      fetchAdminStats();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed updating fee', 'error');
    }
  };

  const handleDeleteUser = async (userId, customId) => {
    if (!window.confirm(`Are you sure you want to delete user ${customId}?`)) return;
    try {
      await axios.delete(`${API_BASE_URL}/admin/users/${userId}`);
      showToast(`User ${customId} deleted successfully`, 'success');
      fetchAdminUsers();
      fetchAdminStats();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error deleting user', 'error');
    }
  };

  // --- TEACHER API CALLS ---
  const fetchMyClassInfo = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/teacher/my-class`);
      if (res.data.assigned) {
        setMyClassInfo(res.data);
      }
    } catch (err) {
      console.error('Failed fetching my class info:', err);
    }
  };

  const fetchTeacherStudents = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/teacher/students`);
      setTeacherStudents(res.data);
      if (res.data.length > 0) {
        setAttForm((prev) => ({ ...prev, studentId: res.data[0]._id }));
        setMarksForm((prev) => ({ ...prev, studentId: res.data[0]._id }));
        // Initialize bulk attendance with 'Present' for all students
        const initialStatus = {};
        res.data.forEach((s) => { initialStatus[s._id] = 'Present'; });
        setBulkAttStatus(initialStatus);
      }
    } catch (err) {
      console.error('Failed fetching students:', err);
    }
  };

  const fetchTeacherAttendance = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/teacher/attendance`);
      setAttendanceRecords(res.data);
    } catch (err) {
      console.error('Failed fetching attendance logs:', err);
    }
  };

  const fetchTeacherMarks = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/teacher/marks`);
      setMarksRecords(res.data);
    } catch (err) {
      console.error('Failed fetching marks logs:', err);
    }
  };

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE_URL}/teacher/attendance`, attForm);
      showToast(`✅ ${res.data.message}`, 'success');
      fetchTeacherAttendance();
      fetchTeacherStudents();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error marking attendance', 'error');
    }
  };

  // Bulk attendance submit (entire class roster)
  const handleBulkAttendance = async () => {
    if (!bulkAttDate || !bulkAttSubject) {
      showToast('Please select date and subject', 'error');
      return;
    }
    if (teacherStudents.length === 0) {
      showToast('No students in roster to mark attendance', 'error');
      return;
    }
    setBulkAttSubmitting(true);
    try {
      const attendanceList = teacherStudents.map((s) => ({
        studentId: s._id,
        status: bulkAttStatus[s._id] || 'Present',
      }));
      const res = await axios.post(`${API_BASE_URL}/teacher/attendance/bulk`, {
        date: bulkAttDate,
        subject: bulkAttSubject,
        attendanceList,
      });
      showToast(`✅ ${res.data.message}`, 'success');
      fetchTeacherAttendance();
      fetchTeacherStudents();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error submitting bulk attendance', 'error');
    } finally {
      setBulkAttSubmitting(false);
    }
  };

  // Admin: Assign student to a class
  const handleAssignStudentClass = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE_URL}/admin/assign-student-class`, assignStudentForm);
      showToast(`✅ ${res.data.message}`, 'success');
      setAssignStudentForm({ studentId: '', classId: '' });
      fetchAdminUsers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error assigning student to class', 'error');
    }
  };

  const handleUploadMarks = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/teacher/marks`, marksForm);
      showToast('🏆 Student marks uploaded successfully!', 'success');
      fetchTeacherMarks();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error uploading marks', 'error');
    }
  };

  // --- STUDENT API CALLS ---
  const fetchStudentProfile = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/student/profile`);
      setUser(res.data);
      localStorage.setItem('erp_user', JSON.stringify(res.data));
    } catch (err) {
      console.error('Failed fetching student profile:', err);
    }
  };

  const fetchStudentAttendance = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/student/my-attendance`);
      setStudentAttendance(res.data);
    } catch (err) {
      console.error('Failed fetching my attendance:', err);
    }
  };

  const fetchStudentMarks = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/student/my-marks`);
      setStudentMarks(res.data);
    } catch (err) {
      console.error('Failed fetching my marks:', err);
    }
  };

  const handlePayFee = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE_URL}/student/pay-fee`, { amount: payAmount });
      showToast(res.data.message, 'success');
      setLastReceipt(res.data);
      setPayAmount('');
      setUser(res.data.user);
      localStorage.setItem('erp_user', JSON.stringify(res.data.user));
    } catch (err) {
      showToast(err.response?.data?.message || 'Payment failed', 'error');
    }
  };

  // --- AUTH HANDLERS ---
  const handleLoginTabChange = (role) => {
    setLoginTab(role);
    setLoginError('');
    if (role === 'admin') {
      setIdentifier('admin@school.com');
      setPassword('admin123');
    } else if (role === 'teacher') {
      setIdentifier('EMP1001');
      setPassword('password123');
    } else if (role === 'student') {
      setIdentifier('STU1001');
      setPassword('password123');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, { identifier, password });
      const userData = res.data.user;
      localStorage.setItem('erp_token', res.data.token);
      localStorage.setItem('erp_user', JSON.stringify(userData));
      setUser(userData);
      loadDashboardData(userData);
      showToast(`Welcome back, ${userData.name}!`, 'success');
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Server connection failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_user');
    setUser(null);
    setNotice(null);
    handleLoginTabChange('admin');
  };

  // Teachers list for dropdowns
  const facultyList = usersList.filter((u) => u.role === 'teacher');

  // Filtered Users
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.customId && u.customId.toLowerCase().includes(userSearch.toLowerCase()));
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Filtered Classes
  const unassignedCount = classesList.filter((c) => !c.classTeacherId).length;
  const assignedCount = classesList.filter((c) => c.classTeacherId).length;

  const filteredClasses = classesList.filter((c) => {
    const matchesStd = classFilterStd === 'all' || c.standardId?._id === classFilterStd || c.name.startsWith(classFilterStd);
    if (!matchesStd) return false;

    if (classAssignmentFilter === 'unassigned') return !c.classTeacherId;
    if (classAssignmentFilter === 'assigned') return !!c.classTeacherId;
    return true;
  });

  // Calculate student average mark score
  const studentAverageScore =
    studentMarks.length > 0
      ? (
          studentMarks.reduce((acc, m) => acc + (m.marksObtained / m.totalMarks) * 100, 0) /
          studentMarks.length
        ).toFixed(1)
      : 'N/A';

  // -------------------------------------------------------------
  // LOGIN SCREEN
  // -------------------------------------------------------------
  if (!user) {
    return (
      <div className="login-wrapper">
        <div className="login-card animate-fade-in">
          <div className="brand-title" style={{ justifyContent: 'center', marginBottom: '1.25rem' }}>
            <span className="brand-icon">🏫</span>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-blue)' }}>SCHOOL ERP SYSTEM</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>1st to 12th Standard Multi-Portal</p>
            </div>
          </div>

          <div className="login-tab-group">
            <button
              type="button"
              className={`login-tab-btn ${loginTab === 'admin' ? 'active' : ''}`}
              onClick={() => handleLoginTabChange('admin')}
            >
              🔑 Admin
            </button>
            <button
              type="button"
              className={`login-tab-btn ${loginTab === 'teacher' ? 'active' : ''}`}
              onClick={() => handleLoginTabChange('teacher')}
            >
              👨‍🏫 Faculty
            </button>
            <button
              type="button"
              className={`login-tab-btn ${loginTab === 'student' ? 'active' : ''}`}
              onClick={() => handleLoginTabChange('student')}
            >
              🎓 Student
            </button>
          </div>

          {loginError && <div className="alert-box alert-error">{loginError}</div>}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">
                {loginTab === 'admin' ? 'Email Address' : 'User ID (EMP... / STU...) or Email'}
              </label>
              <input
                type="text"
                className="form-input"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                placeholder="Enter ID or Email"
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-submit">
              {loading ? 'Authenticating...' : `Sign In as ${loginTab.toUpperCase()}`}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', background: 'var(--bg-main)', padding: '1rem', borderRadius: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontWeight: 700, color: 'var(--accent-blue)', marginBottom: '4px' }}>💡 Preset Test Account:</div>
            <div>ID/Email: <code style={{ color: '#fff' }}>{identifier}</code></div>
            <div>Password: <code style={{ color: '#fff' }}>{password}</code></div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // LOGGED-IN DASHBOARD LAYOUT
  // -------------------------------------------------------------
  return (
    <div className="erp-app">
      {/* Header Bar */}
      <header className="erp-header">
        <div className="brand-title">
          <span className="brand-icon">🏫</span>
          <div>
            <span style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '0.5px' }}>SCHOOL ERP (1st-12th STANDARD)</span>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Academic Year: 2026-27 | 36 School Divisions (A, B, C)
            </span>
          </div>
        </div>

        <div className="user-profile-badge">
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className="user-role-badge">
              <span className={`badge ${user.role === 'admin' ? 'badge-blue' : user.role === 'teacher' ? 'badge-green' : 'badge-yellow'}`}>
                {user.role.toUpperCase()} {user.customId ? `(${user.customId})` : ''}
              </span>
            </span>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '0.5rem 1rem',
              background: 'rgba(248, 113, 113, 0.15)',
              color: 'var(--accent-red)',
              border: '1px solid rgba(248, 113, 113, 0.3)',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Logout 🚪
          </button>
        </div>
      </header>

      {/* Notification Toast */}
      {notice && (
        <div style={{ padding: '0 2rem', marginTop: '1rem' }}>
          <div className={`alert-box ${notice.type === 'error' ? 'alert-error' : 'alert-success'} animate-fade-in`}>
            <span>{notice.message}</span>
            <button onClick={() => setNotice(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
          </div>
        </div>
      )}

      {/* Main Dashboard Body */}
      <main className="main-content">
        {/* ========================================================= */}
        {/* 🔑 ADMIN DASHBOARD */}
        {/* ========================================================= */}
        {user.role === 'admin' && (
          <div>
            <div className="portal-banner">
              <div className="banner-info">
                <h1>🔑 Executive Admin Dashboard</h1>
                <p>Manage 1st-12th Standard Structure (36 Classes), Assign Class Teachers, & Track Financial Dues.</p>
              </div>
              <span className="badge badge-blue" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                Academic Year 2026-27 Active 🟢
              </span>
            </div>

            {/* Admin Metric Stats */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-card-title">Total Enrolled Students</div>
                <div className="stat-card-value" style={{ color: 'var(--accent-yellow)' }}>
                  {adminStats ? adminStats.studentCount : '...'}
                </div>
                <div className="stat-card-subtitle">Across 36 Class Divisions</div>
              </div>

              <div className="stat-card">
                <div className="stat-card-title">Teaching Staff</div>
                <div className="stat-card-value" style={{ color: 'var(--accent-green)' }}>
                  {adminStats ? adminStats.teacherCount : '...'}
                </div>
                <div className="stat-card-subtitle">Faculty & Class Teachers</div>
              </div>

              <div className="stat-card">
                <div className="stat-card-title">Total School Classes</div>
                <div className="stat-card-value" style={{ color: 'var(--accent-purple)' }}>
                  {adminStats ? adminStats.classCount || classesList.length : classesList.length}
                </div>
                <div className="stat-card-subtitle">12 Standards × Divisions (A/B/C)</div>
              </div>

              <div className="stat-card">
                <div className="stat-card-title">Pending Tuition Fees</div>
                <div className="stat-card-value" style={{ color: 'var(--accent-red)' }}>
                  ${adminStats ? adminStats.totalPendingFees.toLocaleString() : '...'}
                </div>
                <div className="stat-card-subtitle">Total unpaid balance</div>
              </div>
            </div>

            {/* Admin Sub Navigation */}
            <div className="nav-tabs">
              <button
                className={`nav-tab-btn ${activeSubTab === 'classes' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('classes')}
              >
                🏫 Classes & Teachers ({classesList.length})
              </button>
              <button
                className={`nav-tab-btn ${activeSubTab === 'subject-teachers' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('subject-teachers')}
              >
                📚 Subject Teacher Mapping
              </button>
              <button
                className={`nav-tab-btn ${activeSubTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('users')}
              >
                👥 Users Management ({usersList.length})
              </button>
              <button
                className={`nav-tab-btn ${activeSubTab === 'create-student' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('create-student')}
              >
                🎓 Enroll Student
              </button>
              <button
                className={`nav-tab-btn ${activeSubTab === 'create-teacher' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('create-teacher')}
              >
                👨‍🏫 Add Faculty
              </button>
            </div>

            {/* Sub-Tab 1: 36 Classes & Class Teachers */}
            {activeSubTab === 'classes' && (
              <div className="card animate-fade-in">
                <div className="card-title">
                  <span>🏫 School Structure: Classes & Class Teacher Assignment</span>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                      className="btn-submit"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', width: 'auto', background: 'var(--accent-blue)', color: '#0f172a' }}
                      onClick={() => setShowAddClass(!showAddClass)}
                    >
                      {showAddClass ? '✕ Close Form' : '➕ Add New Class Division'}
                    </button>

                    <select
                      className="form-select"
                      style={{ width: '160px', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                      value={classFilterStd}
                      onChange={(e) => setClassFilterStd(e.target.value)}
                    >
                      <option value="all">All Standards</option>
                      {standardsList.map((s) => (
                        <option key={s._id} value={s.name.split(' ')[0]}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Add New Class Form */}
                {showAddClass && (
                  <div style={{ background: 'var(--bg-main)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }} className="animate-fade-in">
                    <h4 style={{ color: 'var(--accent-blue)', marginBottom: '0.75rem' }}>➕ Create New Class Division</h4>
                    <form onSubmit={handleCreateClass} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'end' }}>
                      <div>
                        <label className="form-label">Select Standard</label>
                        <select
                          className="form-select"
                          value={newClassForm.standardId}
                          onChange={(e) => setNewClassForm({ ...newClassForm, standardId: e.target.value })}
                          required
                        >
                          {standardsList.map((s) => (
                            <option key={s._id} value={s._id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="form-label">Division Code (e.g. A, B, C, D)</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. D"
                          value={newClassForm.divisionName}
                          onChange={(e) => setNewClassForm({ ...newClassForm, divisionName: e.target.value })}
                          required
                        />
                      </div>

                      <div>
                        <label className="form-label">Student Capacity</label>
                        <input
                          type="number"
                          className="form-input"
                          value={newClassForm.capacity}
                          onChange={(e) => setNewClassForm({ ...newClassForm, capacity: e.target.value })}
                          required
                        />
                      </div>

                      <div>
                        <label className="form-label">Assign Class Teacher (Optional)</label>
                        <select
                          className="form-select"
                          value={newClassForm.classTeacherId}
                          onChange={(e) => setNewClassForm({ ...newClassForm, classTeacherId: e.target.value })}
                        >
                          <option value="">-- No Class Teacher --</option>
                          {facultyList.map((f) => (
                            <option key={f._id} value={f._id}>
                              {f.name} ({f.customId})
                            </option>
                          ))}
                        </select>
                      </div>

                      <button type="submit" className="btn-submit" style={{ background: 'var(--accent-green)', color: '#0f172a' }}>
                        💾 Create Class
                      </button>
                    </form>
                  </div>
                )}

                {/* Filter Chips for Teacher Assignment Status */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
                  <button
                    className={`action-btn ${classAssignmentFilter === 'all' ? 'action-btn-edit' : ''}`}
                    style={{ background: classAssignmentFilter === 'all' ? 'var(--accent-blue)' : 'var(--bg-main)', color: classAssignmentFilter === 'all' ? '#0f172a' : 'var(--text-secondary)' }}
                    onClick={() => setClassAssignmentFilter('all')}
                  >
                    All Classes ({classesList.length})
                  </button>
                  <button
                    className={`action-btn ${classAssignmentFilter === 'unassigned' ? 'action-btn-danger' : ''}`}
                    style={{ background: classAssignmentFilter === 'unassigned' ? 'var(--accent-red)' : 'var(--bg-main)', color: classAssignmentFilter === 'unassigned' ? '#fff' : 'var(--accent-red)' }}
                    onClick={() => setClassAssignmentFilter('unassigned')}
                  >
                    ⚠️ Remaining / Unassigned ({unassignedCount})
                  </button>
                  <button
                    className={`action-btn ${classAssignmentFilter === 'assigned' ? 'action-btn-edit' : ''}`}
                    style={{ background: classAssignmentFilter === 'assigned' ? 'var(--accent-green)' : 'var(--bg-main)', color: classAssignmentFilter === 'assigned' ? '#0f172a' : 'var(--accent-green)' }}
                    onClick={() => setClassAssignmentFilter('assigned')}
                  >
                    ✅ Assigned ({assignedCount})
                  </button>
                </div>

                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Class Division</th>
                        <th>Standard</th>
                        <th>Division</th>
                        <th>Class Teacher Status</th>
                        <th>Student Capacity</th>
                        <th>Assign / Unassign Class Teacher</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClasses.length === 0 ? (
                        <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No matching classes found.</td></tr>
                      ) : (
                        filteredClasses.map((cls) => (
                          <tr key={cls._id}>
                            <td>
                              <code style={{ background: 'var(--bg-main)', color: 'var(--accent-yellow)', fontSize: '1rem', fontWeight: 800 }}>
                                {cls.name}
                              </code>
                            </td>
                            <td>{cls.standardId?.name || 'Standard'}</td>
                            <td>{cls.divisionId?.name || 'Division'}</td>
                            <td>
                              {cls.classTeacherId ? (
                                <span className="badge badge-green">
                                  👨‍🏫 {cls.classTeacherId.name} ({cls.classTeacherId.customId})
                                </span>
                              ) : (
                                <span className="badge badge-red">
                                  ⚠️ Unassigned / Remaining
                                </span>
                              )}
                            </td>
                            <td>
                              <strong>{cls.studentCount || 0}</strong> / {cls.capacity || 40} Students
                            </td>
                            <td>
                              <select
                                className="form-select"
                                style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', width: '230px' }}
                                value={cls.classTeacherId?._id || 'none'}
                                onChange={(e) => handleAssignClassTeacher(cls._id, e.target.value)}
                              >
                                <option value="none">-- ⚠️ Not Assigned (Unassign) --</option>
                                {facultyList.map((f) => (
                                  <option key={f._id} value={f._id}>
                                    {f.name} ({f.customId || f.department})
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sub-Tab 2: Subject Teacher Mapping */}
            {activeSubTab === 'subject-teachers' && (
              <div className="two-col-grid animate-fade-in">
                <div className="card">
                  <div className="card-title">
                    <span>📚 Assign Subject Teacher to Class</span>
                  </div>
                  <form onSubmit={handleAssignSubjectTeacher}>
                    <div className="form-group">
                      <label className="form-label">Select Class (1st-A to 12th-C)</label>
                      <select
                        className="form-select"
                        value={subTeachForm.classId}
                        onChange={(e) => setSubTeachForm({ ...subTeachForm, classId: e.target.value })}
                        required
                      >
                        {classesList.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.name} ({c.standardId?.name})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Select Subject</label>
                      <select
                        className="form-select"
                        value={subTeachForm.subjectId}
                        onChange={(e) => setSubTeachForm({ ...subTeachForm, subjectId: e.target.value })}
                        required
                      >
                        {subjectsList.map((s) => (
                          <option key={s._id} value={s._id}>
                            {s.name} ({s.standardId?.name})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label className="form-label">Assign Faculty Teacher</label>
                      <select
                        className="form-select"
                        value={subTeachForm.teacherId}
                        onChange={(e) => setSubTeachForm({ ...subTeachForm, teacherId: e.target.value })}
                        required
                      >
                        {facultyList.map((f) => (
                          <option key={f._id} value={f._id}>
                            {f.name} ({f.customId}) - {f.department}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button type="submit" className="btn-submit" style={{ background: 'var(--gradient-admin)', color: '#fff' }}>
                      🔗 Save Subject Teacher Assignment
                    </button>
                  </form>
                </div>

                <div className="card">
                  <div className="card-title">
                    <span>📋 Active Subject Teacher Mappings ({subjectAssignments.length})</span>
                  </div>
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Class</th>
                          <th>Subject</th>
                          <th>Assigned Teacher</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjectAssignments.length === 0 ? (
                          <tr><td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>No subject teacher mappings configured yet.</td></tr>
                        ) : (
                          subjectAssignments.map((a) => (
                            <tr key={a._id}>
                              <td><code style={{ color: 'var(--accent-yellow)' }}>{a.classId?.name}</code></td>
                              <td style={{ fontWeight: 600 }}>{a.subjectId?.name}</td>
                              <td style={{ color: 'var(--accent-green)' }}>{a.teacherId?.name} ({a.teacherId?.customId})</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-Tab 3: Users Directory */}
            {activeSubTab === 'users' && (
              <div className="card animate-fade-in">
                <div className="card-title">
                  <span>📋 System Users Directory</span>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      placeholder="Search name, ID or email..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="form-input"
                      style={{ width: '220px', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                    />
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="form-select"
                      style={{ width: '130px', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                    >
                      <option value="all">All Roles</option>
                      <option value="student">Students</option>
                      <option value="teacher">Faculty</option>
                      <option value="admin">Admins</option>
                    </select>
                  </div>
                </div>

                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Custom ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Dept / Class</th>
                        <th>Pending Fee</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                            No matching user accounts found.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => (
                          <tr key={u._id}>
                            <td>
                              <code style={{ background: 'var(--bg-main)', color: 'var(--accent-blue)', fontWeight: 'bold' }}>
                                {u.customId || 'N/A'}
                              </code>
                            </td>
                            <td style={{ fontWeight: 600 }}>{u.name}</td>
                            <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                            <td>
                              <span className={`badge ${u.role === 'admin' ? 'badge-blue' : u.role === 'teacher' ? 'badge-green' : 'badge-yellow'}`}>
                                {u.role.toUpperCase()}
                              </span>
                            </td>
                            <td>{u.department || u.gradeClass || '-'}</td>
                            <td>
                              {u.role === 'student' ? (
                                <span style={{ color: u.pendingFees > 0 ? 'var(--accent-red)' : 'var(--accent-green)', fontWeight: 'bold' }}>
                                  ${u.pendingFees || 0}
                                </span>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                {u.role === 'student' && (
                                  <button
                                    className="action-btn action-btn-edit"
                                    onClick={() => {
                                      setEditingUser(u);
                                      setNewFeeValue(u.pendingFees || 0);
                                    }}
                                  >
                                    ✏️ Edit Fee
                                  </button>
                                )}
                                {u._id !== user.id && (
                                  <button
                                    className="action-btn action-btn-danger"
                                    onClick={() => handleDeleteUser(u._id, u.customId || u.name)}
                                  >
                                    🗑️ Delete
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sub-Tab 4: Create Student */}
            {activeSubTab === 'create-student' && (
              <div className="two-col-grid animate-fade-in">
                {/* Enroll New Student */}
                <div className="card">
                  <div className="card-title">
                    <span>🎓 Enroll New Student</span>
                    <span className="badge badge-yellow">Auto ID STU100x</span>
                  </div>
                  <form onSubmit={handleCreateStudent}>
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Aarav Patel"
                        value={studentForm.name}
                        onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <input
                        type="email"
                        className="form-input"
                        placeholder="aarav@school.com"
                        value={studentForm.email}
                        onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">🏫 Assign to Class (e.g. 12th-C)</label>
                      <select
                        className="form-select"
                        value={studentForm.classId}
                        onChange={(e) => {
                          const selectedClass = classesList.find((c) => c._id === e.target.value);
                          setStudentForm({
                            ...studentForm,
                            classId: e.target.value,
                            gradeClass: selectedClass ? selectedClass.name : studentForm.gradeClass,
                          });
                        }}
                      >
                        <option value="">-- Select Class --</option>
                        {classesList.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.name} ({c.standardId?.name}) {c.classTeacherId ? `— CT: ${c.classTeacherId.name}` : ''}
                          </option>
                        ))}
                      </select>
                      {studentForm.classId && (
                        <div style={{ marginTop: '6px', fontSize: '0.8rem', color: 'var(--accent-green)' }}>
                          ✅ Will be enrolled in: <strong>{studentForm.gradeClass}</strong>
                        </div>
                      )}
                    </div>

                    <div className="two-col-grid" style={{ marginBottom: '1.1rem' }}>
                      <div>
                        <label className="form-label">Initial Pending Fee ($)</label>
                        <input
                          type="number"
                          className="form-input"
                          placeholder="1200"
                          value={studentForm.pendingFees}
                          onChange={(e) => setStudentForm({ ...studentForm, pendingFees: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="form-label">Default Password</label>
                        <input
                          type="password"
                          className="form-input"
                          value={studentForm.password}
                          onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <button type="submit" className="btn-submit" style={{ background: 'var(--gradient-student)', color: '#fff' }}>
                      ➕ Register & Enroll Student Account
                    </button>
                  </form>
                </div>

                {/* Assign / Reassign Student to Class */}
                <div className="card">
                  <div className="card-title">
                    <span>🔀 Assign / Reassign Student to Class</span>
                    <span className="badge badge-blue">Existing Students</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Move a student from one class to another. This updates both the StudentProfile and gradeClass.
                  </p>
                  <form onSubmit={handleAssignStudentClass}>
                    <div className="form-group">
                      <label className="form-label">Select Student</label>
                      <select
                        className="form-select"
                        value={assignStudentForm.studentId}
                        onChange={(e) => setAssignStudentForm({ ...assignStudentForm, studentId: e.target.value })}
                        required
                      >
                        <option value="">-- Select Student --</option>
                        {usersList.filter((u) => u.role === 'student').map((s) => (
                          <option key={s._id} value={s._id}>
                            {s.name} ({s.customId}) — Current: {s.gradeClass || 'Not Assigned'}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label className="form-label">Assign to Class</label>
                      <select
                        className="form-select"
                        value={assignStudentForm.classId}
                        onChange={(e) => setAssignStudentForm({ ...assignStudentForm, classId: e.target.value })}
                        required
                      >
                        <option value="">-- Select Class --</option>
                        {classesList.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.name} ({c.standardId?.name}) {c.classTeacherId ? `— CT: ${c.classTeacherId.name}` : '⚠️ No Class Teacher'}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button type="submit" className="btn-submit" style={{ background: 'var(--gradient-admin)', color: '#fff' }}>
                      🔀 Assign Student to Selected Class
                    </button>
                  </form>

                  <div style={{ marginTop: '1.5rem', background: 'var(--bg-main)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--accent-blue)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                      📋 How class assignment works:
                    </div>
                    <ul style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', lineHeight: 1.8 }}>
                      <li>When a student is assigned to a class (e.g. <strong>12th-C</strong>), the class teacher can see them in their attendance roster</li>
                      <li>Faculty marks attendance for <strong>each student individually</strong> in their class list</li>
                      <li>Students can be reassigned to a new class at any time</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-Tab 5: Create Teacher */}
            {activeSubTab === 'create-teacher' && (
              <div className="card animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <div className="card-title">
                  <span>👨‍🏫 Create Faculty Account</span>
                  <span className="badge badge-green">Auto ID EMP100x</span>
                </div>
                <form onSubmit={handleCreateTeacher}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Dr. Priya Verma"
                      value={teacherForm.name}
                      onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="priya@school.com"
                      value={teacherForm.email}
                      onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Academic Department</label>
                    <select
                      className="form-select"
                      value={teacherForm.department}
                      onChange={(e) => setTeacherForm({ ...teacherForm, department: e.target.value })}
                    >
                      <option value="Computer Science">Computer Science</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="English & Literature">English & Literature</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label">Default Password</label>
                    <input
                      type="password"
                      className="form-input"
                      value={teacherForm.password}
                      onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })}
                      required
                    />
                  </div>
                  <button type="submit" className="btn-submit" style={{ background: 'var(--gradient-teacher)', color: '#fff' }}>
                    ➕ Register Faculty Account
                  </button>
                </form>
              </div>
            )}

            {/* Fee Edit Modal */}
            {editingUser && (
              <div className="modal-overlay">
                <div className="modal-content animate-fade-in">
                  <h3 style={{ marginBottom: '1rem' }}>✏️ Edit Pending Fee for {editingUser.name}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Student Custom ID: <code>{editingUser.customId}</code>
                  </p>
                  <div className="form-group">
                    <label className="form-label">Updated Pending Fee ($)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newFeeValue}
                      onChange={(e) => setNewFeeValue(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
                    <button
                      className="btn-submit"
                      style={{ flex: 1 }}
                      onClick={() => handleUpdateFee(editingUser._id)}
                    >
                      Save Changes
                    </button>
                    <button
                      style={{
                        padding: '0.85rem 1.25rem',
                        background: 'var(--bg-main)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                      onClick={() => setEditingUser(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* 👨‍🏫 FACULTY DASHBOARD */}
        {/* ========================================================= */}
        {user.role === 'teacher' && (
          <div>
            <div className="portal-banner">
              <div className="banner-info">
                <h1>👨‍🏫 Faculty Operations Portal</h1>
                <p>
                  Department: <strong style={{ color: 'var(--accent-green)' }}>{user.department || 'Computer Science'}</strong> | Employee ID: <strong>{user.customId}</strong>
                </p>
                {myClassInfo && myClassInfo.assigned && (
                  <div style={{ marginTop: '0.5rem', background: 'var(--bg-main)', padding: '0.5rem 1rem', borderRadius: '8px', display: 'inline-block', border: '1px solid var(--accent-green)' }}>
                    🏫 <strong>Assigned Class Teacher:</strong> <span style={{ color: 'var(--accent-yellow)', fontWeight: 800 }}>{myClassInfo.classInfo.name}</span> ({myClassInfo.totalStudents} Enrolled Students)
                  </div>
                )}
              </div>
              <span className="badge badge-green" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                Active Instructor Mode 🟢
              </span>
            </div>

            {/* Sub Navigation */}
            <div className="nav-tabs">
              <button
                className={`nav-tab-btn ${activeSubTab === 'attendance' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('attendance')}
              >
                📝 Mark Attendance
              </button>
              <button
                className={`nav-tab-btn ${activeSubTab === 'gradebook' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('gradebook')}
              >
                📊 Upload Exam Marks
              </button>
              <button
                className={`nav-tab-btn ${activeSubTab === 'att-logs' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('att-logs')}
              >
                📋 Attendance Logs ({attendanceRecords.length})
              </button>
              <button
                className={`nav-tab-btn ${activeSubTab === 'marks-logs' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('marks-logs')}
              >
                🏆 Marks Logs ({marksRecords.length})
              </button>
              <button
                className={`nav-tab-btn ${activeSubTab === 'roster' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('roster')}
              >
                👩‍🎓 Student Roster ({teacherStudents.length})
              </button>
            </div>

            {/* Sub-Tab 1: Mark Attendance — Roster-Based Bulk Marking */}
            {activeSubTab === 'attendance' && (
              <div className="card animate-fade-in">
                <div className="card-title">
                  <span>📝 Mark Class Attendance — {myClassInfo?.classInfo?.name || 'My Class'}</span>
                  <span className="badge badge-green">{teacherStudents.length} Students</span>
                </div>

                {teacherStudents.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏫</div>
                    <p style={{ fontWeight: 600 }}>No students assigned to your class yet.</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                      Ask the Admin to assign students to your class ({myClassInfo?.classInfo?.name || 'your assigned class'}).
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Date + Subject Selectors */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">📅 Attendance Date</label>
                        <input
                          type="date"
                          className="form-input"
                          value={bulkAttDate}
                          onChange={(e) => setBulkAttDate(e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">📚 Subject / Period</label>
                        <select
                          className="form-select"
                          value={bulkAttSubject}
                          onChange={(e) => setBulkAttSubject(e.target.value)}
                        >
                          <option value="Computer Science">Computer Science</option>
                          <option value="Mathematics">Mathematics</option>
                          <option value="Physics">Physics</option>
                          <option value="Chemistry">Chemistry</option>
                          <option value="English Literature">English Literature</option>
                          <option value="Hindi">Hindi</option>
                          <option value="Social Studies">Social Studies</option>
                          <option value="Biology">Biology</option>
                        </select>
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Quick Mark:</span>
                      <button
                        type="button"
                        onClick={() => {
                          const all = {};
                          teacherStudents.forEach((s) => { all[s._id] = 'Present'; });
                          setBulkAttStatus(all);
                        }}
                        style={{
                          padding: '0.4rem 0.9rem', borderRadius: '8px', border: '1px solid var(--accent-green)',
                          background: 'rgba(74,222,128,0.1)', color: 'var(--accent-green)', fontWeight: 700,
                          cursor: 'pointer', fontSize: '0.85rem',
                        }}
                      >
                        ✅ All Present
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const all = {};
                          teacherStudents.forEach((s) => { all[s._id] = 'Absent'; });
                          setBulkAttStatus(all);
                        }}
                        style={{
                          padding: '0.4rem 0.9rem', borderRadius: '8px', border: '1px solid var(--accent-red)',
                          background: 'rgba(248,113,113,0.1)', color: 'var(--accent-red)', fontWeight: 700,
                          cursor: 'pointer', fontSize: '0.85rem',
                        }}
                      >
                        ❌ All Absent
                      </button>
                      <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        ✅ {Object.values(bulkAttStatus).filter((v) => v === 'Present').length} Present &nbsp;|&nbsp;
                        ❌ {Object.values(bulkAttStatus).filter((v) => v === 'Absent').length} Absent
                      </span>
                    </div>

                    {/* Student Roster Table */}
                    <div className="table-container" style={{ maxHeight: '480px', overflowY: 'auto' }}>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Student ID</th>
                            <th>Full Name</th>
                            <th>Class</th>
                            <th>Overall Att %</th>
                            <th style={{ minWidth: '180px' }}>Mark Attendance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {teacherStudents.map((s, idx) => {
                            const status = bulkAttStatus[s._id] || 'Present';
                            return (
                              <tr key={s._id} style={{
                                background: status === 'Absent' ? 'rgba(248,113,113,0.05)' : 'transparent',
                                transition: 'background 0.2s',
                              }}>
                                <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{idx + 1}</td>
                                <td>
                                  <code style={{ color: 'var(--accent-blue)', fontSize: '0.85rem' }}>
                                    {s.customId || 'N/A'}
                                  </code>
                                </td>
                                <td style={{ fontWeight: 700 }}>{s.name}</td>
                                <td>
                                  <span className="badge badge-yellow" style={{ fontSize: '0.75rem' }}>
                                    {s.gradeClass || myClassInfo?.classInfo?.name || '-'}
                                  </span>
                                </td>
                                <td>
                                  <span style={{
                                    color: (s.attendancePercentage || 100) >= 80 ? 'var(--accent-green)' : 'var(--accent-red)',
                                    fontWeight: 700,
                                  }}>
                                    {s.attendancePercentage || 100}%
                                  </span>
                                </td>
                                <td>
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                      type="button"
                                      onClick={() => setBulkAttStatus((prev) => ({ ...prev, [s._id]: 'Present' }))}
                                      style={{
                                        flex: 1,
                                        padding: '0.4rem 0.6rem',
                                        borderRadius: '7px',
                                        border: status === 'Present' ? '2px solid var(--accent-green)' : '1px solid var(--border-color)',
                                        background: status === 'Present' ? 'rgba(74,222,128,0.2)' : 'var(--bg-main)',
                                        color: status === 'Present' ? 'var(--accent-green)' : 'var(--text-muted)',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        fontSize: '0.8rem',
                                        transition: 'all 0.15s',
                                      }}
                                    >
                                      ✅ P
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setBulkAttStatus((prev) => ({ ...prev, [s._id]: 'Absent' }))}
                                      style={{
                                        flex: 1,
                                        padding: '0.4rem 0.6rem',
                                        borderRadius: '7px',
                                        border: status === 'Absent' ? '2px solid var(--accent-red)' : '1px solid var(--border-color)',
                                        background: status === 'Absent' ? 'rgba(248,113,113,0.2)' : 'var(--bg-main)',
                                        color: status === 'Absent' ? 'var(--accent-red)' : 'var(--text-muted)',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        fontSize: '0.8rem',
                                        transition: 'all 0.15s',
                                      }}
                                    >
                                      ❌ A
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Submit Button */}
                    <div style={{ marginTop: '1.25rem', display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="btn-submit"
                        disabled={bulkAttSubmitting}
                        onClick={handleBulkAttendance}
                        style={{ background: 'var(--gradient-teacher)', color: '#fff', flex: 1 }}
                      >
                        {bulkAttSubmitting ? '⏳ Saving...' : `💾 Submit Attendance for All ${teacherStudents.length} Students`}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Sub-Tab 2: Gradebook & Upload Marks */}
            {activeSubTab === 'gradebook' && (
              <div className="card animate-fade-in" style={{ maxWidth: '650px', margin: '0 auto' }}>
                <div className="card-title">
                  <span>📊 Upload Exam Marks / Gradebook</span>
                  <span className="badge badge-purple">Academic Evaluation</span>
                </div>
                <form onSubmit={handleUploadMarks}>
                  <div className="form-group">
                    <label className="form-label">Select Student</label>
                    <select
                      className="form-select"
                      value={marksForm.studentId}
                      onChange={(e) => setMarksForm({ ...marksForm, studentId: e.target.value })}
                      required
                    >
                      {teacherStudents.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name} ({s.customId}) - {s.gradeClass}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="two-col-grid">
                    <div className="form-group">
                      <label className="form-label">Subject</label>
                      <select
                        className="form-select"
                        value={marksForm.subject}
                        onChange={(e) => setMarksForm({ ...marksForm, subject: e.target.value })}
                      >
                        <option value="Computer Science">Computer Science</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Physics">Physics</option>
                        <option value="Chemistry">Chemistry</option>
                        <option value="English Literature">English Literature</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Exam Name</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Midterm 2026, Quiz 1"
                        value={marksForm.examName}
                        onChange={(e) => setMarksForm({ ...marksForm, examName: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="two-col-grid" style={{ marginBottom: '1.5rem' }}>
                    <div className="form-group">
                      <label className="form-label">Marks Obtained</label>
                      <input
                        type="number"
                        className="form-input"
                        value={marksForm.marksObtained}
                        onChange={(e) => setMarksForm({ ...marksForm, marksObtained: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Total Maximum Marks</label>
                      <input
                        type="number"
                        className="form-input"
                        value={marksForm.totalMarks}
                        onChange={(e) => setMarksForm({ ...marksForm, totalMarks: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-submit" style={{ background: 'var(--accent-purple)', color: '#fff' }}>
                    📤 Submit Grade Entry
                  </button>
                </form>
              </div>
            )}

            {/* Sub-Tab 3: Attendance Logs */}
            {activeSubTab === 'att-logs' && (
              <div className="card animate-fade-in">
                <div className="card-title">
                  <span>📋 Class Attendance Logs History</span>
                </div>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Student Name</th>
                        <th>Subject</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceRecords.length === 0 ? (
                        <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>No attendance records found.</td></tr>
                      ) : (
                        attendanceRecords.map((r) => (
                          <tr key={r._id}>
                            <td><code>{r.date}</code></td>
                            <td style={{ fontWeight: 600 }}>{r.studentName}</td>
                            <td>{r.subject}</td>
                            <td>
                              <span className={`badge ${r.status === 'Present' ? 'badge-green' : 'badge-red'}`}>
                                {r.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sub-Tab 4: Marks Logs */}
            {activeSubTab === 'marks-logs' && (
              <div className="card animate-fade-in">
                <div className="card-title">
                  <span>🏆 Uploaded Marks & Evaluation Log</span>
                </div>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Subject</th>
                        <th>Exam Title</th>
                        <th>Marks Obtained</th>
                        <th>Percentage</th>
                        <th>Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {marksRecords.length === 0 ? (
                        <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No gradebook entries recorded.</td></tr>
                      ) : (
                        marksRecords.map((m) => {
                          const pct = ((m.marksObtained / m.totalMarks) * 100).toFixed(1);
                          return (
                            <tr key={m._id}>
                              <td style={{ fontWeight: 600 }}>{m.studentName}</td>
                              <td>{m.subject}</td>
                              <td>{m.examName}</td>
                              <td><strong>{m.marksObtained}</strong> / {m.totalMarks}</td>
                              <td>{pct}%</td>
                              <td>
                                <span className={`badge ${pct >= 50 ? 'badge-green' : 'badge-red'}`}>
                                  {pct >= 50 ? 'PASS' : 'FAIL'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sub-Tab 5: Student Roster */}
            {activeSubTab === 'roster' && (
              <div className="card animate-fade-in">
                <div className="card-title">
                  <span>👩‍🎓 Class Student Directory Roster ({myClassInfo?.classInfo?.name || 'Assigned Class'})</span>
                </div>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Student ID</th>
                        <th>Full Name</th>
                        <th>Email</th>
                        <th>Class/Grade</th>
                        <th>Overall Attendance</th>
                        <th>Pending Fee ($)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teacherStudents.map((s) => (
                        <tr key={s._id}>
                          <td><code style={{ color: 'var(--accent-blue)' }}>{s.customId}</code></td>
                          <td style={{ fontWeight: 600 }}>{s.name}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{s.email}</td>
                          <td>{s.gradeClass}</td>
                          <td>
                            <span style={{ color: s.attendancePercentage >= 80 ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 'bold' }}>
                              {s.attendancePercentage}%
                            </span>
                          </td>
                          <td>${s.pendingFees || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* 🎓 STUDENT DASHBOARD */}
        {/* ========================================================= */}
        {user.role === 'student' && (
          <div>
            <div className="portal-banner">
              <div className="banner-info">
                <h1>🎓 Student Academic Portal</h1>
                <p>
                  Class: <strong>{user.gradeClass || '5th-C'}</strong> | Student ID: <strong>{user.customId}</strong>
                </p>
              </div>
              <span className="badge badge-yellow" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                Enrolled Student 🎓
              </span>
            </div>

            {/* KPI Metric Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-card-title">Overall Attendance</div>
                <div
                  className="stat-card-value"
                  style={{
                    color:
                      (studentAttendance.percentage || user.attendancePercentage) >= 80
                        ? 'var(--accent-green)'
                        : 'var(--accent-red)',
                  }}
                >
                  {studentAttendance.percentage !== undefined ? studentAttendance.percentage : user.attendancePercentage}%
                </div>
                <div className="stat-card-subtitle">
                  {studentAttendance.presentClasses} / {studentAttendance.totalClasses} sessions attended
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card-title">Pending Tuition Fees</div>
                <div className="stat-card-value" style={{ color: user.pendingFees > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                  ${user.pendingFees || 0}
                </div>
                <div className="stat-card-subtitle">
                  {user.pendingFees > 0 ? 'Payment Due' : 'Fully Paid ✅'}
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card-title">Academic Score Avg</div>
                <div className="stat-card-value" style={{ color: 'var(--accent-blue)' }}>
                  {studentAverageScore}%
                </div>
                <div className="stat-card-subtitle">Based on recorded exams</div>
              </div>

              <div className="stat-card">
                <div className="stat-card-title">Exams Evaluated</div>
                <div className="stat-card-value" style={{ color: 'var(--accent-purple)' }}>
                  {studentMarks.length}
                </div>
                <div className="stat-card-subtitle">Completed test papers</div>
              </div>
            </div>

            {/* Student Navigation Sub-tabs */}
            <div className="nav-tabs">
              <button
                className={`nav-tab-btn ${activeSubTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('overview')}
              >
                📅 Attendance Log
              </button>
              <button
                className={`nav-tab-btn ${activeSubTab === 'marks' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('marks')}
              >
                📝 Report Card & Marks
              </button>
              <button
                className={`nav-tab-btn ${activeSubTab === 'fee-payment' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('fee-payment')}
              >
                💳 Pay Fees (${user.pendingFees || 0})
              </button>
            </div>

            {/* Sub-Tab 1: Attendance Log */}
            {activeSubTab === 'overview' && (
              <div className="card animate-fade-in">
                <div className="card-title">
                  <span>📅 Attendance Log & Subject Summary</span>
                </div>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Subject</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentAttendance.records.length === 0 ? (
                        <tr><td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>No individual attendance logs found yet.</td></tr>
                      ) : (
                        studentAttendance.records.map((r) => (
                          <tr key={r._id}>
                            <td><code>{r.date}</code></td>
                            <td style={{ fontWeight: 600 }}>{r.subject}</td>
                            <td>
                              <span className={`badge ${r.status === 'Present' ? 'badge-green' : 'badge-red'}`}>
                                {r.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sub-Tab 2: Report Card */}
            {activeSubTab === 'marks' && (
              <div className="card animate-fade-in">
                <div className="card-title">
                  <span>📝 Official Academic Report Card</span>
                  <button
                    onClick={() => window.print()}
                    style={{
                      padding: '0.4rem 0.8rem',
                      background: 'var(--bg-main)',
                      color: 'var(--accent-blue)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                    }}
                  >
                    🖨️ Print Report Card
                  </button>
                </div>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Exam Title</th>
                        <th>Score</th>
                        <th>Max Score</th>
                        <th>Percentage</th>
                        <th>Grade</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentMarks.length === 0 ? (
                        <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No examination results published yet.</td></tr>
                      ) : (
                        studentMarks.map((m) => {
                          const pct = Number(((m.marksObtained / m.totalMarks) * 100).toFixed(1));
                          const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 50 ? 'C' : 'F';
                          return (
                            <tr key={m._id}>
                              <td style={{ fontWeight: 600 }}>{m.subject}</td>
                              <td>{m.examName}</td>
                              <td><strong>{m.marksObtained}</strong></td>
                              <td>{m.totalMarks}</td>
                              <td>{pct}%</td>
                              <td>
                                <span className={`badge ${grade === 'F' ? 'badge-red' : 'badge-blue'}`}>
                                  {grade}
                                </span>
                              </td>
                              <td>
                                <span className={`badge ${pct >= 50 ? 'badge-green' : 'badge-red'}`}>
                                  {pct >= 50 ? 'PASS' : 'FAIL'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sub-Tab 3: Fee Payment */}
            {activeSubTab === 'fee-payment' && (
              <div className="two-col-grid animate-fade-in">
                <div className="card">
                  <div className="card-title">
                    <span>💳 Fee Payment Gateway</span>
                  </div>
                  <form onSubmit={handlePayFee}>
                    <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: '10px', marginBottom: '1.25rem' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Outstanding Balance:</span>
                      <h2 style={{ color: user.pendingFees > 0 ? 'var(--accent-red)' : 'var(--accent-green)', fontSize: '2rem', marginTop: '4px' }}>
                        ${user.pendingFees || 0}
                      </h2>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Payment Amount ($)</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="Enter amount (e.g. 500)"
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        max={user.pendingFees}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={user.pendingFees <= 0}
                      className="btn-submit"
                      style={{ background: 'var(--gradient-student)', color: '#fff' }}
                    >
                      {user.pendingFees <= 0 ? 'No Fees Due ✅' : '💳 Pay Tuition Fees Now'}
                    </button>
                  </form>
                </div>

                <div className="card">
                  <div className="card-title">
                    <span>🧾 Transaction Receipt</span>
                  </div>
                  {lastReceipt ? (
                    <div className="receipt-card animate-fade-in">
                      <h3 style={{ color: 'var(--accent-green)', marginBottom: '0.5rem' }}>🎉 Payment Successful</h3>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div>Transaction ID: <code style={{ color: '#fff' }}>{lastReceipt.transactionId}</code></div>
                        <div>Amount Paid: <strong style={{ color: '#fff' }}>${lastReceipt.amountPaid}</strong></div>
                        <div>Remaining Fee Balance: <strong style={{ color: 'var(--accent-yellow)' }}>${lastReceipt.remainingFees}</strong></div>
                        <div>Student Name: {user.name}</div>
                        <div>Date: {new Date().toLocaleDateString()}</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                      No recent payment receipt. Submit a fee payment on the left to generate an official transaction receipt.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}