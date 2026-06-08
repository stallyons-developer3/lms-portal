import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import SearchIcon from '../../components/SearchIcon';
import Pagination from '../../components/Pagination';
import usePagination from '../../hooks/usePagination';
import api, { API_BASE } from '../../api/axios';

const cardGradients = [
  'linear-gradient(135deg, #2c5364 0%, #203a43 50%, #0f2027 100%)',
  'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
  'linear-gradient(135deg, #c4b5fd 0%, #818cf8 100%)',
  'linear-gradient(135deg, #fbcfe8 0%, #c084fc 100%)',
  'linear-gradient(135deg, #a78bfa 0%, #6366f1 100%)',
  'linear-gradient(135deg, #fda4af 0%, #f9a8d4 100%)',
];

const dotColors = ['#10b981', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899'];
const cardEmojis = ['💻', '📝', '💰', '🎨', '⏰', '🎁'];

const MyCourses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/courses');
      setCourses(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const { page, setPage, pageSize, setPageSize, totalPages, paginated } = usePagination(filtered, 12);

  return (
    <Layout>
      <div className="page-header-card">
        <div className="page-title-area">
          <h2>My Courses</h2>
          <p>Courses available for your class</p>
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

      {loading ? (
        <div className="empty-state">Loading courses...</div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            {courses.length === 0
              ? 'No courses for your class yet. Ask your teacher or admin to assign courses.'
              : 'No courses match your search.'}
          </div>
        </div>
      ) : (
        <div className="courses-grid">
          {paginated.map((c, i) => (
            <div
              key={c._id}
              className="course-card"
              onClick={() => navigate(`/student/courses/${c._id}/lessons`)}
            >
              <div
                className="course-card-image"
                style={
                  c.coverImage
                    ? { padding: 0 }
                    : { background: cardGradients[i % cardGradients.length] }
                }
              >
                {c.coverImage ? (
                  <img src={`${API_BASE}${c.coverImage}`} alt={c.title} />
                ) : (
                  cardEmojis[i % cardEmojis.length]
                )}
              </div>
              <div className="course-card-body">
                <div className="course-card-meta-row">
                  <div className="course-card-meta">
                    <span
                      className="lesson-dot"
                      style={{ background: dotColors[i % dotColors.length] }}
                    >
                      ▶
                    </span>
                    {c.lessons}x Lesson
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-light)' }}>
                    {c.teacherName}
                  </div>
                </div>
                <div className="course-card-title">{c.title}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />
    </Layout>
  );
};

export default MyCourses;
