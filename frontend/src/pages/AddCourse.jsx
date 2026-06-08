import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import BackButton from '../components/BackButton';
import SaveIcon from '../components/SaveIcon';
import notify from '../utils/notify';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const AddCourse = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isEdit = Boolean(id);

  const [teachers, setTeachers] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [title, setTitle] = useState('');
  const [teacher, setTeacher] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [plannedLessons, setPlannedLessons] = useState('');
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (isAdmin) {
      api.get('/users?role=teacher')
        .then(({ data }) => setTeachers(data))
        .catch((err) => console.error(err));
    }
    api.get('/classes')
      .then(({ data }) => setAllClasses(data))
      .catch((err) => console.error(err));
  }, [isAdmin]);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/courses/${id}`)
      .then(({ data }) => {
        setTitle(data.title || '');
        setTeacher(data.teacher?._id || '');
        setDueDate(data.dueDate ? data.dueDate.split('T')[0] : '');
        setPlannedLessons(data.plannedLessons || '');
        const classIds = (data.classes || []).map((c) => (typeof c === 'object' ? c._id : c));
        setSelectedClasses(classIds);
        if (data.coverImage) {
          setCoverPreview(`http://localhost:5000${data.coverImage}`);
        }
      })
      .catch((err) => {
        notify.error(err.response?.data?.message || 'Failed to load course');
      })
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverImage(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!title) {
      notify.error('Assignment title is required');
      return;
    }
    if (isAdmin && !isEdit && !teacher) {
      notify.error('Please select a teacher');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      if (isAdmin && teacher) formData.append('teacher', teacher);
      formData.append('dueDate', dueDate || '');
      formData.append('plannedLessons', plannedLessons || 0);
      formData.append('classes', JSON.stringify(selectedClasses));
      if (coverImage) formData.append('coverImage', coverImage);

      if (isEdit) {
        await api.put(`/courses/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/courses', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      navigate(isAdmin ? '/admin/courses' : '/teacher/courses');
    } catch (err) {
      notify.error(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} course`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="empty-state">Loading course...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-header-card">
        <div className="page-header-left">
          <BackButton onClick={() => navigate(-1)} />
          <div className="page-title-area">
            <h2>{isEdit ? 'Edit Course' : 'Add Course'}</h2>
            <p>{isEdit ? 'Update course details' : 'View and manage your Staff'}</p>
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
          <div className="form-group">
            <label>Cover Image</label>
            <div className="cover-upload">
              {coverPreview ? (
                <div className="cover-preview">
                  <img src={coverPreview} alt="Cover preview" />
                  <button
                    type="button"
                    className="cover-remove"
                    onClick={() => {
                      setCoverImage(null);
                      setCoverPreview('');
                    }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="cover-dropzone">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                  <span style={{ fontSize: 32 }}>🖼️</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary)' }}>
                    Click to upload cover image
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-light)' }}>
                    JPG, PNG, WebP up to 100MB
                  </span>
                </label>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Assignment Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="enter"
                required
              />
            </div>
            <div className="form-group">
              <label>Select Teacher</label>
              {isAdmin ? (
                <select
                  value={teacher}
                  onChange={(e) => setTeacher(e.target.value)}
                  disabled={isEdit}
                >
                  <option value="">enter</option>
                  {teachers.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input value={user?.name || ''} disabled />
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Number of Lessons</label>
              <input
                type="number"
                value={plannedLessons}
                onChange={(e) => setPlannedLessons(e.target.value)}
                placeholder="enter"
                min={0}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Select Classes (students in selected classes will see this course)</label>
            {allClasses.length === 0 ? (
              <div style={{
                padding: 14,
                background: '#fef3c7',
                color: '#92400e',
                borderRadius: 10,
                fontSize: 13,
              }}>
                No classes created yet. Go to <b>Class Management</b> to create classes first.
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {allClasses.map((c) => {
                  const checked = selectedClasses.includes(c._id);
                  return (
                    <label
                      key={c._id}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 14px',
                        border: `1.5px solid ${checked ? 'var(--primary)' : 'var(--border)'}`,
                        background: checked ? '#ebf6f7' : 'white',
                        borderRadius: 16,
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 600,
                        color: checked ? 'var(--primary)' : 'var(--text)',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedClasses([...selectedClasses, c._id]);
                          } else {
                            setSelectedClasses(selectedClasses.filter((id) => id !== c._id));
                          }
                        }}
                        style={{ width: 'auto', margin: 0 }}
                      />
                      {c.name}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default AddCourse;
