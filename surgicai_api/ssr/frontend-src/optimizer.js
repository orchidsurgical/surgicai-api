;(function () {
    /**
     * Sends a POST request to the /api/v1/opnote/<opnoteid>/optimize/questions/ endpoint.
     * @param {string} opNoteId - The operative note ID.
     * @returns {Promise<Object>} - The response data containing questions.
     */
    async function fetchOptimizationQuestions(opNoteId) {
        const response = await fetch(`/api/v1/opnote/${opNoteId}/optimize/questions/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error('Failed to fetch optimization questions');
        }
        return await response.json();
    }

    /**
     * Disables the Quill editor, grays it out, and shows the optimization modal.
     * @param {string} opNoteId - The operative note ID.
     */
    function showOptimizationModal(opNoteId) {
        // Disable the Quill editor
        if (window.quill) {
            window.quill.disable();
        }

        // Gray out the editor container
        const editorContainer = document.querySelector('.editor-container');
        if (editorContainer) {
            editorContainer.style.opacity = '0.5';
            editorContainer.style.pointerEvents = 'none';
        }

        // Create and show the optimization modal
        createOptimizationModal(opNoteId);
    }

    /**
     * Re-enables the Quill editor and removes the gray overlay.
     */
    function hideOptimizationModal() {
        // Re-enable the Quill editor
        if (window.quill) {
            window.quill.enable();
        }

        // Remove gray overlay from editor container
        const editorContainer = document.querySelector('.editor-container');
        if (editorContainer) {
            editorContainer.style.opacity = '';
            editorContainer.style.pointerEvents = '';
        }

        // Remove the modal from DOM
        const modal = document.getElementById('optimizationModal');
        if (modal) {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) {
                bsModal.hide();
            }
            modal.remove();
        }
    }

    /**
     * Creates the optimization modal HTML and adds it to the DOM.
     * @param {string} opNoteId - The operative note ID.
     */
    function createOptimizationModal(opNoteId) {
        // Remove existing modal if present
        const existingModal = document.getElementById('optimizationModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Create modal HTML
        const modalHTML = `
            <style>
                .progress-dot {
                    display: inline-block;
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background-color: #dee2e6;
                    margin: 0 4px;
                    cursor: default;
                    transition: all 0.2s ease;
                }
                
                .progress-dot.active {
                    background-color: var(--primary-color, #0066cc);
                    transform: scale(1.2);
                }
                
                .progress-dot.answered {
                    background-color: #28a745;
                }
                
                .progress-dot.answered.active {
                    background-color: var(--primary-color, #0066cc);
                }
                
                .progress-dot.accepted {
                    background-color: #28a745;
                }
                
                .progress-dot.rejected {
                    background-color: #dc3545;
                }
                
                .progress-dot.accepted.active {
                    background-color: #198754;
                    transform: scale(1.2);
                }
                
                .progress-dot.rejected.active {
                    background-color: #dc3545;
                    transform: scale(1.2);
                }
                
                .question-slide {
                    min-height: 200px;
                }
                
                .suggestion-slide {
                    min-height: 300px;
                }
            </style>
            <div class="modal fade" id="optimizationModal" tabindex="-1" aria-labelledby="optimizationModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="optimizationModalLabel">
                                <i class="bi bi-magic me-2"></i>Optimize Your Operative Note
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <!-- Progress bar -->
                            <div class="mb-4">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="text-muted small" id="progressLabel">Analyzing your operative note...</span>
                                </div>
                                <div class="progress" style="height: 6px;">
                                    <div class="progress-bar bg-primary" role="progressbar" id="progressBar" 
                                         style="width: 25%;" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
                                </div>
                            </div>
                            
                            <div class="text-center py-4" id="optimizationLoading">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Loading optimization questions...</span>
                                </div>
                                <p class="mt-3">Loading optimization questions...</p>
                            </div>
                            <div id="optimizationContent" style="display: none;">
                                <!-- Questions will be loaded here -->
                            </div>
                        </div>
                        <div class="modal-footer">
                            <!-- Footer content removed - using inline buttons in modal body -->
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('optimizationModal'));
        modal.show();

        // Add event listeners
        const modalElement = document.getElementById('optimizationModal');
        modalElement.addEventListener('hidden.bs.modal', hideOptimizationModal);

        // Store note ID globally for later use
        window.currentOptimizationNoteId = opNoteId;

        // Load optimization questions
        loadOptimizationQuestions(opNoteId);
    }

    /**
     * Loads optimization questions and populates the modal.
     * @param {string} opNoteId - The operative note ID.
     */
    async function loadOptimizationQuestions(opNoteId) {
        try {
            const data = await fetchOptimizationQuestions(opNoteId);
            displayOptimizationQuestions(data);
        } catch (error) {
            console.error('Error loading optimization questions:', error);
            displayOptimizationError(error.message);
        }
    }

    /**
     * Displays optimization questions in the modal.
     * @param {Object} data - The response data containing questions.
     */
    function displayOptimizationQuestions(data) {
        const loadingDiv = document.getElementById('optimizationLoading');
        const contentDiv = document.getElementById('optimizationContent');

        if (!data.questions || data.questions.length === 0) {
            displayOptimizationError('No optimization questions available for this note.');
            return;
        }

        // Hide loading and show content
        loadingDiv.style.display = 'none';
        contentDiv.style.display = 'block';

        // Update progress to stage 2
        updateProgressBar(25, 'Requesting clarification...');

        // Store questions data globally for navigation
        window.optimizationQuestions = data.questions;
        window.currentQuestionIndex = 0;
        window.selectedAnswers = new Array(data.questions.length).fill(null);

        // Build the modal content with navigation
        const questionsHTML = `
            <form id="optimizationForm">
                <div id="questionContainer">
                    <!-- Current question will be displayed here -->
                </div>
                
                <!-- Progress dots -->
                <div class="text-center mt-4 mb-3" id="progressDots">
                    ${data.questions.map((_, index) => 
                        `<span class="progress-dot ${index === 0 ? 'active' : ''}" data-question="${index}"></span>`
                    ).join('')}
                </div>
            
            </form>
        `;
        
        contentDiv.innerHTML = questionsHTML;

        // Add navigation event listeners
        setupQuestionNavigation();
        
        // Display the first question
        displayCurrentQuestion();
    }

    /**
     * Displays an error message in the modal.
     * @param {string} errorMessage - The error message to display.
     */
    function displayOptimizationError(errorMessage) {
        const loadingDiv = document.getElementById('optimizationLoading');
        const contentDiv = document.getElementById('optimizationContent');

        loadingDiv.style.display = 'none';
        contentDiv.style.display = 'block';
        contentDiv.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>
                <strong>Error:</strong> ${errorMessage}
            </div>
        `;
    }

    /**
     * Updates the progress bar with the current stage and percentage.
     * @param {number} percentage - The percentage to display (0-100)
     * @param {string} label - The label to display
     */
    function updateProgressBar(percentage, label) {
        const progressBar = document.getElementById('progressBar');
        const progressLabel = document.getElementById('progressLabel');

        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
            progressBar.setAttribute('aria-valuenow', percentage);
        }
        
        if (progressLabel) {
            progressLabel.textContent = label;
        }
    }

    /**
     * Calculates the current progress based on answered questions.
     * @returns {number} The current percentage (25-75)
     */
    function calculateQuestionProgress() {
        if (!window.optimizationQuestions || !window.selectedAnswers) {
            return 25; // Still in stage 1
        }

        const totalQuestions = window.optimizationQuestions.length;
        const answeredQuestions = window.selectedAnswers.filter(answer => answer !== null).length;
        const questionProgressRange = 50; // Stage 2 is 50% of total progress
        const questionProgress = (answeredQuestions / totalQuestions) * questionProgressRange;
        
        return 25 + questionProgress; // Stage 1 (25%) + progress through stage 2
    }

    /**
     * Sets up navigation event listeners for question navigation.
     */
    function setupQuestionNavigation() {
        // Progress dots are now display-only, no click functionality
        // Users must answer questions to advance
    }

    /**
     * Displays the current question based on currentQuestionIndex.
     */
    function displayCurrentQuestion() {
        const questionContainer = document.getElementById('questionContainer');
        const currentQuestion = window.optimizationQuestions[window.currentQuestionIndex];
        
        let questionHTML = `
            <div class="question-slide">
                <div class="mb-3">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h6 class="text-muted mb-0">Question ${window.currentQuestionIndex + 1} of ${window.optimizationQuestions.length}</h6>
                    </div>
                    <label class="form-label fw-bold fs-5">${currentQuestion.question}</label>
                </div>
                <div class="mt-3">
        `;
        
        currentQuestion.potential_answers.forEach((answer, answerIndex) => {
            const inputId = `current_question_answer_${answerIndex}`;
            const isSelected = window.selectedAnswers[window.currentQuestionIndex] === answer || 
                              currentQuestion.selected_answer === answer;
            
            questionHTML += `
                <div class="form-check mb-2">
                    <input class="form-check-input" type="radio" name="current_question" 
                           id="${inputId}" value="${answer}" ${isSelected ? 'checked' : ''}>
                    <label class="form-check-label" for="${inputId}">
                        ${answer}
                    </label>
                </div>
            `;
        });
        
        questionHTML += `
                </div>
            </div>
        `;
        
        questionContainer.innerHTML = questionHTML;

        // Add event listener to save the selected answer
        const radioButtons = questionContainer.querySelectorAll('input[name="current_question"]');
        radioButtons.forEach(radio => {
            radio.addEventListener('change', () => {
                if (radio.checked) {
                    window.selectedAnswers[window.currentQuestionIndex] = radio.value;
                    updateProgressDots();
                    
                    // Update progress bar based on answered questions
                    const currentProgress = calculateQuestionProgress();
                    updateProgressBar(currentProgress, 'Requesting clarification...');
                    
                    // Auto-advance to next question after a short delay
                    setTimeout(() => {
                        if (window.currentQuestionIndex < window.optimizationQuestions.length - 1) {
                            // Move to next question
                            window.currentQuestionIndex++;
                            displayCurrentQuestion();
                        } else {
                            // All questions answered, show final optimization state
                            showFinalOptimizationState();
                        }
                    }, 500); // 500ms delay to show the selection
                }
            });
        });

        updateProgressDots();
    }

    /**
     * Shows the final optimization state when all questions are answered.
     */
    function showFinalOptimizationState() {
        const questionContainer = document.getElementById('questionContainer');
        const progressDots = document.getElementById('progressDots');
        
        // Hide progress dots
        if (progressDots) {
            progressDots.style.display = 'none';
        }
        
        // Update progress bar to 75% (ready for final stage)
        updateProgressBar(75, 'Submitting answers...');
        
        // Show optimization in progress UI
        const optimizationInProgressHTML = `
            <div class="text-center py-5">
                <div class="mb-4">
                    <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status">
                        <span class="visually-hidden">Submitting answers...</span>
                    </div>
                </div>
                <h4 class="mb-3">Submitting Your Answers</h4>
                <p class="text-muted mb-0">
                    Saving your responses and preparing to generate optimizations...
                </p>
            </div>
        `;
        
        questionContainer.innerHTML = optimizationInProgressHTML;
        
        // Submit answers first, then generate suggestions
        submitOptimizationAnswers();
    }

    /**
     * Submits the optimization answers to the API.
     */
    async function submitOptimizationAnswers() {
        const noteId = window.currentOptimizationNoteId;
        if (!noteId) {
            console.error('No note ID available for submitting answers');
            return;
        }

        try {
            const response = await fetch(`/api/v1/opnote/${noteId}/optimize/questions/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    selected_answers: window.selectedAnswers || []
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Optimization answers submitted successfully:', result);

            // Now proceed to generate suggestions
            updateProgressBar(75, 'Generating optimizations...');
            
            // Update UI to show generating optimizations
            const questionContainer = document.getElementById('questionContainer');
            const optimizationInProgressHTML = `
                <div class="text-center py-5">
                    <div class="mb-4">
                        <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status">
                            <span class="visually-hidden">Generating optimizations...</span>
                        </div>
                    </div>
                    <h4 class="mb-3">Generating Optimizations</h4>
                    <p class="text-muted mb-0">
                        Our AI is analyzing your responses and generating personalized optimizations for your operative note...
                    </p>
                </div>
            `;
            questionContainer.innerHTML = optimizationInProgressHTML;
            
            // Generate suggestions
            generateOptimizationSuggestions();

        } catch (error) {
            console.error('Error submitting optimization answers:', error);
            showOptimizationError('Failed to submit answers: ' + error.message);
        }
    }

    /**
     * Generates optimization suggestions by making an API call.
     */
    async function generateOptimizationSuggestions() {
        const noteId = window.currentOptimizationNoteId;
        if (!noteId) {
            console.error('No note ID available for optimization');
            return;
        }

        try {
            const response = await fetch(`/api/v1/opnote/${noteId}/optimize/suggestions/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const suggestions = await response.json();
            console.log('Optimization suggestions received:', suggestions);

            // Store suggestions globally for later use
            window.optimizationSuggestions = suggestions;

            // Show completion state
            showOptimizationComplete();

        } catch (error) {
            console.error('Error generating optimization suggestions:', error);
            showOptimizationError(error.message);
        }
    }

    /**
     * Shows the optimization complete state with review button.
     */
    function showOptimizationComplete() {
        const questionContainer = document.getElementById('questionContainer');
        
        // Update progress bar to 100%
        updateProgressBar(100, 'Optimizations complete!');
        
        // Show completion UI
        const completionHTML = `
            <div class="text-center py-5">
                <div class="mb-4">
                    <i class="bi bi-check-circle-fill text-success" style="font-size: 3rem;"></i>
                </div>
                <h4 class="mb-3">Optimizations Complete!</h4>
                <p class="text-muted mb-4">
                    Your operative note has been analyzed and optimized. Review the suggested changes to improve clarity and completeness.
                </p>
                <div class="d-flex justify-content-center gap-3">
                    <button type="button" class="btn btn-outline-secondary" onclick="showQuestionReview()">
                        <i class="bi bi-arrow-left me-1"></i>Review Answers
                    </button>
                    <button type="button" class="btn btn-primary btn-lg" onclick="reviewSuggestedChanges()">
                        <i class="bi bi-eye me-2"></i>Review Suggested Changes
                    </button>
                </div>
            </div>
        `;
        
        questionContainer.innerHTML = completionHTML;
    }

    /**
     * Shows an optimization error state.
     */
    function showOptimizationError(errorMessage) {
        const questionContainer = document.getElementById('questionContainer');
        
        // Reset progress bar
        updateProgressBar(75, 'Error generating optimizations');
        
        // Show error UI
        const errorHTML = `
            <div class="text-center py-5">
                <div class="mb-4">
                    <i class="bi bi-exclamation-triangle-fill text-danger" style="font-size: 3rem;"></i>
                </div>
                <h4 class="mb-3">Optimization Failed</h4>
                <p class="text-muted mb-4">
                    ${errorMessage}
                </p>
                <div class="d-flex justify-content-center gap-3">
                    <button type="button" class="btn btn-outline-secondary" onclick="showQuestionReview()">
                        <i class="bi bi-arrow-left me-1"></i>Review Answers
                    </button>
                    <button type="button" class="btn btn-primary" onclick="generateOptimizationSuggestions()">
                        <i class="bi bi-arrow-clockwise me-2"></i>Try Again
                    </button>
                </div>
            </div>
        `;
        
        questionContainer.innerHTML = errorHTML;
    }

    /**
     * Reviews suggested changes and displays them to the user for approval.
     */
    function reviewSuggestedChanges() {
        const questionContainer = document.getElementById('questionContainer');
        const progressDots = document.getElementById('progressDots');
        
        // Check if we have suggestions data
        if (!window.optimizationSuggestions || !window.optimizationSuggestions.suggested_edits) {
            showOptimizationError('No suggestions available to review.');
            return;
        }
        
        const suggestions = window.optimizationSuggestions.suggested_edits;
        
        if (suggestions.length === 0) {
            // No suggestions to show
            const noSuggestionsHTML = `
                <div class="text-center py-5">
                    <div class="mb-4">
                        <i class="bi bi-check-circle-fill text-success" style="font-size: 3rem;"></i>
                    </div>
                    <h4 class="mb-3">No Changes Needed!</h4>
                    <p class="text-muted mb-4">
                        Your operative note is already well-optimized. No suggestions were generated.
                    </p>
                    <button type="button" class="btn btn-primary" onclick="hideOptimizationModal()">
                        <i class="bi bi-check me-2"></i>Close
                    </button>
                </div>
            `;
            questionContainer.innerHTML = noSuggestionsHTML;
            return;
        }
        
        // Initialize suggestion review state
        window.currentSuggestionIndex = 0;
        window.suggestionDecisions = new Array(suggestions.length).fill(null); // null = not decided, true = accepted, false = rejected
        
        // Create progress dots for suggestions
        createSuggestionProgressDots(suggestions.length);
        
        // Show progress dots
        if (progressDots) {
            progressDots.style.display = 'block';
        }
        
        // Display the first suggestion
        displayCurrentSuggestion();
    }
    /**
     * Creates progress dots for suggestion navigation.
     * @param {number} suggestionCount - Number of suggestions.
     */
    function createSuggestionProgressDots(suggestionCount) {
        const progressDots = document.getElementById('progressDots');
        
        let dotsHTML = '';
        for (let i = 0; i < suggestionCount; i++) {
            dotsHTML += `<div class="progress-dot" data-suggestion="${i}"></div>`;
        }
        
        progressDots.innerHTML = dotsHTML;
        
        // Progress dots are now display-only, no click functionality
        // Users must accept/reject suggestions to advance
    }

    /**
     * Displays the current suggestion based on currentSuggestionIndex.
     */
    function displayCurrentSuggestion() {
        const questionContainer = document.getElementById('questionContainer');
        const suggestions = window.optimizationSuggestions.suggested_edits;
        const currentSuggestion = suggestions[window.currentSuggestionIndex];
        
        let suggestionHTML = `
            <div class="suggestion-slide">
                <div class="mb-3">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h6 class="text-muted mb-0">Suggestion ${window.currentSuggestionIndex + 1} of ${suggestions.length}</h6>
                    </div>
                    <h5 class="mb-3">
                        <i class="bi bi-lightbulb me-2"></i>Review Suggested Change
                    </h5>
                </div>
                
                <div class="row mb-4">
                    <div class="col-md-6">
                        <label class="form-label small text-muted fw-bold">CURRENT TEXT</label>
                        <div class="p-3 bg-light border rounded">
                            <code class="text-dark">${escapeHtml(currentSuggestion.current_text)}</code>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label small text-muted fw-bold">SUGGESTED TEXT</label>
                        <div class="p-3 bg-success-subtle border border-success rounded">
                            <code class="text-dark">${escapeHtml(currentSuggestion.suggested_text)}</code>
                        </div>
                    </div>
                </div>
                
                ${currentSuggestion.justification ? `
                    <div class="mb-4">
                        <label class="form-label small text-muted fw-bold">JUSTIFICATION</label>
                        <div class="alert alert-info mb-0">
                            <i class="bi bi-info-circle me-1"></i>
                            ${escapeHtml(currentSuggestion.justification)}
                        </div>
                    </div>
                ` : ''}
                
                <div class="d-flex justify-content-center gap-3 mt-4">
                    <button type="button" class="btn btn-outline-danger btn-lg" onclick="rejectCurrentSuggestion()">
                        <i class="bi bi-x-lg me-2"></i>Reject
                    </button>
                    <button type="button" class="btn btn-success btn-lg" onclick="acceptCurrentSuggestion()">
                        <i class="bi bi-check-lg me-2"></i>Accept
                    </button>
                </div>
            </div>
        `;
        
        questionContainer.innerHTML = suggestionHTML;
        updateSuggestionProgressDots();
    }

    /**
     * Updates the progress dots to show reviewed suggestions.
     */
    function updateSuggestionProgressDots() {
        const progressDots = document.querySelectorAll('.progress-dot');
        
        progressDots.forEach((dot, index) => {
            dot.classList.remove('active', 'accepted', 'rejected');
            
            if (index === window.currentSuggestionIndex) {
                dot.classList.add('active');
            }
            
            if (window.suggestionDecisions[index] === true) {
                dot.classList.add('accepted');
            } else if (window.suggestionDecisions[index] === false) {
                dot.classList.add('rejected');
            }
        });
    }

    /**
     * Accepts the current suggestion and advances to the next one.
     */
    function acceptCurrentSuggestion() {
        window.suggestionDecisions[window.currentSuggestionIndex] = true;
        advanceToNextSuggestion();
    }

    /**
     * Rejects the current suggestion and advances to the next one.
     */
    function rejectCurrentSuggestion() {
        window.suggestionDecisions[window.currentSuggestionIndex] = false;
        advanceToNextSuggestion();
    }

    /**
     * Advances to the next suggestion or submits decisions if all are complete.
     */
    function advanceToNextSuggestion() {
        updateSuggestionProgressDots();
        
        // Check if there are more suggestions
        if (window.currentSuggestionIndex < window.optimizationSuggestions.suggested_edits.length - 1) {
            // Move to next suggestion after a short delay
            setTimeout(() => {
                window.currentSuggestionIndex++;
                displayCurrentSuggestion();
            }, 500);
        } else {
            // All suggestions reviewed, submit decisions
            setTimeout(() => {
                submitSuggestionDecisions();
            }, 500);
        }
    }

    /**
     * Submits the suggestion decisions to the API.
     */
    async function submitSuggestionDecisions() {
        const noteId = window.currentOptimizationNoteId;
        const questionContainer = document.getElementById('questionContainer');
        const progressDots = document.getElementById('progressDots');
        
        // Hide progress dots
        if (progressDots) {
            progressDots.style.display = 'none';
        }
        
        // Show submitting state
        questionContainer.innerHTML = `
            <div class="text-center py-5">
                <div class="mb-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Submitting...</span>
                    </div>
                </div>
                <h4 class="mb-3">Submitting Your Decisions</h4>
                <p class="text-muted mb-0">
                    Applying your selected changes to the operative note...
                </p>
            </div>
        `;
        
        try {
            const response = await fetch(`/api/v1/opnote/${noteId}/optimize/suggestions/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    accepted_edits: window.suggestionDecisions
                })
            });
            
            if (!response.ok) {
                throw new Error(`Server error: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            // Reload the operative note from the server to get the updated content
            if (window.loadDocument && typeof window.loadDocument === 'function') {
                try {
                    await window.loadDocument();
                } catch (loadError) {
                    console.error('Error reloading document:', loadError);
                    // Continue with completion state even if reload fails
                }
            } else {
                console.warn('loadDocument function not available - document may not reflect changes until page refresh');
            }
            
            // Show completion state
            showSuggestionSubmissionComplete();
            
        } catch (error) {
            console.error('Error submitting suggestion decisions:', error);
            showSuggestionSubmissionError(error.message);
        }
    }

    /**
     * Applies accepted suggestions to the Quill editor.
     * 
     * NOTE: This function is no longer used as we now reload the entire document
     * from the server after suggestions are submitted to ensure consistency.
     */
    /*
    function applyAcceptedSuggestions() {
        if (!window.quill) return;
        
        const suggestions = window.optimizationSuggestions.suggested_edits;
        
        // Apply suggestions in reverse order to maintain text positions
        for (let i = suggestions.length - 1; i >= 0; i--) {
            if (window.suggestionDecisions[i] === true) {
                const suggestion = suggestions[i];
                
                try {
                    // Get current content
                    const currentText = window.quill.getText();
                    
                    // Find the text to replace using the position
                    const startPos = suggestion.text_position.start;
                    const endPos = suggestion.text_position.end;
                    
                    // Validate positions
                    if (startPos >= 0 && endPos <= currentText.length && startPos <= endPos) {
                        // Delete the old text and insert the new text
                        window.quill.deleteText(startPos, endPos - startPos, 'user');
                        window.quill.insertText(startPos, suggestion.suggested_text, 'user');
                    }
                } catch (error) {
                    console.error('Error applying suggestion:', error);
                }
            }
        }
        
        // Mark as unsaved
        if (window.hasUnsavedChanges !== undefined) {
            window.hasUnsavedChanges = true;
        }
        if (window.updateSaveIndicator) {
            window.updateSaveIndicator('modified');
        }
    }
    */

    /**
     * Shows the successful submission completion state.
     */
    function showSuggestionSubmissionComplete() {
        const questionContainer = document.getElementById('questionContainer');
        
        const acceptedCount = window.suggestionDecisions.filter(decision => decision === true).length;
        const rejectedCount = window.suggestionDecisions.filter(decision => decision === false).length;
        
        const completionHTML = `
            <div class="text-center py-5">
                <div class="mb-4">
                    <i class="bi bi-check-circle-fill text-success" style="font-size: 3rem;"></i>
                </div>
                <h4 class="mb-3">Optimization Complete!</h4>
                <p class="text-muted mb-4">
                    ${acceptedCount} suggestion${acceptedCount !== 1 ? 's' : ''} accepted, 
                    ${rejectedCount} suggestion${rejectedCount !== 1 ? 's' : ''} rejected.
                    ${acceptedCount > 0 ? ' Your changes have been applied to the document.' : ''}
                </p>
                <button type="button" class="btn btn-primary btn-lg" onclick="hideOptimizationModal()">
                    <i class="bi bi-check me-2"></i>Close
                </button>
            </div>
        `;
        
        questionContainer.innerHTML = completionHTML;
    }

    /**
     * Shows the error state for suggestion submission.
     */
    function showSuggestionSubmissionError(errorMessage) {
        const questionContainer = document.getElementById('questionContainer');
        
        const errorHTML = `
            <div class="text-center py-5">
                <div class="mb-4">
                    <i class="bi bi-exclamation-triangle-fill text-danger" style="font-size: 3rem;"></i>
                </div>
                <h4 class="mb-3">Submission Failed</h4>
                <p class="text-muted mb-4">
                    ${errorMessage}
                </p>
                <div class="d-flex justify-content-center gap-3">
                    <button type="button" class="btn btn-outline-secondary" onclick="reviewSuggestedChanges()">
                        <i class="bi bi-arrow-left me-1"></i>Back to Review
                    </button>
                    <button type="button" class="btn btn-primary" onclick="submitSuggestionDecisions()">
                        <i class="bi bi-arrow-clockwise me-2"></i>Try Again
                    </button>
                </div>
            </div>
        `;
        
        questionContainer.innerHTML = errorHTML;
    }

    function showQuestionReview() {
        const questionContainer = document.getElementById('questionContainer');
        const progressDots = document.getElementById('progressDots');
        
        // Show progress dots again
        if (progressDots) {
            progressDots.style.display = 'block';
        }
        
        let reviewHTML = `
            <div class="question-review">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h5 class="mb-0">Review Your Answers</h5>
                    <button type="button" class="btn btn-sm btn-outline-primary" onclick="backToFinalState()">
                        Done Reviewing
                    </button>
                </div>
        `;
        
        window.optimizationQuestions.forEach((question, index) => {
            const selectedAnswer = window.selectedAnswers[index];
            reviewHTML += `
                <div class="card mb-3">
                    <div class="card-body">
                        <h6 class="card-title">Question ${index + 1}</h6>
                        <p class="card-text">${question.question}</p>
                        <div class="alert alert-info mb-0">
                            <strong>Your answer:</strong> ${selectedAnswer}
                        </div>
                    </div>
                </div>
            `;
        });
        
        reviewHTML += '</div>';
        questionContainer.innerHTML = reviewHTML;
    }

    /**
     * Returns to the final optimization state from review.
     */
    function backToFinalState() {
        showFinalOptimizationState();
    }

    /**
     * Updates the progress dots to show answered questions.
     */
    function updateProgressDots() {
        const progressDots = document.querySelectorAll('.progress-dot');
        
        progressDots.forEach((dot, index) => {
            dot.classList.remove('active', 'answered');
            
            if (index === window.currentQuestionIndex) {
                dot.classList.add('active');
            }
            
            if (window.selectedAnswers[index] !== null) {
                dot.classList.add('answered');
            }
        });
    }

    /**
     * Escapes HTML characters to prevent XSS.
     * @param {string} text - The text to escape.
     * @returns {string} - The escaped text.
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Shows a toast notification (assuming showToast is available globally).
     * @param {string} message - The message to show.
     * @param {string} type - The type of toast (success, danger, warning, info).
     */
    function showToast(message, type) {
        // Check if global showToast function exists
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
        } else {
            // Fallback to console log
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    // Export functions
    window.fetchOptimizationQuestions = fetchOptimizationQuestions;
    window.showOptimizationModal = showOptimizationModal;
    window.hideOptimizationModal = hideOptimizationModal;
    window.showQuestionReview = showQuestionReview;
    window.backToFinalState = backToFinalState;
    window.submitOptimizationAnswers = submitOptimizationAnswers;
    window.generateOptimizationSuggestions = generateOptimizationSuggestions;
    window.reviewSuggestedChanges = reviewSuggestedChanges;
    window.acceptCurrentSuggestion = acceptCurrentSuggestion;
    window.rejectCurrentSuggestion = rejectCurrentSuggestion;
    window.submitSuggestionDecisions = submitSuggestionDecisions;
})();
