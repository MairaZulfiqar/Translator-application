const recordBtn = document.getElementById('record-btn');
const sourceLangSelect = document.getElementById('source-lang');
const targetLangSelect = document.getElementById('target-lang');
const originalText = document.getElementById('original-text');
const translatedText = document.getElementById('translated-text');
const statusMsg = document.getElementById('status');
const videoFeed = document.getElementById('video-feed');

let isListening = false;
let stream = null;
let recognition;

// Initialize Speech Recognition
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    
    recognition.onstart = () => {
        isListening = true;
        recordBtn.classList.add('listening');
        recordBtn.querySelector('span').textContent = 'Stop Listening';
        statusMsg.textContent = 'Listening... Speak now.';
    };

    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }

        const transcript = finalTranscript || interimTranscript;
        if (transcript) {
            originalText.textContent = transcript;
            if (finalTranscript) {
                translateText(finalTranscript);
            }
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        stopListening();
        statusMsg.textContent = `Error: ${event.error}`;
    };

    recognition.onend = () => {
        if (isListening) {
            recognition.start();
        } else {
            stopListening();
        }
    };
} else {
    statusMsg.textContent = 'Speech Recognition not supported in this browser.';
    recordBtn.disabled = true;
}

// Translation Logic
async function translateText(text) {
    // Get language codes (e.g., 'en' from 'en-US')
    const sourceLang = sourceLangSelect.value.split('-')[0];
    const targetLang = targetLangSelect.value.split('-')[0];
    
    statusMsg.textContent = 'Translating...';
    
    try {
        const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`);
        const data = await response.json();
        
        if (data.responseData) {
            translatedText.textContent = data.responseData.translatedText;
            statusMsg.textContent = 'Translated Successfully';
        } else {
            throw new Error('Translation failed');
        }
    } catch (error) {
        console.error('Translation error:', error);
        statusMsg.textContent = 'Translation failed. Try again.';
    }
}

async function startListening() {
    recognition.lang = sourceLangSelect.value;
    
    try {
        if (!stream) {
            if (!window.isSecureContext) {
                statusMsg.textContent = "Error: Camera requires a secure context (HTTPS or localhost).";
                return;
            }
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
            videoFeed.srcObject = stream;
        }
        recognition.start();
    } catch (err) {
        console.error("Error accessing camera: ", err);
        if (err.name === 'NotAllowedError') {
            statusMsg.textContent = "Error: Camera permission denied.";
        } else {
            statusMsg.textContent = `Error: ${err.message}`;
        }
        // Start recognition anyway if only camera fails
        recognition.start();
    }
}

function stopListening() {
    isListening = false;
    recognition.stop();
    
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
        videoFeed.srcObject = null;
    }
    
    recordBtn.classList.remove('listening');
    recordBtn.querySelector('span').textContent = 'Start Listening';
    statusMsg.textContent = 'Stopped. Press the button to start again.';
}

// Event Listeners
recordBtn.addEventListener('click', () => {
    if (isListening) {
        stopListening();
    } else {
        startListening();
    }
});

// Reset UI on language change
const handleLangChange = () => {
    originalText.textContent = '...';
    translatedText.textContent = '...';
    if (isListening) {
        stopListening();
        setTimeout(startListening, 100);
    }
};

sourceLangSelect.addEventListener('change', handleLangChange);
targetLangSelect.addEventListener('change', handleLangChange);

