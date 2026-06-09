import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import PlusIcon from '../../components/PlusIcon';
import EditIcon from '../../components/EditIcon';
import DeleteIcon from '../../components/DeleteIcon';
import Pagination from '../../components/Pagination';
import usePagination from '../../hooks/usePagination';
import notify from '../../utils/notify';
import api, { fileUrl } from '../../api/axios';

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

const CoursesManagement = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [error, setError] = useState('');

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/courses');
      setCourses(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (!openMenuId) return;
    const close = () => setOpenMenuId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [openMenuId]);

  const handleDelete = async (id, title) => {
    setOpenMenuId(null);
    const ok = await notify.confirm({
      title: 'Delete course?',
      text: `"${title}" and all its lessons will be permanently deleted.`,
    });
    if (!ok) return;
    try {
      await api.delete(`/courses/${id}`);
      notify.success('Course deleted');
      fetchCourses();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const toggleMenu = (e, id) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const { page, setPage, pageSize, setPageSize, totalPages, paginated } = usePagination(filtered, 12);

  return (
    <Layout>
      <div className="page-header-card">
        <div className="page-title-area">
          <h2>Course Management</h2>
          <p>View and manage your course</p>
        </div>
        <div className="page-header-actions">
          <div >
          <button className="btn btn-primary" onClick={() => navigate('/admin/courses/new')}>
            <PlusIcon /> Add Course
          </button>
          </div>
          <div className="search-bar" style={{ minWidth: 370 }}>
            <span>
<svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M8.42327 14.5229C11.792 14.5229 14.5229 11.792 14.5229 8.42326C14.5229 5.05454 11.792 2.32366 8.42327 2.32366C5.05455 2.32366 2.32367 5.05454 2.32367 8.42326C2.32367 11.792 5.05455 14.5229 8.42327 14.5229Z" stroke="#017987" strokeWidth="1.39419" strokeLinecap="round" strokeLinejoin="round"/>
<path d="M12.7361 12.7366L16.2652 16.2657" stroke="#017987" strokeWidth="1.39419" strokeLinecap="round" strokeLinejoin="round"/>
</svg></span>
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
              ? 'No courses yet. Click "+ Add Course" to create the first one.'
              : 'No courses match your search.'}
          </div>
        </div>
      ) : (
        <div className="cards-scroll-wrapper">
        <div className="courses-grid">
          {paginated.map((c, i) => (
            <div
              key={c._id}
              className={`course-card ${openMenuId === c._id ? 'menu-open' : ''}`}
              onClick={() => navigate(`/admin/courses/${c._id}`)}
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
                  <img src={fileUrl(c.coverImage)} alt={c.title} />
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
                  <div className="menu-wrapper">
                    <button
                      type="button"
                      className="menu-dots-inline"
                      onClick={(e) => toggleMenu(e, c._id)}
                      title="More actions"
                    >
                      <svg width="21" height="6" viewBox="0 0 21 6" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="2.71057" cy="2.71057" r="2.71057" fill="#D9D9D9"/>
<circle cx="10.2994" cy="2.71057" r="2.71057" fill="#D9D9D9"/>
<circle cx="17.8893" cy="2.71057" r="2.71057" fill="#D9D9D9"/>
</svg>

                    </button>
                    {openMenuId === c._id && (
                      <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => navigate(`/admin/courses/${c._id}/lessons`)}>
                          📖 Lessons
                        </button>
                        <button onClick={() => navigate(`/admin/courses/${c._id}`)}>
                          👁 View
                        </button>
                        <button onClick={() => navigate(`/admin/courses/${c._id}/edit`)}>
                          <EditIcon /> Edit
                        </button>
                        <button className="danger" onClick={() => handleDelete(c._id, c.title)}>
                          <DeleteIcon /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="course-card-title">{c.title}</div>
              </div>
            </div>
          ))}
        </div>
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

export default CoursesManagement;
