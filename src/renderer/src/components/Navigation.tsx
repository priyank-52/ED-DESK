import { Link, useLocation } from 'react-router-dom'

export default function Navigation() {
  const location = useLocation()

  const isActive = (path: string) => {
    return location.pathname === path
  }

  return (
    <nav className="navbar">
      <div className="nav-brand">
        ED<span>-DESK</span>
      </div>
      <div className="nav-links">
        <Link 
          to="/" 
          className={`nav-link ${isActive('/') ? 'active' : ''}`}
        >
          Home
          <span className="hover-indicator" />
          {isActive('/') && <span className="active-indicator" />}
        </Link>
        
        <Link 
          to="/chat" 
          className={`nav-link ${isActive('/chat') ? 'active' : ''}`}
        >
          Chat
          <span className="hover-indicator" />
          {isActive('/chat') && <span className="active-indicator" />}
        </Link>
        
        <Link 
          to="/assessment" 
          className={`nav-link ${isActive('/assessment') ? 'active' : ''}`}
        >
          Assessment
          <span className="hover-indicator" />
          {isActive('/assessment') && <span className="active-indicator" />}
        </Link>
        
        <Link 
          to="/quiz" 
          className={`nav-link ${isActive('/quiz') ? 'active' : ''}`}
        >
          Quiz
          <span className="hover-indicator" />
          {isActive('/quiz') && <span className="active-indicator" />}
        </Link>
        
        <Link 
          to="/poll" 
          className={`nav-link ${isActive('/poll') ? 'active' : ''}`}
        >
          Poll
          <span className="hover-indicator" />
          {isActive('/poll') && <span className="active-indicator" />}
        </Link>
        
        <Link 
          to="/discussion" 
          className={`nav-link ${isActive('/discussion') ? 'active' : ''}`}
        >
          Discussion
          <span className="hover-indicator" />
          {isActive('/discussion') && <span className="active-indicator" />}
        </Link>
      </div>

      <style>{`
        .navbar {
          background-color: #0a0a0a;
          border-bottom: 1px solid #1e3a5f;
          padding: 0.8rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 1000;
          height: 56px;
        }

        .nav-brand {
          color: #ffffff;
          font-size: 1.3rem;
          font-weight: bold;
          letter-spacing: 1px;
          flex-shrink: 0;
        }

        .nav-brand span {
          color: #1e3a5f;
        }

        .nav-links {
          display: flex;
          gap: 0.5rem;
          height: 100%;
          align-items: center;
          margin-left: auto;
        }

        .nav-link {
          color: #cccccc;
          text-decoration: none;
          padding: 0.4rem 0.8rem;
          border-radius: 4px;
          transition: color 0.2s ease;
          font-size: 0.9rem;
          position: relative;
          height: 100%;
          display: flex;
          align-items: center;
          cursor: pointer;
        }

        .nav-link:hover {
          color: #ffffff;
        }

        .nav-link:hover .hover-indicator {
          width: 100%;
        }

        .hover-indicator {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background-color: #1e3a5f;
          opacity: 0.5;
          transition: width 0.2s ease;
        }

        .active-indicator {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background-color: #1e3a5f;
          box-shadow: 0 0 8px #1e3a5f;
        }

        .nav-link.active {
          color: #ffffff;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .navbar {
            flex-direction: column;
            padding: 0.8rem;
            gap: 0.5rem;
            height: auto;
            min-height: 56px;
          }
          
          .nav-links {
            flex-wrap: wrap;
            justify-content: center;
            width: 100%;
            margin-left: 0;
          }
          
          .nav-link {
            height: 40px;
          }
        }
      `}</style>
    </nav>
  )
}