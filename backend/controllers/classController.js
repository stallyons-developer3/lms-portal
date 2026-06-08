const Class = require('../models/Class');
const User = require('../models/User');
const Course = require('../models/Course');

const formatClass = async (cls) => {
  const studentCount = await User.countDocuments({ class: cls._id, role: 'student' });
  const courseCount = await Course.countDocuments({ classes: cls._id });
  return {
    _id: cls._id,
    name: cls.name,
    description: cls.description,
    studentCount,
    courseCount,
    createdAt: cls.createdAt,
  };
};

const getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find().sort({ createdAt: -1 });
    const result = await Promise.all(classes.map(formatClass));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getClassById = async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    const students = await User.find({ class: cls._id, role: 'student' })
      .select('-password')
      .sort({ name: 1 });
    const courses = await Course.find({ classes: cls._id })
      .populate('teacher', 'name')
      .sort({ createdAt: -1 });

    res.json({
      ...(await formatClass(cls)),
      students,
      courses: courses.map((c) => ({
        _id: c._id,
        title: c.title,
        teacherName: c.teacher?.name || '-',
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createClass = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Class name is required' });

    const exists = await Class.findOne({ name });
    if (exists) return res.status(400).json({ message: 'A class with this name already exists' });

    const cls = await Class.create({ name, description: description || '' });
    res.status(201).json(await formatClass(cls));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateClass = async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    const { name, description } = req.body;
    if (name !== undefined) cls.name = name;
    if (description !== undefined) cls.description = description;

    await cls.save();
    res.json(await formatClass(cls));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteClass = async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    await User.updateMany({ class: cls._id }, { $unset: { class: '' } });
    await Course.updateMany({ classes: cls._id }, { $pull: { classes: cls._id } });
    await cls.deleteOne();

    res.json({ message: 'Class deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addStudentToClass = async (req, res) => {
  try {
    const { studentId } = req.body;
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(400).json({ message: 'Invalid student' });
    }

    student.class = cls._id;
    await student.save();

    res.json({ message: 'Student added to class' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const removeStudentFromClass = async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    const student = await User.findById(req.params.studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    if (student.class?.toString() === cls._id.toString()) {
      student.class = null;
      await student.save();
    }

    res.json({ message: 'Student removed from class' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  addStudentToClass,
  removeStudentFromClass,
};
