import { Document, Packer, Paragraph, TextRun, AlignmentType, PageBreak, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

/**
 * Parses AI generated text and converts it into structured docx components.
 * Handles headings (markdown # style), bullet points, and justifies text.
 */
export const generateAndSaveDoc = async ({ title, chapters, font, language }) => {
  const allElements = [];

  // Add Book Title Page
  allElements.push(
    new Paragraph({
      children: [
        new TextRun({
          text: title.toUpperCase(),
          size: 48,
          bold: true,
          font: font,
          color: '0369a1',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 2000, after: 1000 },
    })
  );

  allElements.push(new Paragraph({ children: [new PageBreak()] }));

  // Process Each Chapter
  chapters.forEach((ch, index) => {
    // Chapter Title
    allElements.push(
      new Paragraph({
        text: `CHAPTER ${ch.number}: ${ch.topic.toUpperCase()}`,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 600 },
      })
    );

    // Parse Content
    const lines = ch.content.split('\n');
    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      let paragraphOptions = {
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 200, line: 360 }, // Better readability with line spacing
      };

      let textOptions = {
        font: font,
        size: 24,
      };

      // Detect Heading (## or ###)
      if (trimmedLine.startsWith('##')) {
        const headingText = trimmedLine.replace(/^#+\s*/, '');
        allElements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: headingText,
                bold: true,
                size: 30,
                font: font,
                color: '075985',
              }),
            ],
            spacing: { before: 300, after: 200 },
          })
        );
      }
      // Detect Bullet Points (* or -)
      else if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
        const bulletText = trimmedLine.substring(2);
        allElements.push(
          new Paragraph({
            children: [new TextRun({ text: bulletText, font: font, size: 24 })],
            bullet: { level: 0 },
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 150 },
          })
        );
      }
      // Normal Paragraph
      else {
        allElements.push(
          new Paragraph({
            children: [new TextRun({ text: trimmedLine, font: font, size: 24 })],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 200 },
          })
        );
      }
    });

    // Add Page Break after each chapter except the last one
    if (index < chapters.length - 1) {
      allElements.push(new Paragraph({ children: [new PageBreak()] }));
    }
  });

  const doc = new Document({
    sections: [
      {
        properties: {
            page: {
                margin: {
                    top: 1440, // 1 inch
                    right: 1440,
                    bottom: 1440,
                    left: 1440,
                },
            },
        },
        children: allElements,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${title.replace(/\s+/g, '_')}.docx`);
};
