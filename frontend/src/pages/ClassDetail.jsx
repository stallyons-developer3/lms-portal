import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import BackButton from '../components/BackButton';
import EditIcon from '../components/EditIcon';
import DeleteIcon from '../components/DeleteIcon';
import notify from '../utils/notify';
import api from '../api/axios';

const ClassDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [cls, setCls] = useState(null);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [classRes, studentsRes] = await Promise.all([
        api.get(`/classes/${id}`),
        api.get('/users?role=student'),
      ]);
      setCls(classRes.data);
      setAllStudents(studentsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setError('');
    try {
      await api.post(`/classes/${id}/students`, { studentId: selectedStudent });
      setSuccess('Student added to class');
      setSelectedStudent('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed');
    }
  };

  const handleRemoveStudent = async (studentId) => {
    const ok = await notify.confirm({
      title: 'Remove student?',
      text: 'This student will be removed from the class.',
      confirmButtonText: 'Yes, remove',
    });
    if (!ok) return;
    try {
      await api.delete(`/classes/${id}/students/${studentId}`);
      notify.success('Student removed');
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Failed to remove');
    }
  };

  if (loading) {
    return <Layout><div className="empty-state">Loading...</div></Layout>;
  }
  if (!cls) {
    return <Layout><div className="empty-state">Class not found</div></Layout>;
  }

  const assignedIds = new Set((cls.students || []).map((s) => s._id));
  const availableStudents = allStudents.filter((s) => !assignedIds.has(s._id));

  return (
    <Layout>
      <div className="page-header-card">
        <div className="page-header-left">
          <BackButton onClick={() => navigate('/admin/classes')} />
          <div className="page-title-area">
            <h2>{cls.name}</h2>
            <p>{cls.studentCount} students · {cls.courseCount} courses</p>
          </div>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => navigate(`/admin/classes/${id}/edit`)}>
            <EditIcon /> Edit Class
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {cls.description && (
        <div className="card">
          <p style={{ fontSize: 14, color: 'var(--text-light)' }}>{cls.description}</p>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div>
            <h2>Students in this Class</h2>
            <p className="card-subtitle">Students assigned to this class will see its courses automatically</p>
          </div>
        </div>

        <form onSubmit={handleAddStudent} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            style={{ flex: 1, padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'inherit' }}
          >
            <option value="">
              {availableStudents.length === 0
                ? 'No unassigned students available'
                : 'Select a student to add'}
            </option>
            {availableStudents.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} ({s.email}){s.class ? ' — currently in another class' : ''}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary" disabled={!selectedStudent}>
            Add Student
          </button>
        </form>

        {!cls.students || cls.students.length === 0 ? (
          <div className="empty-state">No students assigned yet.</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Total Points</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {cls.students.map((s) => (
                  <tr key={s._id}>
                    <td>{s.name}</td>
                    <td>{s.email}</td>
                    <td>⭐ {s.totalPoints || 0}</td>
                    <td>
                      <button className="btn-action-delete" onClick={() => handleRemoveStudent(s._id)}>
                        <DeleteIcon /> Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h2>Courses for this Class</h2>
            <p className="card-subtitle">All courses assigned to this class</p>
          </div>
        </div>

        {!cls.courses || cls.courses.length === 0 ? (
          <div className="empty-state">No courses assigned to this class yet. Assign courses from the Course Management page.</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Teacher</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {cls.courses.map((c) => (
                  <tr key={c._id}>
                    <td>{c.title}</td>
                    <td>{c.teacherName}</td>
                    <td>
                      <button className="btn-action-edit" onClick={() => navigate(`/admin/courses/${c._id}`)}>
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ClassDetail;
