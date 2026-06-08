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

const UsersManagement = ({ role, title }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/users?role=${role}`);
      setUsers(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    if (role !== 'student') return;
    try {
      const { data } = await api.get('/classes');
      setClasses(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchClasses();
  }, [role]);

  const handleDelete = async (id, userName) => {
    const ok = await notify.confirm({
      title: 'Delete user?',
      text: `${userName}'s account will be permanently deleted. This cannot be undone.`,
    });
    if (!ok) return;
    try {
      await api.delete(`/users/${id}`);
      notify.success('User deleted');
      fetchUsers();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const classNameFor = (id) => {
    if (!id) return '—';
    const targetId = typeof id === 'object' ? id._id : id;
    const c = classes.find((x) => x._id === targetId);
    return c ? c.name : '—';
  };

  const addPath = role === 'teacher' ? '/admin/teachers/new' : '/admin/students/new';
  const editPath = (uid) => role === 'teacher' ? `/admin/teachers/${uid}/edit` : `/admin/students/${uid}/edit`;

  const filtered = users.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const { page, setPage, pageSize, setPageSize, totalPages, paginated } = usePagination(filtered, 10);

  return (
    <Layout>
      <div className="page-header-card">
        <div className="page-title-area">
          <h2>{title}</h2>
          <p>Manage all {role} accounts</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => navigate(addPath)}>
            <PlusIcon /> Add {role}
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

      <div className="card">
        {loading ? (
          <div className="empty-state">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            {users.length === 0
              ? `No ${role}s found. Click "+ Add ${role}" to create one.`
              : 'No matches found.'}
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  {role === 'teacher' && <th>Subject</th>}
                  {role === 'student' && <th>Class</th>}
                  {role === 'student' && <th>Points</th>}
                  <th>Joined</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((u) => (
                  <tr key={u._id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    {role === 'teacher' && <td>{u.subject || '—'}</td>}
                    {role === 'student' && <td>{classNameFor(u.class)}</td>}
                    {role === 'student' && <td>⭐ {u.totalPoints || 0}</td>}
                    <td style={{ color: 'var(--text-light)', fontSize: 13 }}>
                      {u.joinDate
                        ? new Date(u.joinDate).toLocaleDateString()
                        : new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-action-edit" onClick={() => navigate(editPath(u._id))}>
                          <EditIcon /> Edit
                        </button>
                        <button className="btn-action-delete" onClick={() => handleDelete(u._id, u.name)}>
                          <DeleteIcon /> Delete
                        </button>
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

export default UsersManagement;
