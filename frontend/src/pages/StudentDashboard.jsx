import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import OptionalCoursesPanel from '../components/OptionalCoursesPanel';
import SearchIcon from '../components/SearchIcon';
import welBg from '../assets/image/std-wel-bg.png';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/courses')
      .then(({ data }) => setCourses(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const firstName = user?.name?.split(' ')[0] || 'Student';

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <Layout>
      <div className="student-dashboard-top">
        <div className="search-bar dashboard-search">
          <span><SearchIcon /></span>
          <input type="text" placeholder="Search..." />
        </div>

        <div
          className="welcome-card"
          style={{
            background: `url(${welBg}) center/cover no-repeat`,
          }}
        >
          <div className="welcome-card-text">
            <div className="greeting">Welcome Back</div>
            <div className="name">{firstName}</div>
          </div>
        </div>

        <OptionalCoursesPanel />
      </div>

      <div className="card">
        <h2 className="courses-section-title">Courses</h2>
        <p className="card-subtitle">View and manage your course</p>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Course Title</th>
                <th>Teacher</th>
                <th>Due Date</th>
                <th>Lessons</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 20 }}>Loading...</td>
                </tr>
              ) : courses.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 20, color: 'var(--text-light)' }}>
                    No courses for your class yet.
                  </td>
                </tr>
              ) : (
                courses.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <Link to={`/student/courses/${c._id}/lessons`} className="table-link">
                        {c.title}
                      </Link>
                    </td>
                    <td>{c.teacherName}</td>
                    <td>{formatDate(c.dueDate)}</td>
                    <td>{c.lessons || 0}</td>
                    <td>
                      <button
                        className="btn-action-edit"
                        onClick={() => navigate(`/student/courses/${c._id}/lessons`)}
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default StudentDashboard;
