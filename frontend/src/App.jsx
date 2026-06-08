import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import AdminSetup from './pages/AdminSetup';

import AdminDashboard from './pages/AdminDashboard';
import TeachersManagement from './pages/admin/TeachersManagement';
import StudentsManagement from './pages/admin/StudentsManagement';
import CoursesManagement from './pages/admin/CoursesManagement';
import AdminQuizzes from './pages/admin/Quizzes';

import TeacherDashboard from './pages/TeacherDashboard';
import MyCoursesTeacher from './pages/teacher/MyCourses';
import MyStudents from './pages/teacher/MyStudents';
import TeacherQuizzes from './pages/teacher/TeacherQuizzes';

import StudentDashboard from './pages/StudentDashboard';
import MyCoursesStudent from './pages/student/MyCourses';
import MyProgress from './pages/student/MyProgress';
import StudentQuizzes from './pages/student/StudentQuizzes';

import CourseDetail from './pages/CourseDetail';
import AddCourse from './pages/AddCourse';
import LessonsList from './pages/LessonsList';
import AddLesson from './pages/AddLesson';
import LessonView from './pages/LessonView';

import ClassesManagement from './pages/admin/ClassesManagement';
import AddClass from './pages/AddClass';
import ClassDetail from './pages/ClassDetail';

import AddTeacher from './pages/admin/AddTeacher';
import AddStudent from './pages/admin/AddStudent';

import QuizzesList from './pages/QuizzesList';
import AddQuiz from './pages/AddQuiz';
import TakeQuiz from './pages/TakeQuiz';

const Home = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/${user.role}`} replace />;
};

const adminRoute = (el) => (
  <ProtectedRoute allowedRoles={['admin']}>{el}</ProtectedRoute>
);
const teacherRoute = (el) => (
  <ProtectedRoute allowedRoles={['teacher']}>{el}</ProtectedRoute>
);
const studentRoute = (el) => (
  <ProtectedRoute allowedRoles={['student']}>{el}</ProtectedRoute>
);

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/setup" element={<AdminSetup />} />

          <Route path="/admin" element={adminRoute(<AdminDashboard />)} />
          <Route path="/admin/teachers" element={adminRoute(<TeachersManagement />)} />
          <Route path="/admin/teachers/new" element={adminRoute(<AddTeacher />)} />
          <Route path="/admin/teachers/:id/edit" element={adminRoute(<AddTeacher />)} />
          <Route path="/admin/students" element={adminRoute(<StudentsManagement />)} />
          <Route path="/admin/students/new" element={adminRoute(<AddStudent />)} />
          <Route path="/admin/students/:id/edit" element={adminRoute(<AddStudent />)} />
          <Route path="/admin/courses" element={adminRoute(<CoursesManagement />)} />
          <Route path="/admin/courses/new" element={adminRoute(<AddCourse />)} />
          <Route path="/admin/courses/:id/edit" element={adminRoute(<AddCourse />)} />
          <Route path="/admin/courses/:id/lessons" element={adminRoute(<LessonsList />)} />
          <Route path="/admin/courses/:id/lessons/new" element={adminRoute(<AddLesson />)} />
          <Route path="/admin/courses/:id/lessons/:lessonId/edit" element={adminRoute(<AddLesson />)} />
          <Route path="/admin/courses/:id/lessons/:lessonId" element={adminRoute(<LessonView />)} />
          <Route path="/admin/courses/:id" element={adminRoute(<CourseDetail />)} />
          <Route path="/admin/classes" element={adminRoute(<ClassesManagement />)} />
          <Route path="/admin/classes/new" element={adminRoute(<AddClass />)} />
          <Route path="/admin/classes/:id/edit" element={adminRoute(<AddClass />)} />
          <Route path="/admin/classes/:id" element={adminRoute(<ClassDetail />)} />
          <Route path="/admin/quizzes" element={adminRoute(<QuizzesList />)} />
          <Route path="/admin/quizzes/new" element={adminRoute(<AddQuiz />)} />
          <Route path="/admin/quizzes/:id/edit" element={adminRoute(<AddQuiz />)} />

          <Route path="/teacher" element={teacherRoute(<TeacherDashboard />)} />
          <Route path="/teacher/courses" element={teacherRoute(<MyCoursesTeacher />)} />
          <Route path="/teacher/courses/new" element={teacherRoute(<AddCourse />)} />
          <Route path="/teacher/courses/:id/edit" element={teacherRoute(<AddCourse />)} />
          <Route path="/teacher/courses/:id/lessons" element={teacherRoute(<LessonsList />)} />
          <Route path="/teacher/courses/:id/lessons/new" element={teacherRoute(<AddLesson />)} />
          <Route path="/teacher/courses/:id/lessons/:lessonId/edit" element={teacherRoute(<AddLesson />)} />
          <Route path="/teacher/courses/:id/lessons/:lessonId" element={teacherRoute(<LessonView />)} />
          <Route path="/teacher/courses/:id" element={teacherRoute(<CourseDetail />)} />
          <Route path="/teacher/students" element={teacherRoute(<MyStudents />)} />
          <Route path="/teacher/quizzes" element={teacherRoute(<QuizzesList />)} />
          <Route path="/teacher/quizzes/new" element={teacherRoute(<AddQuiz />)} />
          <Route path="/teacher/quizzes/:id/edit" element={teacherRoute(<AddQuiz />)} />

          <Route path="/student" element={studentRoute(<StudentDashboard />)} />
          <Route path="/student/courses" element={studentRoute(<MyCoursesStudent />)} />
          <Route path="/student/courses/:id/lessons" element={studentRoute(<LessonsList />)} />
          <Route path="/student/courses/:id/lessons/:lessonId" element={studentRoute(<LessonView />)} />
          <Route path="/student/courses/:id" element={studentRoute(<CourseDetail />)} />
          <Route path="/student/progress" element={studentRoute(<MyProgress />)} />
          <Route path="/student/quizzes" element={studentRoute(<QuizzesList />)} />
          <Route path="/student/quizzes/:id/take" element={studentRoute(<TakeQuiz />)} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
