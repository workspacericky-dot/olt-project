import React from 'react';
import { Heart, Music, Play, X } from 'lucide-react';

const LoveLetterPopup = ({ isOpen, onClose, cloudSongs, onSelectSong }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Letter Content */}
            <div className="relative w-full max-w-lg bg-white/10 backdrop-blur-xl border border-pink-200/20 rounded-3xl shadow-2xl p-8 md:p-10 animate-scale-up overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 text-pink-500/10 animate-pulse-slow">
                    <Heart size={200} fill="currentColor" />
                </div>

                <div className="relative z-10 text-center space-y-6">
                    <div className="flex justify-center">
                        <div className="bg-gradient-to-br from-pink-400 to-rose-500 p-4 rounded-full shadow-lg shadow-pink-500/30 animate-bounce-slow">
                            <Heart className="w-8 h-8 text-white fill-current" />
                        </div>
                    </div>

                    <div className="space-y-4 font-serif">
                        <h2 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-200 via-pink-100 to-white drop-shadow-sm italic">
                            Selamat Ulang Tahun!
                        </h2>

                        <div className="bg-white/5 rounded-2xl p-6 border border-white/10 text-pink-100/90 leading-relaxed text-lg italic shadow-inner">
                            <p className="mb-4">
                                "Selamat ulang tahun sengkuu cintakuu! Ini request mu yg kubalut dalam wujud kado digital ini yoo wkwk, maaf kalo ini ga seberapa, nanti kalo aku udah berani kita coba jalan bareng yaaa aku janji.
                            </p>
                            <p>
                                Tapi yg terpenting I love you dan will always love you apapun yang terjadi ke depan, karena "Aku berjanji (engkaulah) Anugerah Terindah"."
                            </p>
                        </div>
                    </div>

                    {/* Song List */}
                    <div className="space-y-3 pt-2">
                        <p className="text-pink-200/60 text-sm font-medium uppercase tracking-widest">
                            Our Special Songs
                        </p>

                        {cloudSongs.length > 0 ? (
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 scrollbar-hide">
                                {cloudSongs.map((song) => (
                                    <button
                                        key={song.id}
                                        onClick={() => onSelectSong(song)}
                                        className="w-full group bg-black/20 hover:bg-pink-500/20 border border-white/5 hover:border-pink-400/30 rounded-xl p-3 flex items-center gap-3 transition-all transform hover:scale-[1.02]"
                                    >
                                        <div className="bg-pink-500/20 p-2 rounded-full group-hover:bg-pink-500 group-hover:text-white transition-colors">
                                            <Play className="w-4 h-4 text-pink-300 group-hover:text-white fill-current" />
                                        </div>
                                        <div className="text-left flex-1 min-w-0">
                                            <p className="text-white font-medium truncate group-hover:text-pink-200 transition-colors">
                                                {song.name}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-white/40 italic text-sm py-2">
                                (No songs synced yet, but my heart is synced with yours)
                            </p>
                        )}
                    </div>

                    <button
                        onClick={onClose}
                        className="text-pink-300/60 hover:text-white text-sm transition-colors flex items-center justify-center gap-2 mx-auto pt-2"
                    >
                        <span>Close Letter</span>
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoveLetterPopup;
