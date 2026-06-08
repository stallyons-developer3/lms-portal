import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">LMS</div>
      <div className="navbar-user">
        <span>{user?.name}</span>
        <span className={`role-badge ${user?.role}`}>{user?.role}</span>
        {user?.role === 'student' && (
          <span style={{ fontSize: 13, color: 'var(--text-light)' }}>
            ⭐ {user?.totalPoints || 0} points
          </span>
        )}
        <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
