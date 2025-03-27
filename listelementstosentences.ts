import { editor } from "@silverbulletmd/silverbullet/syscalls";


export async function listElementsToSentences() {
  const cursor = await editor.getCursor();
  if (!cursor) return;

  const content = await editor.getText();

  // find the start of the list
  let startPos = cursor;
  while (startPos > 0 && /^\s*[-*+]\s+/.test(content.slice(content.lastIndexOf("\n", startPos - 1)))) {
      startPos--;
  }
  // I might have a flaw in my logic, so I have to add one position integer again ...
  startPos++;
  startPos++;

  // find the end of the list
  let endPos = cursor;
  while (endPos < content.length) {
    // search fo rthe next "\" and check, if after that a list element appears
    let nextNewLine = content.indexOf("\n", endPos);
    if (nextNewLine === -1) break;

    let nextLine = content.slice(nextNewLine + 1).trim();
    if (/^\s*[-*+]\s+/.test(nextLine)) {
      endPos = nextNewLine + 1;
    } else {
      break;
    }
  }
  // probably stupid coding, but till here I only have endPos, which represents
  // the start of the last list item and not its end. so search the next
  // "\n" from this position and use this as endPos then instead ...
  let lastListItemStart = content.lastIndexOf("\n", endPos - 1);
  let nextNewLineAfterLastListItem = content.indexOf("\n", lastListItemStart + 1);
  endPos = nextNewLineAfterLastListItem === -1 ? content.length : nextNewLineAfterLastListItem;

  // cancel if no valid list region was found
  if (startPos === endPos) return;

  // extract content and format it as "sentences"
  const listText = content.slice(startPos, endPos);
  let lines = listText.split("\n");
  let transformed = lines.map(line => {
    // remove markdown list element characters
    let trimmedLine = line.replace(/^\s*[-*+]\s*/, '').trim();

    // if there is now sentences ending character, add a point
    if (!/[.!?]$/.test(trimmedLine)) {
      trimmedLine += '.';
    }
    return trimmedLine;
  });

  let sentences = transformed.join(' ');

  await editor.copyToClipboard(sentences);
  await editor.flashNotification("Copied list as sentences to clipboard!", "info");
}


export async function sentencesToListElements() {
  const selection = await editor.getSelection();
  if (!selection) return;

  const content = await editor.getText();
  const selectedText = content.slice(selection.from, selection.to);
  console.log(selectedText);

  // Split selected text into sentences (assuming basic punctuation rules)
  let sentences = selectedText.match(/[^.!?]+[.!?]*/g) || [];

  // Trim whitespace and format as list items
  let listItems = sentences.map(sentence => "- " + sentence.trim());

  let listText = listItems.join("\n");

  await editor.copyToClipboard(listText);
  await editor.flashNotification("Converted sentences to list!", "info");
}