import { access, readFile } from 'node:fs/promises';

const indexHtml = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
const stylesheetTags = indexHtml.match(/<link\b[^>]*>/gi) ?? [];
const appStylesheet = stylesheetTags.find((tag) =>
  /\brel=["']stylesheet["']/i.test(tag)
  && /\bhref=["']\/assets\/app\.css["']/i.test(tag));

if (!appStylesheet) {
  throw new Error('Production HTML does not reference the stable /assets/app.css stylesheet.');
}

if (!/\bdata-clarity-unmask=["']true["']/i.test(appStylesheet)) {
  throw new Error('Production stylesheet link is missing data-clarity-unmask="true".');
}

await access(new URL('../dist/assets/app.css', import.meta.url));

console.log('Clarity production stylesheet contract verified.');
