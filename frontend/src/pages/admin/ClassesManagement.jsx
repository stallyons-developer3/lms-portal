import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import SearchIcon from '../../components/SearchIcon';
import PlusIcon from '../../components/PlusIcon';
import EditIcon from '../../components/EditIcon';
import DeleteIcon from '../../components/DeleteIcon';
import Pagination from '../../components/Pagination';
import usePagination from '../../hooks/usePagination';
import notify from '../../utils/notify';
import api from '../../api/axios';

const cardGradients = [
  'linear-gradient(135deg, #2c5364 0%, #203a43 50%, #0f2027 100%)',
  'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
  'linear-gradient(135deg, #c4b5fd 0%, #818cf8 100%)',
  'linear-gradient(135deg, #fbcfe8 0%, #c084fc 100%)',
  'linear-gradient(135deg, #a78bfa 0%, #6366f1 100%)',
  'linear-gradient(135deg, #fda4af 0%, #f9a8d4 100%)',
];

const classEmojis = ['🎓', '📚', '✏️', '🎒', '🧮', '🔬'];

const ClassesManagement = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [error, setError] = useState('');

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/classes');
      setClasses(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (!openMenuId) return;
    const close = () => setOpenMenuId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [openMenuId]);

  const handleDelete = async (id, name) => {
    setOpenMenuId(null);
    const ok = await notify.confirm({
      title: 'Delete class?',
      text: `"${name}" will be deleted. Students will be unassigned and courses unlinked.`,
    });
    if (!ok) return;
    try {
      await api.delete(`/classes/${id}`);
      notify.success('Class deleted');
      fetchClasses();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const toggleMenu = (e, id) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const filtered = classes.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const { page, setPage, pageSize, setPageSize, totalPages, paginated } = usePagination(filtered, 12);

  return (
    <Layout>
      <div className="page-header-card">
        <div className="page-title-area">
          <h2>Class Management</h2>
          <p>View and manage your classes</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => navigate('/admin/classes/new')}>
            <PlusIcon /> Add Class
          </button>
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
        <div className="empty-state">Loading classes...</div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            {classes.length === 0
              ? 'No classes yet. Click "+ Add Class" to create the first one.'
              : 'No classes match your search.'}
          </div>
        </div>
      ) : (
        <div className="courses-grid">
          {paginated.map((c, i) => (
            <div
              key={c._id}
              className={`course-card ${openMenuId === c._id ? 'menu-open' : ''}`}
              onClick={() => navigate(`/admin/classes/${c._id}`)}
            >
              <div
                className="course-card-image"
                style={{ background: cardGradients[i % cardGradients.length] }}
              >
                {classEmojis[i % classEmojis.length]}
              </div>
              <div className="course-card-body">
                <div className="course-card-meta-row">
                  <div className="course-card-meta">
                    <span>👨‍🎓 {c.studentCount} students · 📚 {c.courseCount} courses</span>
                  </div>
                  <div className="menu-wrapper">
                    <button
                      type="button"
                      className="menu-dots-inline"
                      onClick={(e) => toggleMenu(e, c._id)}
                      title="More actions"
                    >
                      ⋯
                    </button>
                    {openMenuId === c._id && (
                      <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => navigate(`/admin/classes/${c._id}`)}>
                          👁 View
                        </button>
                        <button onClick={() => navigate(`/admin/classes/${c._id}/edit`)}>
                          <EditIcon /> Edit
                        </button>
                        <button className="danger" onClick={() => handleDelete(c._id, c.name)}>
                          <DeleteIcon /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="course-card-title">{c.name}</div>
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

export default ClassesManagement;
