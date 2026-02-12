import { useAtom } from 'jotai';
import { schedulesAtom, currentScheduleIdAtom } from '@/atoms';
import type { Course, SelectedCourse, Schedule } from '@/types';
import { findTimeConflicts, findExamConflicts } from '@/utils/conflicts';

const MAX_SCHEDULES = 5;

export function useSchedule() {
  const [schedules, setSchedules] = useAtom(schedulesAtom);
  const [currentScheduleId, setCurrentScheduleId] = useAtom(currentScheduleIdAtom);

  const currentSchedule = schedules.find((s) => s.id === currentScheduleId) ?? schedules[0];
  const selectedCourses = currentSchedule?.courses ?? [];

  function addCourse(course: Course): { timeConflicts: Course[]; examConflicts: Course[] } | null {
    const exists = selectedCourses.some(
      (c) => c.courseCode === course.courseCode && c.group === course.group,
    );
    if (exists) return null;

    const timeConflicts = findTimeConflicts(course, selectedCourses);
    const examConflicts = findExamConflicts(course, selectedCourses);

    const newCourse: SelectedCourse = { ...course, mode: 'default' };
    setSchedules((prev) =>
      prev.map((s) =>
        s.id === currentScheduleId
          ? { ...s, courses: [...s.courses, newCourse] }
          : s,
      ),
    );

    if (timeConflicts.length > 0 || examConflicts.length > 0) {
      return { timeConflicts, examConflicts };
    }
    return null;
  }

  function removeCourse(courseCode: string, group: number) {
    setSchedules((prev) =>
      prev.map((s) =>
        s.id === currentScheduleId
          ? {
              ...s,
              courses: s.courses.filter(
                (c) => !(c.courseCode === courseCode && c.group === group),
              ),
            }
          : s,
      ),
    );
  }

  function isCourseSelected(courseCode: string, group: number): boolean {
    return selectedCourses.some(
      (c) => c.courseCode === courseCode && c.group === group,
    );
  }

  function createSchedule(): boolean {
    if (schedules.length >= MAX_SCHEDULES) return false;
    const usedIds = new Set(schedules.map((s) => s.id));
    let newId = 0;
    while (usedIds.has(newId)) newId++;
    const newSchedule: Schedule = { id: newId, courses: [] };
    setSchedules((prev) => [...prev, newSchedule].sort((a, b) => a.id - b.id));
    setCurrentScheduleId(newId);
    return true;
  }

  function deleteSchedule(id: number) {
    if (schedules.length <= 1) return;
    const newSchedules = schedules.filter((s) => s.id !== id);
    setSchedules(newSchedules);
    if (currentScheduleId === id) {
      setCurrentScheduleId(newSchedules[0].id);
    }
  }

  function duplicateSchedule() {
    if (schedules.length >= MAX_SCHEDULES) return false;
    const usedIds = new Set(schedules.map((s) => s.id));
    let newId = 0;
    while (usedIds.has(newId)) newId++;
    const copy: Schedule = {
      id: newId,
      courses: [...selectedCourses.map((c) => ({ ...c }))],
    };
    setSchedules((prev) => [...prev, copy].sort((a, b) => a.id - b.id));
    setCurrentScheduleId(newId);
    return true;
  }

  const totalUnits = selectedCourses.reduce((sum, c) => sum + c.unitCount, 0);

  return {
    schedules,
    currentScheduleId,
    setCurrentScheduleId,
    currentSchedule,
    selectedCourses,
    addCourse,
    removeCourse,
    isCourseSelected,
    createSchedule,
    deleteSchedule,
    duplicateSchedule,
    totalUnits,
  };
}
