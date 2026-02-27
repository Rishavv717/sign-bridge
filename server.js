const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let translationHistory = [];

app.post('/api/history', (req, res) => {
    const { word } = req.body;
    translationHistory.unshift({ word, timestamp: new Date() });
    if (translationHistory.length > 10) translationHistory.pop(); 
    res.json({ message: 'Logged' });
});

app.listen(PORT, () => {
    console.log(`🚀 SignBridge Backend running on http://localhost:${PORT}`);
});