const express = require('express');
const {
  getAllCourses,
  getCourseById,
  getCourseCount,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollStudent,
  unenrollStudent,
} = require('../controllers/courseController');
const {
  getLessonsForCourse,
  createLesson,
} = require('../controllers/lessonController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.use(protect);

router.get('/count', authorize('admin', 'teacher'), getCourseCount);
router.get('/', getAllCourses);
router.get('/:id', getCourseById);
router.post(
  '/',
  authorize('admin', 'teacher'),
  upload.fields([{ name: 'coverImage', maxCount: 1 }]),
  createCourse
);
router.put(
  '/:id',
  authorize('admin', 'teacher'),
  upload.fields([{ name: 'coverImage', maxCount: 1 }]),
  updateCourse
);
router.delete('/:id', authorize('admin', 'teacher'), deleteCourse);

router.post('/:id/enroll', authorize('admin', 'teacher'), enrollStudent);
router.delete('/:id/enroll/:studentId', authorize('admin', 'teacher'), unenrollStudent);

router.get('/:courseId/lessons', getLessonsForCourse);
router.post(
  '/:courseId/lessons',
  authorize('admin', 'teacher'),
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'attachment', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 },
  ]),
  createLesson
);

module.exports = router;
