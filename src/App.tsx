import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ExerciseDetail } from './pages/ExerciseDetail';
import { Exercises } from './pages/Exercises';
import { History } from './pages/History';
import { Home } from './pages/Home';
import { Progress } from './pages/Progress';
import { RoutineEdit } from './pages/RoutineEdit';
import { Routines } from './pages/Routines';
import { Settings } from './pages/Settings';
import { WorkoutDetail } from './pages/WorkoutDetail';
import { ActiveWorkout } from './pages/ActiveWorkout';

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="routines" element={<Routines />} />
          <Route path="routines/:id" element={<RoutineEdit />} />
          <Route path="exercises" element={<Exercises />} />
          <Route path="exercises/:id" element={<ExerciseDetail />} />
          <Route path="workout" element={<ActiveWorkout />} />
          <Route path="history" element={<History />} />
          <Route path="history/:id" element={<WorkoutDetail />} />
          <Route path="progress" element={<Progress />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
