import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { fileUrl } from '../api/axios';
import { useAuth } from '../context/AuthContext';

const fallbackEmojis = ['🎨', '🎵', '🎯', '📚', '🎓', '🧮'];

const OptionalCoursesPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/courses')
      .then(({ data }) => setCourses(data.slice(0, 3)))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const basePath =
    user?.role === 'admin' ? '/admin' :
    user?.role === 'teacher' ? '/teacher' : '/student';

  const goToCourse = (id) => {
    if (user?.role === 'student') {
      navigate(`${basePath}/courses/${id}/lessons`);
    } else {
      navigate(`${basePath}/courses/${id}`);
    }
  };

  return (
    <div className="optional-courses-panel">
      <h3>Optional Courses</h3>
      {loading ? (
        <div className="empty-state" style={{ padding: 20, fontSize: 12 }}>Loading...</div>
      ) : courses.length === 0 ? (
        <div className="empty-state" style={{ padding: 20, fontSize: 12 }}>
          No courses available
        </div>
      ) : (
        courses.map((c, i) => (
          <div
            key={c._id}
            className={`optional-course-item ${i === 1 ? 'active' : ''}`}
            onClick={() => goToCourse(c._id)}
            style={{ cursor: 'pointer' }}
          >
            {c.coverImage ? (
              <img
                src={fileUrl(c.coverImage)}
                alt={c.title}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  flexShrink: 0,
                }}
              />
            ) : (
              <div className="oc-emoji">{fallbackEmojis[i % fallbackEmojis.length]}</div>
            )}
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div
                className="oc-title"
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {c.title}
              </div>
              <div
                className="oc-subtitle"
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {c.teacherName || 'Teacher'}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default OptionalCoursesPanel;
