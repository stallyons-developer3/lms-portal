import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import BackButton from '../components/BackButton';
import api from '../api/axios';

const TakeQuiz = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.get(`/quizzes/${id}`)
      .then(({ data }) => {
        setQuiz(data);
        setAnswers(new Array(data.questions.length).fill(null));
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [id]);

  const selectAnswer = (optionIdx) => {
    setAnswers((a) => a.map((v, i) => (i === currentIdx ? optionIdx : v)));
  };

  const handleNext = async () => {
    if (currentIdx < quiz.questions.length - 1) {
      setCurrentIdx((c) => c + 1);
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post(`/quizzes/${id}/attempt`, { answers });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) setCurrentIdx((c) => c - 1);
  };

  if (loading) return <Layout><div className="empty-state">Loading quiz...</div></Layout>;
  if (error) return <Layout><div className="error-message">{error}</div></Layout>;
  if (!quiz) return <Layout><div className="empty-state">Quiz not found</div></Layout>;

  if (result) {
    const percentage = Math.round((result.score / result.totalQuestions) * 100);
    return (
      <Layout>
        <div className="page-header-card">
          <div className="page-header-left">
            <BackButton onClick={() => navigate('/student/quizzes')} />
            <div className="page-title-area">
              <h2>Quiz Complete</h2>
              <p>{quiz.title}</p>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>{percentage >= 70 ? '🎉' : percentage >= 50 ? '👍' : '📚'}</div>
          <h2 style={{ fontSize: 28, marginBottom: 8 }}>Your Score</h2>
          <div style={{ fontSize: 56, fontWeight: 800, color: 'var(--primary)', marginBottom: 8 }}>
            {result.score} / {result.totalQuestions}
          </div>
          <div style={{ fontSize: 18, color: 'var(--text-light)', marginBottom: 24 }}>{percentage}% correct</div>
          <button className="btn btn-primary" onClick={() => navigate('/student/quizzes')}>
            Back to Quizzes
          </button>
        </div>
      </Layout>
    );
  }

  const q = quiz.questions[currentIdx];
  const selectedAnswer = answers[currentIdx];
  const isLast = currentIdx === quiz.questions.length - 1;
  const allAnswered = answers.every((a) => a !== null);

  return (
    <Layout>
      <div className="page-header-card">
        <div className="page-header-left">
          <BackButton onClick={() => navigate('/student/quizzes')} />
          <div className="page-title-area">
            <h2>Quizzes</h2> 
          </div>
        </div>
        <div className="page-header-actions">
          <span style={{ fontSize: 14, color: 'var(--text-light)' }}>
            Question {currentIdx + 1} of {quiz.questions.length}
          </span>
        </div>
      </div>

      <div className="quiz-card card" style={{ padding: 24 }}>
        <strong style={{ fontSize: 18 }}>Question {currentIdx + 1}</strong>

        <div style={{ marginTop: 16, marginBottom: 8, fontSize: 13, fontWeight: 600 }}>Question Text</div>
        <div style={{
          background: '#0179870F',
          padding: 16,
          borderRadius: 8,
          fontSize: 15,
          marginBottom: 20,
        }}>
          {q.text}
        </div>

        <div style={{ marginBottom: 12, fontSize: 13, fontWeight: 600 }}>Answer Options</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {q.options.map((opt, oIdx) => {
            const isSelected = selectedAnswer === oIdx;
            return (
              <label
                key={oIdx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 18px',
                  background: isSelected ? '#ebf6f7' : '#0179870F',
                  border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: 10,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  fontWeight: isSelected ? 600 : 400,
                  fontSize: 14,
                }}
              >
                <input
                  type="radio"
                  name="answer"
                  checked={isSelected}
                  onChange={() => selectAnswer(oIdx)}
                  style={{ width: 18, height: 18, margin: 0, accentColor: 'var(--primary)' }}
                />
                {opt}
              </label>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          {currentIdx > 0 && (
            <button className="btn btn-secondary" onClick={handlePrev}>
              ← Previous
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={handleNext}
            disabled={selectedAnswer === null || (isLast && !allAnswered) || submitting}
            style={{ minWidth: 120 }}
          >
            {submitting ? <span className="spinner"></span> : isLast ? 'Submit Quiz' : 'Next →'}
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default TakeQuiz;
