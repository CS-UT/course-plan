import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { Schedule } from '@/types';

export const schedulesAtom = atomWithStorage<Schedule[]>('plan-schedules', [
  { id: 0, courses: [] },
]);

export const currentScheduleIdAtom = atomWithStorage<number>('plan-currentScheduleId', 0);

export interface SlotFilter {
  dayOfWeek: number;  // same as CourseSession.dayOfWeek
  startTime: string;  // "HH:mm"
  endTime: string;    // "HH:mm"
}

export const slotFilterAtom = atom<SlotFilter | null>(null);
