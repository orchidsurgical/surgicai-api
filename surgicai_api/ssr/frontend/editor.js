import Quill from 'quill';
import {
  TranscribeStreamingClient,
  StartMedicalStreamTranscriptionCommand
} from '@aws-sdk/client-transcribe-streaming';

// Global variables
let quill;
let currentNote = null;
let autoSaveInterval = null;
let isLoading = false;
let hasUnsavedChanges = false;
let isInitialLoad = true; // Flag to prevent triggering unsaved changes during initial load
let lastCursorPosition = 0; // Track last known cursor position
let allTemplates = []; // Store available templates
let pendingTemplateChange = null; // Store pending template change data

// Dictation variables
let audioBuffer = []; // Buffer to hold audio data
let processor = null;
let isDictating = false;
let mediaStream = null;
let audioContext = null;
let transcriptionStream = null;
let dictationButton = null;
let abortController = null;

// Helper function to convert Float32Array to Int16 PCM
function floatTo16BitPCM(float32Array) {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  let offset = 0;
  for (let i = 0; i < float32Array.length; i++) {
    let sample = Math.max(-1, Math.min(1, float32Array[i]));
    sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    view.setInt16(offset, sample, true);
    offset += 2;
  }
  return new Uint8Array(buffer);
}

// Get AWS credentials for transcription
async function getTranscriptionCredentials() {
  try {
    const response = await fetch('/api/v1/transcribe/credentials/', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      accessKeyId: data.AccessKeyId,
      secretAccessKey: data.SecretAccessKey,
      sessionToken: data.SessionToken,
      region: 'us-east-1'
    };
  } catch (error) {
    console.error('Error getting transcription credentials:', error);
    showToast('Failed to get transcription credentials: ' + error.message, 'danger');
    throw error;
  }
}

// Update Quill editor with transcription text
function updateOperativeNoteUI(text, isPartial) {
  if (!quill) return;
  
  const currentSelection = quill.getSelection();
  const currentCursor = currentSelection ? currentSelection.index : quill.getLength() - 1;
  
  if (isPartial) {
    // For partial results, we'll show a preview but not insert permanently
    console.log('Partial transcript:', text);
  } else {
    // Final result - insert into the editor
    if (text && text.trim()) {
      // Add space before if not at beginning and previous char isn't whitespace
      const textToInsert = (currentCursor > 0 && 
                           !quill.getText(currentCursor - 1, 1).match(/\s/)) ? 
                           ' ' + text.trim() + ' ' : text.trim() + ' ';
      
      quill.insertText(currentCursor, textToInsert, 'user');
      quill.setSelection(currentCursor + textToInsert.length);
      
      // Mark as unsaved
      hasUnsavedChanges = true;
      updateSaveIndicator('modified');
      
      // Detect template fields after inserting text
      setTimeout(detectAndHighlightTemplateFields, 100);
    }
  }
}

async function* audioStreamGenerator() {
  while (isDictating) {
    if (audioBuffer.length) {
      // wrap in Uint8Array for v3 SDK
      yield { AudioEvent: { AudioChunk: new Uint8Array(audioBuffer.shift()) } };
    } else {
      // throttle to avoid a tight loop
      await new Promise(r => setTimeout(r, 20));
    }
  }
  // once isDictating===false, generator returns and SDK closes the socket
}

