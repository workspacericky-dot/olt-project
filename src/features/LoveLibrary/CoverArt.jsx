import { Heart } from 'lucide-react';

export function Sunset({ small = false }) {
  return <div className={`love-sunset ${small ? 'is-small' : ''}`} aria-hidden="true">
    <div className="sunset-halo" /><div className="sunset-orbit" /><div className="sunset-sun" />
    <div className="sunset-hill hill-back" /><div className="sunset-hill hill-front" />
    <div className="sunset-water" />
    {Array.from({ length: 18 }, (_, i) => <i className="sunset-star" key={i} style={{ '--i': i, left: `${(i * 37 + 9) % 100}%`, top: `${(i * 19 + 5) % 75}%` }} />)}
  </div>;
}

export function CallingCover() {
  return <div className="love-calling-cover" aria-hidden="true">
    <svg viewBox="0 0 600 700" preserveAspectRatio="xMidYMid slice" role="presentation">
      <defs>
        <linearGradient id="callingSky" x2="0" y2="1"><stop stopColor="#af99c8"/><stop offset=".46" stopColor="#e7acbc"/><stop offset="1" stopColor="#f6c5af"/></linearGradient>
        <radialGradient id="callingGlow"><stop stopColor="#fff5d8" stopOpacity=".95"/><stop offset=".36" stopColor="#ffe4cf" stopOpacity=".6"/><stop offset="1" stopColor="#fff1df" stopOpacity="0"/></radialGradient>
        <linearGradient id="callingGround" x2="0" y2="1"><stop stopColor="#9d759d"/><stop offset="1" stopColor="#6e557e"/></linearGradient>
      </defs>
      <path fill="url(#callingSky)" d="M0 0h600v700H0z"/>
      <circle className="calling-glow" cx="426" cy="249" r="260" fill="url(#callingGlow)"/>
      <circle cx="427" cy="249" r="91" fill="#fff0d7" opacity=".82"/>
      <path d="M0 485Q138 448 276 499T600 441V700H0Z" fill="#aa87ad" opacity=".64"/>
      <path d="M0 557Q184 490 334 558T600 523V700H0Z" fill="url(#callingGround)"/>
      <path d="M0 640Q176 578 346 651T600 597V700H0Z" fill="#725b82" opacity=".6"/>
      <path d="M222 335Q345 298 497 343" fill="none" stroke="#fff6e9" strokeWidth="2" opacity=".72" strokeDasharray="2 12"/>
      <path className="calling-sound" d="M222 349Q355 316 500 364" fill="none" stroke="#fff7e5" strokeWidth="2" opacity=".62"/>
      <path className="calling-sound calling-sound-two" d="M222 362Q350 353 504 389" fill="none" stroke="#fff7e5" strokeWidth="1.5" opacity=".42"/>
      <path fill="#5e4b73" d="M49 700c-7-102 19-187 75-214 22-11 54-13 75 1 45 30 57 117 59 213Z"/>
      <path fill="#57456b" d="M97 492c-14-23-19-47-15-75 5-42 31-69 66-70 40-1 67 25 70 67l-2 33-31 19-24 41Z"/>
      <path fill="#f4c4ae" d="M123 478c-17-14-24-43-18-70 6-24 22-39 43-42 27-4 49 16 53 46l-4 20 26 14-29 10c-7 24-21 43-40 47Z"/>
      <path fill="#5c496e" d="M99 425c-8-45 10-76 44-84 36-8 67 13 73 54-13-18-25-26-42-25-17 2-35 22-39 35-8-3-20-1-36 20Z"/>
      <path fill="#71445c" d="M196 450l25-5-22 15Z"/>
      <path fill="#5e4b73" d="M142 497c-4 34 1 52 21 76l-58-10Z"/>
      <path fill="#684b76" d="M161 523c36 20 52 54 64 85l-18 8c-24-34-45-49-72-58Z"/>
      <path fill="#f4c4ae" d="M220 601c17-7 25 0 32 10 4 8 3 14-3 18l-30-8Z"/>
      <path fill="#655474" d="M491 518c-3-17 3-30 13-32 13-2 24 12 21 30l-7 17-14 7Z"/>
      <path fill="#f8d4bf" d="M498 507c-1-12 5-21 14-21 11 0 17 8 16 21-1 11-8 19-16 19-9 0-14-8-14-19Z"/>
      <path fill="#655474" d="M494 505c0-19 11-30 22-28 11 2 20 14 18 34-5-9-9-13-17-16-9 7-15 10-23 10Z"/>
      <path fill="#775d86" d="M505 527c-14 9-23 25-25 49l10 17 46 1 9-21c-3-22-15-38-27-45Z"/>
      <path fill="#775d86" d="M489 574c-8 39-15 78-17 126h91c-6-53-17-99-29-126Z"/>
      <path fill="none" stroke="#fce3d8" strokeWidth="2" opacity=".5" d="M254 166c71-57 157-62 242-17M282 189c55-38 104-44 155-34"/>
      <circle cx="83" cy="167" r="2" fill="#fff7ec"/><circle cx="334" cy="104" r="2" fill="#fff7ec"/><circle cx="527" cy="76" r="2" fill="#fff7ec"/>
    </svg>
  </div>;
}

export function AlbumCover() {
  return <div className="love-album-cover" aria-hidden="true">
    <span className="album-orbit orbit-one"/><span className="album-orbit orbit-two"/>
    <Heart className="album-heart-shadow" fill="currentColor" strokeWidth={0} />
    <Heart className="album-heart" fill="currentColor" strokeWidth={0} />
    <span className="album-heart-title">Still<br />Love You</span>
    <span className="album-cover-caption">MASIH SAYANG ICA · VOL. 01</span>
  </div>;
}
