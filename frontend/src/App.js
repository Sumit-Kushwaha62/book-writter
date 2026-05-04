import React, { useState } from 'react';
import './App.css';
import {
  Document, Packer, Paragraph, TextRun,
  AlignmentType, PageBreak, NumberFormat
} from 'docx';
import { saveAs } from 'file-saver';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const FONT_GROUPS = {
  Devanagari: ['Hindi', 'Marathi', 'Sanskrit', 'Maithili'],
  English: ['English'],
  Universal: ['Bengali', 'Telugu', 'Tamil', 'Gujarati',
    'Kannada', 'Malayalam', 'Punjabi', 'Odia', 'Urdu', 'Assamese']
};

const FONTS = {
  Devanagari: [
    { label: 'KrutiDev 010 - Classic', value: 'KrutiDev010' },
    { label: 'KrutiDev 011 - Alternate', value: 'KrutiDev011' },
    { label: 'Mangal', value: 'Mangal' },
    { label: 'Kokila', value: 'Kokila' },
    { label: 'Utsaah', value: 'Utsaah' },
    { label: 'Aparajita', value: 'Aparajita' },
    { label: 'Nirmala UI', value: 'Nirmala UI' },
  ],
  English: [
    { label: 'Calibri', value: 'Calibri' },
    { label: 'Times New Roman', value: 'Times New Roman' },
    { label: 'Arial', value: 'Arial' },
    { label: 'Georgia', value: 'Georgia' },
    { label: 'Garamond', value: 'Garamond' },
    { label: 'Cambria', value: 'Cambria' },
    { label: 'Bookman Old Style', value: 'Bookman Old Style' },
  ],
  Universal: [
    { label: 'Nirmala UI (Recommended)', value: 'Nirmala UI' },
    { label: 'Arial Unicode MS', value: 'Arial Unicode MS' },
    { label: 'Calibri', value: 'Calibri' },
    { label: 'Mangal', value: 'Mangal' },
  ]
};

const LANGUAGES = [
  'Hindi', 'English', 'Bengali', 'Telugu', 'Marathi',
  'Tamil', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi',
  'Odia', 'Urdu', 'Assamese', 'Maithili', 'Sanskrit'
];

const getFontGroup = (language) => {
  if (FONT_GROUPS.Devanagari.includes(language)) return 'Devanagari';
  if (FONT_GROUPS.English.includes(language)) return 'English';
  return 'Universal';
};

const unicodeToKrutiDev = (text) => {
  const map = {
    'अ': 'v', 'आ': 'vk', 'इ': 'b', 'ई': 'bZ', 'उ': 'm', 'ऊ': 'Å',
    'ए': ',s', 'ऐ': ',s', 'ओ': 'vks', 'औ': 'vkS',
    'क': 'd', 'ख': '[k', 'ग': 'x', 'घ': '?k', 'च': 'p', 'छ': 'N',
    'ज': 't', 'झ': '>', 'ट': 'V', 'ठ': 'B', 'ड': 'M', 'ढ': '<',
    'त': 'r', 'थ': 'Fk', 'द': 'n', 'ध': 'èk', 'न': 'u', 'प': 'i',
    'फ': 'Q', 'ब': 'c', 'भ': 'Hk', 'म': 'e', 'य': ';', 'र': 'j',
    'ल': 'y', 'व': 'o', 'श': '\'k', 'ष': '"k', 'स': 'l', 'ह': 'g',
    'ा': 'k', 'ि': 'f', 'ी': 'h', 'ु': 'q', 'ू': 'w', 'े': 's',
    'ै': 'S', 'ो': 'ks', 'ौ': 'kS', 'ं': 'a', 'ः': ',', '्': '~',
    'ृ': '`', 'ञ': '\'k', 'ण': '.k',
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
    '।': ']', '॥': ']]'
  };
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += map[text[i]] || text[i];
  }
  return result;
};

