import type { Routine } from '../types';
import { uid } from '../lib/id';

type DayTpl = [name: string, exercises: [id: string, sets: number, reps: number][]];

const tpl = (name: string, days: DayTpl[]): (() => Routine) => () => ({
  id: uid(),
  name,
  createdAt: Date.now(),
  days: days.map(([dayName, exs]) => ({
    id: uid(),
    name: dayName,
    exercises: exs.map(([exerciseId, sets, reps]) => ({ exerciseId, sets, reps, restSec: reps <= 6 ? 180 : 90 })),
  })),
});

export const ROUTINE_TEMPLATES: { name: string; description: string; build: () => Routine }[] = [
  {
    name: 'Push / Pull / Legs',
    description: '3-day split, run once or twice a week.',
    build: tpl('Push / Pull / Legs', [
      [
        'Push',
        [
          ['barbell-bench-press', 4, 6],
          ['overhead-press', 3, 8],
          ['incline-dumbbell-press', 3, 10],
          ['lateral-raise', 3, 15],
          ['triceps-pushdown', 3, 12],
        ],
      ],
      [
        'Pull',
        [
          ['deadlift', 3, 5],
          ['pull-up', 3, 8],
          ['barbell-row', 3, 8],
          ['face-pull', 3, 15],
          ['barbell-curl', 3, 10],
        ],
      ],
      [
        'Legs',
        [
          ['barbell-back-squat', 4, 6],
          ['romanian-deadlift', 3, 8],
          ['leg-press', 3, 12],
          ['lying-leg-curl', 3, 12],
          ['standing-calf-raise', 4, 15],
        ],
      ],
    ]),
  },
  {
    name: 'Upper / Lower',
    description: '4 days a week, alternating upper and lower body.',
    build: tpl('Upper / Lower', [
      [
        'Upper A',
        [
          ['barbell-bench-press', 4, 6],
          ['barbell-row', 4, 6],
          ['seated-dumbbell-press', 3, 10],
          ['lat-pulldown', 3, 10],
          ['hammer-curl', 3, 12],
        ],
      ],
      [
        'Lower A',
        [
          ['barbell-back-squat', 4, 6],
          ['romanian-deadlift', 3, 8],
          ['walking-lunge', 3, 10],
          ['seated-calf-raise', 4, 15],
          ['plank', 3, 1],
        ],
      ],
      [
        'Upper B',
        [
          ['overhead-press', 4, 6],
          ['pull-up', 4, 8],
          ['incline-dumbbell-press', 3, 10],
          ['seated-cable-row', 3, 10],
          ['skull-crusher', 3, 12],
        ],
      ],
      [
        'Lower B',
        [
          ['deadlift', 3, 5],
          ['front-squat', 3, 8],
          ['hip-thrust', 3, 10],
          ['seated-leg-curl', 3, 12],
          ['hanging-leg-raise', 3, 12],
        ],
      ],
    ]),
  },
  {
    name: 'Full Body 3x',
    description: 'Simple beginner full-body plan, 3 days a week.',
    build: tpl('Full Body 3x', [
      [
        'Day A',
        [
          ['barbell-back-squat', 3, 5],
          ['barbell-bench-press', 3, 5],
          ['barbell-row', 3, 5],
        ],
      ],
      [
        'Day B',
        [
          ['barbell-back-squat', 3, 5],
          ['overhead-press', 3, 5],
          ['deadlift', 1, 5],
        ],
      ],
    ]),
  },
];
