import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import BackButton from '../../components/BackButton';
import SaveIcon from '../../components/SaveIcon';
import notify from '../../utils/notify';
import api from '../../api/axios';

const EyeIcon = ({ open }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {open ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    )}
  </svg>
);

const AddTeacher = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [joinDate, setJoinDate] = useState('');
  const [subject, setSubject] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/users/${id}`)
      .then(({ data }) => {
        const parts = (data.name || '').split(' ');
        setFirstName(parts[0] || '');
        setLastName(parts.slice(1).join(' ') || '');
        setEmail(data.email || '');
        setSubject(data.subject || '');
        if (data.joinDate) setJoinDate(data.joinDate.split('T')[0]);
      })
      .catch((err) => notify.error(err.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!firstName) { notify.error('First name is required'); return; }
    if (!email) { notify.error('Email is required'); return; }
    if (!isEdit && !password) { notify.error('Password is required'); return; }

    setSubmitting(true);
    try {
      const body = {
        name: `${firstName} ${lastName}`.trim(),
        email,
        role: 'teacher',
        subject: subject || '',
        joinDate: joinDate || null,
      };
      if (password) body.password = password;

      if (isEdit) {
        await api.put(`/users/${id}`, body);
      } else {
        await api.post('/users', body);
      }
      navigate('/admin/teachers');
    } catch (err) {
      notify.error(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} teacher`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Layout><div className="empty-state">Loading...</div></Layout>;

  return (
    <Layout>
      <div className="page-header-card">
        <div className="page-header-left">
          <BackButton onClick={() => navigate('/admin/teachers')} />
          <div className="page-title-area">
            <h2>{isEdit ? 'Edit Teacher' : 'Add Teachers'}</h2>
            <p>View and manage your Staff</p>
          </div>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={handleSave} disabled={submitting}>
            {submitting ? <span className="spinner"></span> : isEdit ? '💾 Update' : <><SaveIcon /> Save</>}
          </button>
        </div>
      </div>


      <div className="card form-pill">
        <form onSubmit={handleSave}>
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="enter" required />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="enter" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="enter" required />
            </div>
            <div className="form-group">
              <label>Date of Joining</label>
              <input type="date" value={joinDate} onChange={(e) => setJoinDate(e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Password {isEdit && <span style={{ color: 'var(--text-light)', fontWeight: 400 }}>(leave blank to keep current)</span>}</label>
              <div className="password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="enter"
                  required={!isEdit}
                  minLength={isEdit ? undefined : 6}
                />
                <button type="button" className="password-eye" onClick={() => setShowPassword(!showPassword)} title="Toggle password visibility">
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>Subject</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="enter" />
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default AddTeacher;
