import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, ChevronRight, Disc3, Folder, Heart, Home, Music2, Pause, Play, Repeat, RotateCcw, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import audioUrl from '../../../ref/MSProject/Melukis Senja (Cover).mp3';
import lrc from '../../../ref/MSProject/Melukis Senja (Cover).lrc?raw';
import { parseLRC, getCurrentLyricIndex, formatTime } from '../Visualizer/utils/lrcParser';
import './love-library.css';

const lyrics = parseLRC(lrc);
const songRoute = '#/love/musik/melukis-senja';

function Sunset({ small = false }) {
  return <div className={`love-sunset ${small ? 'is-small' : ''}`} aria-hidden="true">
    <div className="sunset-halo" /><div className="sunset-orbit" /><div className="sunset-sun" />
    <div className="sunset-hill hill-back" /><div className="sunset-hill hill-front" />
    <div className="sunset-water" />
    {Array.from({ length: 18 }, (_, i) => <i className="sunset-star" key={i} style={{ '--i': i, left: `${(i * 37 + 9) % 100}%`, top: `${(i * 19 + 5) % 75}%` }} />)}
  </div>;
}

// One audio element survives navigation within the library; its clock drives all lyrics.
export default function LoveLibrary({ route }) {
  const audio = useRef(null);
  const canvas = useRef(null);
  const graph = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [muted, setMuted] = useState(false);
  const [loop, setLoop] = useState(false);
  const [error, setError] = useState('');
  const isSong = route === songRoute;
  const folder = route === '#/love/sajak' ? 'Sajak' : route === '#/love/musik' ? 'Musik' : null;
  const index = getCurrentLyricIndex(lyrics, time);
  const current = lyrics[index];
  const next = lyrics[index + 1];
  // Long gaps in this recording are instrumental passages, not sustained lyric lines.
  const instrumental = current && (next?.time ?? duration) - current.time > 18 && time - current.time > 9;
  const ended = duration > 0 && time >= duration;
  const lineText = ended ? 'Untukmu, selalu.' : instrumental ? 'Biarkan senja bercerita…' : current?.text ?? 'Sebuah lagu, untuk menemanimu.';

  useEffect(() => {
    const previous = document.title;
    document.title = `${isSong ? 'Melukis Senja (Cover)' : 'Love you sayangg'} · Our Love Tracker`;
    return () => { document.title = previous; };
  }, [isSong]);

  useEffect(() => {
    const player = audio.current;
    const syncDuration = () => {
      if (Number.isFinite(player.duration)) setDuration(player.duration);
    };
    syncDuration();
    player.addEventListener('loadedmetadata', syncDuration);
    player.addEventListener('durationchange', syncDuration);
    player.addEventListener('canplay', syncDuration);
    return () => {
      player.removeEventListener('loadedmetadata', syncDuration);
      player.removeEventListener('durationchange', syncDuration);
      player.removeEventListener('canplay', syncDuration);
      player.pause();
      const context = graph.current?.context;
      if (context && context.state !== 'closed') void context.close();
      graph.current = null;
    };
  }, []);

  useEffect(() => {
    if (!playing) return;
    let frame;
    const tick = () => {
      setTime(audio.current.currentTime);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  useEffect(() => {
    const element = canvas.current;
    const context = element.getContext('2d');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame;
    const bins = new Uint8Array(128);
    const draw = () => {
      const width = element.clientWidth;
      const height = element.clientHeight;
      const ratio = window.devicePixelRatio || 1;
      if (element.width !== Math.round(width * ratio) || element.height !== Math.round(height * ratio)) {
        element.width = Math.round(width * ratio);
        element.height = Math.round(height * ratio);
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      if (graph.current && playing) graph.current.analyser.getByteFrequencyData(bins);
      else bins.fill(0);
      const gradient = context.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, '#f9a8d4'); gradient.addColorStop(0.5, '#db2777'); gradient.addColorStop(1, '#a78bfa');
      context.fillStyle = gradient;
      for (let i = 0; i < 64; i++) {
        const amplitude = reducedMotion.matches ? 4 : 3 + (bins[i * 2] / 255) * (height - 5);
        context.beginPath();
        context.roundRect(i * width / 64, (height - amplitude) / 2, Math.max(1, width / 64 - 3), amplitude, 2);
        context.fill();
      }
      if (playing && !reducedMotion.matches) frame = requestAnimationFrame(draw);
    };
    draw();
    const resize = () => { cancelAnimationFrame(frame); draw(); };
    window.addEventListener('resize', resize);
    reducedMotion.addEventListener('change', resize);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize); reducedMotion.removeEventListener('change', resize); };
  }, [playing]);

  const play = async () => {
    const player = audio.current;
    try {
      // Enhancement only: playback still works when Web Audio is unavailable.
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!graph.current && AudioContextClass) {
        const context = new AudioContextClass();
        const analyser = context.createAnalyser();
        analyser.fftSize = 256;
        const source = context.createMediaElementSource(player);
        source.connect(analyser);
        analyser.connect(context.destination);
        graph.current = { context, analyser };
      }
      if (graph.current?.context.state === 'suspended') await graph.current.context.resume();
    } catch { /* The native audio player remains available. */ }
    try {
      player.volume = volume;
      await player.play();
      setError('');
    } catch { setError('Audio belum dapat diputar. Tekan putar untuk mencoba lagi.'); }
  };
  const toggle = () => playing ? audio.current.pause() : void play();
  const seek = value => {
    if (!Number.isFinite(audio.current.duration)) return;
    const target = Math.max(0, Math.min(audio.current.duration, value));
    audio.current.currentTime = target;
    setTime(target);
  };
  const openSong = () => { window.location.hash = songRoute; void play(); };

  return <div className={`love-page ${playing ? 'is-playing' : 'is-paused'} ${isSong ? 'is-immersive' : ''}`}>
    <audio ref={audio} src={audioUrl} preload="metadata" muted={muted} loop={loop}
      onLoadedMetadata={e => setDuration(e.currentTarget.duration)}
      onDurationChange={e => { if (Number.isFinite(e.currentTarget.duration)) setDuration(e.currentTarget.duration); }}
      onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
      onTimeUpdate={e => { setTime(e.currentTarget.currentTime); if (Number.isFinite(e.currentTarget.duration)) setDuration(e.currentTarget.duration); }}
      onEnded={() => setPlaying(false)} onError={() => { setPlaying(false); setError('Lagu gagal dimuat. Coba muat ulang audio.'); }} />
    <header className="love-header"><a href={isSong ? '#/love/musik' : '#'}><ArrowLeft size={16} />{isSong ? 'Kembali ke Musik' : 'Kembali ke OLT'}</a><span><Heart size={15} /> Our Love Tracker</span></header>
    <div className="love-shell">
      <aside className="love-sidebar">
        <a className="love-monogram" href="#/love" aria-label="Love you sayangg"><Heart size={25} strokeWidth={1.3} /></a>
        <nav aria-label="Library"><a href="#/love" className={route === '#/love' ? 'active' : ''} aria-label="Beranda library" title="Beranda"><Home size={20} /></a><a href="#/love/sajak" className={folder === 'Sajak' ? 'active' : ''} aria-label="Library Sajak" title="Sajak"><BookOpen size={20} /></a><a href="#/love/musik" className={folder === 'Musik' || isSong ? 'active' : ''} aria-label="Library Musik" title="Musik"><Music2 size={20} /></a></nav>
        <span className="love-sidebar-note">R & A</span>
      </aside>
      <main className="love-content">
        {isSong ? <section className="love-listening" aria-label="Visualizer Melukis Senja">
          <Sunset />
          <div className="love-track-heading"><span className="love-eyebrow">MUSIK UNTUKMU / 01</span><h1>Melukis Senja <em>(Cover)</em></h1><p>Ricky P.H. <span>—</span> Untuk Annisa</p></div>
          <div className="love-lyric-stage">
            <p className="love-lyric-previous">{!instrumental && !ended ? lyrics[index - 1]?.text : '♪'}</p>
            <div className="love-current-line" key={`${index}-${!!instrumental}-${ended}`}>
              <span className="love-lyric-caption">{ended ? 'DENGAN SEGENAP RASA' : instrumental ? 'INTERLUDE' : index < 0 ? 'UNTUK ICA' : 'MELUKIS SENJA'}</span>
              <p>{lineText.split(/\s+/).map((word, i) => <span key={i} style={{ '--delay': `${Math.min(i * 65, 650)}ms` }}>{word}{' '}</span>)}</p>
              <div className="love-line-ornament"><i /><Heart size={14} /><i /></div>
            </div>
            <button className="love-lyric-next" onClick={() => next && seek(next.time)} disabled={!next || ended} aria-label="Lompat ke lirik berikutnya">{ended ? 'Terima kasih sudah mendengarkan, sayang.' : next?.text || 'Sampai nada terakhir, aku di sini.'}</button>
          </div>
          <div className="love-listening-note"><span>{playing ? 'Sedang menemanimu' : ended ? 'Selesai diputar' : 'Tekan putar, nikmati senjanya'}</span><span>{Math.max(0, index + 1).toString().padStart(2, '0')} / {lyrics.length} bait</span></div>
        </section> : <>
          <div className="love-breadcrumb"><Heart size={14} /><a href="#/love">Ruang kecil kita</a>{folder && <><ChevronRight size={13} /><span>{folder}</span></>}<span className="love-for-you">Dibuat dengan cinta, untuk Ica</span></div>
          <section className="love-hero">
            <div className="love-hero-copy"><span className="love-eyebrow">ADA BANYAK CARA MENGATAKAN CINTA</span><h1>Love you<br /><em>sayangg.</em></h1><p>Lewat kata, lewat nada.<br />Semua yang ingin kusampaikan, ada di sini.</p><button className="love-primary" onClick={openSong}><Play size={15} fill="currentColor" /> Dengarkan untukmu <ArrowRight size={16} /></button><span className="love-handwritten">dari aku, untuk kamu ♡</span></div>
            <button className="love-feature-art" onClick={openSong} aria-label="Putar Melukis Senja (Cover)"><Sunset /><span className="love-art-top">A LITTLE SONG FOR YOU <Heart size={15} /></span><div className="love-art-title"><span>01 / RICKY P.H.</span><h2>Melukis<br /><em>Senja.</em></h2><p>A cover, a feeling, a little piece of me.</p></div><span className="love-art-play"><Play size={20} fill="currentColor" /></span></button>
          </section>
          <section className="love-collections"><div className="love-section-heading"><div><span className="love-eyebrow">TERSIMPAN UNTUKMU</span><h2>{folder ? `Library ${folder}` : 'Koleksi rasa'}</h2></div><span>{folder ? '01 karya' : '02 library'}</span></div>
            {!folder ? <div className="love-folders"><a className="love-folder folder-poem" href="#/love/sajak"><div className="love-folder-icon"><BookOpen size={29} strokeWidth={1.2} /></div><div><span className="love-eyebrow">01 / KATA</span><h3>Sajak</h3><p>Rasa yang menemukan kata.</p><span className="love-folder-count"><Folder size={13} /> 1 sajak</span></div><ArrowRight size={20} /></a><a className="love-folder folder-music" href="#/love/musik"><div className="love-folder-icon"><Music2 size={29} strokeWidth={1.2} /></div><div><span className="love-eyebrow">02 / NADA</span><h3>Musik</h3><p>Rasa yang menjelma suara.</p><span className="love-folder-count"><Folder size={13} /> 1 lagu</span></div><ArrowRight size={20} /></a></div>
              : folder === 'Sajak' ? <a className="love-library-item" href="#/sajak"><div className="love-item-poem"><BookOpen size={27} /></div><div><span className="love-eyebrow">SAJAK UNTUKMU</span><h3>Setelah bersamamu.</h3><p>Sebuah sajak dari Ricky, untuk Ica.</p></div><ArrowRight size={21} /></a>
              : <button className="love-library-item" onClick={openSong}><div className="love-item-cover"><Sunset small /></div><div><span className="love-eyebrow">LYRICS VISUALIZER</span><h3>Melukis Senja (Cover)</h3><p>Ricky P.H. · {duration ? formatTime(duration) : '4:11'}</p></div><Play size={21} /></button>}
          </section>
          <p className="love-library-footer">Tidak perlu banyak kata. Cukup kamu, dan waktu sebentar.</p>
        </>}
      </main>
      <footer className="love-player" aria-label="Pemutar musik">
        <a className="love-now-playing" href={songRoute}><div className="love-mini-cover"><Sunset small /></div><div><strong>Melukis Senja <span>(Cover)</span></strong><small>Ricky P.H. <span>· Untukmu</span></small></div></a>
        <div className="love-transport"><button onClick={() => seek(time - 10)} aria-label="Mundur 10 detik" title="Mundur 10 detik"><SkipBack size={18} /></button><button className="love-play" onClick={toggle} aria-label={playing ? 'Jeda lagu' : 'Putar lagu'}>{playing ? <Pause size={21} fill="currentColor" /> : <Play size={21} fill="currentColor" />}</button><button onClick={() => seek(time + 10)} aria-label="Maju 10 detik" title="Maju 10 detik"><SkipForward size={18} /></button></div>
        <div className="love-timeline"><canvas ref={canvas} className="love-waveform" aria-hidden="true" /><input type="range" min="0" max={duration || 1} step="0.01" value={Math.min(time, duration || 1)} disabled={!duration} onChange={e => seek(Number(e.target.value))} aria-label="Posisi lagu" aria-valuetext={`${formatTime(time)} dari ${formatTime(duration)}`} style={{ '--progress': `${duration ? time / duration * 100 : 0}%` }} /><div><span>{formatTime(time)}</span><span>{formatTime(duration)}</span></div></div>
        <div className="love-player-options"><button onClick={() => seek(0)} aria-label="Ulangi dari awal" title="Ulangi dari awal"><RotateCcw size={16} /></button><button onClick={() => setLoop(v => !v)} aria-label="Ulang otomatis" aria-pressed={loop} title="Ulang otomatis"><Repeat size={17} /></button><button onClick={() => setMuted(v => !v)} aria-label={muted ? 'Aktifkan suara' : 'Bisukan suara'}>{muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}</button><input type="range" min="0" max="1" step="0.01" value={volume} aria-label="Volume lagu" onChange={e => { const value = Number(e.target.value); setVolume(value); audio.current.volume = value; setMuted(false); }} /></div>
      </footer>
    </div>
    {error && <div className="love-error" role="alert">{error}<button onClick={() => { audio.current.load(); void play(); }}>Coba lagi</button></div>}
    <div className="love-bottom-note"><span><Heart size={12} /> Ricky & Annisa</span><span><Disc3 size={12} /> Kata dan nada, untuk orang yang sama.</span></div>
  </div>;
}
