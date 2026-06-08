const express = require('express');
const {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  addStudentToClass,
  removeStudentFromClass,
} = require('../controllers/classController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', authorize('admin', 'teacher'), getAllClasses);
router.get('/:id', authorize('admin', 'teacher'), getClassById);
router.post('/', authorize('admin'), createClass);
router.put('/:id', authorize('admin'), updateClass);
router.delete('/:id', authorize('admin'), deleteClass);
router.post('/:id/students', authorize('admin'), addStudentToClass);
router.delete('/:id/students/:studentId', authorize('admin'), removeStudentFromClass);

module.exports = router;
