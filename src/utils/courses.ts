export function getCourseCodeLabel(courseCode: string): string {
  return courseCode.startsWith('local-') ? '—' : courseCode;
}

export function getCourseIdentityLabel(courseCode: string, group: number): string {
  return courseCode.startsWith('local-')
    ? `گروه ${group}`
    : `${courseCode}-${group}`;
}
