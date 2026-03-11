const recordBtn = document.getElementById('record-btn');
const langToggle = document.getElementById('lang-toggle');
const originalText = document.getElementById('original-text');
const translatedText = document.getElementById('translated-text');
const statusMsg = document.getElementById('status');
const labelLeft = document.getElementById('label-left');
const labelRight = document.getElementById('label-right');

let isListening = false;
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
            
            // Only translate final results to reduce API calls and perceived latency
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
            recognition.start(); // Keep listening if not manually stopped
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
    const sourceLang = langToggle.checked ? 'fi' : 'en';
    const targetLang = langToggle.checked ? 'en' : 'fi';
    
    statusMsg.textContent = 'Translating...';
    
    try {
        // Using MyMemory Free API (no key required for small volumes)
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

function startListening() {
    const lang = langToggle.checked ? 'fi-FI' : 'en-US';
    recognition.lang = lang;
    recognition.start();
}

function stopListening() {
    isListening = false;
    recognition.stop();
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

langToggle.addEventListener('change', () => {
    const isFItoEN = langToggle.checked;
    
    if (isFItoEN) {
        labelLeft.classList.remove('active');
        labelRight.classList.add('active');
        originalText.setAttribute('placeholder', 'Puhu nyt...');
        translatedText.setAttribute('placeholder', 'Translation appears here...');
    } else {
        labelLeft.classList.add('active');
        labelRight.classList.remove('active');
        originalText.setAttribute('placeholder', 'Listening...');
        translatedText.setAttribute('placeholder', 'Käännös ilmestyy tänne...');
    }
    
    // Reset contents on toggle
    originalText.textContent = '...';
    translatedText.textContent = '...';
    
    if (isListening) {
        stopListening();
        setTimeout(startListening, 100); // Restart with new language
    }
});

// Set initial active state
labelLeft.classList.add('active');
