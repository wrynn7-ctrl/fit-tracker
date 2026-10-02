import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { RestTimer } from './RestTimer';
import { useElapsed } from './useElapsed';

const tabs = [
  { to: '/', label: 'Home', icon: '⌂' },
  { to: '/routines', label: 'Routines', icon: '☰' },
  { to: '/exercises', label: 'Exercises', icon: '◎' },
  { to: '/history', label: 'History', icon: '◷' },
  { to: '/progress', label: 'Progress', icon: '↗' },
];

export function Layout() {
  const active = useStore((s) => s.active);
  const location = useLocation();
  const navigate = useNavigate();
  const elapsed = useElapsed(active?.startedAt);
  const onWorkoutPage = location.pathname === '/workout';

  return (
    <div className="app">
      <main className="content">
        <Outlet />
      </main>
      <div className="bottom">
        <RestTimer />
        {active && !onWorkoutPage && (
          <button className="active-banner" onClick={() => navigate('/workout')}>
            <span>
              <strong>Workout in progress</strong> · {active.name}
            </span>
            <span>{elapsed} ›</span>
          </button>
        )}
        <nav className="tabbar">
          {tabs.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.to === '/'} className="tab">
              <span className="tab-icon" aria-hidden>
                {t.icon}
              </span>
              <span>{t.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
