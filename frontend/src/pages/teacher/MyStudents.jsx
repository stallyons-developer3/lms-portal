import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import SearchIcon from '../../components/SearchIcon';
import api from '../../api/axios';

const MyStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [coursesRes, allStudentsRes, classesRes] = await Promise.all([
          api.get('/courses'),
          api.get('/users?role=student'),
          api.get('/classes'),
        ]);

        const courses = coursesRes.data;
        const allStudents = allStudentsRes.data;
        const classes = classesRes.data;

        const teacherClassIds = new Set();
        courses.forEach((c) => {
          (c.classes || []).forEach((cls) => {
            const id = typeof cls === 'object' ? cls._id : cls;
            if (id) teacherClassIds.add(id.toString());
          });
        });

        const myStudents = allStudents.filter((s) => {
          if (!s.class) return false;
          const classId = typeof s.class === 'object' ? s.class._id : s.class;
          return teacherClassIds.has(classId.toString());
        });

        const classMap = {};
        classes.forEach((c) => { classMap[c._id] = c.name; });

        const enriched = myStudents.map((s) => {
          const classId = typeof s.class === 'object' ? s.class._id : s.class;
          return { ...s, className: classMap[classId] || '-' };
        });

        setStudents(enriched);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = students.filter((s) =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="page-header-card">
        <div className="page-title-area">
          <h2>My Students</h2>
          <p>Students in classes assigned to your courses</p>
        </div>
        <div className="page-header-actions">
          <div className="search-bar" style={{ minWidth: 220 }}>
            <span><SearchIcon /></span>
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="card">
        {loading ? (
          <div className="empty-state">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            {students.length === 0
              ? 'No students yet. Make sure your courses are assigned to classes with enrolled students.'
              : 'No students match your search.'}
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Class</th>
                  <th>Points</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s._id}>
                    <td>{s.name}</td>
                    <td>{s.email}</td>
                    <td>{s.className}</td>
                    <td>⭐ {s.totalPoints || 0}</td>
                    <td style={{ color: 'var(--text-light)', fontSize: 13 }}>
                      {new Date(s.createdAt).toLocaleDateString()}
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

export default MyStudents;
