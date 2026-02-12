import { atomWithStorage } from 'jotai/utils';
import type { Schedule } from '@/types';

export const schedulesAtom = atomWithStorage<Schedule[]>('plan-schedules', [
  { id: 0, courses: [] },
]);

export const currentScheduleIdAtom = atomWithStorage<number>('plan-currentScheduleId', 0);
