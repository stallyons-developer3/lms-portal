import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import BackButton from '../components/BackButton';
import PlusIcon from '../components/PlusIcon';
import notify from '../utils/notify';
import api, { fileUrl } from '../api/axios';
import { useAuth } from '../context/AuthContext';

const AddLesson = () => {
  const navigate = useNavigate();
  const { id: courseId, lessonId } = useParams();
  const { user } = useAuth();
  const isEdit = Boolean(lessonId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState(10);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [content, setContent] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [existingAttachmentUrl, setExistingAttachmentUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  const isAdmin = user?.role === 'admin';
  const backPath = isAdmin
    ? `/admin/courses/${courseId}/lessons`
    : `/teacher/courses/${courseId}/lessons`;

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/lessons/${lessonId}`)
      .then(({ data }) => {
        setTitle(data.title || '');
        setDescription(data.description || '');
        setPoints(data.points ?? 10);
        setContent(data.content || '');
        if (data.videoUrl) setVideoPreview(fileUrl(data.videoUrl));
        if (data.coverImage) setCoverPreview(fileUrl(data.coverImage));
        if (data.attachmentUrl) setExistingAttachmentUrl(data.attachmentUrl);
      })
      .catch((err) => notify.error(err.response?.data?.message || 'Failed to load lesson'))
      .finally(() => setLoading(false));
  }, [lessonId, isEdit]);

  useEffect(() => {
    return () => {
      if (videoPreview && videoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(videoPreview);
      }
    };
  }, [videoPreview]);

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (videoPreview && videoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(videoPreview);
    }
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!title) {
      notify.error('Lesson title is required');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('points', points);
      formData.append('content', content);
      if (videoFile) formData.append('video', videoFile);
      if (coverImage) formData.append('coverImage', coverImage);
      if (attachment) formData.append('attachment', attachment);

      if (isEdit) {
        await api.put(`/lessons/${lessonId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post(`/courses/${courseId}/lessons`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      navigate(backPath);
    } catch (err) {
      notify.error(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} lesson`);
    } finally {
      setSubmitting(false);
    }
  };

  const getFileName = (url) => {
    if (!url) return '';
    const parts = url.split('/');
    return parts[parts.length - 1];
  };

  if (loading) {
    return <Layout><div className="empty-state">Loading lesson...</div></Layout>;
  }

  return (
    <Layout>
      <div className="page-header-card">
        <div className="page-header-left">
          <BackButton onClick={() => navigate(backPath)} />
          <div className="page-title-area">
            <h2>{isEdit ? 'Edit Lesson' : 'Add Lessons'}</h2>
            <p>{isEdit ? 'Update lesson details' : 'Access and review Lessons'}</p>
          </div>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={handleSave} disabled={submitting}>
            {submitting ? <span className="spinner"></span> : isEdit ? '💾 Update Lesson' : <><PlusIcon /> Add Lesson</>}
          </button>
        </div>
      </div>


      <div className="card form-pill">
        <form onSubmit={handleSave}>
          <div className="form-group">
            {videoPreview ? (
              <div className="video-preview">
                <video src={videoPreview} controls />
                <button
                  type="button"
                  className="cover-remove"
                  onClick={() => {
                    if (videoPreview && videoPreview.startsWith('blob:')) {
                      URL.revokeObjectURL(videoPreview);
                    }
                    setVideoFile(null);
                    setVideoPreview('');
                  }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <label className="video-dropzone">
                <input
                  type="file"
                  accept="video/mp4,video/quicktime,video/x-msvideo,video/avi,video/*"
                  onChange={handleVideoChange}
                  style={{ display: 'none' }}
                />
                <div className="video-dropzone-icon">
                  <svg width="48" height="48" viewBox="0 0 66 66" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M49.4493 56.3138H15.6881C12.0683 56.1666 8.8219 53.0589 8.8219 48.8505V40.7087C8.8219 39.5712 9.71977 38.6733 10.8573 38.6733C11.9948 38.6733 12.8928 39.5712 12.8928 40.7087V48.8505C12.8927 50.4582 14.0238 52.1343 15.6067 52.2429H49.4493C51.0322 52.1343 52.1633 50.4582 52.1632 48.8505V40.7087C52.1632 39.5712 53.0611 38.6733 54.1987 38.6733C55.3362 38.6733 56.2341 39.5712 56.2341 40.7087V48.8505C56.3154 53.0589 53.0691 56.1666 49.4493 56.3138Z"
                      fill="#017987"
                    />
                    <path
                      d="M32.5687 8.8219C33.1081 8.8219 33.6255 9.036 34.0071 9.41717L44.8628 20.2729C45.6253 21.0354 45.6253 22.3886 44.8628 23.1496C44.6749 23.3399 44.4508 23.4907 44.2038 23.5933C43.9568 23.6958 43.6919 23.7479 43.4244 23.7467C43.157 23.7479 42.892 23.6958 42.645 23.5933C42.398 23.4907 42.174 23.3399 41.986 23.1496L34.6021 15.7657V40.7088C34.6021 41.8463 33.7042 42.7442 32.5667 42.7442C31.4291 42.7442 30.5312 41.8463 30.5312 40.7088V15.7657L23.1514 23.1496C22.7656 23.5092 22.2552 23.7049 21.7279 23.6956C20.6975 23.6863 19.7287 22.7268 19.7287 21.6964C19.7194 21.1691 19.9151 20.6587 20.2747 20.2729L31.1304 9.41717C31.512 9.036 32.0293 8.8219 32.5687 8.8219Z"
                      fill="#017987"
                    />
                  </svg>
                </div>
                <div className="video-dropzone-title">Upload video</div>
                <div className="video-dropzone-subtitle">
                  <span>MP4</span>
                  <span>MOV</span>
                  <span>AVI</span>
                </div>
              </label>
            )}
          </div>

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
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      setCoverImage(file);
                      setCoverPreview(URL.createObjectURL(file));
                    }}
                    style={{ display: 'none' }}
                  />
                  <span style={{ fontSize: 28 }}>🖼️</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary)' }}>
                    Click to upload cover image
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-light)' }}>
                    JPG, PNG, WebP
                  </span>
                </label>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Lesson Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="enter"
                required
              />
            </div>
            <div className="form-group">
              <label>Points</label>
              <input
                type="number"
                value={points}
                min={0}
                onChange={(e) => setPoints(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What this lesson covers..."
            />
          </div>

          <div className="form-group">
            <label>Enter Your Content</label>
            <div className="content-textarea-wrapper">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="enter"
                className="content-textarea"
              />
              <label className="attach-button" title="Attach a file">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,image/*,.txt,.zip"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) setAttachment(file);
                  }}
                />
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
              </label>
              {attachment ? (
                <div className="attachment-chip">
                  <span className="filename">📎 {attachment.name}</span>
                  <button type="button" onClick={() => setAttachment(null)} title="Remove">
                    ✕
                  </button>
                </div>
              ) : existingAttachmentUrl ? (
                <div className="attachment-chip">
                  <span className="filename">📎 {getFileName(existingAttachmentUrl)} (existing)</span>
                </div>
              ) : null}
            </div>
            {isEdit && existingAttachmentUrl && !attachment && (
              <p style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 8 }}>
                Upload a new file to replace the existing attachment.
              </p>
            )}
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default AddLesson;
