const express = require('express');
const {
  getLessonById,
  updateLesson,
  deleteLesson,
  completeLesson,
} = require('../controllers/lessonController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.use(protect);

router.get('/:id', getLessonById);

router.put(
  '/:id',
  authorize('admin', 'teacher'),
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'attachment', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 },
  ]),
  updateLesson
);
router.delete('/:id', authorize('admin', 'teacher'), deleteLesson);
router.post('/:id/complete', authorize('student'), completeLesson);

module.exports = router;
