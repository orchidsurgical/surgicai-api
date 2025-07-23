import {
    TranscribeStreamingClient,
    StartMedicalStreamTranscriptionCommand,
} from "@aws-sdk/client-transcribe-streaming";

const LanguageCode = "en-US";
const MediaEncoding = "pcm";
const MediaSampleRateHertz = "16000";


async function getCredentials() {
    try {
        const response = await fetch(`/api/v1/transcribe/credentials/`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return {
            accessKeyId: data.AccessKeyId,
            secretAccessKey: data.SecretAccessKey,
            sessionToken: data.SessionToken,
            expiration: new Date(data.Expiration),
        };
    } catch (error) {
        console.error('Error fetching credentials:', error);
        return null;
    }
}

let isDictating = false;
let stopDictationSignal = null;
let audioContextRef = null;
let processorRef = null;
let sourceRef = null;
let mediaStreamRef = null;
let lastPartial = { index: null, length: 0 };

// Browser audio stream setup
async function* getAudioStream() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStreamRef = stream;
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioContextRef = audioContext;
    const source = audioContext.createMediaStreamSource(stream);
    sourceRef = source;
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    processorRef = processor;
    source.connect(processor);
    processor.connect(audioContext.destination);

    // Use a queue to buffer audio chunks
    const queue = [];
    stopDictationSignal = false;
    processor.onaudioprocess = (e) => {
        if (stopDictationSignal) return;
        const input = e.inputBuffer.getChannelData(0);
        const pcm = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) {
            pcm[i] = Math.max(-32768, Math.min(32767, input[i] * 32768));
        }
        const audioChunk = new Uint8Array(pcm.buffer);
        if (audioChunk.length > 0) {
            queue.push({ AudioEvent: { AudioChunk: audioChunk } });
        }
    };
    // Yield audio chunks as they arrive
    while (!stopDictationSignal) {
        if (queue.length > 0) {
            yield queue.shift();
        } else {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    processor.disconnect();
    source.disconnect();
    audioContext.close();
}

async function startDictation() {
    if (isDictating) return;
    isDictating = true;
    // Update button to show starting state
    let dictationButton = document.getElementById('dictationButton');
    if (dictationButton) {
        dictationButton.innerHTML = '<i class="bi bi-hourglass-split me-1"></i>Starting Dictation...';
        dictationButton.disabled = true;
    }

    const credentials = await getCredentials();
    const client = new TranscribeStreamingClient({
        region: "us-east-1",
        credentials
    });
    const params = {
        LanguageCode,
        MediaEncoding,
        MediaSampleRateHertz,
        Specialty: "PRIMARYCARE", // required by AWS Transcribe Medical
        Type: "DICTATION",       // required by AWS Transcribe Medical
        VocabularyName: "SurgicalTerms", // Custom vocabulary name
        AudioStream: getAudioStream(),
    }

    // Update button to show transcription is active
    if (dictationButton) {
        dictationButton.innerHTML = '<i class="bi bi-mic-fill me-1"></i>Stop Dictation';
        dictationButton.classList.add('btn-dictating');
        dictationButton.classList.remove('btn-outline-primary');
        dictationButton.disabled = false;
        dictationButton.onclick = stopDictation;
    }

    const command = new StartMedicalStreamTranscriptionCommand(params);

    const response = await client.send(command);

    try {
        for await (const event of response.TranscriptResultStream) {
            if (event.TranscriptEvent) {
                const results = event.TranscriptEvent.Transcript.Results;
                if (results && results.length > 0) {
                    console.log(results);
                }
                insertTranscriptToQuill(event);
            }
        }
    } catch (error) {
        console.error('Error processing transcription stream:', error);
    }
}

function stopDictation() {
    stopDictationSignal = true;
    if (processorRef) processorRef.disconnect();
    if (sourceRef) sourceRef.disconnect();
    if (audioContextRef) audioContextRef.close();
    if (mediaStreamRef) {
        mediaStreamRef.getTracks().forEach(track => track.stop());
        mediaStreamRef = null;
    }
    let dictationButton = document.getElementById('dictationButton');
    if (dictationButton) {
        dictationButton.innerHTML = '<i class="bi bi-mic me-1"></i>Start Dictation';
        dictationButton.classList.remove('btn-dictating');
        dictationButton.classList.add('btn-outline-primary');
        dictationButton.onclick = startDictation;
    }
    isDictating = false;
}

function insertTranscriptToQuill(event) {
    let quillInstance = window.quill;
    if (!quillInstance && window.Quill) {
        const editorElem = document.getElementById('editor');
        if (editorElem && editorElem.__quill) {
            quillInstance = editorElem.__quill;
        }
    }
    const results = event.TranscriptEvent.Transcript.Results;
    if (results && results.length > 0) {
        const result = results[0];
        if (result.Alternatives && result.Alternatives.length > 0) {
            let transcript = result.Alternatives[0].Transcript;
            if (transcript) {
                // Remove previous partial highlight if present
                if (lastPartial.index !== null && lastPartial.length > 0) {
                    quillInstance.formatText(lastPartial.index, lastPartial.length, { background: false }, 'silent');
                    quillInstance.deleteText(lastPartial.index, lastPartial.length, 'silent');
                }
                // Insert or overwrite transcript
                const range = quillInstance.getSelection(true);
                let index = range ? range.index : quillInstance.getLength();
                let length = range ? range.length : 0;
                if (length > 0) {
                    quillInstance.deleteText(index, length, 'silent');
                }
                // Check if previous character is a period
                let needsSpace = false;
                if (index > 0) {
                    const prevChar = quillInstance.getText(index - 1, 1);
                    if (prevChar === '.') {
                        needsSpace = true;
                    }
                }
                // Capitalize first letter of transcript
                transcript = transcript.charAt(0).toUpperCase() + transcript.slice(1);
                let insertText = (needsSpace ? ' ' : '') + transcript + ' ';
                quillInstance.insertText(index, insertText, 'silent');
                // Always use formatText for background color
                if (result.IsPartial) {
                    quillInstance.formatText(index, insertText.length, { background: '#e3f2fd' }, 'silent');
                } else {
                    quillInstance.formatText(index, insertText.length, { background: false }, 'silent');
                }
                // Track the new partial
                lastPartial.index = index;
                lastPartial.length = insertText.length;
                // If result is final, move cursor and reset partial tracking
                if (!result.IsPartial) {
                    quillInstance.setSelection(index + insertText.length, 0);
                    lastPartial.index = null;
                    lastPartial.length = 0;
                } else {
                    quillInstance.setSelection(index + insertText.length, 0);
                }
            }
        }
    }
}

function toggleDictation() {
    if (isDictating) {
        stopDictation();
    } else {
        startDictation();
    }
}

// Add to global context for script tag usage
window.startDictation = startDictation;
window.stopDictation = stopDictation;
window.toggleDictation = toggleDictation;
