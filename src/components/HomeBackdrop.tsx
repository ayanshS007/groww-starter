// Soft drifting blobs behind Home (Stage 5) and Landing (Stage 6a). Decoration:
// aria-hidden, no pointer events, pure CSS animation (.home-blob in index.css).
// Static under prefers-reduced-motion, paused while the tab is hidden. Blob
// colours and pace follow the market mood (data-mood on <html>); `sky` adds the
// time-of-day gradient and `payday` turns the third blob gold.
import { useEffect, useState } from 'react';

export function HomeBackdrop({ sky = true, payday = false }: { sky?: boolean; payday?: boolean }) {
  const [hidden, setHidden] = useState(() => typeof document !== 'undefined' && document.hidden);
  useEffect(() => {
    const onChange = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);
  return (
    <div aria-hidden data-paused={hidden} data-payday={payday} className="home-blobs">
      {sky && <span className="home-sky" />}
      <span className="home-blob home-blob-green" />
      <span className="home-blob home-blob-mint" />
      <span className="home-blob home-blob-lavender" />
    </div>
  );
}
