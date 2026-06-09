const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
const User = require('../models/User');

const canManageCourse = (course, user) => {
  if (user.role === 'admin') return true;
  if (user.role === 'teacher' && course.teacher.toString() === user._id.toString()) return true;
  return false;
};

const formatLesson = (lesson, userId, userRole) => {
  const completed = lesson.completedBy?.some((id) => id.toString() === userId?.toString());
  return {
    _id: lesson._id,
    title: lesson.title,
    description: lesson.description,
    course: lesson.course,
    videoUrl: lesson.videoUrl,
    coverImage: lesson.coverImage || '',
    content: lesson.content || '',
    attachmentUrl: lesson.attachmentUrl || '',
    points: lesson.points,
    order: lesson.order,
    completedBy: lesson.completedBy,
    completedCount: lesson.completedBy?.length || 0,
    isCompletedByMe: userRole === 'student' ? completed : undefined,
    createdAt: lesson.createdAt,
  };
};

const getLessonsForCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (req.user.role === 'student') {
      if (!req.user.class) {
        return res.status(403).json({ message: 'You are not assigned to a class' });
      }
      const inClass = (course.classes || []).some(
        (id) => id.toString() === req.user.class.toString()
      );
      if (!inClass) return res.status(403).json({ message: 'This course is not for your class' });
    } else if (req.user.role === 'teacher' && course.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not your course' });
    }

    const lessons = await Lesson.find({ course: courseId }).sort({ order: 1 });

    if (req.user.role === 'student') {
      const result = lessons.map((l, idx) => {
        const formatted = formatLesson(l, req.user._id, 'student');
        const previousCompleted = idx === 0 || lessons.slice(0, idx).every((p) =>
          p.completedBy.some((uid) => uid.toString() === req.user._id.toString())
        );
        return { ...formatted, isUnlocked: previousCompleted };
      });
      return res.json(result);
    }

    res.json(lessons.map((l) => formatLesson(l, req.user._id, req.user.role)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLessonById = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    const course = await Course.findById(lesson.course);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (req.user.role === 'student') {
      if (!req.user.class) {
        return res.status(403).json({ message: 'You are not assigned to a class' });
      }
      const inClass = (course.classes || []).some(
        (id) => id.toString() === req.user.class.toString()
      );
      if (!inClass) {
        return res.status(403).json({ message: 'This course is not for your class' });
      }
    } else if (
      req.user.role === 'teacher' &&
      course.teacher.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not your course' });
    }

    const allLessons = await Lesson.find({ course: lesson.course }).sort({ order: 1 });
    let isUnlocked = true;
    if (req.user.role === 'student' && lesson.order > 1) {
      const previous = allLessons.filter((l) => l.order < lesson.order);
      isUnlocked = previous.every((p) =>
        p.completedBy.some((uid) => uid.toString() === req.user._id.toString())
      );
    }

    res.json({
      ...formatLesson(lesson, req.user._id, req.user.role),
      isUnlocked,
      courseTitle: course.title,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createLesson = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, points, content } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({ message: 'Not authorized for this course' });
    }
    if (!title) return res.status(400).json({ message: 'Title is required' });

    const lastLesson = await Lesson.findOne({ course: courseId }).sort({ order: -1 });
    const nextOrder = lastLesson ? lastLesson.order + 1 : 1;

    const videoUrl = req.files?.video?.[0]?.path || '';
    const attachmentUrl = req.files?.attachment?.[0]?.path || '';
    const coverImage = req.files?.coverImage?.[0]?.path || '';

    const lesson = await Lesson.create({
      title,
      description: description || '',
      course: courseId,
      videoUrl,
      coverImage,
      content: content || '',
      attachmentUrl,
      points: points !== undefined ? Number(points) : 10,
      order: nextOrder,
    });

    res.status(201).json(formatLesson(lesson, req.user._id, req.user.role));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    const course = await Course.findById(lesson.course);
    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { title, description, points, content } = req.body;
    if (title !== undefined) lesson.title = title;
    if (description !== undefined) lesson.description = description;
    if (content !== undefined) lesson.content = content;
    if (points !== undefined) lesson.points = Number(points);

    if (req.files?.video?.[0]) lesson.videoUrl = req.files.video[0].path;
    if (req.files?.attachment?.[0]) lesson.attachmentUrl = req.files.attachment[0].path;
    if (req.files?.coverImage?.[0]) lesson.coverImage = req.files.coverImage[0].path;

    await lesson.save();
    res.json(formatLesson(lesson, req.user._id, req.user.role));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    const course = await Course.findById(lesson.course);
    if (!canManageCourse(course, req.user)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await lesson.deleteOne();
    res.json({ message: 'Lesson deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const completeLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    const course = await Course.findById(lesson.course);
    if (!req.user.class) {
      return res.status(403).json({ message: 'You are not assigned to a class' });
    }
    const inClass = (course.classes || []).some(
      (id) => id.toString() === req.user.class.toString()
    );
    if (!inClass) return res.status(403).json({ message: 'This course is not for your class' });

    const alreadyCompleted = lesson.completedBy.some((id) => id.toString() === req.user._id.toString());
    if (alreadyCompleted) {
      return res.status(400).json({ message: 'You already completed this lesson' });
    }

    if (lesson.order > 1) {
      const previousLessons = await Lesson.find({
        course: lesson.course,
        order: { $lt: lesson.order },
      });
      const allDone = previousLessons.every((p) =>
        p.completedBy.some((uid) => uid.toString() === req.user._id.toString())
      );
      if (!allDone) {
        return res.status(400).json({ message: 'Complete previous lessons first' });
      }
    }

    lesson.completedBy.push(req.user._id);
    await lesson.save();

    const user = await User.findById(req.user._id);
    user.totalPoints = (user.totalPoints || 0) + lesson.points;
    await user.save();

    res.json({
      message: `Lesson completed! +${lesson.points} points`,
      pointsEarned: lesson.points,
      totalPoints: user.totalPoints,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getLessonsForCourse,
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson,
  completeLesson,
};
