import React from 'react';
import { Book, GraduationCap, Search, ArrowRight } from 'lucide-react';

const SelectionSection = ({ onSelect }) => {
  const options = [
    {
      id: 'book',
      title: 'Digital Book',
      description: 'Perfect for novels, biographies, or educational textbooks with automatic chapter flow.',
      icon: <Book size={42} />,
      color: '#0369a1'
    },
    {
      id: 'thesis',
      title: 'Academic Thesis',
      description: 'Structured writing for university students. Focuses on clarity, methodology, and citations.',
      icon: <GraduationCap size={42} />,
      color: '#0891b2'
    },
    {
      id: 'research',
      title: 'Research Paper',
      description: 'Deep-dive analysis for scientific papers, case studies, and corporate reports.',
      icon: <Search size={42} />,
      color: '#0e7490'
    },
  ];

  return (
    <section id="write-section" className="selection-section">
      <div className="section-header" style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h2 className="section-title" style={{ fontSize: '3rem', color: '#0369a1' }}>Select Your Path</h2>
        <p style={{ color: '#64748b', fontSize: '1.2rem', maxWidth: '700px', margin: '10px auto' }}>
          Choose the format that fits your vision. Our AI adapts its tone and structure to your choice.
        </p>
      </div>
      
      <div className="selection-grid">
        {options.map((opt) => (
          <div key={opt.id} className="selection-card" onClick={() => onSelect(opt.id)}>
            <div className="card-badge">Professional</div>
            <div className="card-icon" style={{ backgroundColor: `${opt.color}15`, color: opt.color }}>
              {opt.icon}
            </div>
            <h3>{opt.title}</h3>
            <p>{opt.description}</p>
            <div className="card-footer">
              <span>Start Writing</span>
              <ArrowRight size={18} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SelectionSection;
