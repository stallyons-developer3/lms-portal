const User = require('../models/User');

const createUser = async (req, res) => {
  try {
    const { name, email, password, role, class: classId, subject, age, joinDate } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Please provide name, email, password, and role' });
    }

    if (!['admin', 'teacher', 'student'].includes(role)) {
      return res.status(400).json({ message: 'Role must be admin, teacher, or student' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const userData = { name, email, password, role };
    if (role === 'student' && classId) userData.class = classId;
    if (role === 'teacher' && subject) userData.subject = subject;
    if (role === 'student' && age) userData.age = Number(age);
    if (joinDate) userData.joinDate = joinDate;

    const user = await User.create(userData);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      class: user.class,
      subject: user.subject,
      age: user.age,
      joinDate: user.joinDate,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { name, email, password, class: classId, subject, age, joinDate } = req.body;
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (password) user.password = password;
    if (classId !== undefined) user.class = classId || null;
    if (subject !== undefined) user.subject = subject;
    if (age !== undefined) user.age = age ? Number(age) : null;
    if (joinDate !== undefined) user.joinDate = joinDate || null;

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      class: user.class,
      subject: user.subject,
      age: user.age,
      joinDate: user.joinDate,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete yourself' });
    }

    await user.deleteOne();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createUser, updateUser, getAllUsers, getUserById, deleteUser };
