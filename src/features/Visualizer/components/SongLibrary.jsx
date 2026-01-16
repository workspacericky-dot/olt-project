import React from 'react';
import { X, Trash2, Music, Clock, Cloud, Loader2 } from 'lucide-react';

const SongLibrary = ({ library, isLoading, onSelect, onDelete, onClose }) => {
    const formatDate = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <div className="fixed inset-0 z-40 flex">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Sidebar */}
            <div className="relative ml-auto w-full max-w-md bg-zinc-900 border-l border-zinc-800 h-full overflow-hidden flex flex-col animate-slide-in-right">
                {/* Header */}
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white">Song Library</h2>
                        <p className="text-zinc-500 text-sm">
                            {library.length} saved song{library.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="p-4 flex items-center justify-center space-x-2 text-zinc-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Loading cloud songs...</span>
                    </div>
                )}

                {/* Song List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {library.length === 0 && !isLoading ? (
                        <div className="text-center py-12">
                            <Music className="w-12 h-12 mx-auto text-zinc-700 mb-4" />
                            <p className="text-zinc-500 font-medium">No songs saved yet</p>
                            <p className="text-zinc-600 text-sm mt-1">
                                Songs you visualize will appear here
                            </p>
                        </div>
                    ) : (
                        library.map((song) => (
                            <div
                                key={`${song.isCloud ? 'cloud' : 'local'}-${song.id}`}
                                className="group bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 hover:border-zinc-600 rounded-xl p-4 transition-all cursor-pointer"
                                onClick={() => onSelect(song)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2">
                                            <h3 className="font-medium text-white truncate group-hover:text-pink-400 transition-colors">
                                                {song.name}
                                            </h3>
                                            {song.isCloud && (
                                                <Cloud className="w-4 h-4 text-blue-400 flex-shrink-0" title="Synced to cloud" />
                                            )}
                                        </div>
                                        <div className="flex items-center space-x-3 mt-1">
                                            <div className="flex items-center space-x-1">
                                                <Clock className="w-3 h-3 text-zinc-500" />
                                                <span className="text-zinc-500 text-xs">
                                                    {formatDate(song.lastPlayed)}
                                                </span>
                                            </div>
                                            {song.uploadedBy && (
                                                <span className="text-zinc-600 text-xs">
                                                    by {song.uploadedBy}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(song.id, song.isCloud, song.audioPath);
                                        }}
                                        className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                        title="Delete song"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Preview of lyrics */}
                                <p className="text-zinc-600 text-xs mt-2 line-clamp-2">
                                    {song.lrcContent?.split('\n').slice(0, 2).join(' ').replace(/\[\d{1,2}:\d{1,2}[.:]\d{1,3}\]/g, '').trim() || 'No preview available'}
                                </p>

                                {/* Cloud song indicator - can play directly */}
                                {song.isCloud && song.audioUrl && (
                                    <div className="mt-2 flex items-center space-x-1 text-xs text-blue-400">
                                        <span>☁️ Ready to play</span>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {library.length > 0 && (
                    <div className="p-4 border-t border-zinc-800 bg-zinc-900/80 backdrop-blur">
                        <p className="text-zinc-500 text-xs text-center">
                            {library.some(s => s.isCloud)
                                ? '☁️ Cloud songs can be played instantly'
                                : 'Click a song to load its lyrics'
                            }
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SongLibrary;
