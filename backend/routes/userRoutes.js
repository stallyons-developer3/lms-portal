const express = require('express');
const { createUser, updateUser, getAllUsers, getUserById, deleteUser } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', authorize('admin'), createUser);
router.get('/', authorize('admin', 'teacher'), getAllUsers);
router.get('/:id', authorize('admin', 'teacher'), getUserById);
router.put('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;
