import React, { useState, Suspense, useEffect } from 'react';
import './App.css';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import Navbar from './components/layout/Navbar';
import Book3D from './components/3d/Scene';
import SelectionSection from './components/ui/SelectionSection';
import { Book, Shield, Zap, Globe, X, Link2 } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { generateAndSaveDoc } from './utils/docxExport';

gsap.registerPlugin(ScrollTrigger);

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
const LANGUAGES = ['English', 'Hindi', 'Bengali', 'Telugu', 'Marathi', 'Tamil', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi'];

function App() {
  const [writeType, setWriteType] = useState(null);
  const [bookTitle, setBookTitle] = useState('');
  const [language, setLanguage] = useState('English');
  const [font, setFont] = useState('Calibri');
  const [userIdea, setUserIdea] = useState('');
  const [totalChapters, setTotalChapters] = useState(5);
  const [wordsPerChapter, setWordsPerChapter] = useState(1000);
  const [chapterTopics, setChapterTopics] = useState(Array(5).fill(''));
  const [currentStep, setCurrentStep] = useState('landing'); 
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const [generatedChapters, setGeneratedChapters] = useState([]);

  const FONTS = ['Calibri', 'Arial', 'Times New Roman', 'Georgia', 'Verdana'];

  useEffect(() => {
    if (currentStep === 'landing') {
      gsap.from('.hero-section h1', { opacity: 0, x: -100, duration: 1.2, ease: 'power4.out' });
      gsap.from('.hero-section p', { opacity: 0, x: -100, duration: 1.2, delay: 0.2, ease: 'power4.out' });
      gsap.from('.hero-section .btn-cta', { opacity: 0, y: 50, duration: 1, delay: 0.5, ease: 'back.out(1.7)' });

      gsap.from('.feature-item', {
        scrollTrigger: { trigger: '.features-section', start: 'top 80%' },
        opacity: 0, y: 40, stagger: 0.2, duration: 0.8, ease: 'power2.out'
      });
    }
  }, [currentStep]);

  const handleSelect = (type) => {
    setWriteType(type);
    setCurrentStep('config');
    setChapterTopics(Array(totalChapters).fill(''));
    window.scrollTo(0, 0);
  };

  const updateSectionCount = (count) => {
    const n = parseInt(count) || 1;
    setTotalChapters(n);
    const newTopics = [...chapterTopics];
    if (n > newTopics.length) {
      for (let i = newTopics.length; i < n; i++) newTopics.push('');
    } else {
      newTopics.splice(n);
    }
    setChapterTopics(newTopics);
  };

  const handleGenerate = async () => {
    if (!bookTitle.trim()) { setError('Please enter a title'); return; }
    setError('');
    setCurrentStep('generating');
    let chapters = [];
    let previousSummary = '';
    
    try {
      for (let i = 0; i < totalChapters; i++) {
        setStatusMessage(`Generating section ${i + 1} of ${totalChapters}...`);
        setProgress(Math.round((i / totalChapters) * 100));
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 min timeout

        const response = await fetch(`${BACKEND_URL}/generate-chapter`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            bookTitle, 
            language, 
            chapterNumber: i + 1, 
            totalChapters, 
            topic: chapterTopics[i], 
            wordsPerChapter, 
            previousSummary, 
            writeType,
            userIdea // Send the custom instructions/idea
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Server responded with ${response.status}`);
        }

        const data = await response.json();
        if (!data.success) throw new Error(data.error || 'Generation failed');
        
        chapters.push({ number: i + 1, topic: chapterTopics[i] || `Chapter ${i+1}`, content: data.content });
        setGeneratedChapters([...chapters]);
        previousSummary += `${chapterTopics[i]} covered. `;
      }
      
      setProgress(100);
      setStatusMessage('Finalizing...');
      
      // Small delay to ensure state propagates before transition
      setTimeout(() => {
        setCurrentStep('done');
      }, 500);

    } catch (err) {
      console.error('Generation Error:', err);
      setError(err.name === 'AbortError' ? 'Request timed out. Please try again.' : err.message);
      setCurrentStep('config'); // Return to config so user can try again
    }
  };

  const downloadDocx = async () => {
    try {
      await generateAndSaveDoc({
        title: bookTitle,
        chapters: generatedChapters,
        font: font,
        language: language
      });
    } catch (err) {
      console.error('Download Error:', err);
      setError('Failed to generate document. Please try again.');
    }
  };

  return (
    <div className="app">
      <Navbar onGetStarted={() => document.getElementById('write-section')?.scrollIntoView({ behavior: 'smooth' })} />
      
      <div className="canvas-container">
        <Canvas camera={{ position: [0, 0, 8], fov: 40 }}>
          <Suspense fallback={null}>
            <Book3D />
            <Environment preset="city" />
            <OrbitControls enableZoom={false} autoRotate />
          </Suspense>
        </Canvas>
      </div>

      <main className="main-content">
        {currentStep === 'landing' && (
          <div className="landing-wrapper">
            <section className="hero-landing">
              <div className="hero-section">
                <h1>The Future of <br/> <span>Creative Writing.</span></h1>
                <p>Harness the power of AI to write professional books, thesis, and research papers in minutes. Clean, structured, and ready to publish.</p>
                <button className="btn-cta" onClick={() => document.getElementById('write-section').scrollIntoView({ behavior: 'smooth' })}>
                  Start Your Masterpiece
                </button>
              </div>
            </section>

            <section id="features" className="features-section">
              <h2 className="section-title">Why BookWritter?</h2>
              <div className="features-grid">
                <div className="feature-item"><Zap size={40} color="#0369a1" /><h4>Instant Drafts</h4><p>Generate full chapters from simple topics in seconds.</p></div>
                <div className="feature-item"><Shield size={40} color="#0369a1" /><h4>Plagiarism Free</h4><p>Unique content tailored to your specific style.</p></div>
                <div className="feature-item"><Globe size={40} color="#0369a1" /><h4>Multi-Lingual</h4><p>Support for Hindi, English and regional languages.</p></div>
                <div className="feature-item"><Book size={40} color="#0369a1" /><h4>DOCX Export</h4><p>Professional formatting, ready for print.</p></div>
              </div>
            </section>

            <section id="write-section" className="write-select-section">
              <SelectionSection onSelect={handleSelect} />
            </section>

            <footer>
              <div className="footer-content">
                <h3>BookWritter AI</h3>
                <p>© 2026 Crafted for Creators with ❤️ by Developer Sumit</p>
                <div className="socials" style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '20px' }}>
                  <X size={20} /> <Link2 size={20} /> <Globe size={20} />
                </div>
              </div>
            </footer>
          </div>
        )}

        {currentStep !== 'landing' && (
          <div className="form-overlay">
            <div className="form-content">
              <button className="btn-nav" onClick={() => setCurrentStep('landing')} style={{ marginBottom: '20px' }}>← Exit Editor</button>
              
              {currentStep === 'config' && (
                <div className="config-form">
                  <h1>Setup your {writeType}</h1>
                  {error && <div className="error" style={{ color: 'red', marginBottom: '20px' }}>{error}</div>}
                  
                  <div className="form-group">
                    <label>Title</label>
                    <input type="text" placeholder="e.g. My Great Novel" value={bookTitle} onChange={e => setBookTitle(e.target.value)} />
                  </div>

                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label>Your Creative Idea / Instructions (Optional)</label>
                    <textarea 
                      placeholder="e.g. Write in a suspenseful tone, focus on character development, or include specific technical details..." 
                      value={userIdea} 
                      onChange={e => setUserIdea(e.target.value)}
                      style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', minHeight: '100px', fontFamily: 'inherit' }}
                    />
                  </div>

                  <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '20px' }}>
                    <div className="form-group">
                      <label>Language</label>
                      <select value={language} onChange={e => setLanguage(e.target.value)}>
                        {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Font Style</label>
                      <select value={font} onChange={e => setFont(e.target.value)}>
                        {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '20px' }}>
                    <div className="form-group">
                      <label>Total Sections</label>
                      <input type="number" min="1" max="20" value={totalChapters} onChange={e => updateSectionCount(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Words per Section</label>
                      <input type="number" value={wordsPerChapter} onChange={e => setWordsPerChapter(e.target.value)} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Topics for each Section</label>
                    {chapterTopics.map((topic, i) => (
                      <input key={i} type="text" placeholder={`Section ${i+1} topic`} value={topic} onChange={e => {
                        const u = [...chapterTopics]; u[i] = e.target.value; setChapterTopics(u);
                      }} style={{ marginBottom: '10px' }} />
                    ))}
                  </div>

                  <button className="btn-cta" style={{ width: '100%' }} onClick={handleGenerate}>Begin Generation</button>
                </div>
              )}

              {currentStep === 'generating' && (
                <div className="progress-container">
                  <h1>Writing your masterpiece...</h1>
                  <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }}></div></div>
                  <p>{statusMessage}</p>
                </div>
              )}

              {currentStep === 'done' && (
                <div className="done-container" style={{ textAlign: 'center' }}>
                  <h1>Writing Complete!</h1>
                  <p>Your {writeType} is ready for download.</p>
                  <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '40px' }}>
                    <button className="btn-cta" onClick={downloadDocx}>Download .DOCX</button>
                    <button className="btn-nav" onClick={() => setCurrentStep('landing')}>Finish</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;






















