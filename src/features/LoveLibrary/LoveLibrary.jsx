import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { ArrowLeft, ArrowRight, BookOpen, ChevronRight, Disc3, Folder, Heart, Home, Music2, Pause, Play, Repeat, RotateCcw, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import senjaAudio from '../../../ref/MSProject/Melukis Senja (Cover).mp3';
import senjaLrc from '../../../ref/MSProject/Melukis Senja (Cover).lrc?raw';
import jatuhCintaAudio from '../../../ref/AYJCProject/Aku yang Jatuh Cinta (Cover).mp3';
import jatuhCintaLrc from '../../../ref/AYJCProject/Aku yang Jatuh Cinta (Cover).lrc?raw';
import { parseLRC, getCurrentLyricIndex, formatTime } from '../Visualizer/utils/lrcParser';
import { AlbumCover, CallingCover, Sunset } from './CoverArt';
import './love-library.css';

const albumRoute = '#/love/musik/masih-sayang-ica';
const songs = [
  { id: 'melukis-senja', title: 'Melukis Senja', route: '#/love/musik/melukis-senja', audio: senjaAudio, lyrics: parseLRC(senjaLrc), durationLabel: '4:11', label: 'MELUKIS SENJA', opening: 'Sebuah lagu, untuk menemanimu.', interlude: 'Biarkan senja bercerita…', ending: 'Untukmu, selalu.', Cover: Sunset },
  { id: 'aku-yang-jatuh-cinta', title: 'Aku yang Jatuh Cinta', route: '#/love/musik/aku-yang-jatuh-cinta', audio: jatuhCintaAudio, lyrics: parseLRC(jatuhCintaLrc), durationLabel: '3:14', label: 'AKU YANG JATUH CINTA', opening: 'Ada rasa yang ingin kudengar sampai padamu.', interlude: 'Semoga suaraku sampai kepadamu…', ending: 'Aku yang jatuh cinta.', Cover: CallingCover },
];

function MusicCollection({ isAlbum, onSelect, onPlayAlbum }) {
  return <div className="love-music-collection">
    <div className="love-breadcrumb"><Heart size={14} /><a href="#/love">Ruang kecil kita</a><ChevronRight size={13}/><a href="#/love/musik">Musik</a>{isAlbum && <><ChevronRight size={13}/><span>Masih Sayang Ica</span></>}<span className="love-for-you">Dibuat dengan cinta, untuk Ica</span></div>
    {isAlbum ? <section className="love-album-detail"><div className="love-album-detail-art"><AlbumCover /></div><div className="love-album-detail-copy"><span className="love-eyebrow">ALBUM / 02 SINGLE / RICKY P.H.</span><h1>Masih<br/><em>Sayang Ica.</em></h1><p>Dua lagu, satu hati yang masih memilih kamu. Dengarkan dari awal, atau pilih cerita yang ingin kau dengar lebih dulu.</p><button className="love-primary" onClick={onPlayAlbum}><Play size={15} fill="currentColor"/> Putar album <ArrowRight size={16}/></button></div></section>
      : <section className="love-music-intro"><div><span className="love-eyebrow">KATA YANG MENJADI NADA</span><h1>Untukmu,<br/><em>aku bernyanyi.</em></h1><p>Satu album, dua cerita. Semuanya masih tentang Ica.</p></div><span className="love-music-note">♡ &nbsp; Ricky & Annisa</span></section>}
    {!isAlbum && <section className="love-album-section"><div className="love-section-heading"><div><span className="love-eyebrow">KUMPULAN SINGLE</span><h2>Album</h2></div><span>01 album</span></div><a className="love-album-card" href={albumRoute}><div className="love-album-card-art"><AlbumCover /></div><div className="love-album-card-copy"><span className="love-eyebrow">01 / SEBUAH KISAH</span><h3>Masih Sayang Ica</h3><p>Melukis Senja · Aku yang Jatuh Cinta</p><span className="love-album-count"><Disc3 size={14}/> 2 single <ArrowRight size={16}/></span></div></a></section>}
    <section className="love-singles-section"><div className="love-section-heading"><div><span className="love-eyebrow">{isAlbum ? 'DI DALAM ALBUM' : 'DENGARKAN SATU PER SATU'}</span><h2>Single</h2></div><span>02 lagu</span></div><div className="love-singles-list">{songs.map((song, i) => <button className="love-single-card" onClick={() => onSelect(song)} key={song.id} aria-label={`Putar ${song.title} (Cover)`}><span className="love-single-number">{String(i + 1).padStart(2, '0')}</span><span className="love-single-art"><song.Cover small/></span><span className="love-single-meta"><strong>{song.title} <em>(Cover)</em></strong><small>Ricky P.H. · {song.durationLabel}</small></span><span className="love-single-play"><Play size={17} fill="currentColor"/></span></button>)}</div></section>
    <p className="love-library-footer">Semoga sampai kepadamu, di mana pun kamu berada.</p>
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
  const [albumQueue, setAlbumQueue] = useState(false);
  const [error, setError] = useState('');
  const [selectedSongId, setSelectedSongId] = useState(() => songs.find(song => song.route === route)?.id ?? songs[0].id);
  const selectedSongIdRef = useRef(selectedSongId);
  const selectedSong = songs.find(song => song.id === selectedSongId) ?? songs[0];
  const { lyrics } = selectedSong;
  const isSong = songs.some(song => song.route === route);
  const isAlbum = route === albumRoute;
  const isMusic = route === '#/love/musik';
  const folder = route === '#/love/sajak' ? 'Sajak' : isMusic || isAlbum ? 'Musik' : null;
  const index = getCurrentLyricIndex(lyrics, time);
  const current = lyrics[index];
  const next = lyrics[index + 1];
  // Long gaps in this recording are instrumental passages, not sustained lyric lines.
  const instrumental = current && (next?.time ?? duration) - current.time > 18 && time - current.time > 9;
  const ended = duration > 0 && time >= duration;
  const lineText = ended ? selectedSong.ending : instrumental ? selectedSong.interlude : current?.text ?? selectedSong.opening;

  useEffect(() => {
    const previous = document.title;
    document.title = `${isSong ? `${selectedSong.title} (Cover)` : isAlbum ? 'Masih Sayang Ica' : 'Love you sayangg'} · Our Love Tracker`;
    return () => { document.title = previous; };
  }, [isSong, isAlbum, selectedSong.title]);

  useEffect(() => {
    const onHashChange = () => {
      const song = songs.find(item => item.route === window.location.hash);
      if (song && song.id !== selectedSongIdRef.current) {
        const player = audio.current;
        player.pause();
        selectedSongIdRef.current = song.id;
        setSelectedSongId(song.id);
        setTime(0);
        setDuration(0);
        setAlbumQueue(false);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

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
    player.volume = volume;
    let playback;
    try { playback = player.play(); }
    catch { setError('Audio belum dapat diputar. Tekan putar untuk mencoba lagi.'); return; }
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
      if (graph.current?.context.state === 'suspended') void graph.current.context.resume();
    } catch { /* The native audio player remains available. */ }
    try { await playback; setError(''); }
    catch { setError('Audio belum dapat diputar. Tekan putar untuk mencoba lagi.'); }
  };
  const toggle = () => playing ? audio.current.pause() : void play();
  const seek = value => {
    if (!Number.isFinite(audio.current.duration)) return;
    const target = Math.max(0, Math.min(audio.current.duration, value));
    audio.current.currentTime = target;
    setTime(target);
  };
  const switchSong = (song, keepAlbum = false) => {
    const player = audio.current;
    player.pause();
    if (selectedSongId !== song.id) {
      selectedSongIdRef.current = song.id;
      flushSync(() => setSelectedSongId(song.id));
      setDuration(0);
    }
    player.currentTime = 0;
    setTime(0);
    setError('');
    if (!keepAlbum) setAlbumQueue(false);
    window.location.hash = song.route;
    void play();
  };
  const openSong = () => switchSong(songs[0]);
  const playAlbum = () => { setAlbumQueue(true); switchSong(songs[0], true); };
  const onSongEnded = () => {
    setPlaying(false);
    if (albumQueue && selectedSongId === songs[0].id) switchSong(songs[1], true);
    else setAlbumQueue(false);
  };

  return <div className={`love-page ${playing ? 'is-playing' : 'is-paused'} ${isSong ? 'is-immersive' : ''}`}>
    <audio ref={audio} src={selectedSong.audio} preload="metadata" muted={muted} loop={loop}
      onEmptied={() => { setTime(0); setDuration(0); setPlaying(false); }}
      onLoadedMetadata={e => setDuration(e.currentTarget.duration)}
      onDurationChange={e => { if (Number.isFinite(e.currentTarget.duration)) setDuration(e.currentTarget.duration); }}
      onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
      onTimeUpdate={e => { setTime(e.currentTarget.currentTime); if (Number.isFinite(e.currentTarget.duration)) setDuration(e.currentTarget.duration); }}
      onEnded={onSongEnded} onError={() => { setPlaying(false); setError('Lagu gagal dimuat. Coba muat ulang audio.'); }} />
    <header className="love-header"><a href={isSong ? albumRoute : isAlbum ? '#/love/musik' : '#'}><ArrowLeft size={16} />{isSong ? 'Kembali ke Album' : isAlbum ? 'Kembali ke Musik' : 'Kembali ke OLT'}</a><span><Heart size={15} /> Our Love Tracker</span></header>
    <div className="love-shell">
      <aside className="love-sidebar">
        <a className="love-monogram" href="#/love" aria-label="Love you sayangg"><Heart size={25} strokeWidth={1.3} /></a>
        <nav aria-label="Library"><a href="#/love" className={route === '#/love' ? 'active' : ''} aria-label="Beranda library" title="Beranda"><Home size={20} /></a><a href="#/love/sajak" className={folder === 'Sajak' ? 'active' : ''} aria-label="Library Sajak" title="Sajak"><BookOpen size={20} /></a><a href="#/love/musik" className={folder === 'Musik' || isSong ? 'active' : ''} aria-label="Library Musik" title="Musik"><Music2 size={20} /></a></nav>
        <span className="love-sidebar-note">R & A</span>
      </aside>
      <main className="love-content">
        {isSong ? <section className={`love-listening ${selectedSong.id === songs[1].id ? 'love-listening-calling' : ''}`} aria-label={`Visualizer ${selectedSong.title}`}>
          <selectedSong.Cover />
          <div className="love-track-heading"><span className="love-eyebrow">MASIH SAYANG ICA / {selectedSong.id === songs[0].id ? '01' : '02'}</span><h1>{selectedSong.title} <em>(Cover)</em></h1><p>Ricky P.H. <span>—</span> Untuk Annisa</p></div>
          <div className="love-lyric-stage">
            <p className="love-lyric-previous">{!instrumental && !ended ? lyrics[index - 1]?.text : '♪'}</p>
            <div className="love-current-line" key={`${index}-${!!instrumental}-${ended}`}>
              <span className="love-lyric-caption">{ended ? 'DENGAN SEGENAP RASA' : instrumental ? 'INTERLUDE' : index < 0 ? 'UNTUK ICA' : selectedSong.label}</span>
              <p>{lineText.split(/\s+/).map((word, i) => <span key={i} style={{ '--delay': `${Math.min(i * 65, 650)}ms` }}>{word}{' '}</span>)}</p>
              <div className="love-line-ornament"><i /><Heart size={14} /><i /></div>
            </div>
            <button className="love-lyric-next" onClick={() => next && seek(next.time)} disabled={!next || ended} aria-label="Lompat ke lirik berikutnya">{ended ? 'Terima kasih sudah mendengarkan, sayang.' : next?.text || 'Sampai nada terakhir, aku di sini.'}</button>
          </div>
          <div className="love-listening-note"><span>{playing ? 'Sedang menemanimu' : ended ? 'Selesai diputar' : 'Tekan putar, nikmati senjanya'}</span><span>{Math.max(0, index + 1).toString().padStart(2, '0')} / {lyrics.length} bait</span></div>
        </section> : isMusic || isAlbum ? <MusicCollection isAlbum={isAlbum} onSelect={song => switchSong(song)} onPlayAlbum={playAlbum}/> : <>
          <div className="love-breadcrumb"><Heart size={14} /><a href="#/love">Ruang kecil kita</a>{folder && <><ChevronRight size={13} /><span>{folder}</span></>}<span className="love-for-you">Dibuat dengan cinta, untuk Ica</span></div>
          <section className="love-hero">
            <div className="love-hero-copy"><span className="love-eyebrow">ADA BANYAK CARA MENGATAKAN CINTA</span><h1>Love you<br /><em>sayangg.</em></h1><p>Lewat kata, lewat nada.<br />Semua yang ingin kusampaikan, ada di sini.</p><button className="love-primary" onClick={openSong}><Play size={15} fill="currentColor" /> Dengarkan untukmu <ArrowRight size={16} /></button><span className="love-handwritten">dari aku, untuk kamu ♡</span></div>
            <button className="love-feature-art" onClick={openSong} aria-label="Putar Melukis Senja (Cover)"><Sunset /><span className="love-art-top">A LITTLE SONG FOR YOU <Heart size={15} /></span><div className="love-art-title"><span>01 / RICKY P.H.</span><h2>Melukis<br /><em>Senja.</em></h2><p>A cover, a feeling, a little piece of me.</p></div><span className="love-art-play"><Play size={20} fill="currentColor" /></span></button>
          </section>
          <section className="love-collections"><div className="love-section-heading"><div><span className="love-eyebrow">TERSIMPAN UNTUKMU</span><h2>{folder ? `Library ${folder}` : 'Koleksi rasa'}</h2></div><span>{folder ? '01 karya' : '02 library'}</span></div>
            {!folder ? <div className="love-folders"><a className="love-folder folder-poem" href="#/love/sajak"><div className="love-folder-icon"><BookOpen size={29} strokeWidth={1.2} /></div><div><span className="love-eyebrow">01 / KATA</span><h3>Sajak</h3><p>Rasa yang menemukan kata.</p><span className="love-folder-count"><Folder size={13} /> 1 sajak</span></div><ArrowRight size={20} /></a><a className="love-folder folder-music" href="#/love/musik"><div className="love-folder-icon"><Music2 size={29} strokeWidth={1.2} /></div><div><span className="love-eyebrow">02 / NADA</span><h3>Musik</h3><p>Rasa yang menjelma suara.</p><span className="love-folder-count"><Folder size={13} /> 1 album · 2 single</span></div><ArrowRight size={20} /></a></div>
              : folder === 'Sajak' ? <a className="love-library-item" href="#/sajak"><div className="love-item-poem"><BookOpen size={27} /></div><div><span className="love-eyebrow">SAJAK UNTUKMU</span><h3>Setelah bersamamu.</h3><p>Sebuah sajak dari Ricky, untuk Ica.</p></div><ArrowRight size={21} /></a>
              : null}
          </section>
          <p className="love-library-footer">Tidak perlu banyak kata. Cukup kamu, dan waktu sebentar.</p>
        </>}
      </main>
      <footer className="love-player" aria-label="Pemutar musik">
        <a className="love-now-playing" href={selectedSong.route}><div className="love-mini-cover"><selectedSong.Cover small /></div><div><strong>{selectedSong.title} <span>(Cover)</span></strong><small>Ricky P.H. <span>· Untukmu</span></small></div></a>
        <div className="love-transport"><button onClick={() => seek(time - 10)} aria-label="Mundur 10 detik" title="Mundur 10 detik"><SkipBack size={18} /></button><button className="love-play" onClick={toggle} aria-label={playing ? 'Jeda lagu' : 'Putar lagu'}>{playing ? <Pause size={21} fill="currentColor" /> : <Play size={21} fill="currentColor" />}</button><button onClick={() => seek(time + 10)} aria-label="Maju 10 detik" title="Maju 10 detik"><SkipForward size={18} /></button></div>
        <div className="love-timeline"><canvas ref={canvas} className="love-waveform" aria-hidden="true" /><input type="range" min="0" max={duration || 1} step="0.01" value={Math.min(time, duration || 1)} disabled={!duration} onChange={e => seek(Number(e.target.value))} aria-label="Posisi lagu" aria-valuetext={`${formatTime(time)} dari ${formatTime(duration)}`} style={{ '--progress': `${duration ? time / duration * 100 : 0}%` }} /><div><span>{formatTime(time)}</span><span>{formatTime(duration)}</span></div></div>
        <div className="love-player-options"><button onClick={() => seek(0)} aria-label="Ulangi dari awal" title="Ulangi dari awal"><RotateCcw size={16} /></button><button onClick={() => setLoop(v => !v)} aria-label="Ulang otomatis" aria-pressed={loop} title="Ulang otomatis"><Repeat size={17} /></button><button onClick={() => setMuted(v => !v)} aria-label={muted ? 'Aktifkan suara' : 'Bisukan suara'}>{muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}</button><input type="range" min="0" max="1" step="0.01" value={volume} aria-label="Volume lagu" onChange={e => { const value = Number(e.target.value); setVolume(value); audio.current.volume = value; setMuted(false); }} /></div>
      </footer>
    </div>
    {error && <div className="love-error" role="alert">{error}<button onClick={() => { audio.current.load(); void play(); }}>Coba lagi</button></div>}
    <div className="love-bottom-note"><span><Heart size={12} /> Ricky & Annisa</span><span><Disc3 size={12} /> Kata dan nada, untuk orang yang sama.</span></div>
  </div>;
}
