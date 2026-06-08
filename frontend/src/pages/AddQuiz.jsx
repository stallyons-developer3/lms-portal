import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import BackButton from '../components/BackButton';
import SaveIcon from '../components/SaveIcon';
import PlusIcon from '../components/PlusIcon';
import notify from '../utils/notify';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const blankQuestion = () => ({
  text: '',
  options: ['', '', '', ''],
  correctOption: 0,
});

const AddQuiz = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isEdit = Boolean(id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [classId, setClassId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [questions, setQuestions] = useState([blankQuestion()]);

  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const basePath = isAdmin ? '/admin' : '/teacher';

  useEffect(() => {
    api.get('/classes')
      .then(({ data }) => setClasses(data))
      .catch((err) => console.error(err));
    if (isAdmin) {
      api.get('/users?role=teacher')
        .then(({ data }) => setTeachers(data))
        .catch((err) => console.error(err));
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/quizzes/${id}`)
      .then(({ data }) => {
        setTitle(data.title || '');
        setDescription(data.description || '');
        setClassId(data.class?._id || '');
        setTeacherId(data.teacher?._id || '');
        setQuestions(
          (data.questions || []).map((q) => ({
            text: q.text,
            options: q.options,
            correctOption: q.correctOption ?? 0,
          }))
        );
      })
      .catch((err) => notify.error(err.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const updateQuestion = (idx, key, val) => {
    setQuestions((qs) => qs.map((q, i) => (i === idx ? { ...q, [key]: val } : q)));
  };

  const updateOption = (qIdx, oIdx, val) => {
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qIdx
          ? { ...q, options: q.options.map((o, j) => (j === oIdx ? val : o)) }
          : q
      )
    );
  };

  const addQuestion = () => setQuestions((qs) => [...qs, blankQuestion()]);

  const removeQuestion = (idx) => {
    if (questions.length <= 1) {
      notify.error('Quiz must have at least one question');
      return;
    }
    setQuestions((qs) => qs.filter((_, i) => i !== idx));
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!title) { notify.error('Title is required'); return; }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) { notify.error(`Question ${i + 1} text is required`); return; }
      if (q.options.some((o) => !o.trim())) {
        notify.error(`Question ${i + 1} — all 4 options required`); return;
      }
    }

    setSubmitting(true);
    try {
      const body = {
        title,
        description,
        class: classId || null,
        questions,
      };
      if (isAdmin && teacherId) body.teacher = teacherId;

      if (isEdit) {
        await api.put(`/quizzes/${id}`, body);
      } else {
        await api.post('/quizzes', body);
      }
      navigate(`${basePath}/quizzes`);
    } catch (err) {
      notify.error(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Layout><div className="empty-state">Loading...</div></Layout>;

  return (
    <Layout>
      <div className="page-header-card">
        <div className="page-header-left">
          <BackButton onClick={() => navigate(`${basePath}/quizzes`)} />
          <div className="page-title-area">
            <h2>{isEdit ? 'Edit Quiz' : 'Add Quizz'}</h2>
            <p>View and manage your course</p>
          </div>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={handleSave} disabled={submitting}>
            {submitting ? <span className="spinner"></span> : isEdit ? '💾 Update Quiz' : <><SaveIcon /> Save Quiz</>}
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="card form-pill" style={{ background: '#0372850F', padding: 24, borderRadius: 12 }}>
        <div className="form-row">
          <div className="form-group">
            <label>Quiz Title (Subject)</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. English" required />
          </div>
          <div className="form-group">
            <label>Class</label>
            <select value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">No class assigned</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {isAdmin && (
          <div className="form-group">
            <label>Teacher</label>
            <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
              <option value="">Select teacher</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="form-group">
          <label>Description (optional)</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="What this quiz covers..." />
        </div>
      </div>

      {questions.map((q, qIdx) => (
        <div
          key={qIdx}
          className="card form-pill"
          style={{ background: '#0372850F', padding: 24, borderRadius: 12, marginBottom: 16 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <strong style={{ fontSize: 16 }}>Question {qIdx + 1}</strong>
            {questions.length > 1 && (
              <button type="button" className="btn-action-delete" onClick={() => removeQuestion(qIdx)} style={{ padding: '6px 12px' }}>
                ✕ Remove
              </button>
            )}
          </div>

          <div className="form-group">
            <label>Question</label>
            <textarea
              value={q.text}
              onChange={(e) => updateQuestion(qIdx, 'text', e.target.value)}
              rows={2}
              placeholder="enter"
            />
          </div>

          <div className="form-row">
            {[0, 1].map((oIdx) => (
              <div key={oIdx} className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="radio"
                    name={`correct-${qIdx}`}
                    checked={q.correctOption === oIdx}
                    onChange={() => updateQuestion(qIdx, 'correctOption', oIdx)}
                    style={{ width: 'auto', margin: 0 }}
                  />
                  Option {oIdx + 1} {q.correctOption === oIdx && <span style={{ color: 'var(--success)', fontWeight: 700 }}>(Correct)</span>}
                </label>
                <input
                  value={q.options[oIdx]}
                  onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                  placeholder="enter"
                />
              </div>
            ))}
          </div>
          <div className="form-row">
            {[2, 3].map((oIdx) => (
              <div key={oIdx} className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="radio"
                    name={`correct-${qIdx}`}
                    checked={q.correctOption === oIdx}
                    onChange={() => updateQuestion(qIdx, 'correctOption', oIdx)}
                    style={{ width: 'auto', margin: 0 }}
                  />
                  Option {oIdx + 1} {q.correctOption === oIdx && <span style={{ color: 'var(--success)', fontWeight: 700 }}>(Correct)</span>}
                </label>
                <input
                  value={q.options[oIdx]}
                  onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                  placeholder="enter"
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <button type="button" className="btn btn-primary" onClick={addQuestion} style={{ marginBottom: 20 }}>
        <PlusIcon /> Add Question
      </button>
    </Layout>
  );
};

export default AddQuiz;
