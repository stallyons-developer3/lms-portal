const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const User = require('../models/User');

const buildCourseFilter = (req) => {
  if (req.user.role === 'admin') return {};
  if (req.user.role === 'teacher') return { teacher: req.user._id };
  if (!req.user.class) return { _id: null };
  return { classes: req.user.class };
};

const formatCourse = async (course) => {
  const lessonCount = await Lesson.countDocuments({ course: course._id });
  return {
    _id: course._id,
    title: course.title,
    description: course.description,
    teacher: course.teacher ? { _id: course.teacher._id, name: course.teacher.name } : null,
    teacherName: course.teacher?.name || '-',
    dueDate: course.dueDate,
    plannedLessons: course.plannedLessons || 0,
    category: course.category || '',
    coverImage: course.coverImage || '',
    lessons: lessonCount,
    classes: course.classes || [],
    classNames: Array.isArray(course.classes)
      ? course.classes
          .filter((c) => c && typeof c === 'object' && c.name)
          .map((c) => c.name)
      : [],
    createdAt: course.createdAt,
  };
};

const getAllCourses = async (req, res) => {
  try {
    const filter = buildCourseFilter(req);
    const courses = await Course.find(filter)
      .populate('teacher', 'name email')
      .populate('classes', 'name')
      .sort({ createdAt: -1 });
    const result = await Promise.all(courses.map(formatCourse));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('teacher', 'name email')
      .populate('classes', 'name');
    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (req.user.role === 'teacher' && course.teacher._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only view your own courses' });
    }
    if (req.user.role === 'student') {
      if (!req.user.class) {
        return res.status(403).json({ message: 'You are not assigned to a class' });
      }
      const inClass = course.classes.some((c) => c._id.toString() === req.user.class.toString());
      if (!inClass) return res.status(403).json({ message: 'This course is not for your class' });
    }

    const lessons = await Lesson.find({ course: course._id }).sort({ order: 1 });
    res.json({ ...(await formatCourse(course)), lessonsList: lessons });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCourseCount = async (req, res) => {
  try {
    const filter = buildCourseFilter(req);
    const count = await Course.countDocuments(filter);
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createCourse = async (req, res) => {
  try {
    const { title, description, dueDate, teacher, plannedLessons, category } = req.body;
    let classes = req.body.classes;
    if (!title) return res.status(400).json({ message: 'Title is required' });
    if (typeof classes === 'string') {
      try {
        classes = JSON.parse(classes);
      } catch {
        classes = classes ? [classes] : [];
      }
    }
    if (!Array.isArray(classes)) classes = [];

    let teacherId = req.user._id;
    if (req.user.role === 'admin' && teacher) {
      const t = await User.findById(teacher);
      if (!t || t.role !== 'teacher') {
        return res.status(400).json({ message: 'Invalid teacher selected' });
      }
      teacherId = t._id;
    }

    const coverImage = req.files?.coverImage?.[0]?.path || '';

    const course = await Course.create({
      title,
      description: description || '',
      teacher: teacherId,
      dueDate: dueDate || undefined,
      plannedLessons: plannedLessons || 0,
      category: category || '',
      coverImage,
      classes,
    });

    const populated = await Course.findById(course._id)
      .populate('teacher', 'name email')
      .populate('classes', 'name');
    res.status(201).json(await formatCourse(populated));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (req.user.role === 'teacher' && course.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only update your own courses' });
    }

    const { title, description, dueDate, plannedLessons, category } = req.body;
    let classes = req.body.classes;
    if (title !== undefined) course.title = title;
    if (description !== undefined) course.description = description;
    if (dueDate !== undefined) course.dueDate = dueDate;
    if (plannedLessons !== undefined) course.plannedLessons = Number(plannedLessons) || 0;
    if (category !== undefined) course.category = category;
    if (classes !== undefined) {
      if (typeof classes === 'string') {
        try {
          classes = JSON.parse(classes);
        } catch {
          classes = classes ? [classes] : [];
        }
      }
      if (Array.isArray(classes)) course.classes = classes;
    }
    if (req.files?.coverImage?.[0]) {
      course.coverImage = req.files.coverImage[0].path;
    }

    await course.save();
    const populated = await Course.findById(course._id)
      .populate('teacher', 'name email')
      .populate('classes', 'name');
    res.json(await formatCourse(populated));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (req.user.role === 'teacher' && course.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own courses' });
    }

    await Lesson.deleteMany({ course: course._id });
    await course.deleteOne();
    res.json({ message: 'Course and its lessons deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const enrollStudent = async (req, res) => {
  try {
    const { studentId } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (req.user.role === 'teacher' && course.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only enroll students in your own courses' });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(400).json({ message: 'Invalid student' });
    }

    if (course.enrolledStudents.includes(studentId)) {
      return res.status(400).json({ message: 'Student already enrolled' });
    }

    course.enrolledStudents.push(studentId);
    await course.save();
    res.json({ message: 'Student enrolled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const unenrollStudent = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (req.user.role === 'teacher' && course.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only unenroll from your own courses' });
    }

    course.enrolledStudents = course.enrolledStudents.filter(
      (id) => id.toString() !== req.params.studentId
    );
    await course.save();
    res.json({ message: 'Student unenrolled' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllCourses,
  getCourseById,
  getCourseCount,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollStudent,
  unenrollStudent,
};