// Start dictation functionality
async function startDictation() {
  if (isDictating) {
    return stopDictation();
  }

  // 1) grab creds, mic, context, etc…
  const creds = await getTranscriptionCredentials();
  mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  audioContext = new AudioContext({ sampleRate: 16000 });
  const source = audioContext.createMediaStreamSource(mediaStream);
  processor = audioContext.createScriptProcessor(4096, 1, 1);
  let audioBuffer = [];
  processor.onaudioprocess = evt => {
    if (!isDictating) return;
    const pcm = floatTo16BitPCM(evt.inputBuffer.getChannelData(0));
    audioBuffer.push(pcm);
  };
  source.connect(processor);
  processor.connect(audioContext.destination);

  // 2) prepare AWS client & controller
  const client = new TranscribeStreamingClient({
    region: "us-east-1",
    credentials: {
      accessKeyId:     creds.accessKeyId,
      secretAccessKey: creds.secretAccessKey,
      sessionToken:    creds.sessionToken
    }
  });
  abortController = new AbortController();
  audioBuffer = []; // Reset audio buffer
  isDictating = true;

  // 3) kick off the stream with the generator and abortSignal
  const command = new StartMedicalStreamTranscriptionCommand({
    LanguageCode:           "en-US",
    MediaEncoding:          "pcm",
    MediaSampleRateHertz:   16000,
    Specialty:              "PRIMARYCARE",
    Type:                   "DICTATION",
    // VocabularyName:         "YourCustomSurgicalVocab",
    AudioStream:            audioStreamGenerator(),
    abortSignal:            abortController.signal
  });

  let response;
  try {
    response = await client.send(command);
  } catch (err) {
    if (err.name === "AbortError") {
      console.log("Transcribe stream aborted");
    } else {
      throw err;
    }
  }

  // 4) read transcripts
  (async () => {
    if (!response) return;
    try {
      for await (const event of response.TranscriptResultStream) {
        const r = event.Transcript?.Results?.[0];
        if (r) {
          updateOperativeNoteUI(r.Alternatives[0].Transcript, r.IsPartial);
        }
      }
    } catch (e) {
      if (e.name !== "AbortError") console.error(e);
    }
  })();

  // 5) update UI
  if (!dictationButton) {
    dictationButton = document.getElementById('dictationButton');
  }
  if (dictationButton) {
    dictationButton.innerHTML = '<i class="bi bi-mic-fill me-1"></i>Stop Dictation';
    dictationButton.classList.add('btn-dictating');
    dictationButton.classList.remove('btn-outline-primary');
  }
}

// Stop dictation functionality
function stopDictation() {
  if (!isDictating) return;
  isDictating = false;

  // stop the audio graph
  processor.disconnect();
  audioContext.close();
  mediaStream.getTracks().forEach(t => t.stop());

  // this will cause the SDK’s WebSocket to close cleanly
  abortController.abort();

  // … update your UI back to “Start Dictation” …
  if (dictationButton) {
    dictationButton.innerHTML = '<i class="bi bi-mic-fill me-1"></i>Start Dictation';
    dictationButton.classList.remove('btn-dictating');
    dictationButton.classList.add('btn-outline-primary');
  }
}

// Initialize the editor
function initializeEditor() {
  console.log('Editor page loaded');
  
  // Wait for Quill to load
  function waitForQuill() {
    if (typeof Quill !== 'undefined') {
      console.log('Quill is available, initializing editor...');
      initializeQuill();
      loadDocument();
      setupAutoSave();
      setupBeforeUnload();
      setupTitleChangeListener();
      setupKeyboardShortcuts();
      initializeTooltips();
    } else {
      console.log('Waiting for Quill to load...');
      setTimeout(waitForQuill, 100);
    }
  }
  
  waitForQuill();
}

function initializeQuill() {
  try {
    const editorElement = document.getElementById('editor');
    if (!editorElement) {
      throw new Error('Editor element not found');
    }
    
    quill = new Quill('#editor', {
      theme: 'snow',
      modules: {
        toolbar: false, // Completely disable toolbar
        keyboard: {
          bindings: {
            tab: {
              key: 'Tab',
              handler: function(range, context) {
                return false;
              }
            }
          }
        }
      },
      formats: ['background', 'color'], // Allow background and color for field highlighting
      placeholder: 'Start typing your operative note...'
    });
    
    console.log('Quill initialized successfully');
    
    // Listen for text changes
    quill.on('text-change', function(delta, oldDelta, source) {
      if (source === 'user' && !isInitialLoad) {
        hasUnsavedChanges = true;
        updateSaveIndicator('modified');
        // Detect template fields with a longer delay to allow typing to complete
        clearTimeout(window.fieldDetectionTimeout);
        window.fieldDetectionTimeout = setTimeout(detectAndHighlightTemplateFields, 500);
      }
    });
    
    // Listen for selection changes to track cursor position
    quill.on('selection-change', function(range, oldRange, source) {
      if (range) {
        lastCursorPosition = range.index;
      }
    });
  } catch (error) {
    console.error('Error initializing Quill:', error);
    showToast('Error initializing editor. Please refresh the page.', 'danger');
  }
}

