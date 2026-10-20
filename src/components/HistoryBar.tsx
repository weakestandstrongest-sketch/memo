import { useEffect, useRef } from 'react';
import { ja } from '../i18n/ja';
import { formatDateTime } from '../utils/format';
import { CloseIcon } from './icons';

interface HistoryBarProps {
  start: number;
  end: number;
  /** Current moment shown in the universe. */
  time: number;
  playing: boolean;
  /** Creation times of all stars (drawn as small ticks on the timeline). */
  ticks: number[];
  /** Stars visible at `time`. */
  visibleCount: number;
  onTimeChange: (t: number) => void;
  onPlayingChange: (playing: boolean) => void;
  onClose: () => void;
}

const STEPS = 1000;

/** "宇宙の歴史": replay how the universe grew, or scrub to any moment. */
export function HistoryBar({
  start,
  end,
  time,
  playing,
  ticks,
  visibleCount,
  onTimeChange,
  onPlayingChange,
  onClose,
}: HistoryBarProps) {
  const t = ja.history;
  const span = Math.max(1, end - start);
  const latest = useRef({ time, onTimeChange, onPlayingChange });
  latest.current = { time, onTimeChange, onPlayingChange };

  // Playback: the whole history takes 6–20 seconds depending on how many stars there are.
  useEffect(() => {
    if (!playing) return;
    const duration = Math.min(20000, Math.max(6000, 4000 + ticks.length * 300));
    let last = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const dt = now - last;
      last = now;
      const next = Math.min(end, latest.current.time + (span * dt) / duration);
      latest.current.onTimeChange(next);
      if (next >= end) latest.current.onPlayingChange(false);
      else frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [playing, end, span, ticks.length]);

  // Escape closes the history view.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('.modal-backdrop')) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const togglePlay = () => {
    if (!playing && time >= end) onTimeChange(start); // replay from the beginning
    onPlayingChange(!playing);
  };

  return (
    <section className="history-bar glass" aria-label={t.label}>
      <button
        type="button"
        className="history-play"
        onClick={togglePlay}
        aria-label={playing ? t.pause : t.play}
        title={playing ? t.pause : t.play}
      >
        {playing ? (
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" />
            <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
          </svg>
        )}
      </button>

      <div className="history-main">
        <div className="history-info">
          <span className="history-date">{formatDateTime(new Date(time).toISOString())}</span>
          <span className="history-count">{t.stars(visibleCount)}</span>
        </div>
        <div className="history-track">
          <div className="history-ticks" aria-hidden="true">
            {ticks.slice(0, 400).map((tick, i) => (
              <span
                key={i}
                className={`history-tick ${tick <= time ? 'is-past' : ''}`}
                style={{ left: `${((tick - start) / span) * 100}%` }}
              />
            ))}
          </div>
          <input
            type="range"
            className="history-slider"
            min={0}
            max={STEPS}
            step={1}
            value={Math.round(((time - start) / span) * STEPS)}
            aria-label={t.slider}
            aria-valuetext={formatDateTime(new Date(time).toISOString())}
            onChange={(e) => {
              onPlayingChange(false);
              onTimeChange(start + (Number(e.target.value) / STEPS) * span);
            }}
          />
        </div>
      </div>

      <button type="button" className="icon-button history-close" onClick={onClose} aria-label={t.close} title={t.close}>
        <CloseIcon />
      </button>
    </section>
  );
}
