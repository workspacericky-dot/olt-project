const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_INSTRUCTION = (partnerName, score, recentJournals) => {
    const recentThoughts = recentJournals
        .slice(-5)
        .map(j => `[${j.date}] ${j.partner_name}: "${j.content}"`)
        .join('\n');

    return `Kamu adalah seorang coach hubungan yang hangat, santai, dan perhatian. Kamu sedang ngobrol sama ${partnerName}.

Informasi penting:
- Skor hubungan individu ${partnerName} hari ini: ${score}/35.
- Jurnal mereka sebelumnya:
${recentThoughts || "Belum ada jurnal sebelumnya."}

ATURAN KETAT:
1. Gunakan bahasa Indonesia yang santai dan gaul tapi tetap sopan (kayak ngobrol sama temen). Pakai "lo/lu" atau "kamu", bukan "Anda".
2. Kamu harus bertanya SATU pertanyaan singkat per pesan. Jangan panjang. Maks 2 kalimat.
3. Pertanyaan harus relevan dengan skor hubungan dan konteks jurnal sebelumnya.
4. Jika skor tinggi (22-35): tanya tentang hal-hal positif, momen bahagia, apresiasi ke pasangan.
5. Jika skor menengah (12-21): tanya tentang rutinitas, keinginan, atau hal yang bisa ditingkatkan.
6. Jika skor rendah (0-11): tanya dengan sangat lembut tentang perasaan, kebutuhan, atau support yang diharapkan.
7. Setelah user menjawab 2-3 pertanyaan, JANGAN tanya lagi. Langsung berikan output akhir.
8. Output akhir HARUS dalam format ini (pakai emoji):

✨ **Ide untuk cerita hari ini:**
1. [topik spesifik dari jawaban user]
2. [topik spesifik dari jawaban user]  
3. [topik spesifik dari jawaban user]

Sekarang, mulai dengan satu pertanyaan pembuka yang hangat berdasarkan skor mereka.`;
};

/**
 * Send a message in the multi-turn conversation.
 * @param {Array} conversationHistory - Array of {role, text} objects
 * @param {string} partnerName
 * @param {number} score
 * @param {Array} recentJournals
 * @returns {Promise<{reply: string, isDone: boolean}>}
 */
export const sendCoachMessage = async (conversationHistory, partnerName, score, recentJournals) => {
    if (!GEMINI_API_KEY) {
        return {
            reply: "Hai! Aku coach-mu hari ini 😊 Ceritain dong, gimana harimu tadi sama pasangan?",
            isDone: false
        };
    }

    try {
        // Build the Gemini multi-turn contents array
        const contents = conversationHistory.map(msg => ({
            role: msg.role === 'coach' ? 'model' : 'user',
            parts: [{ text: msg.text }]
        }));

        const requestBody = {
            system_instruction: {
                parts: [{ text: SYSTEM_INSTRUCTION(partnerName, score, recentJournals) }]
            },
            contents,
            generationConfig: {
                temperature: 0.8,
                maxOutputTokens: 200,
            }
        };

        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            throw new Error(`Gemini API Error: ${response.status}`);
        }

        const data = await response.json();
        if (data.candidates && data.candidates.length > 0) {
            const reply = data.candidates[0].content.parts[0].text.trim();
            // Check if this is the final output (contains the writing suggestions)
            const isDone = reply.includes('**Ide untuk cerita hari ini:**') || reply.includes('Ide untuk cerita');
            return { reply, isDone };
        } else {
            throw new Error("Invalid response format from Gemini");
        }

    } catch (error) {
        console.error("Coach API error:", error);
        // Determine a conversational fallback based on how many user messages we have
        const userMsgCount = conversationHistory.filter(m => m.role === 'user').length;
        if (userMsgCount <= 1) {
            return {
                reply: "Hai! Maaf aku agak lemot nih 😅 Tapi gpp, ceritain aja gimana harimu hari ini?",
                isDone: false
            };
        } else {
            // If user has answered enough, give the final suggestions based on what we have
            return {
                reply: "✨ **Ide untuk cerita hari ini:**\n1. Apa yang bikin kamu senyum hari ini\n2. Satu hal yang kamu hargai dari pasangan\n3. Harapan kecil buat besok",
                isDone: true
            };
        }
    }
};

/**
 * Start a new coaching session - returns the first AI question.
 */
export const startCoachSession = async (partnerName, score, recentJournals) => {
    // The first message is just the system instruction kicking in; we send a minimal user prompt.
    const initialHistory = [
        { role: 'user', text: 'Hai coach, aku mau nulis jurnal hari ini. Bantu aku dong!' }
    ];
    
    const result = await sendCoachMessage(initialHistory, partnerName, score, recentJournals);
    return {
        history: [
            ...initialHistory,
            { role: 'coach', text: result.reply }
        ],
        reply: result.reply,
        isDone: result.isDone
    };
};
