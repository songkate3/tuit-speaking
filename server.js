// server.js
// 이 파일은 Vercel 배포에 최적화된 버전입니다.

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer'); // 음성 파일 처리용
const FormData = require('form-data');
require('dotenv').config(); 

const app = express();
const upload = multer(); // 파일 업로드 설정 (메모리 저장)

// 모든 도메인에서의 요청 허용 (CORS)
app.use(cors());
app.use(express.json());

// 환경 변수에서 API Key 가져오기
const API_KEY = process.env.OPENAI_API_KEY;

// [1] 텍스트 대화 (GPT-4o) 중계
app.post('/api/chat', async (req, res) => {
    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            req.body, 
            {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`, 
                    'Content-Type': 'application/json'
                }
            }
        );
        res.json(response.data);
    } catch (error) {
        console.error('Chat API Error:', error.response?.data || error.message);
        res.status(500).send('Chat API Error');
    }
});

// [2] 음성 인식 (Whisper) 중계
app.post('/api/whisper', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No file uploaded');
        }

        const formData = new FormData();
        formData.append('file', req.file.buffer, 'audio.webm');
        formData.append('model', 'whisper-1');

        const response = await axios.post(
            'https://api.openai.com/v1/audio/transcriptions',
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${API_KEY}` 
                }
            }
        );
        res.json(response.data);
    } catch (error) {
        console.error('Whisper API Error:', error.response?.data || error.message);
        res.status(500).send('Whisper API Error');
    }
});

// [3] 음성 합성 (TTS) 중계
app.post('/api/tts', async (req, res) => {
    try {
        const response = await axios.post(
            'https://api.openai.com/v1/audio/speech',
            req.body,
            {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                },
                responseType: 'arraybuffer'
            }
        );
        res.set('Content-Type', 'audio/mpeg');
        res.send(response.data);
    } catch (error) {
        console.error('TTS API Error:', error.response?.data || error.message);
        res.status(500).send('TTS API Error');
    }
});

// --- Vercel 배포를 위한 핵심 코드 ---
// 로컬에서 실행할 때만 포트를 엽니다.
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`✅ Server is running locally on http://localhost:${PORT}`);
    });
}

// Vercel이 서버를 실행할 수 있도록 내보냅니다.
module.exports = app;