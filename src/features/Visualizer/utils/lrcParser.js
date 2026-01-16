/**
 * LRC Parser Utility
 * Parses LRC (Lyric) file format into an array of timed lyric objects
 * 
 * LRC Format: [mm:ss.xx]Lyric text
 * Example: [00:12.50]Hello world
 */

/**
 * Parse LRC text content into an array of lyric objects
 * @param {string} lrcText - Raw LRC file content
 * @returns {Array<{time: number, text: string}>} Parsed lyrics sorted by time
 */
export function parseLRC(lrcText) {
  if (!lrcText || typeof lrcText !== 'string') {
    console.log('parseLRC: Invalid input - empty or not a string');
    return [];
  }

  console.log('parseLRC: Parsing LRC text, length:', lrcText.length);

  // Normalize line endings
  const normalizedText = lrcText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalizedText.split('\n');
  const lyrics = [];

  // More lenient regex: allows 1-2 digits for minutes/seconds, optional milliseconds
  // Matches: [0:00], [00:00], [0:00.00], [00:00.00], [00:00.000], [0:00:00]
  const timestampRegex = /\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;

  for (const line of lines) {
    // Skip empty lines
    if (!line.trim()) continue;

    // Skip metadata lines like [ar:Artist], [ti:Title], etc.
    if (line.match(/^\[(ar|ti|al|au|length|by|offset|re|ve|id|tool):/i)) {
      continue;
    }

    // Find all timestamps in the line (some lines have multiple timestamps)
    const timestamps = [];
    let match;

    while ((match = timestampRegex.exec(line)) !== null) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      let milliseconds = 0;

      if (match[3]) {
        // Pad or truncate to 3 digits for milliseconds
        const msStr = match[3].padEnd(3, '0').substring(0, 3);
        milliseconds = parseInt(msStr, 10);
      }

      // Convert to total seconds
      const time = minutes * 60 + seconds + milliseconds / 1000;
      timestamps.push({ time, index: match.index, length: match[0].length });
    }

    // Reset regex lastIndex for next line
    timestampRegex.lastIndex = 0;

    if (timestamps.length === 0) continue;

    // Extract the lyric text (everything after the last timestamp)
    const lastTimestamp = timestamps[timestamps.length - 1];
    const text = line.substring(lastTimestamp.index + lastTimestamp.length).trim();

    // Skip empty lyrics (but keep lines with just whitespace removal)
    if (!text) continue;

    // Create a lyric entry for each timestamp (for repeated lines)
    for (const { time } of timestamps) {
      lyrics.push({ time, text });
    }
  }

  // Sort by time
  lyrics.sort((a, b) => a.time - b.time);

  console.log('parseLRC: Parsed', lyrics.length, 'lyric lines');
  if (lyrics.length > 0) {
    console.log('parseLRC: First lyric:', lyrics[0]);
    console.log('parseLRC: Last lyric:', lyrics[lyrics.length - 1]);
  }

  return lyrics;
}

/**
 * Format seconds to mm:ss display format
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
export function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '0:00';

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Find the index of the current lyric based on audio time
 * @param {Array<{time: number, text: string}>} lyrics - Parsed lyrics array
 * @param {number} currentTime - Current audio time in seconds
 * @returns {number} Index of current lyric, or -1 if none
 */
export function getCurrentLyricIndex(lyrics, currentTime) {
  if (!lyrics || lyrics.length === 0) return -1;

  // Find the last lyric whose time is <= currentTime
  for (let i = lyrics.length - 1; i >= 0; i--) {
    if (lyrics[i].time <= currentTime) {
      return i;
    }
  }

  return -1;
}
