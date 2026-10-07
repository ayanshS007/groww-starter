// Soft drifting blobs behind Home only (Stage 5). Decoration: aria-hidden, no
// pointer events, pure CSS animation (.home-blob in index.css). It is static
// under prefers-reduced-motion, and paused while the tab is hidden.
import { useEffect, useState } from 'react';

export function HomeBackdrop() {
  const [hidden, setHidden] = useState(() => typeof document !== 'undefined' && document.hidden);
  useEffect(() => {
    const onChange = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);
  return (
    <div aria-hidden data-paused={hidden} className="home-blobs">
      <span className="home-blob home-blob-green" />
      <span className="home-blob home-blob-mint" />
      <span className="home-blob home-blob-lavender" />
    </div>
  );
}
