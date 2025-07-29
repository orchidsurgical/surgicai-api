(function(){async function d(t){const e=await fetch(`/api/v1/opnote/${t}/optimize/questions/`,{method:"POST",headers:{"Content-Type":"application/json"}});if(!e.ok)throw new Error("Failed to fetch optimization questions");return await e.json()}function x(t){window.quill&&window.quill.disable();const e=document.querySelector(".editor-container");e&&(e.style.opacity="0.5",e.style.pointerEvents="none"),S(t)}function l(){window.quill&&window.quill.enable();const t=document.querySelector(".editor-container");t&&(t.style.opacity="",t.style.pointerEvents="");const e=document.getElementById("optimizationModal");if(e){const i=bootstrap.Modal.getInstance(e);i&&i.hide(),e.remove()}}function S(t){const e=document.getElementById("optimizationModal");e&&e.remove(),document.body.insertAdjacentHTML("beforeend",`
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
        `),new bootstrap.Modal(document.getElementById("optimizationModal")).show(),document.getElementById("optimizationModal").addEventListener("hidden.bs.modal",l),window.currentOptimizationNoteId=t,q(t)}async function q(t){try{const e=await d(t);C(e)}catch(e){console.error("Error loading optimization questions:",e),u(e.message)}}function C(t){const e=document.getElementById("optimizationLoading"),i=document.getElementById("optimizationContent");if(!t.questions||t.questions.length===0){u("No optimization questions available for this note.");return}e.style.display="none",i.style.display="block",a(25,"Requesting clarification..."),window.optimizationQuestions=t.questions,window.currentQuestionIndex=0,window.selectedAnswers=new Array(t.questions.length).fill(null);const n=`
            <form id="optimizationForm">
                <div id="questionContainer">
                    <!-- Current question will be displayed here -->
                </div>
                
                <!-- Progress dots -->
                <div class="text-center mt-4 mb-3" id="progressDots">
                    ${t.questions.map((s,o)=>`<span class="progress-dot ${o===0?"active":""}" data-question="${o}"></span>`).join("")}
                </div>
            
            </form>
        `;i.innerHTML=n,g()}function u(t){const e=document.getElementById("optimizationLoading"),i=document.getElementById("optimizationContent");e.style.display="none",i.style.display="block",i.innerHTML=`
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>
                <strong>Error:</strong> ${t}
            </div>
        `}function a(t,e){const i=document.getElementById("progressBar"),n=document.getElementById("progressLabel");i&&(i.style.width=`${t}%`,i.setAttribute("aria-valuenow",t)),n&&(n.textContent=e)}function T(){if(!window.optimizationQuestions||!window.selectedAnswers)return 25;const t=window.optimizationQuestions.length;return 25+window.selectedAnswers.filter(s=>s!==null).length/t*50}function g(){const t=document.getElementById("questionContainer"),e=window.optimizationQuestions[window.currentQuestionIndex];let i=`
            <div class="question-slide">
                <div class="mb-3">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h6 class="text-muted mb-0">Question ${window.currentQuestionIndex+1} of ${window.optimizationQuestions.length}</h6>
                    </div>
                    <label class="form-label fw-bold fs-5">${e.question}</label>
                </div>
                <div class="mt-3">
        `;e.potential_answers.forEach((s,o)=>{const z=`current_question_answer_${o}`,H=window.selectedAnswers[window.currentQuestionIndex]===s||e.selected_answer===s;i+=`
                <div class="form-check mb-2">
                    <input class="form-check-input" type="radio" name="current_question" 
                           id="${z}" value="${s}" ${H?"checked":""}>
                    <label class="form-check-label" for="${z}">
                        ${s}
                    </label>
                </div>
            `}),i+=`
                </div>
            </div>
        `,t.innerHTML=i,t.querySelectorAll('input[name="current_question"]').forEach(s=>{s.addEventListener("change",()=>{if(s.checked){window.selectedAnswers[window.currentQuestionIndex]=s.value,h();const o=T();a(o,"Requesting clarification..."),setTimeout(()=>{window.currentQuestionIndex<window.optimizationQuestions.length-1?(window.currentQuestionIndex++,g()):m()},500)}})}),h()}function m(){const t=document.getElementById("questionContainer"),e=document.getElementById("progressDots");e&&(e.style.display="none"),a(75,"Submitting answers...");const i=`
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
        `;t.innerHTML=i,p()}async function p(){const t=window.currentOptimizationNoteId;if(!t){console.error("No note ID available for submitting answers");return}try{const e=await fetch(`/api/v1/opnote/${t}/optimize/questions/`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({selected_answers:window.selectedAnswers||[]})});if(!e.ok)throw new Error(`HTTP error! status: ${e.status}`);const i=await e.json();console.log("Optimization answers submitted successfully:",i),a(75,"Generating optimizations...");const n=document.getElementById("questionContainer"),s=`
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
            `;n.innerHTML=s,b()}catch(e){console.error("Error submitting optimization answers:",e),r("Failed to submit answers: "+e.message)}}async function b(){const t=window.currentOptimizationNoteId;if(!t){console.error("No note ID available for optimization");return}try{const e=await fetch(`/api/v1/opnote/${t}/optimize/suggestions/`,{method:"POST",headers:{"Content-Type":"application/json"}});if(!e.ok)throw new Error(`HTTP error! status: ${e.status}`);const i=await e.json();console.log("Optimization suggestions received:",i),window.optimizationSuggestions=i,E()}catch(e){console.error("Error generating optimization suggestions:",e),r(e.message)}}function E(){const t=document.getElementById("questionContainer");a(100,"Optimizations complete!");const e=`
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
        `;t.innerHTML=e}function r(t){const e=document.getElementById("questionContainer");a(75,"Error generating optimizations");const i=`
            <div class="text-center py-5">
                <div class="mb-4">
                    <i class="bi bi-exclamation-triangle-fill text-danger" style="font-size: 3rem;"></i>
                </div>
                <h4 class="mb-3">Optimization Failed</h4>
                <p class="text-muted mb-4">
                    ${t}
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
        `;e.innerHTML=i}function I(){const t=document.getElementById("questionContainer"),e=document.getElementById("progressDots");if(!window.optimizationSuggestions||!window.optimizationSuggestions.suggested_edits){r("No suggestions available to review.");return}const i=window.optimizationSuggestions.suggested_edits;if(i.length===0){const n=`
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
            `;t.innerHTML=n;return}window.currentSuggestionIndex=0,window.suggestionDecisions=new Array(i.length).fill(null),L(i.length),e&&(e.style.display="block"),w()}function L(t){const e=document.getElementById("progressDots");let i="";for(let n=0;n<t;n++)i+=`<div class="progress-dot" data-suggestion="${n}"></div>`;e.innerHTML=i}function w(){const t=document.getElementById("questionContainer"),e=window.optimizationSuggestions.suggested_edits,i=e[window.currentSuggestionIndex];let n=`
            <div class="suggestion-slide">
                <div class="mb-3">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h6 class="text-muted mb-0">Suggestion ${window.currentSuggestionIndex+1} of ${e.length}</h6>
                    </div>
                    <h5 class="mb-3">
                        <i class="bi bi-lightbulb me-2"></i>Review Suggested Change
                    </h5>
                </div>
                
                <div class="row mb-4">
                    <div class="col-md-6">
                        <label class="form-label small text-muted fw-bold">CURRENT TEXT</label>
                        <div class="p-3 bg-light border rounded">
                            <code class="text-dark">${c(i.current_text)}</code>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label small text-muted fw-bold">SUGGESTED TEXT</label>
                        <div class="p-3 bg-success-subtle border border-success rounded">
                            <code class="text-dark">${c(i.suggested_text)}</code>
                        </div>
                    </div>
                </div>
                
                ${i.justification?`
                    <div class="mb-4">
                        <label class="form-label small text-muted fw-bold">JUSTIFICATION</label>
                        <div class="alert alert-info mb-0">
                            <i class="bi bi-info-circle me-1"></i>
                            ${c(i.justification)}
                        </div>
                    </div>
                `:""}
                
                <div class="d-flex justify-content-center gap-3 mt-4">
                    <button type="button" class="btn btn-outline-danger btn-lg" onclick="rejectCurrentSuggestion()">
                        <i class="bi bi-x-lg me-2"></i>Reject
                    </button>
                    <button type="button" class="btn btn-success btn-lg" onclick="acceptCurrentSuggestion()">
                        <i class="bi bi-check-lg me-2"></i>Accept
                    </button>
                </div>
            </div>
        `;t.innerHTML=n,v()}function v(){document.querySelectorAll(".progress-dot").forEach((e,i)=>{e.classList.remove("active","accepted","rejected"),i===window.currentSuggestionIndex&&e.classList.add("active"),window.suggestionDecisions[i]===!0?e.classList.add("accepted"):window.suggestionDecisions[i]===!1&&e.classList.add("rejected")})}function M(){window.suggestionDecisions[window.currentSuggestionIndex]=!0,y()}function k(){window.suggestionDecisions[window.currentSuggestionIndex]=!1,y()}function y(){v(),window.currentSuggestionIndex<window.optimizationSuggestions.suggested_edits.length-1?setTimeout(()=>{window.currentSuggestionIndex++,w()},500):setTimeout(()=>{f()},500)}async function f(){const t=window.currentOptimizationNoteId,e=document.getElementById("questionContainer"),i=document.getElementById("progressDots");i&&(i.style.display="none"),e.innerHTML=`
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
        `;try{const n=await fetch(`/api/v1/opnote/${t}/optimize/suggestions/`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({accepted_edits:window.suggestionDecisions})});if(!n.ok)throw new Error(`Server error: ${n.statusText}`);const s=await n.json();if(window.loadDocument&&typeof window.loadDocument=="function")try{await window.loadDocument()}catch(o){console.error("Error reloading document:",o)}else console.warn("loadDocument function not available - document may not reflect changes until page refresh");D()}catch(n){console.error("Error submitting suggestion decisions:",n),O(n.message)}}function D(){const t=document.getElementById("questionContainer"),e=window.suggestionDecisions.filter(s=>s===!0).length,i=window.suggestionDecisions.filter(s=>s===!1).length,n=`
            <div class="text-center py-5">
                <div class="mb-4">
                    <i class="bi bi-check-circle-fill text-success" style="font-size: 3rem;"></i>
                </div>
                <h4 class="mb-3">Optimization Complete!</h4>
                <p class="text-muted mb-4">
                    ${e} suggestion${e!==1?"s":""} accepted, 
                    ${i} suggestion${i!==1?"s":""} rejected.
                    ${e>0?" Your changes have been applied to the document.":""}
                </p>
                <button type="button" class="btn btn-primary btn-lg" onclick="hideOptimizationModal()">
                    <i class="bi bi-check me-2"></i>Close
                </button>
            </div>
        `;t.innerHTML=n}function O(t){const e=document.getElementById("questionContainer"),i=`
            <div class="text-center py-5">
                <div class="mb-4">
                    <i class="bi bi-exclamation-triangle-fill text-danger" style="font-size: 3rem;"></i>
                </div>
                <h4 class="mb-3">Submission Failed</h4>
                <p class="text-muted mb-4">
                    ${t}
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
        `;e.innerHTML=i}function $(){const t=document.getElementById("questionContainer"),e=document.getElementById("progressDots");e&&(e.style.display="block");let i=`
            <div class="question-review">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h5 class="mb-0">Review Your Answers</h5>
                    <button type="button" class="btn btn-sm btn-outline-primary" onclick="backToFinalState()">
                        Done Reviewing
                    </button>
                </div>
        `;window.optimizationQuestions.forEach((n,s)=>{const o=window.selectedAnswers[s];i+=`
                <div class="card mb-3">
                    <div class="card-body">
                        <h6 class="card-title">Question ${s+1}</h6>
                        <p class="card-text">${n.question}</p>
                        <div class="alert alert-info mb-0">
                            <strong>Your answer:</strong> ${o}
                        </div>
                    </div>
                </div>
            `}),i+="</div>",t.innerHTML=i}function B(){m()}function h(){document.querySelectorAll(".progress-dot").forEach((e,i)=>{e.classList.remove("active","answered"),i===window.currentQuestionIndex&&e.classList.add("active"),window.selectedAnswers[i]!==null&&e.classList.add("answered")})}function c(t){const e=document.createElement("div");return e.textContent=t,e.innerHTML}window.fetchOptimizationQuestions=d,window.showOptimizationModal=x,window.hideOptimizationModal=l,window.showQuestionReview=$,window.backToFinalState=B,window.submitOptimizationAnswers=p,window.generateOptimizationSuggestions=b,window.reviewSuggestedChanges=I,window.acceptCurrentSuggestion=M,window.rejectCurrentSuggestion=k,window.submitSuggestionDecisions=f})();
