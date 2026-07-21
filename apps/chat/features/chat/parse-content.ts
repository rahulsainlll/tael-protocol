export type ContentBlock =
  { type: "tool"; text: string } | { type: "code"; text: string } | { type: "p"; text: string };

export function parseContent(content: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  const lines = content.split("\n");
  let paragraph: string[] = [];
  let inCode = false;
  let codeLines: string[] = [];

  const flushParagraph = () => {
    const text = paragraph.join("\n").trim();
    if (text) blocks.push({ type: "p", text });
    paragraph = [];
  };

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCode) {
        blocks.push({ type: "code", text: codeLines.join("\n") });
        codeLines = [];
        inCode = false;
      } else {
        flushParagraph();
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeLines.push(line);
      continue;
    }
    if (line.startsWith("✦ ")) {
      flushParagraph();
      blocks.push({ type: "tool", text: line.slice(2) });
      continue;
    }
    if (line.trim() === "") {
      flushParagraph();
      continue;
    }
    paragraph.push(line);
  }
  if (inCode) blocks.push({ type: "code", text: codeLines.join("\n") });
  flushParagraph();

  return blocks;
}
