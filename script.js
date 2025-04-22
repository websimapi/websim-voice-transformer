// Global variables
let voices = [];
let selectedVoice = null;
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let recognition = null;

// Initialize speech recognition
function initSpeechRecognition() {
    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!window.SpeechRecognition) {
        alert("Speech recognition not supported in this browser. Please try Chrome or Edge.");
        return null;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US'; // Default language
    
    recognition.onresult = (event) => {
        const results = event.results;
        const recognizedText = Array.from(results)
            .map(result => result[0].transcript)
            .join(' ');
        
        document.getElementById('recognized-text').innerHTML = `<p>${recognizedText}</p>`;
        
        // For complete sentences, speak using TTS
        if (results[results.length - 1].isFinal) {
            speakWithTTS(recognizedText);
        }
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
    };
    
    return recognition;
}

// Load TTS voices
function loadVoices() {
    const voiceSelect = document.getElementById('voice-select');
    voiceSelect.innerHTML = ''; // Clear options
    
    voices = speechSynthesis.getVoices();
    
    voices.forEach((voice, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${voice.name} (${voice.lang})`;
        voiceSelect.appendChild(option);
    });
    
    // Set default voice
    if (voices.length > 0) {
        selectedVoice = voices[0];
    }
}

// Speak text using the selected TTS voice
function speakWithTTS(text) {
    if (!selectedVoice) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = selectedVoice;
    utterance.pitch = 1;
    utterance.rate = 1;
    utterance.volume = 1;
    
    speechSynthesis.speak(utterance);
}

// Start recording
async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };
        
        mediaRecorder.start();
        isRecording = true;
        
        // Update UI
        document.getElementById('status-indicator').classList.add('recording');
        document.getElementById('status-text').textContent = 'Recording...';
        document.getElementById('start-recording').disabled = true;
        document.getElementById('stop-recording').disabled = false;
        
        // Start speech recognition
        if (recognition) {
            recognition.start();
        }
    } catch (err) {
        console.error('Error accessing microphone:', err);
        alert('Error accessing your microphone. Please check permissions and try again.');
    }
}

// Stop recording
function stopRecording() {
    if (!mediaRecorder) return;
    
    mediaRecorder.stop();
    isRecording = false;
    
    // Update UI
    document.getElementById('status-indicator').classList.remove('recording');
    document.getElementById('status-text').textContent = 'Not recording';
    document.getElementById('start-recording').disabled = false;
    document.getElementById('stop-recording').disabled = true;
    
    // Stop speech recognition
    if (recognition) {
        recognition.stop();
    }
    
    // Close media tracks
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Initialize speech recognition
    recognition = initSpeechRecognition();
    
    // Load voices when available
    speechSynthesis.onvoiceschanged = loadVoices;
    
    // Check if voices are already loaded
    if (speechSynthesis.getVoices().length > 0) {
        loadVoices();
    }
    
    // Event listeners
    document.getElementById('voice-select').addEventListener('change', (e) => {
        const voiceIndex = parseInt(e.target.value);
        selectedVoice = voices[voiceIndex];
    });
    
    document.getElementById('test-voice').addEventListener('click', () => {
        speakWithTTS('This is a test of the selected voice. Does it sound good?');
    });
    
    document.getElementById('start-recording').addEventListener('click', startRecording);
    document.getElementById('stop-recording').addEventListener('click', stopRecording);
});

