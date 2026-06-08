import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ courses: 0, students: 0, lessons: 0, quizzes: 0 });
  const [recentCourses, setRecentCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [coursesRes, classesRes, quizzesRes] = await Promise.all([
          api.get('/courses'),
          api.get('/classes'),
          api.get('/quizzes'),
        ]);

        const courses = coursesRes.data;
        const classes = classesRes.data;
        const quizzes = quizzesRes.data;

        const totalLessons = courses.reduce((sum, c) => sum + (c.lessons || 0), 0);

        const teacherClassIds = new Set();
        courses.forEach((c) => {
          (c.classes || []).forEach((cls) => {
            const id = typeof cls === 'object' ? cls._id : cls;
            if (id) teacherClassIds.add(id.toString());
          });
        });

        const teacherClasses = classes.filter((c) => teacherClassIds.has(c._id.toString()));
        const totalStudents = teacherClasses.reduce((sum, c) => sum + (c.studentCount || 0), 0);

        setStats({
          courses: courses.length,
          students: totalStudents,
          lessons: totalLessons,
          quizzes: quizzes.length,
        });
        setRecentCourses(courses.slice(0, 5));
      } catch (err) {
        console.error('Stats load failed:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Layout>
      <div className="stats-grid">
        <StatCard label="My Courses" value={stats.courses} icon="📚" color="blue" />
        <StatCard label="My Students" value={stats.students} icon="👨‍🎓" color="purple" />
        <StatCard label="Total Lessons" value={stats.lessons} icon="📖" color="orange" />
        <StatCard label="Quizzes" value={stats.quizzes} icon="📝" color="pink" />
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h2>Welcome back, {user?.name?.split(' ')[0]}!</h2>
            <p className="card-subtitle">Quick overview of your courses</p>
          </div>
          <Link to="/teacher/courses" className="btn btn-secondary btn-sm">View All Courses</Link>
        </div>

        {loading ? (
          <div className="empty-state">Loading...</div>
        ) : recentCourses.length === 0 ? (
          <div className="empty-state">
            No courses yet. <Link to="/teacher/courses/new" className="text-link">Create your first course</Link>.
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Lessons</th>
                  <th>Classes</th>
                </tr>
              </thead>
              <tbody>
                {recentCourses.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <Link to={`/teacher/courses/${c._id}`} className="table-link">{c.title}</Link>
                    </td>
                    <td>{c.lessons || 0}</td>
                    <td>{(c.classNames || []).join(', ') || '—'}</td>
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

export default TeacherDashboard;
