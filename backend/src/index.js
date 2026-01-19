import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { uploadDocument } from './routes/documents.js';
import { queryRag } from './routes/query.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/documents/upload', uploadDocument);
app.post('/api/query', queryRag);

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: err.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

app.listen(PORT, () => {
    console.log(`Mini RAG Backend running on http://localhost:${PORT}`);
});
