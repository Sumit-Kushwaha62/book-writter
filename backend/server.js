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
  const { bookTitle, language, chapterNumber, totalChapters, topic, wordsPerChapter, previousSummary, userIdea } = req.body;

  const contextLine = previousSummary
    ? `Previous chapters: ${previousSummary}`
    : '';

  const userIdeaLine = userIdea 
    ? `User specific instructions/idea: "${userIdea}"`
    : '';

  const prompt = `Book Title: "${bookTitle}"
Language: ${language}
Part ${chapterNumber} of ${totalChapters}
Section Topic: "${topic}"
Target Word Count: ~${wordsPerChapter} words

STRUCTURE RULES:
1. Use markdown-style subheadings (starting with ##) for section breaks within the chapter.
2. Use bullet points (- or *) for lists or key takeaways where appropriate.
3. Content must be professional, well-structured, and flow logically.

${userIdeaLine}
${contextLine}

TASK: Write the complete content for this section in ${language}. Start directly with the section content or title. No preamble or chat filler.`;

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
          max_tokens: 4000,
          temperature: 0.7
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
