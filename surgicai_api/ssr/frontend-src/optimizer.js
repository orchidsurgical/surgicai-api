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
                    cursor: pointer;
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
                
                .progress-dot:hover {
                    background-color: #adb5bd;
                    transform: scale(1.1);
                }
                
                .progress-dot.answered:hover {
                    background-color: #218838;
                }
                
                .question-slide {
                    min-height: 200px;
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
        const progressDots = document.querySelectorAll('.progress-dot');

        // Progress dots
        progressDots.forEach(dot => {
            dot.addEventListener('click', () => {
                const questionIndex = parseInt(dot.getAttribute('data-question'));
                window.currentQuestionIndex = questionIndex;
                displayCurrentQuestion();
            });
        });
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
                },
                body: JSON.stringify({
                    selected_answers: window.selectedAnswers || []
                })
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
     * Reviews suggested changes (for now, just closes the modal).
     */
    function reviewSuggestedChanges() {
        // For now, just close the modal
        hideOptimizationModal();
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

    // Export functions
    window.fetchOptimizationQuestions = fetchOptimizationQuestions;
    window.showOptimizationModal = showOptimizationModal;
    window.hideOptimizationModal = hideOptimizationModal;
    window.showQuestionReview = showQuestionReview;
    window.backToFinalState = backToFinalState;
    window.submitOptimizationAnswers = submitOptimizationAnswers;
    window.generateOptimizationSuggestions = generateOptimizationSuggestions;
    window.reviewSuggestedChanges = reviewSuggestedChanges;
})();
