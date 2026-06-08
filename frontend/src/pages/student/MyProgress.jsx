import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const MyProgress = () => {
  const { user } = useAuth();
  const [coursesProgress, setCoursesProgress] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [coursesRes, quizzesRes] = await Promise.all([
          api.get('/courses'),
          api.get('/quizzes'),
        ]);

        const courses = coursesRes.data;
        const quizzes = quizzesRes.data;

        const progress = await Promise.all(
          courses.map(async (c) => {
            try {
              const { data: lessons } = await api.get(`/courses/${c._id}/lessons`);
              const completed = lessons.filter((l) => l.isCompletedByMe).length;
              return {
                _id: c._id,
                title: c.title,
                teacherName: c.teacherName,
                totalLessons: lessons.length,
                completedLessons: completed,
                percent: lessons.length === 0 ? 0 : Math.round((completed / lessons.length) * 100),
              };
            } catch {
              return { _id: c._id, title: c.title, totalLessons: 0, completedLessons: 0, percent: 0 };
            }
          })
        );

        setCoursesProgress(progress);
        setQuizAttempts(quizzes.filter((q) => q.attempted));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Layout>
      <div className="page-header-card">
        <div className="page-title-area">
          <h2>My Progress</h2>
          <p>Track your learning journey</p>
        </div>
      </div>

      <div className="card" style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 14, color: 'var(--text-light)', marginBottom: 8 }}>Total Points Earned</div>
        <div style={{ fontSize: 56, fontWeight: 800, color: 'var(--primary)' }}>
          ⭐ {user?.totalPoints || 0}
        </div>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Course Progress</h2>
        {loading ? (
          <div className="empty-state">Loading...</div>
        ) : coursesProgress.length === 0 ? (
          <div className="empty-state">No courses yet for your class.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {coursesProgress.map((c) => (
              <div key={c._id} style={{ padding: 14, background: '#f9fafb', borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Link to={`/student/courses/${c._id}/lessons`} className="table-link" style={{ fontSize: 15 }}>
                    {c.title}
                  </Link>
                  <span style={{ fontSize: 13, color: 'var(--text-light)' }}>
                    {c.completedLessons}/{c.totalLessons} lessons · {c.percent}%
                  </span>
                </div>
                <div style={{ background: '#e5e7eb', borderRadius: 999, height: 8, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${c.percent}%`,
                      height: '100%',
                      background: 'var(--primary)',
                      transition: 'width 0.3s',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {quizAttempts.length > 0 && (
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Quiz Results</h2>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Quiz</th>
                  <th>Score</th>
                  <th>Total</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {quizAttempts.map((q) => {
                  const pct = Math.round((q.attempt.score / q.attempt.total) * 100);
                  return (
                    <tr key={q._id}>
                      <td>{q.title}</td>
                      <td>{q.attempt.score}</td>
                      <td>{q.attempt.total}</td>
                      <td>
                        <span style={{ color: pct >= 70 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)', fontWeight: 700 }}>
                          {pct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default MyProgress;
