import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Term, TermScope } from './Term';

const buttons = (html: string) => (html.match(/<button/g) ?? []).length;

describe('Term (PLAN C8)', () => {
  it('underlines only the first appearance of a term within a screen', () => {
    const html = renderToString(
      <TermScope>
        <p>
          A <Term id="sip">SIP</Term> is monthly. Your <Term id="sip">SIP</Term> can be skipped. <Term id="nav">NAV</Term>
        </p>
      </TermScope>,
    );
    expect(buttons(html)).toBe(2); // one SIP, one NAV
    expect(html.replace(/<!-- -->/g, '')).toContain('Your SIP can be skipped');
  });
  it('a new screen (new scope) underlines the term again', () => {
    const one = renderToString(
      <TermScope>
        <Term id="sip" />
      </TermScope>,
    );
    expect(buttons(one)).toBe(1);
  });
  it('unknown ids render as plain text', () => {
    expect(buttons(renderToString(<Term id="nope">word</Term>))).toBe(0);
  });
});
