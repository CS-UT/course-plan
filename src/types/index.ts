export interface CourseSession {
  dayOfWeek: number; // 6=شنبه, 0=یکشنبه, 1=دوشنبه, 2=سه‌شنبه, 3=چهارشنبه, 4=پنجشنبه, 5=جمعه
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
}

export interface Course {
  courseCode: string;
  group: number;
  courseName: string;
  unitCount: number;
  gender: 'male' | 'female' | 'mixed';
  professor: string;
  sessions: CourseSession[];
  examDate: string;  // "1405/04/20" Jalali
  examTime: string;  // "10:00"
  location: string;
  prerequisites: string;
  notes: string;
  grade: string;
}

export interface SelectedCourse extends Course {
  mode?: 'default' | 'hover' | 'both';
}

export interface Schedule {
  id: number;
  courses: SelectedCourse[];
}

export interface CoursesData {
  semester: string;
  semesterLabel: string;
  fetchedAt: string;
  department: string;
  courses: Course[];
}
