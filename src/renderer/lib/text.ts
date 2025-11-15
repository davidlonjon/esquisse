/**
 * Rough word count by stripping HTML and splitting on whitespace.
 */
export function getWordCountFromHTML(html: string): number {
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) {
    return 0;
  }

  return text.split(' ').length;
}
