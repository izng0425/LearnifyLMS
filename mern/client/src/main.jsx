import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App.jsx";
import StudentLessons from "./pages/StudentLessons.jsx";
import InstructorLessons from "./pages/InstructorLessons.jsx";
import AdminLessons from "./pages/AdminLessons.jsx";
import Login from "./pages/Home.jsx";
import Signup from "./pages/signup.jsx";
import "./index.css";
import InstructorLessonsContent from "./pages/InstructorLessonsContent.jsx";
import InstructorCourse from "./pages/InstructorCourse.jsx";
import InstructorCoursesContent from "./pages/InstructorCoursesContent.jsx";
import InstructorClassroom from "./pages/InstructorClassroom.jsx";
import InstructorViewClassroom from "./pages/InstructorViewClassroom.jsx";
import StudentCourse from "./pages/StudentCourse.jsx";
import StudentCoursesContent from "./pages/StudentCoursesContent.jsx";
import StudentClassroom from "./pages/StudentClassroom.jsx";
import StudentLessonsContent from "./pages/StudentLessonsContent.jsx";
import AdminCourse from "./pages/AdminCourse.jsx";
import AdminClassroom from "./pages/AdminClassroom.jsx";
import AdminCoursesContent from "./pages/AdminCoursesContent.jsx";
import AdminLessonsContent from "./pages/AdminLessonsContent.jsx";
import StudentViewClassroom from "./pages/StudentViewClassroom.jsx";
import AdminViewClassroom from "./pages/AdminViewClassroom.jsx";
import ClassroomDetails from "./pages/ClassroomDetails.jsx";
import InstructorEditClassroom from "./pages/InstructorEditClassroom.jsx";
import AdminEditClassroom from "./pages/AdminEditClassroom.jsx";
import InstructorEditCourses from "./pages/InstructorEditCourses.jsx";
import AdminEditCourses from "./pages/AdminEditCourses.jsx";
import AdminManageInstructors from "./pages/AdminManageInstructors.jsx";
import InstructorCreateClassroom from "./pages/InstructorCreateClassroom.jsx";
import AdminCreateClassroom from "./pages/AdminCreateClassroom.jsx";
import InstructorCreateLessons from "./pages/InstructorCreateLessons.jsx";
import AdminCreateLessons from "./pages/AdminCreateLessons.jsx";
import InstructorCreateCourses from "./pages/InstructorCreateCourses.jsx";
import AdminCreateCourses from "./pages/AdminCreateCourses.jsx";
import InstructorEditLessons from "./pages/InstructorEditLessons.jsx";
import AdminEditLessons from "./pages/AdminEditLessons.jsx";
import AdminViewInstructor from "./pages/AdminViewInstructor.jsx";
import AdminManageCourses from "./pages/AdminManageCourses.jsx";
import InstructorStudentList from "./pages/InstructorStudentList.jsx";
import AdminStudentList from "./pages/AdminStudentList.jsx";
import AdminManageLessons from "./pages/AdminManageLessons.jsx";
import InstructorManageLessons from "./pages/InstructorManageLessons.jsx";
import AdminManageClassroom from "./pages/AdminManageClassroom.jsx";
import InstructorManageCourses from "./pages/InstructorManageCourses.jsx";
import InstructorManageClassroom from "./pages/InstructorManageClassroom.jsx";


const router = createBrowserRouter([
  {
    path: "/",
    element: <App />, // maybe a layout component
    children: [
      { index: true, element: <Login /> },          // default: login page
      { path: "signup", element: <Signup /> },      // signup page
      { path: "student-lessons", element: <StudentLessons /> },
      { path: "instructor-lessons", element: <InstructorLessons /> },
      { path: "instructor-create-lessons", element: <InstructorCreateLessons /> },
      { path: "instructor-edit-lessons/:lessonId", element: <InstructorEditLessons /> },
      { path: "admin-lessons", element: <AdminLessons /> },
      { path: "admin-student-list", element: <AdminStudentList /> },
      { path: "instructor-student-list", element: <InstructorStudentList /> },
      { path: "/instructor-lessons-content/:id", element: <InstructorLessonsContent /> },
      { path: "instructor-courses", element: <InstructorCourse /> },
      { path: "/instructor-create-courses", element: <InstructorCreateCourses /> },
      { path: "/instructor-edit-courses", element: <InstructorEditCourses /> },
      { path: "/instructor-courses-content", element: <InstructorCoursesContent /> },
      { path: "/instructor-classroom", element: <InstructorClassroom /> },
      { path: "/instructor-view-classroom", element: <InstructorViewClassroom /> },    
      { path: "/instructor-create-classroom", element: <InstructorCreateClassroom /> },  
      { path: "/student-course", element: <StudentCourse /> },  
      { path: "/student-course-content", element: <StudentCoursesContent /> },
      { path: "/student-classroom", element: <StudentClassroom /> },
      { path: "/instructor-edit-classroom", element: <InstructorEditClassroom /> },
      { path: "/student-lessons-content", element: <StudentLessonsContent /> },
      { path: "/admin-courses", element: <AdminCourse/> },
      { path: "/admin-classroom", element: <AdminClassroom/> },
      { path: "/admin-courses-content", element: <AdminCoursesContent/> },
      { path: "/admin-lessons-content", element: <AdminLessonsContent/> },
      { path: "/student-view-classroom", element: <StudentViewClassroom /> },    
      { path: "/admin-view-classroom", element: <AdminViewClassroom /> },    
      { path: "/classroom-details/:id", element: <ClassroomDetails /> },
      { path: "/admin-edit-classroom", element: <AdminEditClassroom /> },
      { path: "/admin-edit-courses", element: <AdminEditCourses /> },
      { path: "/admin-manage-instructors", element: <AdminManageInstructors /> },
      { path: "/admin-create-classroom", element: <AdminCreateClassroom /> },
      { path: "/admin-create-lessons", element: <AdminCreateLessons /> },
      { path: "/admin-create-courses", element: <AdminCreateCourses /> },
      { path: "/admin-edit-lessons/:lessonId", element: <AdminEditLessons /> },
      { path: "/admin-view-instructor", element: <AdminViewInstructor /> },
      { path: "/admin-manage-courses", element: <AdminManageCourses /> },
      { path: "/instructor-manage-courses", element: <InstructorManageCourses /> },
      { path: "/admin-manage-lessons", element: <AdminManageLessons /> },
      { path: "/instructor-manage-lessons", element: <InstructorManageLessons /> },
      { path: "/admin-manage-classroom", element: <AdminManageClassroom /> },
      { path: "/instructor-manage-classroom", element: <InstructorManageClassroom /> }









    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);