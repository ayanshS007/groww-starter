// Market mood + simulated clock for React (Stage 6a). The hook re-reads the
// clock every minute; AmbienceRoot writes it to <html> as data attributes,
// which tokens.ts (via Tailwind) turns into app-wide CSS variables.
import { useEffect, useState } from 'react';
import { ambience, type Ambience } from '../lib/mood';
import { useStore } from '../state/store';

export function useAmbience(): Ambience {
  const { state } = useStore();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return ambience(state, now);
}

/** Mirrors the ambience onto <html data-mood data-tod data-payday data-weekend>. Renders nothing. */
export function AmbienceRoot() {
  const a = useAmbience();
  useEffect(() => {
    const d = document.documentElement.dataset;
    d.mood = a.mood;
    d.tod = a.timeOfDay;
    d.payday = String(a.payday);
    d.weekend = String(a.weekend);
  }, [a.mood, a.timeOfDay, a.payday, a.weekend]);
  return null;
}
