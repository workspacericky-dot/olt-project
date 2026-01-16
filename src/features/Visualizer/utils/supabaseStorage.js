import { createClient } from '@supabase/supabase-js';

// Use the same Supabase client configuration as the main app
const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

const BUCKET_NAME = 'song-files';
const TABLE_NAME = 'shared_songs';

/**
 * Upload a song to Supabase (audio file to storage, metadata to database)
 * @param {File} audioFile - The audio file to upload
 * @param {string} lrcContent - The LRC lyrics content
 * @param {string} songName - Display name of the song
 * @param {string} coupleId - The couple's ID for access control
 * @param {string} uploadedBy - Name of the person uploading
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function uploadSongToCloud(audioFile, lrcContent, songName, coupleId, uploadedBy) {
    try {
        // 1. Upload audio file to storage
        const fileName = `${coupleId}/${Date.now()}_${audioFile.name}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, audioFile, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error('Storage upload error:', uploadError);
            return { success: false, error: `Failed to upload audio: ${uploadError.message}` };
        }

        // 2. Get public URL for the uploaded file
        const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(fileName);

        const audioUrl = urlData.publicUrl;

        // 3. Save metadata to database
        const { data: dbData, error: dbError } = await supabase
            .from(TABLE_NAME)
            .insert([{
                couple_id: coupleId,
                name: songName,
                lrc_content: lrcContent,
                audio_url: audioUrl,
                audio_path: fileName,
                uploaded_by: uploadedBy
            }])
            .select()
            .single();

        if (dbError) {
            console.error('Database insert error:', dbError);
            // Try to clean up the uploaded file
            await supabase.storage.from(BUCKET_NAME).remove([fileName]);
            return { success: false, error: `Failed to save song data: ${dbError.message}` };
        }

        console.log('Song uploaded successfully:', dbData);
        return { success: true, data: dbData };

    } catch (err) {
        console.error('Upload error:', err);
        return { success: false, error: err.message };
    }
}

/**
 * Fetch all shared songs for a couple
 * @param {string} coupleId - The couple's ID
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export async function fetchSharedSongs(coupleId) {
    try {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('*')
            .eq('couple_id', coupleId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Fetch error:', error);
            return { success: false, error: error.message };
        }

        // Transform to match local library format
        const songs = data.map(song => ({
            id: song.id,
            name: song.name,
            lrcContent: song.lrc_content,
            audioUrl: song.audio_url,
            audioPath: song.audio_path,
            uploadedBy: song.uploaded_by,
            lastPlayed: song.created_at,
            isCloud: true // Flag to indicate this is a cloud song
        }));

        return { success: true, data: songs };

    } catch (err) {
        console.error('Fetch error:', err);
        return { success: false, error: err.message };
    }
}

/**
 * Delete a song from cloud storage and database
 * @param {string} songId - The song's database ID
 * @param {string} audioPath - The storage path of the audio file
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteSongFromCloud(songId, audioPath) {
    try {
        // 1. Delete from storage
        if (audioPath) {
            const { error: storageError } = await supabase.storage
                .from(BUCKET_NAME)
                .remove([audioPath]);

            if (storageError) {
                console.warn('Storage delete warning:', storageError);
            }
        }

        // 2. Delete from database
        const { error: dbError } = await supabase
            .from(TABLE_NAME)
            .delete()
            .eq('id', songId);

        if (dbError) {
            console.error('Database delete error:', dbError);
            return { success: false, error: dbError.message };
        }

        return { success: true };

    } catch (err) {
        console.error('Delete error:', err);
        return { success: false, error: err.message };
    }
}

/**
 * Check if Supabase storage bucket exists and is accessible
 * @returns {Promise<boolean>}
 */
export async function checkStorageAccess() {
    try {
        const { data, error } = await supabase.storage.getBucket(BUCKET_NAME);
        if (error) {
            console.warn('Storage bucket check failed:', error.message);
            return false;
        }
        return true;
    } catch (err) {
        console.warn('Storage access check failed:', err);
        return false;
    }
}

export { supabase };
