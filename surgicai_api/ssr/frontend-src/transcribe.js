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
let lastPartial = { element: null, index: null, length: 0 };
let lastFocusedElement = null; // Track last focused editor or field element

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
                insertTranscriptAtCursor(event);
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

function insertTranscriptAtCursor(event) {
    const results = event.TranscriptEvent.Transcript.Results;
    if (!results || results.length === 0) return;
    
    const result = results[0];
    if (!result.Alternatives || result.Alternatives.length === 0) return;
    
    let transcript = result.Alternatives[0].Transcript;
    if (!transcript) return;
    
    // Check if we're currently focused on a field component
    const activeElement = document.activeElement;
    const isInFieldComponent = activeElement && activeElement.classList.contains('field-content');
    
    // Use last focused element if current element isn't relevant
    let targetElement = activeElement;
    if (!isInFieldComponent && !activeElement.classList.contains('ql-editor')) {
        targetElement = lastFocusedElement;
    }
    
    // Determine if we should use field insertion or Quill insertion
    if (targetElement) {
        insertTranscriptToField(targetElement, transcript, result.IsPartial);
    }
}

function insertTranscriptToField(fieldElement, transcript, isPartial) {
    if (!isPartial) {
        // Get current selection/cursor position
        const selection = window.getSelection();
        
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            
            // Check if the range is within the field element
            if (fieldElement.contains(range.startContainer)) {
                // Store the current range position before any modifications
                const startContainer = range.startContainer;
                const startOffset = range.startOffset;
                
                // Delete any selected text first (if there's a selection)
                if (!range.collapsed) {
                    range.deleteContents();
                }
                
                // Check if we need to add a space before the transcript
                let needsSpace = false;
                
                // Only add space if not at the beginning of content
                if (startOffset > 0) {
                    if (startContainer.nodeType === Node.TEXT_NODE) {
                        // Check the character before the cursor in the text node
                        const prevChar = startContainer.textContent.charAt(startOffset - 1);
                        needsSpace = prevChar !== ' ';
                    } else if (startContainer.nodeType === Node.ELEMENT_NODE && startOffset > 0) {
                        // Check the last character of the previous node
                        const prevNode = startContainer.childNodes[startOffset - 1];
                        if (prevNode && prevNode.nodeType === Node.TEXT_NODE) {
                            const lastChar = prevNode.textContent.slice(-1);
                            needsSpace = lastChar !== ' ';
                        }
                    }
                }
                
                // Prepare the text to insert
                const textToInsert = needsSpace ? ' ' + transcript : transcript;
                
                // Use execCommand for better cursor positioning
                if (document.execCommand) {
                    document.execCommand('insertText', false, textToInsert);
                } else {
                    // Fallback for browsers that don't support execCommand
                    const textNode = document.createTextNode(textToInsert);
                    range.insertNode(textNode);
                    
                    // Calculate the new cursor position
                    const newOffset = startOffset + textToInsert.length;
                    range.setStart(startContainer, newOffset);
                    range.setEnd(startContainer, newOffset);
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            } else {
                // Range is not in the field element, use fallback
                fieldElement.focus();
                
                // Check if we need space before appending
                let needsSpace = false;
                if (fieldElement.textContent.length > 0) {
                    const lastChar = fieldElement.textContent.slice(-1);
                    needsSpace = lastChar !== ' ';
                }
                
                const textToInsert = needsSpace ? ' ' + transcript : transcript;
                const textNode = document.createTextNode(textToInsert);
                fieldElement.appendChild(textNode);
                
                // Position cursor at the end of the inserted text
                const range = document.createRange();
                range.setStartAfter(textNode);
                range.setEndAfter(textNode);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        } else {
            // No selection range, focus the element and position at end
            fieldElement.focus();
            
            // Check if we need space before appending
            let needsSpace = false;
            if (fieldElement.textContent.length > 0) {
                const lastChar = fieldElement.textContent.slice(-1);
                needsSpace = lastChar !== ' ';
            }
            
            // Create a range at the end of existing content
            const range = document.createRange();
            if (fieldElement.childNodes.length > 0) {
                range.setStartAfter(fieldElement.lastChild);
                range.setEndAfter(fieldElement.lastChild);
            } else {
                range.setStart(fieldElement, 0);
                range.setEnd(fieldElement, 0);
            }
            
            // Insert transcript at the end
            const textToInsert = needsSpace ? ' ' + transcript : transcript;
            const textNode = document.createTextNode(textToInsert);
            range.insertNode(textNode);
            
            // Position cursor at the end of the inserted text
            range.setStartAfter(textNode);
            range.setEndAfter(textNode);
            selection.removeAllRanges();
            selection.addRange(range);
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

// Track focus changes on editor and field elements
document.addEventListener('focusin', function(event) {
    const target = event.target;
    
    // Check if the focused element is the Quill editor or a field element
    if (target.classList.contains('ql-editor') || 
        target.classList.contains('field-content')) {
        lastFocusedElement = target;
        console.log('Focused element:', lastFocusedElement);
    }
});

// Also track when elements lose focus to maintain the last known good element
document.addEventListener('focusout', function(event) {
    // Keep the lastFocusedElement as is - don't clear it on blur
    // This way we maintain the last known editor/field that was focused
});
