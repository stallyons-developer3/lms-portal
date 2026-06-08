import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import PlusIcon from '../components/PlusIcon';
import EditIcon from '../components/EditIcon';
import DeleteIcon from '../components/DeleteIcon';
import notify from '../utils/notify';
import api, { API_BASE } from '../api/axios';
import { useAuth } from '../context/AuthContext';

const PointsIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ verticalAlign: 'middle', marginRight: 4 }}
  >
    <path
      d="M12 2L14.39 8.84L21.51 9.36L16.06 13.96L17.78 21L12 17.27L6.22 21L7.94 13.96L2.49 9.36L9.61 8.84L12 2Z"
      fill="#FFB627"
      stroke="#F09000"
      strokeWidth="0.5"
      strokeLinejoin="round"
    />
  </svg>
);

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const canManage = user?.role === 'admin' || user?.role === 'teacher';

  const fetchCourse = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/courses/${id}`);
      setCourse(data);
      setLessons(data.lessonsList || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const handleDeleteLesson = async (lessonId, lessonTitle) => {
    const ok = await notify.confirm({
      title: 'Delete lesson?',
      text: `"${lessonTitle}" will be permanently deleted.`,
    });
    if (!ok) return;
    try {
      await api.delete(`/lessons/${lessonId}`);
      notify.success('Lesson deleted');
      fetchCourse();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleCompleteLesson = async (lessonId) => {
    try {
      const { data } = await api.post(`/lessons/${lessonId}/complete`);
      notify.success(data.message);
      fetchCourse();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Failed');
    }
  };

  const addLessonPath =
    user?.role === 'admin'
      ? `/admin/courses/${id}/lessons/new`
      : `/teacher/courses/${id}/lessons/new`;

  const allLessonsPath =
    user?.role === 'admin'
      ? `/admin/courses/${id}/lessons`
      : user?.role === 'teacher'
      ? `/teacher/courses/${id}/lessons`
      : `/student/courses/${id}/lessons`;

  if (loading) {
    return <Layout><div className="empty-state">Loading...</div></Layout>;
  }
  if (!course) {
    return <Layout><div className="empty-state">Course not found</div></Layout>;
  }

  return (
    <Layout>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="courses-section-title">{course.title}</h2>
            <p className="card-subtitle">
              Teacher: {course.teacherName} · {lessons.length} lesson{lessons.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <svg width="13" height="10" viewBox="0 0 15 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M0.248716 5.04452C0.0894632 5.20383 0 5.41986 0 5.64511C0 5.87036 0.0894632 6.08639 0.248716 6.24569L5.05423 11.0512C5.1326 11.1323 5.22633 11.1971 5.32997 11.2416C5.43361 11.2861 5.54508 11.3095 5.65788 11.3105C5.77067 11.3115 5.88253 11.29 5.98693 11.2473C6.09132 11.2046 6.18617 11.1415 6.26593 11.0617C6.34569 10.982 6.40877 10.8871 6.45148 10.7827C6.49419 10.6783 6.51569 10.5665 6.51471 10.4537C6.51373 10.3409 6.49029 10.2294 6.44577 10.1258C6.40125 10.0221 6.33654 9.9284 6.2554 9.85004L2.89995 6.49459L14.1496 6.49459C14.3749 6.49459 14.591 6.40509 14.7503 6.24578C14.9096 6.08647 14.9991 5.8704 14.9991 5.64511C14.9991 5.41981 14.9096 5.20374 14.7503 5.04443C14.591 4.88512 14.3749 4.79563 14.1496 4.79563L2.89995 4.79563L6.2554 1.44017C6.41014 1.27996 6.49576 1.06538 6.49383 0.842647C6.49189 0.619916 6.40255 0.406854 6.24505 0.249354C6.08755 0.0918529 5.87449 0.00251363 5.65176 0.00057768C5.42903 -0.00135732 5.21445 0.0842655 5.05423 0.239006L0.248716 5.04452Z"
                fill="currentColor"
              />
            </svg>
            Back
          </button>
        </div>
        {course.description && <p style={{ fontSize: 14, color: 'var(--text-light)' }}>{course.description}</p>}
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h2>Lessons</h2>
            <p className="card-subtitle">Sequential — complete in order to earn points</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate(allLessonsPath)}>
              View All Lessons
            </button>
            {canManage && (
              <button className="btn btn-primary" onClick={() => navigate(addLessonPath)}>
                <PlusIcon /> Add Lesson
              </button>
            )}
          </div>
        </div>

        {lessons.length === 0 ? (
          <div className="empty-state">
            No lessons yet. {canManage ? 'Click "+ Add Lesson" to create the first one.' : 'Check back later.'}
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Points</th>
                  <th>Video</th>
                  {user?.role === 'student' && <th>Status</th>}
                  <th className={canManage ? 'action-header' : ''}>{canManage ? 'Action' : ''}</th>
                </tr>
              </thead>
              <tbody>
                {lessons.map((l) => (
                  <tr key={l._id}>
                    <td>{l.order}</td>
                    <td>
                      <Link
                        to={`${user?.role === 'admin' ? '/admin' : user?.role === 'teacher' ? '/teacher' : '/student'}/courses/${id}/lessons/${l._id}`}
                        className="table-link"
                      >
                        {l.title}
                      </Link>
                    </td>
                    <td>
                      <PointsIcon />
                      {l.points}
                    </td>
                    <td>
                      {l.videoUrl ? (
                        <a href={`${API_BASE}${l.videoUrl}`} target="_blank" rel="noreferrer" className="text-link">
                          Watch
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-light)' }}>—</span>
                      )}
                    </td>
                    {user?.role === 'student' && (
                      <td>
                        {l.isCompletedByMe ? (
                          <span style={{ color: 'var(--success)', fontWeight: 600 }}>Completed</span>
                        ) : l.isUnlocked ? (
                          <button className="btn btn-sm btn-primary" onClick={() => handleCompleteLesson(l._id)}>
                            Mark Complete
                          </button>
                        ) : (
                          <span style={{ color: 'var(--text-light)' }}>Locked</span>
                        )}
                      </td>
                    )}
                    <td>
                      {canManage && (
                        <div className="action-buttons">
                          <button
                            className="btn-action-edit"
                            onClick={() => {
                              const base = user?.role === 'admin' ? '/admin' : '/teacher';
                              navigate(`${base}/courses/${id}/lessons/${l._id}/edit`);
                            }}
                          >
                            <EditIcon /> Edit
                          </button>
                          <button className="btn-action-delete" onClick={() => handleDeleteLesson(l._id, l.title)}>
                            <DeleteIcon /> Delete
                          </button>
                        </div>
                      )}
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

export default CourseDetail;
