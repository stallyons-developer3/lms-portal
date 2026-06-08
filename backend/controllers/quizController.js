const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const User = require('../models/User');

const formatQuiz = (quiz, includeAnswers = true) => {
  return {
    _id: quiz._id,
    title: quiz.title,
    description: quiz.description,
    teacher: quiz.teacher ? { _id: quiz.teacher._id, name: quiz.teacher.name } : null,
    teacherName: quiz.teacher?.name || '-',
    class: quiz.class ? { _id: quiz.class._id, name: quiz.class.name } : null,
    className: quiz.class?.name || '-',
    questions: (quiz.questions || []).map((q) => ({
      _id: q._id,
      text: q.text,
      options: q.options,
      ...(includeAnswers ? { correctOption: q.correctOption } : {}),
    })),
    questionsCount: quiz.questions?.length || 0,
    createdAt: quiz.createdAt,
  };
};

const buildQuizFilter = (req) => {
  if (req.user.role === 'admin') return {};
  if (req.user.role === 'teacher') return { teacher: req.user._id };
  if (!req.user.class) return { _id: null };
  return { class: req.user.class };
};

const getAllQuizzes = async (req, res) => {
  try {
    const filter = buildQuizFilter(req);
    const quizzes = await Quiz.find(filter)
      .populate('teacher', 'name email')
      .populate('class', 'name')
      .sort({ createdAt: -1 });

    if (req.user.role === 'student') {
      const attempts = await QuizAttempt.find({ student: req.user._id });
      const attemptMap = {};
      attempts.forEach((a) => {
        attemptMap[a.quiz.toString()] = { score: a.score, total: a.totalQuestions };
      });
      return res.json(
        quizzes.map((q) => ({
          ...formatQuiz(q, false),
          attempted: !!attemptMap[q._id.toString()],
          attempt: attemptMap[q._id.toString()],
        }))
      );
    }

    res.json(quizzes.map((q) => formatQuiz(q)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('teacher', 'name email')
      .populate('class', 'name');
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    if (req.user.role === 'teacher' && quiz.teacher._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not your quiz' });
    }
    if (req.user.role === 'student') {
      if (!req.user.class) return res.status(403).json({ message: 'You are not in a class' });
      if (!quiz.class || quiz.class._id.toString() !== req.user.class.toString()) {
        return res.status(403).json({ message: 'This quiz is not for your class' });
      }
    }

    const includeAnswers = req.user.role !== 'student';
    res.json(formatQuiz(quiz, includeAnswers));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createQuiz = async (req, res) => {
  try {
    const { title, description, teacher, class: classId, questions } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'At least one question is required' });
    }

    let teacherId = req.user._id;
    if (req.user.role === 'admin' && teacher) {
      const t = await User.findById(teacher);
      if (!t || t.role !== 'teacher') {
        return res.status(400).json({ message: 'Invalid teacher selected' });
      }
      teacherId = t._id;
    }

    const validated = questions.map((q) => ({
      text: q.text,
      options: q.options,
      correctOption: Number(q.correctOption ?? 0),
    }));

    const quiz = await Quiz.create({
      title,
      description: description || '',
      teacher: teacherId,
      class: classId || null,
      questions: validated,
    });

    const populated = await Quiz.findById(quiz._id)
      .populate('teacher', 'name email')
      .populate('class', 'name');
    res.status(201).json(formatQuiz(populated));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    if (req.user.role === 'teacher' && quiz.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not your quiz' });
    }

    const { title, description, class: classId, questions } = req.body;
    if (title !== undefined) quiz.title = title;
    if (description !== undefined) quiz.description = description;
    if (classId !== undefined) quiz.class = classId || null;
    if (Array.isArray(questions)) {
      quiz.questions = questions.map((q) => ({
        text: q.text,
        options: q.options,
        correctOption: Number(q.correctOption ?? 0),
      }));
    }

    await quiz.save();
    const populated = await Quiz.findById(quiz._id)
      .populate('teacher', 'name email')
      .populate('class', 'name');
    res.json(formatQuiz(populated));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    if (req.user.role === 'teacher' && quiz.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not your quiz' });
    }

    await QuizAttempt.deleteMany({ quiz: quiz._id });
    await quiz.deleteOne();
    res.json({ message: 'Quiz deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const submitAttempt = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    if (!req.user.class || !quiz.class || quiz.class.toString() !== req.user.class.toString()) {
      return res.status(403).json({ message: 'This quiz is not for your class' });
    }

    const { answers } = req.body;
    if (!Array.isArray(answers) || answers.length !== quiz.questions.length) {
      return res.status(400).json({ message: 'Invalid answers' });
    }

    let score = 0;
    quiz.questions.forEach((q, i) => {
      if (Number(answers[i]) === q.correctOption) score++;
    });

    const attempt = await QuizAttempt.findOneAndUpdate(
      { student: req.user._id, quiz: quiz._id },
      {
        student: req.user._id,
        quiz: quiz._id,
        answers,
        score,
        totalQuestions: quiz.questions.length,
        completedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    res.json({
      score,
      totalQuestions: quiz.questions.length,
      attemptId: attempt._id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllQuizzes,
  getQuizById,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  submitAttempt,
};
