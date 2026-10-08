// Copy rules (Stage 7a): the UI sounds like a smart older friend, not a bank or a chatbot.
// Rendered text of every screen, and the source text of toasts and lib copy, is checked against the same rules.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { renderScreen } from './App';
import { ToastProvider } from './components/Toast';
import { buildPersona } from './data/personas';
import { jumpLinks } from './lib/jumpLinks';
import { parseHash, resolveRoute } from './lib/routes';
import { StoreProvider } from './state/store';
import type { State } from './state/types';
import { agedSip, fresh, run, TODAY, withCheckin, withNextDebit, withPicks } from './test/fixtures';

/** Words and phrases the app never uses (owner list, Stage 7a). */
export const BANNED = new RegExp(
  [
    'seamless(ly)?',
    'effortless(ly)?',
    'empower\\w*',
    'journey\\w*',
    'leverag\\w*',
    'robust\\w*',
    'elevat\\w*',
    'delv\\w*',
    'dive into',
    'dives into',
    'embark\\w*',
    'holistic\\w*',
    'tailored',
    'curated',
    'game-changer',
    'let[’\']s',
    'here[’\']s the thing',
    'rest assured',
  ].join('|'),
  'i',
);

const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ');

function render(hash: string, state: State): string | null {
  const r = resolveRoute(parseHash(hash), state);
  if (r.kind !== 'screen') return null;
  const storage = { getItem: () => JSON.stringify(state), setItem: () => {}, removeItem: () => {} };
  return renderToString(
    <StoreProvider storage={storage} today={TODAY}>
      <ToastProvider>{renderScreen(r)}</ToastProvider>
    </StoreProvider>,
  );
}

const planned = withCheckin(fresh());
const states: [string, State][] = [
  ['fresh', fresh()],
  ['planned', planned],
  ['planned and picked', withPicks(planned)],
  ['Riya', buildPersona('riya', TODAY)],
  ['Riya, big dip', run(buildPersona('riya', TODAY), { type: 'setPreview', patch: { mood: 'big_dip' } })],
  ['Kabir', buildPersona('kabir', TODAY)],
  ['Meera', buildPersona('meera', TODAY)],
  ['Arjun', buildPersona('arjun', TODAY)],
  ['Arjun, Pro', run(buildPersona('arjun', TODAY), { type: 'unlockPro' })],
  ['a SIP inside the cutoff', withNextDebit(agedSip(), true)],
  ['a SIP outside the cutoff', withNextDebit(agedSip(), false)],
];

describe('every screen follows the copy rules', () => {
  for (const [name, state] of states) {
    for (const link of jumpLinks(state)) {
      const html = render('#' + link.to, state);
      if (html === null) continue;
      const t = text(html);
      it(`${name}: ${link.to}`, () => {
        expect(t.match(BANNED)?.[0]).toBeUndefined();
        // At most one exclamation mark per screen.
        expect((t.match(/!/g) ?? []).length).toBeLessThanOrEqual(1);
        // No em dashes: full stops or commas instead.
        expect(t).not.toContain('—');
      });
    }
  }
});

/** Every non-test source file under src. */
function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return f === 'test' ? [] : sources(p);
    return /\.(ts|tsx)$/.test(f) && !/\.test\.tsx?$/.test(f) ? [p] : [];
  });
}

describe('source text (toasts, lib copy, data) follows the same rules', () => {
  const files = sources(join(process.cwd(), 'src'));
  it('has files to check', () => expect(files.length).toBeGreaterThan(50));
  for (const file of files) {
    it(file.replace(process.cwd() + '/', ''), () => {
      const bad: string[] = [];
      readFileSync(file, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          const t = line.trim();
          if (/^(import |\/\/|\*|\/\*)/.test(t)) return;
          const prose = line.replace(/\bnavigate\b/g, '').replace(/\bNAVIGATE\b/g, '');
          if (BANNED.test(prose)) bad.push(`${i + 1}: banned word: ${t}`);
          if (/[A-Za-z0-9₹)] — [A-Za-z0-9₹(]/.test(line) || /[A-Za-z]—[A-Za-z]/.test(line)) bad.push(`${i + 1}: em dash: ${t}`);
          // An exclamation mark inside a string literal or JSX text (not a TypeScript operator).
          const literals = [...line.matchAll(/'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"|`((?:[^`\\]|\\.)*)`|>([^<>{}]+)</g)].map((m) => m[1] ?? m[2] ?? m[3] ?? m[4] ?? '');
          if (literals.some((l) => /[A-Za-z0-9₹)]!(\s|$)/.test(l))) bad.push(`${i + 1}: exclamation: ${t}`);
        });
      expect(bad).toEqual([]);
    });
  }
});
