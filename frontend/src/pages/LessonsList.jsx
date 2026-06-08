import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import BackButton from '../components/BackButton';
import SearchIcon from '../components/SearchIcon';
import PlusIcon from '../components/PlusIcon';
import EditIcon from '../components/EditIcon';
import DeleteIcon from '../components/DeleteIcon';
import Pagination from '../components/Pagination';
import usePagination from '../hooks/usePagination';
import notify from '../utils/notify';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const cardGradients = [
  'linear-gradient(135deg, #2c5364 0%, #203a43 50%, #0f2027 100%)',
  'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
  'linear-gradient(135deg, #c4b5fd 0%, #818cf8 100%)',
  'linear-gradient(135deg, #fbcfe8 0%, #c084fc 100%)',
  'linear-gradient(135deg, #a78bfa 0%, #6366f1 100%)',
  'linear-gradient(135deg, #fda4af 0%, #f9a8d4 100%)',
];
const cardEmojis = ['💻', '📝', '💰', '🎨', '⏰', '🎁'];

const LessonsList = () => {
  const navigate = useNavigate();
  const { id: courseId } = useParams();
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'teacher';

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [contentModal, setContentModal] = useState(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [courseRes, lessonsRes] = await Promise.all([
        api.get(`/courses/${courseId}`),
        api.get(`/courses/${courseId}/lessons`),
      ]);
      setCourse(courseRes.data);
      setLessons(lessonsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [courseId]);

  useEffect(() => {
    if (!openMenuId) return;
    const close = () => setOpenMenuId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [openMenuId]);

  const handleDelete = async (lessonId, lessonTitle) => {
    setOpenMenuId(null);
    const ok = await notify.confirm({
      title: 'Delete lesson?',
      text: `"${lessonTitle}" will be permanently deleted.`,
    });
    if (!ok) return;
    try {
      await api.delete(`/lessons/${lessonId}`);
      notify.success('Lesson deleted');
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleComplete = async (lessonId) => {
    try {
      const { data } = await api.post(`/lessons/${lessonId}/complete`);
      notify.success(data.message);
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Failed');
    }
  };

  const toggleMenu = (e, id) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const filtered = lessons.filter((l) =>
    l.title.toLowerCase().includes(search.toLowerCase())
  );

  const { page, setPage, pageSize, setPageSize, totalPages, paginated } = usePagination(filtered, 12);

  const backPath = user?.role === 'admin'
    ? '/admin/courses'
    : user?.role === 'teacher'
    ? '/teacher/courses'
    : '/student/courses';

  const newLessonPath = user?.role === 'admin'
    ? `/admin/courses/${courseId}/lessons/new`
    : `/teacher/courses/${courseId}/lessons/new`;

  return (
    <Layout>
      <div className="page-header-card">
        <div className="page-header-left">
          <BackButton onClick={() => navigate(backPath)} />
          <div className="page-title-area">
            <h2>Lessons</h2>
            <p>Access and review Lessons{course ? ` · ${course.title}` : ''}</p>
          </div>
        </div>
        <div className="page-header-actions">
          {canManage && (
            <button className="btn btn-primary" onClick={() => navigate(newLessonPath)}>
              <PlusIcon /> Add Lesson
            </button>
          )}
          <div className="search-bar" style={{ minWidth: 280 }}>
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
      {success && <div className="success-message">{success}</div>}

      {loading ? (
        <div className="empty-state">Loading lessons...</div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            {lessons.length === 0
              ? canManage
                ? 'No lessons yet. Click "+ Add Lesson" to create the first one.'
                : 'No lessons available yet.'
              : 'No lessons match your search.'}
          </div>
        </div>
      ) : (
        <div className="courses-grid">
          {paginated.map((l, i) => (
            <div key={l._id} className="course-card lesson-card">
              <div
                className="course-card-image"
                style={
                  l.coverImage
                    ? { padding: 0 }
                    : { background: cardGradients[i % cardGradients.length] }
                }
              >
                {l.coverImage ? (
                  <img src={`http://localhost:5000${l.coverImage}`} alt={l.title} />
                ) : (
                  cardEmojis[i % cardEmojis.length]
                )}
                {user?.role === 'student' && l.isCompletedByMe && (
                  <div className="completed-ribbon">Completed</div>
                )}
              </div>
              {canManage && (
                <div className="menu-wrapper card-menu-wrapper">
                  <button
                    type="button"
                    className="menu-dots"
                    onClick={(e) => toggleMenu(e, l._id)}
                    title="More actions"
                  >
                    <svg width="21" height="6" viewBox="0 0 21 6" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="2.71057" cy="2.71057" r="2.71057" fill="white"/>
<circle cx="10.2994" cy="2.71057" r="2.71057" fill="white"/>
<circle cx="17.8893" cy="2.71057" r="2.71057" fill="white"/>
</svg>

                  </button>
                  {openMenuId === l._id && (
                    <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          const base = user?.role === 'admin' ? '/admin' : '/teacher';
                          navigate(`${base}/courses/${courseId}/lessons/${l._id}/edit`);
                        }}
                      >
                        <EditIcon /> Edit
                      </button>
                      <button className="danger" onClick={() => handleDelete(l._id, l.title)}>
                        <DeleteIcon /> Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
              <div className="course-card-body">
                <div className="course-card-meta">
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                    Lesson {l.order}
                  </span>
                  <span>·   {l.points} pts</span>
                </div>
                <div className="course-card-title">{l.title}</div>

                <div className="lesson-card-actions">
                  {user?.role === 'student' && !l.isUnlocked ? (
                    <div className="lesson-status-locked">🔒 Complete previous lesson</div>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="btn-watch"
                        onClick={() => {
                          const base =
                            user?.role === 'admin'
                              ? '/admin'
                              : user?.role === 'teacher'
                              ? '/teacher'
                              : '/student';
                          navigate(`${base}/courses/${courseId}/lessons/${l._id}`);
                        }}
                      >
                       <svg width="17" height="12" viewBox="0 0 17 12" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M2.67 11.0215C1.82625 11.0215 1.16927 10.7974 0.699053 10.3491C0.233232 9.90527 0.000322342 9.26807 0.000322342 8.4375V2.61694C0.000322342 1.79077 0.242022 1.14917 0.72542 0.692139C1.20882 0.230713 1.85701 0 2.67 0H9.52547C10.3692 0 11.024 0.230713 11.4898 0.692139C11.9556 1.14917 12.1886 1.79077 12.1886 2.61694V8.39795C12.1886 9.22852 11.9556 9.87231 11.4898 10.3293C11.024 10.7908 10.3692 11.0215 9.52547 11.0215H2.67ZM2.88094 9.84155H9.30794C9.8221 9.84155 10.2198 9.70532 10.5011 9.43286C10.7867 9.1604 10.9295 8.75391 10.9295 8.21338V2.80811C10.9295 2.26758 10.7889 1.86108 10.5076 1.58862C10.2264 1.31177 9.82649 1.17334 9.30794 1.17334H2.88094C2.36678 1.17334 1.96688 1.30957 1.68123 1.58203C1.39998 1.85449 1.25936 2.26318 1.25936 2.80811V8.21338C1.25936 8.75391 1.39998 9.1604 1.68123 9.43286C1.96688 9.70532 2.36678 9.84155 2.88094 9.84155ZM11.971 3.63208L14.5682 1.43042C14.722 1.30298 14.8758 1.19971 15.0296 1.12061C15.1878 1.0415 15.346 1.00195 15.5042 1.00195C15.8075 1.00195 16.0513 1.10083 16.2359 1.29858C16.4249 1.49634 16.5194 1.75781 16.5194 2.08301V8.96484C16.5194 9.29004 16.4249 9.55371 16.2359 9.75586C16.0513 9.95361 15.8075 10.0525 15.5042 10.0525C15.346 10.0525 15.1878 10.0129 15.0296 9.93384C14.8758 9.85474 14.722 9.74927 14.5682 9.61743L11.971 7.41577V6.01831L15.0626 8.54956C15.0933 8.56714 15.1197 8.58472 15.1417 8.60229C15.1637 8.61548 15.1878 8.62207 15.2142 8.62207C15.2845 8.62207 15.3197 8.57373 15.3197 8.47705V2.57739C15.3197 2.47632 15.2845 2.42578 15.2142 2.42578C15.1878 2.42578 15.1637 2.43457 15.1417 2.45215C15.1197 2.46533 15.0933 2.48291 15.0626 2.50488L11.971 5.03613V3.63208Z" fill="white"/>
</svg>
 Watch Now
                      </button>
                      <button
                        type="button"
                        className="btn-read"
                        onClick={() => (l.content || l.attachmentUrl) && setContentModal(l)}
                        disabled={!l.content && !l.attachmentUrl}
                      >
                        <svg width="11" height="12" viewBox="0 0 11 12" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M2.61394 3.177H4.4505M2.61394 5.62557H7.51106M2.61394 8.07413H7.51106M9.70312 3.69507V8.51457C9.69196 8.82981 9.61851 9.13972 9.48702 9.42644C9.35554 9.71317 9.1686 9.97104 8.937 10.1852C8.7052 10.4003 8.43329 10.5677 8.1368 10.6777C7.8403 10.7878 7.52503 10.8383 7.209 10.8264H2.93962C2.62167 10.841 2.30397 10.7926 2.00474 10.6841C1.70551 10.5756 1.43063 10.4091 1.19587 10.1942C0.962027 9.97946 0.773181 9.7204 0.640309 9.43206C0.507437 9.14372 0.433188 8.83185 0.421875 8.51457V2.73544C0.433043 2.4202 0.506488 2.11029 0.637976 1.82356C0.769464 1.53684 0.956397 1.27897 1.188 1.06482C1.4198 0.849672 1.69171 0.682305 1.9882 0.572277C2.2847 0.462249 2.59997 0.411716 2.916 0.423565H6.13012C6.62078 0.421832 7.0944 0.603377 7.45819 0.932628L9.12319 2.46375C9.30086 2.6168 9.44432 2.80553 9.54423 3.01767C9.64415 3.22982 9.69829 3.46062 9.70312 3.69507Z" stroke="#017987" strokeWidth="0.84375" strokeLinecap="round" strokeLinejoin="round"/>
</svg>
 Read Now
                      </button>
                      {user?.role === 'student' && l.isUnlocked && !l.isCompletedByMe && (
                        <div style={{ fontSize: 12, color: 'var(--text-light)', textAlign: 'center', marginTop: 4 }}>
                          Watch full video to earn {l.points} pts
                        </div>
                      )}
                    </>
                  )}
                </div>
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

      {contentModal && (
        <div className="content-modal-backdrop" onClick={() => setContentModal(null)}>
          <div className="content-modal" onClick={(e) => e.stopPropagation()}>
            <div className="content-modal-header">
              <h3>{contentModal.title}</h3>
              <button className="content-modal-close" onClick={() => setContentModal(null)}>
                ✕
              </button>
            </div>
            <div className="content-modal-body">
              {contentModal.content}
              {contentModal.attachmentUrl && (
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  <a
                    href={`http://localhost:5000${contentModal.attachmentUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary"
                    style={{ display: 'inline-flex', textDecoration: 'none' }}
                  >
                    📎 Download attachment
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default LessonsList;