function loadDocument() {
  // Get note_id from the template (we'll need to pass this from the template)
  const noteId = window.editorConfig?.noteId || document.body.dataset.noteId;
  console.log('Loading document:', noteId);
  
  showLoading(true);
  
  fetch(`/api/v1/opnote/${noteId}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('Document loaded:', data);
    currentNote = data;
    populateDocument(data);
    hasUnsavedChanges = false;
    // Don't show any save indicator on initial load
  })
  .catch(error => {
    console.error('Error loading document:', error);
    showToast('Error loading document: ' + error.message, 'danger');
    updateSaveIndicator('error');
  })
  .finally(() => {
    showLoading(false);
  });
}

function populateDocument(note) {
  // Update header
  document.getElementById('documentTitle').value = note.title || '';
  
  // Update last updated with better formatting
  const lastUpdated = note.updated_at ? 
    new Date(note.updated_at).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }) : 'Never';
  document.getElementById('lastUpdated').textContent = 'Last updated: ' + lastUpdated;
  
  // Format dates for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };
  
  document.getElementById('operationStart').textContent = formatDate(note.operation_datetime_start);
  document.getElementById('operationEnd').textContent = formatDate(note.operation_datetime_end);
  
  // Set editor content as plain text
  if (note.text && quill) {
    // Set content as plain text only
    quill.setText(note.text, 'silent');
  } else if (note.text) {
    // Fallback if Quill isn't ready yet
    const editorElement = document.getElementById('editor');
    if (editorElement) {
      editorElement.textContent = note.text;
    }
  }
  
  // Update button states
  updateButtonStates(note.status);
  
  // Reset initial load flag after document is fully populated
  setTimeout(() => {
    isInitialLoad = false;
    // Detect and highlight template fields after initial load
    detectAndHighlightTemplateFields();
  }, 200); // Increased timeout to ensure content is set
}

function detectAndHighlightTemplateFields() {
  if (!quill) return;
  
  const text = quill.getText();
  
  // Find all *** patterns (just the three asterisks)
  const fieldPattern = /\*\*\*/g;
  let matches = [];
  let match;
  
  while ((match = fieldPattern.exec(text)) !== null) {
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      text: match[0]
    });
  }
  
  // Apply highlighting to template fields
  highlightFieldsInEditor(matches);
}

function highlightFieldsInEditor(matches) {
  if (!quill || matches.length === 0) {
    // Clear all formatting if no matches
    if (quill) {
      const fullRange = quill.getLength();
      quill.removeFormat(0, fullRange, 'silent');
    }
    return;
  }
  
  // Store current cursor position
  const currentSelection = quill.getSelection();
  
  // Clear all formatting first
  const fullRange = quill.getLength();
  quill.removeFormat(0, fullRange, 'silent');
  
  // Apply highlighting to each *** field
  matches.forEach((match, index) => {
    try {
      // Apply background color styling to the *** text
      quill.formatText(match.start, match.end - match.start, {
        'background': '#fff3cd',
        'color': '#856404'
      }, 'silent');
    } catch (error) {
      console.warn('Error highlighting field:', error);
    }
  });
  
  // Restore cursor position if it existed
  if (currentSelection) {
    quill.setSelection(currentSelection.index, currentSelection.length, 'silent');
  }
}

function goToNextField() {
  if (!quill) return;
  
  const text = quill.getText();
  const currentCursor = quill.getSelection()?.index ?? lastCursorPosition;
  
  // Find all *** patterns (just the three asterisks)
  const fieldPattern = /\*\*\*/g;
  let nextField = null;
  let match;
  
  while ((match = fieldPattern.exec(text)) !== null) {
    // Find the first field after the current cursor position
    if (match.index > currentCursor) {
      nextField = {
        start: match.index,
        end: match.index + match[0].length
      };
      break;
    }
  }
  
  // If no field found after cursor, wrap around to the first field
  if (!nextField) {
    fieldPattern.lastIndex = 0; // Reset regex
    const firstMatch = fieldPattern.exec(text);
    if (firstMatch) {
      nextField = {
        start: firstMatch.index,
        end: firstMatch.index + firstMatch[0].length
      };
    }
  }
  
  // Focus the editor and move to the next field
  if (nextField) {
    quill.focus();
    quill.setSelection(nextField.start, nextField.end - nextField.start);
    lastCursorPosition = nextField.start;
    
    // Scroll the field into view
    const bounds = quill.getBounds(nextField.start, nextField.end - nextField.start);
    if (bounds) {
      const editorContainer = document.querySelector('.ql-editor');
      if (editorContainer) {
        editorContainer.scrollTo({
          top: bounds.top - 100, // Offset for better visibility
          behavior: 'smooth'
        });
      }
    }
  } else {
    // No fields found, just focus the editor at the last known position
    quill.focus();
    quill.setSelection(lastCursorPosition);
  }
}

function updateButtonStates(status) {
  const saveButton = document.getElementById('saveButton');
  const titleInput = document.getElementById('documentTitle');
  
  if (status === 'submitted') {
    saveButton.disabled = true;
    if (titleInput) {
      titleInput.disabled = true;
      titleInput.style.cursor = 'not-allowed';
      titleInput.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    }
    if (quill) {
      quill.disable();
    }
  } else {
    saveButton.disabled = false;
    if (titleInput) {
      titleInput.disabled = false;
      titleInput.style.cursor = 'text';
      titleInput.style.backgroundColor = 'transparent';
    }
    if (quill) {
      quill.enable();
    }
  }
}

function saveDocument() {
  if (isLoading) return;
  
  const noteId = window.editorConfig?.noteId || document.body.dataset.noteId;
  let content = '';
  
  if (quill) {
    content = quill.getText().trim(); // Get plain text instead of HTML
  } else {
    // Fallback to get content from editor element
    const editorElement = document.getElementById('editor');
    if (editorElement) {
      content = editorElement.textContent || editorElement.innerText || '';
    }
  }
  
  const titleInput = document.getElementById('documentTitle');
  const title = titleInput ? titleInput.value.trim() : '';
  
  if (!title) {
    showToast('Please enter a title for the document', 'warning');
    titleInput?.focus();
    return;
  }
  
  const updateData = {
    title: title,
    text: content
  };
  
  console.log('Saving document:', updateData);
  updateSaveIndicator('saving');
  
  fetch(`/api/v1/opnote/${noteId}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updateData)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('Document saved:', data);
    currentNote = data;
    hasUnsavedChanges = false;
    updateSaveIndicator('saved');
    
    // Remove modified class from title
    const titleInput = document.getElementById('documentTitle');
    if (titleInput) {
      titleInput.classList.remove('modified');
    }
    
    // Update last updated time with better formatting
    const lastUpdated = new Date(data.updated_at).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    document.getElementById('lastUpdated').textContent = 'Last updated: ' + lastUpdated;      
  })
  .catch(error => {
    console.error('Error saving document:', error);
    updateSaveIndicator('error');
    showToast('Error saving document: ' + error.message, 'danger');
  });
}

