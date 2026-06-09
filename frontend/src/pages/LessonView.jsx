import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import BackButton from '../components/BackButton';
import api, { fileUrl } from '../api/axios';
import { useAuth } from '../context/AuthContext';

const LessonView = () => {
  const { id: courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const videoRef = useRef(null);
  const autoCompletedRef = useRef(false);

  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [completing, setCompleting] = useState(false);

  const backPath =
    user?.role === 'admin'
      ? `/admin/courses/${courseId}/lessons`
      : user?.role === 'teacher'
      ? `/teacher/courses/${courseId}/lessons`
      : `/student/courses/${courseId}/lessons`;

  const fetchLesson = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/lessons/${lessonId}`);
      setLesson(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load lesson');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLesson();
    autoCompletedRef.current = false;
  }, [lessonId]);

  const handleComplete = async (auto = false) => {
    if (completing) return;
    setCompleting(true);
    try {
      const { data } = await api.post(`/lessons/${lessonId}/complete`);
      setSuccess(auto ? `🎉 Lesson completed automatically! +${data.pointsEarned} points` : data.message);
      fetchLesson();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark complete');
    } finally {
      setCompleting(false);
    }
  };

  const handleVideoEnded = () => {
    if (autoCompletedRef.current) return;
    if (user?.role !== 'student') return;
    if (lesson?.isCompletedByMe) return;
    if (!lesson?.isUnlocked) return;

    autoCompletedRef.current = true;
    handleComplete(true);
  };

  if (loading) {
    return <Layout><div className="empty-state">Loading lesson...</div></Layout>;
  }
  if (!lesson) {
    return <Layout><div className="empty-state">Lesson not found</div></Layout>;
  }

  const isStudent = user?.role === 'student';
  const noVideo = !lesson.videoUrl;

  return (
    <Layout>
      <div className="page-header-card">
        <div className="page-header-left">
          <BackButton onClick={() => navigate(backPath)} />
          <div className="page-title-area">
            <h2>{lesson.title}</h2>
            <p>
              {lesson.courseTitle ? `${lesson.courseTitle} · ` : ''}
              Lesson {lesson.order}
            </p>
          </div>
        </div>
        <div className="page-header-actions">
          {isStudent && lesson.isCompletedByMe && (
            <span className="lesson-info-pill success">✓ Completed</span>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {isStudent && !lesson.isUnlocked && (
        <div className="error-message">
          🔒 Complete previous lessons first to unlock this one.
        </div>
      )}

      {isStudent && !lesson.isCompletedByMe && lesson.isUnlocked && !noVideo && (
        <div
          style={{
            background: '#fef3c7',
            color: '#92400e',
            padding: '12px 16px',
            borderRadius: 10,
            fontSize: 13,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 18 }}>ℹ️</span>
          <span><b>Watch the full video to complete this lesson</b> and earn <b>{lesson.points} points</b>.</span>
        </div>
      )}

      {lesson.videoUrl ? (
        <div className="lesson-view-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="lesson-video-wrapper">
            <video
              ref={videoRef}
              src={fileUrl(lesson.videoUrl)}
              controls
              onEnded={handleVideoEnded}
            />
          </div>
        </div>
      ) : (
        <div className="lesson-view-card">
          <div className="empty-state">No video for this lesson</div>
        </div>
      )}

      <div className="lesson-view-card">
        <div className="lesson-info-row" style={{ marginBottom: 16 }}>
          <span className="lesson-info-pill">⭐ {lesson.points} points</span>
          <span className="lesson-info-pill">📘 Lesson {lesson.order}</span>
          {!isStudent && (
            <span className="lesson-info-pill">👥 {lesson.completedCount || 0} completed</span>
          )}
        </div>

        {lesson.description ? (
          <>
            <div className="lesson-section-title">Description</div>
            <p className="lesson-description-text">{lesson.description}</p>
          </>
        ) : null}
      </div>

      <div className="lesson-view-card">
        <div className="lesson-section-title">Content</div>
        {lesson.content ? (
          <div className="lesson-content-text">{lesson.content}</div>
        ) : (
          <div style={{ color: 'var(--text-light)', fontSize: 14 }}>
            No text content for this lesson.
          </div>
        )}
      </div>

      {lesson.attachmentUrl && (
        <div className="lesson-view-card">
          <div className="lesson-section-title">Attachment</div>
          <a
            href={fileUrl(lesson.attachmentUrl)}
            target="_blank"
            rel="noreferrer"
            className="attachment-download"
          >
            📎 Download attachment
          </a>
        </div>
      )}

      {isStudent && !lesson.isCompletedByMe && lesson.isUnlocked && noVideo && (
        <div className="lesson-view-card" style={{ textAlign: 'center', padding: 24 }}>
          <p style={{ marginBottom: 16, color: 'var(--text-light)', fontSize: 14 }}>
            This lesson has no video. After reviewing the content, mark it as read to earn points.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => handleComplete(false)}
            disabled={completing}
          >
            {completing ? <span className="spinner"></span> : `✓ Mark as Read (+${lesson.points} pts)`}
          </button>
        </div>
      )}
    </Layout>
  );
};

export default LessonView;
