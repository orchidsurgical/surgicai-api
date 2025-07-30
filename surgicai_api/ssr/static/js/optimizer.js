(function(){async function d(i){const e=await fetch(`/api/v1/opnote/${i}/optimize/questions/`,{method:"POST",headers:{"Content-Type":"application/json"}});if(!e.ok)throw new Error("Failed to fetch optimization questions");return await e.json()}function z(i){window.quill&&window.quill.disable();const e=document.querySelector(".editor-container");e&&(e.style.opacity="0.5",e.style.pointerEvents="none"),q(i)}function l(){window.quill&&window.quill.enable();const i=document.querySelector(".editor-container");i&&(i.style.opacity="",i.style.pointerEvents="");const e=document.getElementById("optimizationModal");if(e){const t=bootstrap.Modal.getInstance(e);t&&t.hide(),e.remove()}}function q(i){const e=document.getElementById("optimizationModal");e&&e.remove(),document.body.insertAdjacentHTML("beforeend",`
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
                    background-color: var(--primary-color, #0066cc);
                }
                
                .progress-dot.answered.active {
                    background-color: var(--primary-color, #0066cc);
                    transform: scale(1.2);
                }
                
                .progress-dot.accepted {
                    background-color: var(--primary-color, #0066cc);
                }
                
                .progress-dot.rejected {
                    background-color: var(--primary-color, #0066cc);
                }
                
                .progress-dot.accepted.active {
                    background-color: var(--primary-color, #0066cc);
                    transform: scale(1.2);
                }
                
                .progress-dot.rejected.active {
                    background-color: var(--primary-color, #0066cc);
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
                                <i class="bi bi-check-circle me-2"></i>Validate Your Operative Note
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
                                <p class="mt-3">Loading validation questions...</p>
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
        `),new bootstrap.Modal(document.getElementById("optimizationModal")).show(),document.getElementById("optimizationModal").addEventListener("hidden.bs.modal",l),window.currentOptimizationNoteId=i,I(i)}async function I(i){try{const e=await d(i);T(e)}catch(e){console.error("Error loading optimization questions:",e),u(e.message)}}function T(i){const e=document.getElementById("optimizationLoading"),t=document.getElementById("optimizationContent");if(!i.questions||i.questions.length===0){u("No validation questions available for this note.");return}e.style.display="none",t.style.display="block",r(25,"Requesting clarification..."),window.optimizationQuestions=i.questions,window.currentQuestionIndex=0,window.selectedAnswers=new Array(i.questions.length).fill(null);const s=`
            <form id="optimizationForm">
                <div id="questionContainer">
                    <!-- Current question will be displayed here -->
                </div>
                
                <!-- Progress dots -->
                <div class="text-center mt-4 mb-3" id="progressDots">
                    ${i.questions.map((n,o)=>`<span class="progress-dot ${o===0?"active":""}" data-question="${o}"></span>`).join("")}
                </div>
            
            </form>
        `;t.innerHTML=s,g()}function u(i){const e=document.getElementById("optimizationLoading"),t=document.getElementById("optimizationContent");e.style.display="none",t.style.display="block",t.innerHTML=`
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>
                <strong>Error:</strong> ${i}
            </div>
        `}function r(i,e){const t=document.getElementById("progressBar"),s=document.getElementById("progressLabel");t&&(t.style.width=`${i}%`,t.setAttribute("aria-valuenow",i)),s&&(s.textContent=e)}function E(){if(!window.optimizationQuestions||!window.selectedAnswers)return 25;const i=window.optimizationQuestions.length;return 25+window.selectedAnswers.filter(n=>n!==null).length/i*50}function g(){const i=document.getElementById("questionContainer"),e=window.optimizationQuestions[window.currentQuestionIndex];let t=`
            <div class="question-slide">
                <div class="mb-3">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h6 class="text-muted mb-0">Question ${window.currentQuestionIndex+1} of ${window.optimizationQuestions.length}</h6>
                    </div>
                    <label class="form-label fw-bold fs-5">${e.question}</label>
                </div>
                <div class="mt-3">
        `;e.potential_answers.forEach((n,o)=>{const S=`current_question_answer_${o}`,H=window.selectedAnswers[window.currentQuestionIndex]===n||e.selected_answer===n;t+=`
                <div class="form-check mb-2">
                    <input class="form-check-input" type="radio" name="current_question" 
                           id="${S}" value="${n}" ${H?"checked":""}>
                    <label class="form-check-label" for="${S}">
                        ${n}
                    </label>
                </div>
            `}),t+=`
                </div>
            </div>
        `,i.innerHTML=t,i.querySelectorAll('input[name="current_question"]').forEach(n=>{n.addEventListener("change",()=>{if(n.checked){window.selectedAnswers[window.currentQuestionIndex]=n.value,x();const o=E();r(o,"Requesting clarification..."),setTimeout(()=>{window.currentQuestionIndex<window.optimizationQuestions.length-1?(window.currentQuestionIndex++,g()):m()},500)}})}),x()}function m(){const i=document.getElementById("questionContainer"),e=document.getElementById("progressDots");e&&(e.style.display="none"),r(75,"Submitting answers...");const t=`
            <div class="text-center py-5">
                <div class="mb-4">
                    <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status">
                        <span class="visually-hidden">Submitting answers...</span>
                    </div>
                </div>
                <h4 class="mb-3">Submitting Your Answers</h4>
                <p class="text-muted mb-0">
                    Saving your responses and preparing to generate validations...
                </p>
            </div>
        `;i.innerHTML=t,p()}async function p(){const i=window.currentOptimizationNoteId;if(!i){console.error("No note ID available for submitting answers");return}try{const e=await fetch(`/api/v1/opnote/${i}/optimize/questions/`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({selected_answers:window.selectedAnswers||[]})});if(!e.ok)throw new Error(`HTTP error! status: ${e.status}`);const t=await e.json();console.log("Optimization answers submitted successfully:",t),r(75,"Generating validations...");const s=document.getElementById("questionContainer"),n=`
                <div class="text-center py-5">
                    <div class="mb-4">
                        <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status">
                            <span class="visually-hidden">Generating validations...</span>
                        </div>
                    </div>
                    <h4 class="mb-3">Generating Validations</h4>
                    <p class="text-muted mb-0">
                        Our AI is analyzing your responses and generating personalized validations for your operative note...
                    </p>
                </div>
            `;s.innerHTML=n,w()}catch(e){console.error("Error submitting validation answers:",e),a("Failed to submit answers: "+e.message)}}async function w(){const i=window.currentOptimizationNoteId;if(!i){console.error("No note ID available for optimization");return}try{const e=await fetch(`/api/v1/opnote/${i}/optimize/suggestions/`,{method:"POST",headers:{"Content-Type":"application/json"}});if(!e.ok)throw new Error(`HTTP error! status: ${e.status}`);const t=await e.json();console.log("Validation suggestions received:",t),window.optimizationSuggestions=t,b()}catch(e){console.error("Error generating validation suggestions:",e),a(e.message)}}function a(i){const e=document.getElementById("questionContainer");r(75,"Error generating validations");const t=`
            <div class="text-center py-5">
                <div class="mb-4">
                    <i class="bi bi-exclamation-triangle-fill text-danger" style="font-size: 3rem;"></i>
                </div>
                <h4 class="mb-3">Validation Failed</h4>
                <p class="text-muted mb-4">
                    ${i}
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
        `;e.innerHTML=t}function b(){const i=document.getElementById("questionContainer"),e=document.getElementById("progressDots");if(r(75,"Review suggested changes..."),!window.optimizationSuggestions||!window.optimizationSuggestions.suggested_edits){a("No suggestions available to review.");return}const t=window.optimizationSuggestions.suggested_edits;if(t.length===0){const s=`
                <div class="text-center py-5">
                    <div class="mb-4">
                        <i class="bi bi-check-circle-fill text-success" style="font-size: 3rem;"></i>
                    </div>
                    <h4 class="mb-3">No Changes Needed!</h4>
                    <p class="text-muted mb-4">
                        Your operative note is already well-validated. No suggestions were generated.
                    </p>
                    <button type="button" class="btn btn-primary" onclick="hideOptimizationModal()">
                        <i class="bi bi-check me-2"></i>Close
                    </button>
                </div>
            `;i.innerHTML=s;return}window.currentSuggestionIndex=0,window.suggestionDecisions=new Array(t.length).fill(null),C(t.length),e&&(e.style.display="block"),v()}function C(i){const e=document.getElementById("progressDots");let t="";for(let s=0;s<i;s++)t+=`<div class="progress-dot" data-suggestion="${s}"></div>`;e.innerHTML=t}function v(){const i=document.getElementById("questionContainer"),e=window.optimizationSuggestions.suggested_edits,t=e[window.currentSuggestionIndex];let s=`
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
                            <code class="text-dark">${c(t.current_text)}</code>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label small text-muted fw-bold">SUGGESTED TEXT</label>
                        <div class="p-3 bg-success-subtle border border-success rounded">
                            <code class="text-dark">${c(t.suggested_text)}</code>
                        </div>
                    </div>
                </div>
                
                ${t.justification?`
                    <div class="mb-4">
                        <label class="form-label small text-muted fw-bold">JUSTIFICATION</label>
                        <div class="alert alert-info mb-0">
                            <i class="bi bi-info-circle me-1"></i>
                            ${c(t.justification)}
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
        `;i.innerHTML=s,y()}function y(){document.querySelectorAll(".progress-dot").forEach((e,t)=>{e.classList.remove("active","accepted","rejected"),t===window.currentSuggestionIndex&&e.classList.add("active"),window.suggestionDecisions[t]===!0?e.classList.add("accepted"):window.suggestionDecisions[t]===!1&&e.classList.add("rejected")})}function L(){window.suggestionDecisions[window.currentSuggestionIndex]=!0,f()}function M(){window.suggestionDecisions[window.currentSuggestionIndex]=!1,f()}function f(){y();const i=window.optimizationSuggestions.suggested_edits.length,n=75+(window.currentSuggestionIndex+1)/i*25;r(n,"Reviewing suggestions..."),window.currentSuggestionIndex<window.optimizationSuggestions.suggested_edits.length-1?setTimeout(()=>{window.currentSuggestionIndex++,v()},500):setTimeout(()=>{h()},500)}async function h(){const i=window.currentOptimizationNoteId,e=document.getElementById("questionContainer"),t=document.getElementById("progressDots");r(100,"Applying changes..."),t&&(t.style.display="none"),e.innerHTML=`
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
        `;try{const s=await fetch(`/api/v1/opnote/${i}/optimize/suggestions/`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({accepted_edits:window.suggestionDecisions})});if(!s.ok)throw new Error(`Server error: ${s.statusText}`);const n=await s.json();if(window.loadDocument&&typeof window.loadDocument=="function")try{await window.loadDocument()}catch(o){console.error("Error reloading document:",o)}else console.warn("loadDocument function not available - document may not reflect changes until page refresh");k()}catch(s){console.error("Error submitting suggestion decisions:",s),D(s.message)}}function k(){const i=document.getElementById("questionContainer"),e=window.suggestionDecisions.filter(n=>n===!0).length,t=window.suggestionDecisions.filter(n=>n===!1).length,s=`
            <div class="text-center py-5">
                <div class="mb-4">
                    <i class="bi bi-check-circle-fill text-success" style="font-size: 3rem;"></i>
                </div>
                <h4 class="mb-3">Validation Complete!</h4>
                <p class="text-muted mb-4">
                    ${e} suggestion${e!==1?"s":""} accepted, 
                    ${t} suggestion${t!==1?"s":""} rejected.
                    ${e>0?" Your changes have been applied to the document.":""}
                </p>
                <button type="button" class="btn btn-primary btn-lg" onclick="hideOptimizationModal()">
                    <i class="bi bi-check me-2"></i>Close
                </button>
            </div>
        `;i.innerHTML=s}function D(i){const e=document.getElementById("questionContainer"),t=`
            <div class="text-center py-5">
                <div class="mb-4">
                    <i class="bi bi-exclamation-triangle-fill text-danger" style="font-size: 3rem;"></i>
                </div>
                <h4 class="mb-3">Submission Failed</h4>
                <p class="text-muted mb-4">
                    ${i}
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
        `;e.innerHTML=t}function $(){const i=document.getElementById("questionContainer"),e=document.getElementById("progressDots");e&&(e.style.display="block");let t=`
            <div class="question-review">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h5 class="mb-0">Review Your Answers</h5>
                    <button type="button" class="btn btn-sm btn-outline-primary" onclick="backToFinalState()">
                        Done Reviewing
                    </button>
                </div>
        `;window.optimizationQuestions.forEach((s,n)=>{const o=window.selectedAnswers[n];t+=`
                <div class="card mb-3">
                    <div class="card-body">
                        <h6 class="card-title">Question ${n+1}</h6>
                        <p class="card-text">${s.question}</p>
                        <div class="alert alert-info mb-0">
                            <strong>Your answer:</strong> ${o}
                        </div>
                    </div>
                </div>
            `}),t+="</div>",i.innerHTML=t}function B(){m()}function x(){document.querySelectorAll(".progress-dot").forEach((e,t)=>{e.classList.remove("active","answered"),t===window.currentQuestionIndex&&e.classList.add("active"),window.selectedAnswers[t]!==null&&e.classList.add("answered")})}function c(i){const e=document.createElement("div");return e.textContent=i,e.innerHTML}window.fetchOptimizationQuestions=d,window.showOptimizationModal=z,window.hideOptimizationModal=l,window.showQuestionReview=$,window.backToFinalState=B,window.submitOptimizationAnswers=p,window.generateOptimizationSuggestions=w,window.reviewSuggestedChanges=b,window.acceptCurrentSuggestion=L,window.rejectCurrentSuggestion=M,window.submitSuggestionDecisions=h})();
