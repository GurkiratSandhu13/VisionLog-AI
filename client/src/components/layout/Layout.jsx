import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';

export default function Layout() {
  const location = useLocation();
  
  return (
    <div>
      <header>
        <Link to="/" className="brand">
          VisionLog AI
        </Link>
        <nav>
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/register">Register</NavLink>
          <NavLink to="/monitor">Monitor</NavLink>
          <NavLink to="/history">History</NavLink>
        </nav>
      </header>
      <main key={location.pathname} className="section page-wrapper fade-in">
        <Outlet />
      </main>
    </div>
  );
}
