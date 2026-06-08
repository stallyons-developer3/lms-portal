import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import OptionalCoursesPanel from '../components/OptionalCoursesPanel';
import api from '../api/axios';
import EditIcon from '../components/EditIcon';
import DeleteIcon from '../components/DeleteIcon';
import Pagination from '../components/Pagination';
import usePagination from '../hooks/usePagination';
import notify from '../utils/notify';
import statCubes from '../assets/image/stat-cubes.png';
import statTrophy from '../assets/image/stat-trophy.png';
import statShapes from '../assets/image/stat-shapes.png';
import statRobot from '../assets/image/stat-robot.png';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, teachers: 0, students: 0, courses: 0 });
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { page, setPage, pageSize, setPageSize, totalPages, paginated: paginatedCourses } = usePagination(courses, 10);

  const fetchData = async () => {
    try {
      const [usersRes, coursesRes] = await Promise.all([
        api.get('/users'),
        api.get('/courses'),
      ]);

      const users = usersRes.data;
      const coursesData = coursesRes.data;

      setStats({
        total: users.length,
        teachers: users.filter((u) => u.role === 'teacher').length,
        students: users.filter((u) => u.role === 'student').length,
        courses: coursesData.length,
      });

      setCourses(coursesData);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id, title) => {
    const ok = await notify.confirm({
      title: 'Delete course?',
      text: `"${title}" and all its lessons will be permanently deleted.`,
    });
    if (!ok) return;
    try {
      await api.delete(`/courses/${id}`);
      notify.success('Course deleted');
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  // Format date nicely
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <Layout title="Dashboard">
      <div className="dashboard-top">
        <div className="search-bar dashboard-search">
          <span>
<svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M8.42327 14.5229C11.792 14.5229 14.5229 11.792 14.5229 8.42326C14.5229 5.05454 11.792 2.32366 8.42327 2.32366C5.05455 2.32366 2.32367 5.05454 2.32367 8.42326C2.32367 11.792 5.05455 14.5229 8.42327 14.5229Z" stroke="#017987" strokeWidth="1.39419" strokeLinecap="round" strokeLinejoin="round"/>
<path d="M12.7361 12.7366L16.2652 16.2657" stroke="#017987" strokeWidth="1.39419" strokeLinecap="round" strokeLinejoin="round"/>
</svg>
</span>
          <input type="text" placeholder="Search..." />
        </div>

        <div className="stats-grid-2x2">
          <StatCard label="Total User" value={stats.total.toLocaleString()} image={statCubes} color="orange" />
          <StatCard label="Total Teachers" value={stats.teachers.toLocaleString()} image={statTrophy} color="blue" />
          <StatCard label="Total Students" value={stats.students.toLocaleString()} image={statShapes} color="purple" />
          <StatCard label="Total Courses" value={stats.courses.toLocaleString()} image={statRobot} color="pink" />
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
                <th>Assignment Title</th>
                <th>Teacher</th>
                <th>Due Date</th>
                <th>Lessons</th>
                <th>Submit</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>Loading...</td>
                </tr>
              ) : courses.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                    No courses found. Add courses to see them here.
                  </td>
                </tr>
              ) : (
                paginatedCourses.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <Link to={`/admin/courses/${c._id}`} className="table-link">
                        {c.title}
                      </Link>
                    </td>
                    <td>{c.teacherName}</td>
                    <td>{formatDate(c.dueDate)}</td>
                    <td>{c.lessons ?? '-'}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-action-edit"
                          onClick={() => navigate(`/admin/courses/${c._id}/edit`)}
                        >
                          <EditIcon /> Edit
                        </button>
                        <button
                          className="btn-action-delete"
                          onClick={() => handleDelete(c._id, c.title)}
                        >
                          <DeleteIcon /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
        />
      </div>
    </Layout>
  );
};

export default AdminDashboard;