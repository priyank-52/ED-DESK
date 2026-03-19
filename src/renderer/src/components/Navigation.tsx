import { Link, useLocation } from 'react-router-dom'

export default function Navigation() {
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="navbar">
      <div className="nav-brand">
        ED<span>-DESK</span>
      </div>
      <div className="nav-links">
        {[
          { path: '/', label: 'Home' },
          { path: '/chat', label: 'Chat' },
          { path: '/assessment', label: 'Assessment' },
          { path: '/quiz', label: 'Quiz' },
          { path: '/poll', label: 'Poll' },
          { path: '/discussion', label: 'Discussion' },
        ].map(({ path, label }) => (
          <Link
            key={path}
            to={path}
            className={`nav-link ${isActive(path) ? 'active' : ''}`}
          >
            {label}
            {isActive(path) && <span className="active-bar" />}
            <span className="hover-bar" />
          </Link>
        ))}
      </div>

      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }

        .navbar {
          background: #0a0a0a;
          border-bottom: 1px solid #1e3a5f;
          padding: 0 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 56px;
          position: sticky;
          top: 0;
          z-index: 1000;
          font-family: 'SF Mono', 'Monaco', 'Fira Code', monospace;
        }

        .nav-brand {
          color: #ffffff;
          font-family: 'SF Mono', 'Monaco', 'Fira Code', monospace;
          font-size: 1.2rem;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          flex-shrink: 0;
        }

        .nav-brand span {
          color: #1e3a5f;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 0;
          height: 56px;
        }

        .nav-link {
          color: #ffffff;
          text-decoration: none;
          font-family: 'SF Mono', 'Monaco', 'Fira Code', monospace;
          font-size: 0.85rem;
          padding: 0 1.1rem;
          height: 100%;
          display: flex;
          align-items: center;
          position: relative;
          opacity: 0.7;
          transition: opacity 0.2s ease;
          letter-spacing: 0.3px;
        }

        .nav-link:hover {
          opacity: 1;
        }

        .nav-link:hover .hover-bar {
          width: 100%;
        }

        .hover-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background: #1e3a5f;
          transition: width 0.2s ease;
        }

        .active-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: #1e3a5f;
        }

        .nav-link.active {
          opacity: 1;
          font-weight: 600;
        }

        .nav-link.active .hover-bar {
          display: none;
        }

        @media (max-width: 768px) {
          .navbar {
            flex-direction: column;
            height: auto;
            padding: 0.6rem 1rem;
            gap: 0.4rem;
          }
          .nav-links {
            flex-wrap: wrap;
            height: auto;
            justify-content: center;
            gap: 0;
          }
          .nav-link {
            height: 36px;
            padding: 0 0.7rem;
            font-size: 0.78rem;
          }
        }
      `}</style>
    </nav>
  )
}