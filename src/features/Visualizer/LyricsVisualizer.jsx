import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Library, Cloud, CloudOff, Loader2 } from 'lucide-react';
import FileUploader from './components/FileUploader';
import LyricsDisplay from './components/LyricsDisplay';
import PlayerControls from './components/PlayerControls';
import AudioVisualizer from './components/AudioVisualizer';
import SongLibrary from './components/SongLibrary';
import LoveLetterPopup from './components/LoveLetterPopup';
import { parseLRC, getCurrentLyricIndex } from './utils/lrcParser';
import { uploadSongToCloud, fetchSharedSongs, deleteSongFromCloud } from './utils/supabaseStorage';

const LIBRARY_STORAGE_KEY = 'lyrics_visualizer_library';

const LyricsVisualizer = ({ onBack, coupleId, partnerName }) => {
    // State
    const [audioFile, setAudioFile] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [lrcText, setLrcText] = useState('');
    const [lyrics, setLyrics] = useState([]);
    const [isReady, setIsReady] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
    const [showLibrary, setShowLibrary] = useState(false);
    const [library, setLibrary] = useState([]);
    const [cloudSongs, setCloudSongs] = useState([]);
    const [analyser, setAnalyser] = useState(null);
    const [parseError, setParseError] = useState('');
    const [selectedSong, setSelectedSong] = useState(null); // Track selected song from library
    const [isUploading, setIsUploading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState('');
    const [isLoadingCloud, setIsLoadingCloud] = useState(false);
    const [showLoveLetter, setShowLoveLetter] = useState(true); // Default to true to show love letter on entry

    // Refs
    const audioRef = useRef(null);
    const audioContextRef = useRef(null);
    const sourceRef = useRef(null);

    // Load local library from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(LIBRARY_STORAGE_KEY);
            if (saved) {
                setLibrary(JSON.parse(saved));
            }
        } catch (e) {
            console.error('Failed to load library:', e);
        }
    }, []);

    // Fetch cloud songs on mount
    useEffect(() => {
        if (coupleId) {
            loadCloudSongs();
        }
    }, [coupleId]);

    const loadCloudSongs = async () => {
        if (!coupleId) return;

        setIsLoadingCloud(true);
        const result = await fetchSharedSongs(coupleId);
        if (result.success) {
            setCloudSongs(result.data);
        } else {
            console.error('Failed to load cloud songs:', result.error);
        }
        setIsLoadingCloud(false);
    };

    // Save library to localStorage
    const saveLibrary = useCallback((newLibrary) => {
        setLibrary(newLibrary);
        try {
            localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(newLibrary));
        } catch (e) {
            console.error('Failed to save library:', e);
        }
    }, []);

    // Handle audio file load
    const handleAudioLoad = useCallback((file) => {
        setAudioFile(file);
        const url = URL.createObjectURL(file);
        setAudioUrl(url);
        setParseError('');
        setUploadMessage('');
    }, []);

    // Handle LRC text load
    const handleLrcLoad = useCallback((text) => {
        setLrcText(text);
        const parsed = parseLRC(text);
        setLyrics(parsed);
        setSelectedSong(null); // Clear selected song when new lyrics are loaded
    }, []);

    // Save song to local library
    const saveSongToLibrary = useCallback((songName, lrcContent) => {
        const cleanName = songName.replace(/\.[^/.]+$/, '');
        const existingIndex = library.findIndex(s => s.name === cleanName);

        const songEntry = {
            id: existingIndex >= 0 ? library[existingIndex].id : Date.now(),
            name: cleanName,
            lrcContent,
            lastPlayed: new Date().toISOString(),
            isCloud: false
        };

        let newLibrary;
        if (existingIndex >= 0) {
            newLibrary = [...library];
            newLibrary[existingIndex] = songEntry;
        } else {
            newLibrary = [songEntry, ...library];
        }

        saveLibrary(newLibrary);
    }, [library, saveLibrary]);

    // Start the visualizer
    const handleStart = useCallback(() => {
        console.log('handleStart called', { audioFile, lyricsLength: lyrics.length });
        setParseError('');

        if (!audioFile) {
            setParseError('Please upload an audio file first.');
            return;
        }

        let currentLyrics = lyrics;
        if (lrcText && lyrics.length === 0) {
            console.log('Re-parsing LRC text...');
            const parsed = parseLRC(lrcText);
            setLyrics(parsed);
            currentLyrics = parsed;
        }

        if (currentLyrics.length === 0) {
            if (!lrcText) {
                setParseError('Please upload or paste lyrics in LRC format.');
            } else {
                setParseError('Could not parse lyrics. Please ensure your LRC file has valid timestamps like [00:00.00]');
            }
            return;
        }

        console.log('Starting visualizer with', currentLyrics.length, 'lyrics');
        setIsReady(true);
        saveSongToLibrary(audioFile.name, lrcText);
    }, [audioFile, lyrics, lrcText, saveSongToLibrary]);

    // Load song from library (local or cloud)
    const handleLoadFromLibrary = useCallback((song) => {
        setLrcText(song.lrcContent);
        const parsed = parseLRC(song.lrcContent);
        setLyrics(parsed);
        setSelectedSong(song);
        setShowLibrary(false);
        setParseError('');

        // If it's a cloud song with audio URL, load it directly
        if (song.isCloud && song.audioUrl) {
            setAudioUrl(song.audioUrl);
            setAudioFile({ name: song.name + '.mp3' }); // Fake file object for display
            setIsReady(true);
            // Attempt to auto-play after a short delay to ensure DOM is ready
            setTimeout(() => {
                handlePlayPause();
            }, 100);
        }
    }, []);

    // Delete song from library
    const handleDeleteFromLibrary = useCallback(async (songId, isCloud, audioPath) => {
        if (isCloud) {
            // Delete from cloud
            const result = await deleteSongFromCloud(songId, audioPath);
            if (result.success) {
                setCloudSongs(prev => prev.filter(s => s.id !== songId));
            } else {
                console.error('Failed to delete cloud song:', result.error);
            }
        } else {
            // Delete from local
            const newLibrary = library.filter(s => s.id !== songId);
            saveLibrary(newLibrary);
        }
    }, [library, saveLibrary]);

    // Upload current song to cloud
    const handleUploadToCloud = useCallback(async () => {
        if (!audioFile || !lrcText || !coupleId) {
            setUploadMessage('Cannot sync: missing audio, lyrics, or not logged in');
            return;
        }

        setIsUploading(true);
        setUploadMessage('Uploading to cloud...');

        const songName = audioFile.name.replace(/\.[^/.]+$/, '');
        const result = await uploadSongToCloud(audioFile, lrcText, songName, coupleId, partnerName);

        if (result.success) {
            setUploadMessage('✓ Song synced to cloud!');
            await loadCloudSongs(); // Refresh cloud library
        } else {
            setUploadMessage(`Failed: ${result.error}`);
        }

        setIsUploading(false);
    }, [audioFile, lrcText, coupleId, partnerName]);

    // Initialize Web Audio API
    const initAudioContext = useCallback(() => {
        if (!audioRef.current || audioContextRef.current) return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioContextRef.current = new AudioContext();

            const newAnalyser = audioContextRef.current.createAnalyser();
            newAnalyser.fftSize = 256;
            newAnalyser.smoothingTimeConstant = 0.8;

            sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
            sourceRef.current.connect(newAnalyser);
            newAnalyser.connect(audioContextRef.current.destination);

            setAnalyser(newAnalyser);
        } catch (error) {
            console.error('Failed to initialize Web Audio API:', error);
        }
    }, []);

    // Play/Pause toggle
    const handlePlayPause = useCallback(() => {
        if (!audioRef.current) return;

        if (!audioContextRef.current) {
            initAudioContext();
        }

        if (audioContextRef.current?.state === 'suspended') {
            audioContextRef.current.resume();
        }

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(console.error);
        }
    }, [isPlaying, initAudioContext]);

    // Replay from start
    const handleReplay = useCallback(() => {
        if (!audioRef.current) return;
        audioRef.current.currentTime = 0;
        if (!audioContextRef.current) initAudioContext();
        audioRef.current.play().catch(console.error);
    }, [initAudioContext]);

    // Seek to time
    const handleSeek = useCallback((time) => {
        if (!audioRef.current) return;
        audioRef.current.currentTime = time;
        setCurrentTime(time);
    }, []);

    // Handle lyric click
    const handleLyricClick = useCallback((time) => {
        handleSeek(time);
        if (!isPlaying) handlePlayPause();
    }, [handleSeek, isPlaying, handlePlayPause]);

    // Audio event handlers
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
            setCurrentLyricIndex(getCurrentLyricIndex(lyrics, audio.currentTime));
        };

        const handleLoadedMetadata = () => setDuration(audio.duration);
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
            setCurrentLyricIndex(-1);
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [lyrics]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (audioUrl && !audioUrl.startsWith('http')) {
                URL.revokeObjectURL(audioUrl);
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, [audioUrl]);

    // Back button handler
    const handleBack = () => {
        if (audioRef.current) audioRef.current.pause();
        onBack?.();
    };

    // New song handler
    const handleNewSong = () => {
        if (audioRef.current) audioRef.current.pause();
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        sourceRef.current = null;
        setAnalyser(null);
        setIsReady(false);
        setAudioFile(null);
        setAudioUrl(null);
        setLrcText('');
        setLyrics([]);
        setCurrentTime(0);
        setDuration(0);
        setCurrentLyricIndex(-1);
        setIsPlaying(false);
        setParseError('');
        setSelectedSong(null);
        setUploadMessage('');
    };

    // Combine local and cloud libraries
    const combinedLibrary = [...cloudSongs, ...library.filter(l => !l.isCloud)];

    return (
        <div className="min-h-screen bg-zinc-900 text-white relative overflow-hidden">
            <AudioVisualizer analyser={analyser} isPlaying={isPlaying} />

            <div className="relative z-10 min-h-screen flex flex-col">
                {/* Header */}
                <header className="fixed top-0 left-0 right-0 z-50 p-4 flex items-center justify-between">
                    <button
                        onClick={handleBack}
                        className="flex items-center space-x-2 text-zinc-400 hover:text-white transition-colors bg-zinc-800/50 hover:bg-zinc-700/50 backdrop-blur-sm px-4 py-2 rounded-xl"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back</span>
                    </button>

                    <div className="flex items-center space-x-2">
                        {/* Cloud sync button */}
                        {isReady && coupleId && (
                            <button
                                onClick={handleUploadToCloud}
                                disabled={isUploading}
                                className="flex items-center space-x-2 text-zinc-400 hover:text-white transition-colors bg-zinc-800/50 hover:bg-zinc-700/50 backdrop-blur-sm px-4 py-2 rounded-xl text-sm disabled:opacity-50"
                                title="Sync to cloud for your partner"
                            >
                                {isUploading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Cloud className="w-4 h-4" />
                                )}
                                <span className="hidden sm:inline">Sync</span>
                            </button>
                        )}

                        {isReady && (
                            <button
                                onClick={handleNewSong}
                                className="text-zinc-400 hover:text-white transition-colors bg-zinc-800/50 hover:bg-zinc-700/50 backdrop-blur-sm px-4 py-2 rounded-xl text-sm"
                            >
                                New Song
                            </button>
                        )}

                        <button
                            onClick={() => setShowLibrary(!showLibrary)}
                            className={`flex items-center space-x-2 transition-colors backdrop-blur-sm px-4 py-2 rounded-xl ${showLibrary
                                ? 'text-pink-400 bg-pink-500/20'
                                : 'text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-700/50'
                                }`}
                        >
                            <Library className="w-5 h-5" />
                            <span className="hidden sm:inline">Library</span>
                            {combinedLibrary.length > 0 && (
                                <span className="bg-pink-500 text-white text-xs px-2 py-0.5 rounded-full">
                                    {combinedLibrary.length}
                                </span>
                            )}
                        </button>
                    </div>
                </header>

                {/* Upload message */}
                {uploadMessage && (
                    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-zinc-800 border border-zinc-700 px-4 py-2 rounded-xl text-sm">
                        {uploadMessage}
                    </div>
                )}

                {/* Song Library Sidebar */}
                {showLibrary && (
                    <SongLibrary
                        library={combinedLibrary}
                        isLoading={isLoadingCloud}
                        onSelect={handleLoadFromLibrary}
                        onDelete={handleDeleteFromLibrary}
                        onClose={() => setShowLibrary(false)}
                    />
                )}

                {/* Love Letter Popup */}
                <LoveLetterPopup
                    isOpen={showLoveLetter}
                    onClose={() => setShowLoveLetter(false)}
                    cloudSongs={cloudSongs}
                    onSelectSong={(song) => {
                        handleLoadFromLibrary(song);
                        setShowLoveLetter(false);
                    }}
                />

                {/* Main Content */}

                {/* Main Content */}
                {!isReady ? (
                    <FileUploader
                        onAudioLoad={handleAudioLoad}
                        onLrcLoad={handleLrcLoad}
                        onStart={handleStart}
                        hasLyrics={lyrics.length > 0 || lrcText.length > 0}
                        parseError={parseError}
                        selectedSong={selectedSong}
                    />
                ) : (
                    <LyricsDisplay
                        lyrics={lyrics}
                        currentIndex={currentLyricIndex}
                        onLyricClick={handleLyricClick}
                    />
                )}

                {/* Audio Element */}
                {audioUrl && (
                    <audio
                        ref={audioRef}
                        src={audioUrl}
                        preload="auto"
                        crossOrigin="anonymous"
                    />
                )}

                {/* Player Controls */}
                {isReady && (
                    <PlayerControls
                        audioRef={audioRef}
                        isPlaying={isPlaying}
                        onPlayPause={handlePlayPause}
                        onReplay={handleReplay}
                        currentTime={currentTime}
                        duration={duration}
                        onSeek={handleSeek}
                        songTitle={audioFile?.name?.replace(/\.[^/.]+$/, '') || 'Unknown Track'}
                    />
                )}
            </div>
        </div>
    );
};

export default LyricsVisualizer;
