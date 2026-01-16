import React, { useState, useRef } from 'react';
import { Upload, FileAudio, FileText, Clipboard, ArrowRight, AlertCircle, Music, CheckCircle } from 'lucide-react';

const FileUploader = ({ onAudioLoad, onLrcLoad, onStart, parseError, selectedSong }) => {
    const [audioFile, setAudioFile] = useState(null);
    const [lrcText, setLrcText] = useState('');
    const [lrcFile, setLrcFile] = useState(null);
    const [activeTab, setActiveTab] = useState('file'); // 'file' or 'paste'
    const [dragActive, setDragActive] = useState(false);

    const audioInputRef = useRef(null);
    const lrcInputRef = useRef(null);

    const handleAudioChange = (e) => {
        const file = e.target.files?.[0];
        if (file && (file.type.includes('audio') || file.name.match(/\.(mp3|wav|ogg|m4a)$/i))) {
            setAudioFile(file);
            onAudioLoad(file);
        }
    };

    const handleLrcFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file && file.name.endsWith('.lrc')) {
            setLrcFile(file);
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target.result;
                setLrcText(text);
                onLrcLoad(text);
            };
            reader.readAsText(file);
        }
    };

    const handleLrcPaste = (text) => {
        setLrcText(text);
        onLrcLoad(text);
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const files = e.dataTransfer.files;
        for (const file of files) {
            if (file.type.includes('audio') || file.name.match(/\.(mp3|wav|ogg|m4a)$/i)) {
                setAudioFile(file);
                onAudioLoad(file);
            } else if (file.name.endsWith('.lrc')) {
                setLrcFile(file);
                const reader = new FileReader();
                reader.onload = (event) => {
                    const text = event.target.result;
                    setLrcText(text);
                    onLrcLoad(text);
                };
                reader.readAsText(file);
            }
        }
    };

    const canStart = audioFile && (lrcText || lrcFile || selectedSong);
    const hasLyricsFromLibrary = selectedSong && !audioFile;

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-rose-300 to-indigo-300 mb-3 drop-shadow-sm font-serif italic">Lagu-Lagu Kita</h1>
                    <p className="text-pink-200/60 font-medium tracking-wide">Upload our special songs and lyrics</p>
                </div>

                {/* Selected Song Banner */}
                {selectedSong && (
                    <div className={`mb-6 p-4 rounded-xl flex items-center space-x-3 ${selectedSong.isCloud && selectedSong.audioUrl
                        ? 'bg-blue-500/10 border border-blue-500/30'
                        : 'bg-green-500/10 border border-green-500/30'
                        }`}>
                        {selectedSong.isCloud && selectedSong.audioUrl ? (
                            <>
                                <Music className="w-5 h-5 text-blue-400" />
                                <div>
                                    <p className="text-blue-400 font-medium">☁️ Cloud song ready!</p>
                                    <p className="text-blue-300 text-sm">"{selectedSong.name}" - Click Start to play</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-5 h-5 text-green-400" />
                                <div>
                                    <p className="text-green-400 font-medium">Lyrics loaded from library</p>
                                    <p className="text-green-300 text-sm">"{selectedSong.name}" - Now upload the matching audio file</p>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Drop Zone */}
                <div
                    className={`relative border-2 border-dashed rounded-3xl p-8 mb-6 transition-all duration-300 backdrop-blur-md ${dragActive
                        ? 'border-pink-500 bg-pink-500/20 scale-[1.02]'
                        : 'border-white/10 hover:border-pink-400/50 bg-black/20 hover:bg-black/30'
                        }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <div className="text-center">
                        <Upload className={`w-12 h-12 mx-auto mb-4 transition-colors ${dragActive ? 'text-pink-500' : 'text-zinc-500'}`} />
                        <p className="text-zinc-300 font-medium mb-2">Drag & drop files here</p>
                        <p className="text-zinc-500 text-sm">or click the buttons below</p>
                    </div>
                </div>

                {/* File Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Audio File Input */}
                    <div
                        className={`p-6 rounded-2xl border transition-all cursor-pointer backdrop-blur-sm group ${audioFile
                            ? 'bg-pink-500/20 border-pink-500'
                            : 'bg-black/20 border-white/10 hover:border-pink-500/50 hover:bg-black/30'
                            }`}
                        onClick={() => audioInputRef.current?.click()}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <FileAudio className={`w-8 h-8 ${audioFile ? 'text-pink-400' : 'text-zinc-400 group-hover:text-pink-300'}`} />
                            {audioFile && <div className="bg-pink-500 rounded-full p-1"><CheckCircle className="w-3 h-3 text-white" /></div>}
                        </div>
                        <h3 className="text-white font-medium mb-1">Audio File</h3>
                        <p className="text-zinc-400 text-sm truncate">{audioFile ? audioFile.name : 'MP3, WAV, OGG'}</p>
                        <input
                            type="file"
                            accept="audio/*,.mp3,.wav,.ogg,.m4a"
                            onChange={handleAudioChange}
                            className="hidden"
                            ref={audioInputRef}
                        />
                    </div>

                    {/* Lyrics File Input */}
                    <div
                        className={`p-6 rounded-2xl border transition-all cursor-pointer backdrop-blur-sm group ${lrcFile || lrcText
                            ? 'bg-pink-500/20 border-pink-500'
                            : 'bg-black/20 border-white/10 hover:border-pink-500/50 hover:bg-black/30'
                            }`}
                        onClick={() => lrcInputRef.current?.click()}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <FileText className={`w-8 h-8 ${lrcFile || lrcText ? 'text-pink-400' : 'text-zinc-400 group-hover:text-pink-300'}`} />
                            {(lrcFile || lrcText) && <div className="bg-pink-500 rounded-full p-1"><CheckCircle className="w-3 h-3 text-white" /></div>}
                        </div>
                        <h3 className="text-white font-medium mb-1">Lyrics File</h3>
                        <p className="text-zinc-400 text-sm truncate">{lrcFile ? lrcFile.name : (lrcText ? 'Lyrics loaded' : '.LRC format')}</p>
                        <input
                            type="file"
                            accept=".lrc"
                            onChange={handleLrcFileChange}
                            className="hidden"
                            ref={lrcInputRef}
                        />
                    </div>
                </div>

                {/* Paste LRC Tab */}
                <div className="bg-zinc-800/50 rounded-2xl border border-zinc-700 overflow-hidden mb-6">
                    <div className="flex border-b border-zinc-700">
                        <button
                            onClick={() => setActiveTab('file')}
                            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'file'
                                ? 'text-white bg-zinc-700/50'
                                : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                        >
                            <FileText className="w-4 h-4 inline mr-2" />
                            Upload File
                        </button>
                        <button
                            onClick={() => setActiveTab('paste')}
                            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'paste'
                                ? 'text-white bg-zinc-700/50'
                                : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                        >
                            <Clipboard className="w-4 h-4 inline mr-2" />
                            Paste LRC
                        </button>
                    </div>

                    {activeTab === 'paste' && (
                        <div className="p-4">
                            <textarea
                                value={lrcText}
                                onChange={(e) => handleLrcPaste(e.target.value)}
                                placeholder="[00:00.00]Paste your LRC lyrics here...&#10;[00:05.00]Each line with timestamps..."
                                className="w-full h-40 bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-zinc-300 text-sm font-mono resize-none focus:outline-none focus:border-pink-500 placeholder-zinc-600"
                            />
                        </div>
                    )}
                </div>

                {/* Start Button */}
                <button
                    onClick={() => {
                        console.log('Start Button clicked!', { canStart, audioFile: !!audioFile, lrcFile: !!lrcFile, lrcText: !!lrcText });
                        if (canStart && onStart) {
                            onStart();
                        }
                    }}
                    disabled={!canStart}
                    className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center space-x-3 transition-all tracking-wide ${canStart
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 transform hover:-translate-y-0.5'
                        : 'bg-white/5 text-zinc-500 cursor-not-allowed border border-white/5'
                        }`}
                >
                    <span>Start Visualizer</span>
                    <ArrowRight className="w-5 h-5" />
                </button>

                {/* Error Message */}
                {parseError && (
                    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-red-400 text-sm">{parseError}</p>
                    </div>
                )}

                {!canStart && !parseError && (
                    <p className="text-center text-zinc-500 text-sm mt-4">
                        Please upload both an audio file and lyrics to continue
                    </p>
                )}
            </div>
        </div>
    );
};

export default FileUploader;