function editPatientInfo() {
  if (!currentNote) return;
  
  // Format dates for datetime-local inputs
  const formatForInput = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    // Format for datetime-local input
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };
  
  document.getElementById('modalOperationStart').value = formatForInput(currentNote.operation_datetime_start);
  document.getElementById('modalOperationEnd').value = formatForInput(currentNote.operation_datetime_end);
  
  // Load templates and reset template dropdown
  loadTemplatesForModal();
  
  // Show modal
  const modal = new bootstrap.Modal(document.getElementById('patientModal'));
  modal.show();
}

function savePatientInfo() {
  if (isLoading) return;
  
  const noteId = window.editorConfig?.noteId || document.body.dataset.noteId;
  const formData = new FormData(document.getElementById('patientForm'));
  
  // Convert datetime-local values to proper format for API
  const updateData = {
    operation_datetime_start: formData.get('operation_datetime_start') || null,
    operation_datetime_end: formData.get('operation_datetime_end') || null
  };
  
  console.log('Saving patient info:', updateData);
  
  fetch(`/api/v1/opnote/${noteId}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updateData)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('Patient info saved:', data);
    currentNote = data;
    
    const formatDate = (dateStr) => {
      if (!dateStr) return '-';
      const date = new Date(dateStr);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    };
    
    document.getElementById('operationStart').textContent = formatDate(data.operation_datetime_start);
    document.getElementById('operationEnd').textContent = formatDate(data.operation_datetime_end);
    
    // Update last updated time with better formatting
    const lastUpdated = new Date(data.updated_at).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    document.getElementById('lastUpdated').textContent = 'Last updated: ' + lastUpdated;
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('patientModal'));
    modal.hide();
    
    showToast('Operation information updated successfully', 'success');
  })
  .catch(error => {
    console.error('Error saving patient info:', error);
    showToast('Error saving operation information: ' + error.message, 'danger');
  });
}

function setupAutoSave() {
  // Auto-save every 30 seconds if there are unsaved changes
  autoSaveInterval = setInterval(() => {
    if (hasUnsavedChanges && !isLoading && currentNote && currentNote.status !== 'submitted') {
      console.log('Auto-saving document...');
      saveDocument();
    }
  }, 30000); // 30 seconds
}

function setupTitleChangeListener() {
  const titleInput = document.getElementById('documentTitle');
  if (titleInput) {
    titleInput.addEventListener('input', function() {
      const hasChanged = this.value !== (currentNote?.title || '');
      if (hasChanged && !isInitialLoad) {
        hasUnsavedChanges = true;
        updateSaveIndicator('modified');
        this.classList.add('modified');
      } else {
        this.classList.remove('modified');
      }
    });
    
    // Save title on blur if it has changed
    titleInput.addEventListener('blur', function() {
      if (hasUnsavedChanges && this.value !== (currentNote?.title || '')) {
        console.log('Title changed, auto-saving...');
        saveDocument();
      }
    });
    
    // Save title on Enter key
    titleInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.blur(); // Trigger blur event to save
      }
    });
  }
}

function setupBeforeUnload() {
  window.addEventListener('beforeunload', (e) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
    }
  });
}

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', function(e) {
    // Check for Ctrl+S (Windows/Linux) or Cmd+S (Mac)
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault(); // Prevent browser's default save behavior
      console.log('Save shortcut detected');
      saveDocument();
    }
    
    // Check for Tab key to go to next field - always prevent default Tab behavior on this page
    if (e.key === 'Tab') {
      e.preventDefault(); // Prevent default tab behavior
      goToNextField();
    }
  });
}

function updateSaveIndicator(state) {
  const indicator = document.getElementById('saveIndicator');
  const spinner = document.getElementById('saveSpinner');
  const saveIcon = document.getElementById('saveIcon');
  const errorIcon = document.getElementById('errorIcon');
  const message = document.getElementById('saveMessage');
  const unsavedIndicator = document.getElementById('unsavedIndicator');
  
  // Reset
  indicator.className = 'save-indicator';
  spinner.style.display = 'none';
  saveIcon.style.display = 'none';
  errorIcon.style.display = 'none';
  
  switch(state) {
    case 'saving':
      indicator.className = 'save-indicator saving show';
      spinner.style.display = 'inline-block';
      message.textContent = 'Saving...';
      if (unsavedIndicator) unsavedIndicator.style.display = 'none';
      break;
    case 'saved':
      indicator.className = 'save-indicator saved show';
      saveIcon.style.display = 'inline-block';
      message.textContent = 'Saved';
      if (unsavedIndicator) unsavedIndicator.style.display = 'none';
      setTimeout(() => {
        indicator.classList.remove('show');
      }, 2000);
      break;
    case 'error':
      indicator.className = 'save-indicator error show';
      errorIcon.style.display = 'inline-block';
      message.textContent = 'Error saving';
      if (unsavedIndicator) unsavedIndicator.style.display = 'inline-block';
      setTimeout(() => {
        indicator.classList.remove('show');
      }, 5000);
      break;
    case 'modified':
      indicator.className = 'save-indicator show';
      message.textContent = 'Unsaved changes';
      if (unsavedIndicator) unsavedIndicator.style.display = 'inline-block';
      break;
  }
}

function showLoading(show) {
  isLoading = show;
  const overlay = document.getElementById('loadingOverlay');
  if (show) {
    overlay.classList.add('show');
  } else {
    overlay.classList.remove('show');
  }
}

function backToDashboard() {
  if (hasUnsavedChanges) {
    if (!confirm('You have unsaved changes. Are you sure you want to leave?')) {
      return;
    }
  }
  window.location.href = '/dashboard';
}

function initializeTooltips() {
  // Initialize tooltips for info icons
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
}

// Template management functions
function loadTemplatesForModal() {
  fetch('/api/v1/template/', {
    method: 'GET',
    credentials: 'include'
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    allTemplates = data;
    updateModalTemplateDropdown();
  })
  .catch(error => {
    console.error('Error loading templates:', error);
    // Don't show error to user, just leave dropdown empty
  });
}

function updateModalTemplateDropdown() {
  const templateSelect = document.getElementById('modalTemplateSelect');
  if (!templateSelect) return;
  
  // Clear existing options except the first one
  while (templateSelect.children.length > 1) {
    templateSelect.removeChild(templateSelect.lastChild);
  }
  
  // Add template options
  allTemplates.forEach(template => {
    const option = document.createElement('option');
    option.value = template.id;
    option.textContent = template.name;
    templateSelect.appendChild(option);
  });
  
  // Reset to default option
  templateSelect.value = '';
}

function onModalTemplateSelected() {
  const templateSelect = document.getElementById('modalTemplateSelect');
  if (!templateSelect) return;
  
  const templateId = templateSelect.value;
  
  if (!templateId) {
    // No template selected, clear pending change
    pendingTemplateChange = null;
    return;
  }
  
  // Find the selected template
  const selectedTemplate = allTemplates.find(template => template.id === templateId);
  
  if (selectedTemplate) {
    // Store the pending template change but don't apply it yet
    pendingTemplateChange = {
      templateId: templateId,
      templateName: selectedTemplate.name
    };
    
    // Show confirmation modal
    document.getElementById('templateNameConfirm').textContent = selectedTemplate.name;
    const confirmModal = new bootstrap.Modal(document.getElementById('templateChangeModal'));
    confirmModal.show();
  }
}

function cancelTemplateChange() {
  // Reset the dropdown to "Keep current content..."
  const templateSelect = document.getElementById('modalTemplateSelect');
  if (templateSelect) {
    templateSelect.value = '';
  }
  pendingTemplateChange = null;
}

function confirmTemplateChange() {
  if (!pendingTemplateChange) return;
  
  // Fetch the full template details
  fetch(`/api/v1/template/${pendingTemplateChange.templateId}`, {
    method: 'GET',
    credentials: 'include'
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(template => {
    // Replace the content in the Quill editor
    if (quill && template.text) {
      quill.setText(template.text, 'user');
      hasUnsavedChanges = true;
      updateSaveIndicator('modified');
      
      // Detect and highlight template fields
      setTimeout(() => {
        detectAndHighlightTemplateFields();
      }, 100);
    }
    
    // Close confirmation modal
    const confirmModal = bootstrap.Modal.getInstance(document.getElementById('templateChangeModal'));
    confirmModal.hide();
    
    // Clear pending change
    pendingTemplateChange = null;
    
    showToast(`Content replaced with template: ${template.name}`, 'success');
  })
  .catch(error => {
    console.error('Error loading template details:', error);
    showToast('Error loading template content', 'danger');
    cancelTemplateChange();
  });
}

function toggleHelpPanel() {
  const helpPanel = document.getElementById('helpPanel');
  const editorContainer = document.querySelector('.editor-container');
  const helpToggleBtn = document.getElementById('helpToggleBtn');
  
  if (helpPanel && editorContainer && helpToggleBtn) {
    const isOpen = helpPanel.classList.contains('open');
    
    if (isOpen) {
      // Close panel
      helpPanel.classList.remove('open');
      editorContainer.classList.remove('panel-open');
      helpToggleBtn.classList.remove('panel-open');
    } else {
      // Open panel
      helpPanel.classList.add('open');
      editorContainer.classList.add('panel-open');
      helpToggleBtn.classList.add('panel-open');
    }
  }
}

// Global function that can be called from inline HTML - use window.showToast if available
function showToast(message, type) {
  if (window.showToast) {
    window.showToast(message, type);
  } else {
    console.log(`Toast [${type}]: ${message}`);
  }
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
  }
  // Stop dictation if running
  if (isDictating) {
    stopDictation();
  }
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeEditor);

// Attach all top-level functions to window for inline event handlers (ensure this is last)
window.floatTo16BitPCM = floatTo16BitPCM;
window.getTranscriptionCredentials = getTranscriptionCredentials;
window.updateOperativeNoteUI = updateOperativeNoteUI;
window.startDictation = startDictation;
window.stopDictation = stopDictation;
window.initializeEditor = initializeEditor;
window.initializeQuill = initializeQuill;
window.loadDocument = loadDocument;
window.populateDocument = populateDocument;
window.detectAndHighlightTemplateFields = detectAndHighlightTemplateFields;
window.highlightFieldsInEditor = highlightFieldsInEditor;
window.goToNextField = goToNextField;
window.updateButtonStates = updateButtonStates;
window.saveDocument = saveDocument;
window.editPatientInfo = editPatientInfo;
window.savePatientInfo = savePatientInfo;
window.setupAutoSave = setupAutoSave;
window.setupTitleChangeListener = setupTitleChangeListener;
window.setupBeforeUnload = setupBeforeUnload;
window.setupKeyboardShortcuts = setupKeyboardShortcuts;
window.updateSaveIndicator = updateSaveIndicator;
window.showLoading = showLoading;
window.backToDashboard = backToDashboard;
window.initializeTooltips = initializeTooltips;
window.loadTemplatesForModal = loadTemplatesForModal;
window.updateModalTemplateDropdown = updateModalTemplateDropdown;
window.onModalTemplateSelected = onModalTemplateSelected;
window.cancelTemplateChange = cancelTemplateChange;
window.confirmTemplateChange = confirmTemplateChange;
window.toggleHelpPanel = toggleHelpPanel;
window.showToast = showToast;
