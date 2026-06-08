import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import SearchIcon from '../components/SearchIcon';
import PlusIcon from '../components/PlusIcon';
import EditIcon from '../components/EditIcon';
import DeleteIcon from '../components/DeleteIcon';
import Pagination from '../components/Pagination';
import usePagination from '../hooks/usePagination';
import notify from '../utils/notify';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const QuizzesList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'teacher';
  const isStudent = user?.role === 'student';

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const basePath =
    user?.role === 'admin'
      ? '/admin'
      : user?.role === 'teacher'
      ? '/teacher'
      : '/student';

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/quizzes');
      setQuizzes(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleDelete = async (id, title) => {
    const ok = await notify.confirm({
      title: 'Delete quiz?',
      text: `"${title}" will be permanently deleted.`,
    });
    if (!ok) return;
    try {
      await api.delete(`/quizzes/${id}`);
      notify.success('Quiz deleted');
      fetchQuizzes();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const filtered = quizzes.filter((q) =>
    q.title?.toLowerCase().includes(search.toLowerCase())
  );

  const { page, setPage, pageSize, setPageSize, totalPages, paginated } = usePagination(filtered, 10);

  return (
    <Layout>
      <div className="page-header-card">
        <div className="page-title-area">
          <h2>Quizzes</h2>
          <p>View and manage your quizzes</p>
        </div>
        <div className="page-header-actions">
          {canManage && (
            <button className="btn btn-primary" onClick={() => navigate(`${basePath}/quizzes/new`)}>
              <PlusIcon /> Add Quizzes
            </button>
          )}
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
            {quizzes.length === 0
              ? canManage
                ? 'No quizzes yet. Click "+ Add Quizzes" to create one.'
                : 'No quizzes available for your class yet.'
              : 'No quizzes match your search.'}
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Teacher</th>
                  <th>Class</th>
                  <th>Questions</th>
                  {isStudent && <th>Status</th>}
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((q) => (
                  <tr key={q._id}>
                    <td>
                      {isStudent ? (
                        q.title
                      ) : (
                        <Link to={`${basePath}/quizzes/${q._id}/edit`} className="table-link">
                          {q.title}
                        </Link>
                      )}
                    </td>
                    <td>{q.teacherName}</td>
                    <td>{q.className}</td>
                    <td>{q.questionsCount}</td>
                    {isStudent && (
                      <td>
                        {q.attempted ? (
                          <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                            ✓ Score: {q.attempt.score}/{q.attempt.total}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-light)' }}>Not attempted</span>
                        )}
                      </td>
                    )}
                    <td>
                      <div className="action-buttons">
                        {isStudent ? (
                          <button
                            className="btn-action-edit"
                            onClick={() => navigate(`${basePath}/quizzes/${q._id}/take`)}
                          >
                            {q.attempted ? 'Retake' : 'Take Quiz'}
                          </button>
                        ) : (
                          <>
                            <button
                              className="btn-action-edit"
                              onClick={() => navigate(`${basePath}/quizzes/${q._id}/edit`)}
                            >
                              <EditIcon /> Edit
                            </button>
                            <button
                              className="btn-action-delete"
                              onClick={() => handleDelete(q._id, q.title)}
                            >
                              <DeleteIcon /> Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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

export default QuizzesList;
