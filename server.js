const express = require('express');
const app = express();
const port = 3000;

// CORS 미들웨어 설정
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // 모든 origin 허용 (보안상 주의)
    res.header('Access-Control-Allow-Methods', 'GET, POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// OpenAI API 키
const openAIKey = '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';

app.use(express.json()); // JSON 요청 본문을 처리하기 위한 미들웨어

// 경로 및 핸들러 설정
app.post('/get-quote', async (req, res) => {
    try {
        const openAIResponse = await fetch('https://api.openai.com/v1/engines/text-davinci-003/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openAIKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: "계획에 관련된 한명의 명언을 하나만 알려줘.",
                max_tokens: 100
            })
        });

        const openAIData = await openAIResponse.json();
        res.json({ quote: openAIData.choices[0].text.trim() });
    } catch (error) {
        res.status(500).json({ message: '서버에서 오류가 발생했습니다.' });
    }
});

app.listen(port, () => {
    console.log(`서버가 http://localhost:${port}에서 실행 중입니다.`);
});
