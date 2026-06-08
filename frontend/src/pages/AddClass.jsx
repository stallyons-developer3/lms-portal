import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import BackButton from '../components/BackButton';
import SaveIcon from '../components/SaveIcon';
import notify from '../utils/notify';
import api from '../api/axios';

const AddClass = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/classes/${id}`)
      .then(({ data }) => {
        setName(data.name || '');
        setDescription(data.description || '');
      })
      .catch((err) => notify.error(err.response?.data?.message || 'Failed to load class'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!name) {
      notify.error('Class name is required');
      return;
    }
    setSubmitting(true);
    try {
      if (isEdit) {
        await api.put(`/classes/${id}`, { name, description });
      } else {
        await api.post('/classes', { name, description });
      }
      navigate('/admin/classes');
    } catch (err) {
      notify.error(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} class`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Layout><div className="empty-state">Loading...</div></Layout>;
  }

  return (
    <Layout>
      <div className="page-header-card">
        <div className="page-header-left">
          <BackButton onClick={() => navigate(-1)} />
          <div className="page-title-area">
            <h2>{isEdit ? 'Edit Class' : 'Add Class'}</h2>
            <p>{isEdit ? 'Update class details' : 'Create a new class for students'}</p>
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
            <label>Class Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Class 8 - Section A"
              required
            />
          </div>

          <div className="form-group">
            <label>Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Brief description of this class..."
            />
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default AddClass;
