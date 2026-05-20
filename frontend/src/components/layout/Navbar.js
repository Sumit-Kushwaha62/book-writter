import React from 'react';
import { BookOpen } from 'lucide-react';

const Navbar = ({ onGetStarted }) => {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ cursor: 'pointer' }}>
          <BookOpen size={32} />
          <span>BookWritter</span>
        </div>
        <div className="nav-links">
          <button className="btn-cta" onClick={onGetStarted}>Get Started</button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