function App() {
  const [bookTitle, setBookTitle] = useState('');
  const [language, setLanguage] = useState('Hindi');
  const [totalChapters, setTotalChapters] = useState(5);
  const [wordsPerChapter, setWordsPerChapter] = useState(1000);
  const [selectedFont, setSelectedFont] = useState('Mangal');
  const [chapterTopics, setChapterTopics] = useState(Array(5).fill(''));
  const [generatedChapters, setGeneratedChapters] = useState([]);
  const [currentStep, setCurrentStep] = useState('config');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');

  const fontGroup = getFontGroup(language);
  const availableFonts = FONTS[fontGroup];
  const isKrutiDev = selectedFont.startsWith('KrutiDev');

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    const group = getFontGroup(lang);
    setSelectedFont(FONTS[group][0].value);
  };

  const handleChapterCountChange = (count) => {
    const num = parseInt(count);
    setTotalChapters(num);
    setChapterTopics(Array(num).fill('').map((_, i) => chapterTopics[i] || ''));
  };

  const handleTopicChange = (index, value) => {
    const updated = [...chapterTopics];
    updated[index] = value;
    setChapterTopics(updated);
  };

  const generateChapter = async (chapterNumber, topic, previousSummary) => {
    const response = await fetch(`${BACKEND_URL}/generate-chapter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookTitle, language, chapterNumber,
        totalChapters, topic, wordsPerChapter, previousSummary
      })
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.content;
  };

  const handleGenerate = async () => {
    if (!bookTitle.trim()) { setError('Book title daalo!'); return; }
    if (chapterTopics.some(t => !t.trim())) { setError('Sabhi chapters ke topics daalo!'); return; }

    setError('');
    setIsGenerating(true);
    setCurrentStep('generating');
    setGeneratedChapters([]);

    const chapters = [];
    let previousSummary = '';

    for (let i = 0; i < totalChapters; i++) {
      setStatusMessage(`Chapter ${i + 1} / ${totalChapters} generate ho raha hai...`);
      setProgress(Math.round((i / totalChapters) * 100));

      try {
        const content = await generateChapter(i + 1, chapterTopics[i], previousSummary);
        chapters.push({ number: i + 1, topic: chapterTopics[i], content });
        setGeneratedChapters([...chapters]);
        previousSummary += `Ch${i + 1}(${chapterTopics[i]}):covered. `;
      } catch (err) {
        setError(`Chapter ${i + 1} mein error: ${err.message}`);
        setIsGenerating(false);
        return;
      }

      if (i < totalChapters - 1) {
        await new Promise(r => setTimeout(r, 1500));
      }
    }

    setProgress(100);
    setStatusMessage('Sab chapters ready hain!');
    setIsGenerating(false);
    setCurrentStep('done');
  };

  const processText = (text) => isKrutiDev ? unicodeToKrutiDev(text) : text;

  const downloadDocx = async () => {
    const BLACK = '000000';

    // Sab content ek hi array mein — ek section = continuous page numbers
    const allChildren = [];

    // Title page
    allChildren.push(
      new Paragraph({
        children: [new TextRun({
          text: processText(bookTitle),
          font: selectedFont,
          size: 48,
          bold: true,
          color: BLACK,
        })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 2000, after: 400 },
      }),
      new Paragraph({ children: [new PageBreak()] })
    );

    // Chapters — sab ek saath
    generatedChapters.forEach((chapter) => {
      const lines = chapter.content.split('\n').filter(l => l.trim());

      lines.forEach((line, idx) => {
        const cleanLine = line.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
        if (!cleanLine) return;

        if (idx === 0) {
          // Chapter title — centered, large, bold
          allChildren.push(new Paragraph({
            children: [new TextRun({
              text: processText(cleanLine),
              font: selectedFont,
              size: 36,
              bold: true,
              color: BLACK,
            })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 300 },
          }));
        } else if (line.startsWith('##') || line.startsWith('**')) {
          // Subheading
          allChildren.push(new Paragraph({
            children: [new TextRun({
              text: processText(cleanLine),
              font: selectedFont,
              size: 28,
              bold: true,
              color: BLACK,
            })],
            alignment: AlignmentType.LEFT,
            spacing: { before: 300, after: 150 },
          }));
        } else if (line.startsWith('#')) {
          // H1
          allChildren.push(new Paragraph({
            children: [new TextRun({
              text: processText(cleanLine),
              font: selectedFont,
              size: 32,
              bold: true,
              color: BLACK,
            })],
            alignment: AlignmentType.LEFT,
            spacing: { before: 300, after: 150 },
          }));
        } else {
          // Body
          allChildren.push(new Paragraph({
            children: [new TextRun({
              text: processText(cleanLine),
              font: selectedFont,
              size: 24,
              color: BLACK,
            })],
            alignment: AlignmentType.LEFT,
            spacing: { after: 150 },
          }));
        }
      });

      // Chapter ke baad page break
      allChildren.push(new Paragraph({ children: [new PageBreak()] }));
    });

    // EK HI SECTION — continuous page numbers guaranteed
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
            pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL }
          }
        },
        children: allChildren
      }]
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${bookTitle}.docx`);
  };

  const resetApp = () => {
    setCurrentStep('config');
    setGeneratedChapters([]);
    setProgress(0);
    setStatusMessage('');
    setError('');
  };

  return (
    <div className="app">
      <header className="header">
        <h1>AI Book Writer</h1>
        <p>AI se apni book generate karo</p>
      </header>

      {currentStep === 'config' && (
        <div className="form-container">
          {error && <div className="error">{error}</div>}

          <div className="form-group">
            <label>Book Title</label>
            <input
              type="text"
              value={bookTitle}
              onChange={e => setBookTitle(e.target.value)}
              placeholder="Jaise: Bharat ka Itihas"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Language</label>
              <select value={language} onChange={e => handleLanguageChange(e.target.value)}>
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Font <span style={{ fontSize: '11px', color: '#888' }}>({fontGroup})</span></label>
              <select value={selectedFont} onChange={e => setSelectedFont(e.target.value)}>
                {availableFonts.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Total Chapters: {totalChapters}</label>
              <input
                type="range" min="1" max="20" value={totalChapters}
                onChange={e => handleChapterCountChange(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Words per Chapter: {wordsPerChapter}</label>
              <input
                type="range" min="500" max="5000" step="500" value={wordsPerChapter}
                onChange={e => setWordsPerChapter(parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Chapter Topics</label>
            {chapterTopics.map((topic, i) => (
              <input
                key={i} type="text" value={topic}
                onChange={e => handleTopicChange(i, e.target.value)}
                placeholder={`Chapter ${i + 1} ka topic`}
                style={{ marginBottom: '8px' }}
              />
            ))}
          </div>

          <button className="btn-primary" onClick={handleGenerate} disabled={isGenerating}>
            Book Generate Karo
          </button>
        </div>
      )}

      {currentStep === 'generating' && (
        <div className="generating-container">
          <h2>Book Generate Ho Rahi Hai...</h2>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="status">{statusMessage}</p>
          {error && <div className="error">{error}</div>}
          <div className="chapters-preview">
            {generatedChapters.map(ch => (
              <div key={ch.number} className="chapter-done">
                ✓ Chapter {ch.number}: {ch.topic}
              </div>
            ))}
          </div>
        </div>
      )}

      {currentStep === 'done' && (
        <div className="done-container">
          <h2>Book Ready!</h2>
          <p>{generatedChapters.length} chapters generate hue</p>
          <div className="chapters-list">
            {generatedChapters.map(ch => (
              <div key={ch.number} className="chapter-card">
                <h3>Chapter {ch.number}: {ch.topic}</h3>
                <p>{ch.content.substring(0, 200)}...</p>
              </div>
            ))}
          </div>
          <div className="action-buttons">
            <button className="btn-primary" onClick={downloadDocx}>DOCX Download Karo</button>
            <button className="btn-secondary" onClick={resetApp}>Nayi Book Banao</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
