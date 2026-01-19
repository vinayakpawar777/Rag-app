const API_URL = 'https://rag-app-5evh.onrender.com/api';
const SESSION_ID = 'session-' + Math.random().toString(36).substring(2, 15);
console.log('Current Session ID:', SESSION_ID);

let uploadedDocuments = [];

const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');

uploadArea.addEventListener('click', () => fileInput.click());
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('active');
});
uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('active'));
uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('active');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        fileInput.files = files;
        readFile(files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        readFile(e.target.files[0]);
    }
});

function readFile(file) {
    const reader = new FileReader();

    if (!file.type.includes('text') && !file.name.endsWith('.md') && !file.name.endsWith('.txt')) {
        alert('❌ Only .txt and .md files are supported. Please convert PDFs to text first.');
        return;
    }

    reader.onload = (e) => {
        document.getElementById('textInput').value = e.target.result;
        if (!document.getElementById('titleInput').value) {
            document.getElementById('titleInput').value = file.name.replace(/\.[^/.]+$/, '');
        }
    };
    reader.readAsText(file);
}

async function uploadDocument() {
    const text = document.getElementById('textInput').value.trim();
    const title = document.getElementById('titleInput').value.trim();
    const progressContainer = document.getElementById('progressContainer');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const uploadSuccess = document.getElementById('uploadSuccess');
    const successMessage = document.getElementById('successMessage');
    const uploadBtn = document.getElementById('uploadBtn');

    if (!text) {
        uploadSuccess.classList.remove('show');
        progressContainer.classList.remove('active');
        alert('Please paste or upload text first');
        return;
    }

    uploadSuccess.classList.remove('show');
    progressContainer.classList.add('active');
    progressFill.style.width = '0%';
    progressText.textContent = '⏳ Uploading...';
    uploadBtn.disabled = true;

    try {
        progressText.textContent = '✂️ Chunking text...';
        progressFill.style.width = '25%';

        const response = await fetch(`${API_URL}/documents/upload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text,
                title: title || 'Untitled',
                session_id: SESSION_ID
            })
        });

        progressText.textContent = '🧮 Creating embeddings...';
        progressFill.style.width = '75%';

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Upload failed');
        }

        const data = await response.json();
        uploadedDocuments.push(data);

        progressText.textContent = '💾 Storing vectors...';
        progressFill.style.width = '95%';

        setTimeout(() => {
            progressFill.style.width = '100%';
            progressText.textContent = '✅ Complete!';

            setTimeout(() => {
                progressContainer.classList.remove('active');
                successMessage.innerHTML = `
                    <strong>${data.chunks_created} chunks created</strong><br>
                    📊 ${data.estimated_tokens} tokens<br>
                    📁 "${data.title || 'Untitled'}"
                `;
                uploadSuccess.classList.add('show');

                updateDocumentsList();

                // Clear inputs after 2 seconds (user can read success first)
                document.getElementById('textInput').value = '';
                document.getElementById('titleInput').value = '';
            }, 2000);
        }, 300);
    } catch (error) {
        progressContainer.classList.remove('active');
        uploadSuccess.classList.remove('show');
        progressText.textContent = '❌ Error!';
        progressFill.style.width = '0%';
        alert(`❌ Error: ${error.message}`);
    } finally {
        uploadBtn.disabled = false;
    }
}

function updateDocumentsList() {
    const list = document.getElementById('documentsList');
    if (uploadedDocuments.length === 0) {
        list.innerHTML = '<div class="no-documents">No documents uploaded yet</div>';
        return;
    }

    list.innerHTML = '<h3 style="color: #333; margin-bottom: 10px;">Uploaded Documents</h3>' +
        uploadedDocuments.map((doc, i) => `
            <div style="padding: 10px; background: #f0f0f0; border-radius: 6px; margin-bottom: 8px; font-size: 13px;">
                <strong>${doc.title}</strong><br>
                <span style="color: #666;">${doc.chunks_created} chunks • ${doc.estimated_tokens} tokens</span>
            </div>
        `).join('');
}

async function submitQuery() {
    const query = document.getElementById('queryInput').value.trim();
    const topK = parseInt(document.getElementById('topK').value);
    const status = document.getElementById('queryStatus');

    if (!query) {
        showStatus(status, 'error', 'Please enter a question');
        return;
    }

    if (uploadedDocuments.length === 0) {
        showStatus(status, 'error', 'Please upload a document first');
        return;
    }

    showStatus(status, 'loading', '🔍 Retrieving and answering...');
    document.getElementById('queryBtn').disabled = true;

    try {
        const response = await fetch(`${API_URL}/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query,
                top_k: topK,
                session_id: SESSION_ID
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Query failed');
        }

        const data = await response.json();
        displayResults(data);
        showStatus(status, 'success', '✓ Answer generated!');
    } catch (error) {
        showStatus(status, 'error', `❌ Error: ${error.message}`);
    } finally {
        document.getElementById('queryBtn').disabled = false;
    }
}

function displayResults(data) {
    const panel = document.getElementById('resultsPanel');
    panel.style.display = 'block';

    // Answer
    document.getElementById('answerBox').innerHTML = data.answer;

    if (data.timing) {
        const t = data.timing;
        document.getElementById('timingInfo').innerHTML =
            `⏱️ <strong>Time:</strong> Total: ${t.total_ms}ms (LLM: ${t.llm_ms}ms)`;
        document.getElementById('timingInfo').style.display = 'block';
    }

    if (data.cost_estimate) {
        const c = data.cost_estimate;
        document.getElementById('costInfo').innerHTML =
            `💰 <strong>Est. Cost:</strong> Embed: ${c.embedding_api} | Rerank: ${c.rerank_api} | LLM: ${c.llm_api}`;
        document.getElementById('costInfo').style.display = 'block';
    }

    // Sources
    document.getElementById('sourceCount').textContent = data.sources.length;
    const sourcesHtml = data.sources.map(source => `
        <div class="source-card">
            <div class="source-header">
                <div class="source-number">${source.id}</div>
                <div>${source.title}</div>
            </div>
            <div class="source-content">${escapeHtml(source.content)}</div>
            <div class="source-meta">
                Score: ${(source.pinecone_score || 0).toFixed(3)}
                ${source.rerank_score ? ` | Rerank: ${source.rerank_score.toFixed(3)}` : ''}
            </div>
        </div>
    `).join('');
    document.getElementById('sourcesContainer').innerHTML = sourcesHtml;
}

function showStatus(element, type, message) {
    element.className = `status ${type}`;
    element.textContent = message;
}

function clearUpload() {
    document.getElementById('textInput').value = '';
    document.getElementById('titleInput').value = '';
    fileInput.value = '';
    document.getElementById('uploadSuccess').classList.remove('show');
    document.getElementById('progressContainer').classList.remove('active');
}

function clearQuery() {
    document.getElementById('queryInput').value = '';
    document.getElementById('queryStatus').textContent = '';
    document.getElementById('queryStatus').className = 'status';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize
updateDocumentsList();
