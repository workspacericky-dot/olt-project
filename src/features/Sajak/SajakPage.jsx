import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Heart, Music2, Pause, Play, RotateCcw, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import poem from './poem.txt?raw';
import music from './love-me.mp3';
import './sajak.css';

const chapters = ['Dicintai', 'Disyukuri', 'Belajar', 'Sejujurnya', 'Ruang untukmu', 'Pulang'];
const lines = poem.trim().split(/\r?\n\s*\r?\n/).flatMap((stanza, chapter) =>
  stanza.split(/\r?\n/).filter(Boolean).flatMap(line => line.split(/(?<=[.!?])\s+(?=[A-Z])/u))
    .map(text => ({ text, chapter, duration: 10000 }))
);
const totalDuration = lines.reduce((sum, line) => sum + line.duration, 0);
const FADE_OUT_DURATION = 4500;

export default function SajakPage() {
  const audio = useRef(null);
  const elapsed = useRef(0);
  const fadeFrame = useRef(null);
  const fadingOut = useRef(false);
  const fadeFactor = useRef(1);
  const volumeRef = useRef(0.45);
  const [index, setIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.45);
  const [progress, setProgress] = useState(0);
  const [audioError, setAudioError] = useState(false);
  const current = lines[index];

  const cancelFadeOut = useCallback(() => {
    if (fadeFrame.current !== null) cancelAnimationFrame(fadeFrame.current);
    fadeFrame.current = null;
    if (fadingOut.current) audio.current?.pause();
    fadingOut.current = false;
    fadeFactor.current = 1;
    if (audio.current) audio.current.volume = volumeRef.current;
  }, []);

  const fadeOutMusic = useCallback(() => {
    cancelFadeOut();
    fadingOut.current = true;
    const startedAt = performance.now();
    const fade = (now) => {
      const remaining = Math.max(0, 1 - (now - startedAt) / FADE_OUT_DURATION);
      fadeFactor.current = remaining * remaining;
      audio.current.volume = volumeRef.current * fadeFactor.current;
      if (remaining > 0) fadeFrame.current = requestAnimationFrame(fade);
      else {
        audio.current.pause();
        fadingOut.current = false;
        fadeFrame.current = null;
      }
    };
    fadeFrame.current = requestAnimationFrame(fade);
  }, [cancelFadeOut]);

  useEffect(() => {
    const previous = document.title;
    document.title = 'Sajak untukmu · Our Love Tracker';
    return () => { document.title = previous; };
  }, []);

  useEffect(() => {
    const player = audio.current;
    if (!playing && !fadingOut.current) player.pause();
  }, [playing]);

  useEffect(() => {
    const player = audio.current;
    return () => { cancelFadeOut(); player.pause(); };
  }, [cancelFadeOut]);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      elapsed.current += now - last;
      last = now;
      setProgress(Math.min(1, elapsed.current / current.duration));
      if (elapsed.current >= current.duration) {
        elapsed.current = 0;
        setProgress(0);
        if (index < lines.length - 1) setIndex(i => i + 1);
        else { fadeOutMusic(); setPlaying(false); setFinished(true); }
      }
    }, 80);
    return () => window.clearInterval(timer);
  }, [playing, index, current.duration, fadeOutMusic]);

  useEffect(() => {
    const onHidden = () => {
      if (document.hidden) {
        cancelFadeOut();
        audio.current.pause();
        setPlaying(false);
      }
    };
    document.addEventListener('visibilitychange', onHidden);
    return () => document.removeEventListener('visibilitychange', onHidden);
  }, [cancelFadeOut]);

  const playAudio = () => {
    cancelFadeOut();
    audio.current.play().then(() => setAudioError(false)).catch(() => setAudioError(true));
  };
  const start = () => {
    setStarted(true);
    setPlaying(true);
    playAudio();
  };
  const move = (next) => {
    cancelFadeOut();
    elapsed.current = 0;
    setProgress(0);
    setFinished(false);
    setIndex(Math.max(0, Math.min(lines.length - 1, next)));
  };
  const restart = () => {
    move(0);
    audio.current.currentTime = 0;
    start();
  };
  const toggle = () => {
    if (finished) restart();
    else if (playing) setPlaying(false);
    else start();
  };
  const overall = (lines.slice(0, index).reduce((sum, line) => sum + line.duration, 0) + progress * current.duration) / totalDuration;

  return (
    <div className={`sajak-page ${playing ? 'is-playing' : 'is-paused'}`}>
      <audio ref={audio} src={music} loop muted={muted} preload="none" onError={() => setAudioError(true)} />
      <div className="sajak-atmosphere" aria-hidden="true">
        <div className="sajak-glow glow-one" /><div className="sajak-glow glow-two" />
        {Array.from({ length: 12 }, (_, i) => <i key={i} className="sajak-petal" style={{ '--i': i }} />)}
      </div>
      <header className="sajak-header">
        <a href="#" className="sajak-back"><ArrowLeft size={17} /> Kembali ke OLT</a>
        <span className="sajak-brand"><Heart size={16} /> <span>Our Love Tracker</span></span>
      </header>

      <main className="sajak-main">
        <div className="sajak-eyebrow"><span /> SEBUAH SAJAK UNTUKMU <span /></div>
        {!started ? (
          <section className="sajak-intro">
            <div className="sajak-seal"><Heart size={30} strokeWidth={1.2} /></div>
            <p className="sajak-dedication">Untuk Ica, Aku persembahkan sebuah sajak pertama yang pernah aku buat</p>
            <h1>Setelah<br /><em>bersamamu.</em></h1>
            <p className="sajak-description">Ada rasa yang lebih mudah ditulis daripada diucapkan.<br />Izinkan aku menyampaikannya, satu kalimat setiap waktu.</p>
            <button className="sajak-primary" onClick={start}><Play size={17} fill="currentColor" /> Mulai membaca <ArrowRight size={17} /></button>
          </section>
        ) : (
          <section className="sajak-reading" aria-label="Pembacaan sajak">
            <div className="sajak-chapter"><span>{String(current.chapter + 1).padStart(2, '0')}</span> / {chapters[current.chapter]}</div>
            <div className="sajak-stage" aria-live="polite" aria-atomic="true">
              <div className="sajak-sentence" key={index}>
                <span className="sajak-quote" aria-hidden="true">“</span>
                <p className={current.text.length > 200 ? 'sajak-long' : ''}>
                  {current.text.split(/\s+/).map((word, i) => <span className="sajak-word" key={i} style={{ '--delay': `${Math.min(i * 42, 1600)}ms` }}>{word}{' '}</span>)}
                </p>
                <div className="sajak-flourish" aria-hidden="true"><span /><Heart size={14} /><span /></div>
              </div>
            </div>
            <div className="sajak-reading-footer">
              <p className="sajak-status">Untuk Annisa Nurul Safitri seorang</p>
              <div className="sajak-progress" role="progressbar" aria-label="Progres sajak" aria-valuemin={0} aria-valuemax={lines.length} aria-valuenow={finished ? lines.length : index + 1}><span style={{ width: `${finished ? 100 : overall * 100}%` }} /></div>
              <div className="sajak-position"><span>{chapters[current.chapter]}</span><span>{String(index + 1).padStart(2, '0')} / {lines.length} kalimat</span></div>
              <div className="sajak-controls">
                <button onClick={restart} aria-label="Ulangi dari awal" title="Ulangi dari awal"><RotateCcw size={18} /></button>
                <button onClick={() => move(index - 1)} disabled={index === 0} aria-label="Kalimat sebelumnya"><SkipBack size={20} /></button>
                <button className="sajak-play" onClick={toggle} aria-label={finished ? 'Putar ulang sajak' : playing ? 'Jeda sajak' : 'Lanjutkan sajak'}>{playing ? <Pause size={23} fill="currentColor" /> : <Play size={23} fill="currentColor" />}</button>
                <button onClick={() => move(index + 1)} disabled={index === lines.length - 1} aria-label="Kalimat berikutnya"><SkipForward size={20} /></button>
                <button onClick={() => setMuted(v => !v)} aria-label={muted ? 'Aktifkan musik' : 'Bisukan musik'}>{muted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
              </div>
            </div>
          </section>
        )}
      </main>
      <footer className="sajak-footer">
        <span><BookOpen size={14} /> Ricky & Annisa</span>
        <div className="sajak-audio"><Music2 size={14} /><span>Love Me · Yiruma</span>{started && <input aria-label="Volume musik" type="range" min="0" max="1" step="0.05" value={volume} onChange={e => { const value = Number(e.target.value); setVolume(value); volumeRef.current = value; audio.current.volume = value * fadeFactor.current; }} />}</div>
      </footer>
      {audioError && <div className="sajak-error" role="status">Musik belum dapat diputar. Kamu tetap bisa membaca. <button onClick={playAudio}>Coba musik lagi</button></div>}
    </div>
  );
}
