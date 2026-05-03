require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.json({ message: 'Book Writer Backend Running!' });
});

app.post('/generate-chapter', async (req, res) => {
  const { bookTitle, language, chapterNumber, totalChapters, topic, wordsPerChapter } = req.body;

  const prompt = `Book:"${bookTitle}"|Lang:${language}|Ch${chapterNumber}/${totalChapters}:"${topic}"
Words:~${wordsPerChapter}|Format:H1 title then H2 subheadings then paragraphs
Write complete chapter in ${language}. No preamble. Start directly with chapter title.`;

  try {
    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 4000
        })
      }
    );

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    res.json({
      success: true,
      content: data.choices[0].message.content
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});