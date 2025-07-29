(function(){async function l(t){const e=await fetch(`/api/v1/opnote/${t}/optimize/questions/`,{method:"POST",headers:{"Content-Type":"application/json"}});if(!e.ok)throw new Error("Failed to fetch optimization questions");return await e.json()}function v(t){window.quill&&window.quill.disable();const e=document.querySelector(".editor-container");e&&(e.style.opacity="0.5",e.style.pointerEvents="none"),y(t)}function r(){window.quill&&window.quill.enable();const t=document.querySelector(".editor-container");t&&(t.style.opacity="",t.style.pointerEvents="");const e=document.getElementById("optimizationModal");if(e){const i=bootstrap.Modal.getInstance(e);i&&i.hide(),e.remove()}}function y(t){const e=document.getElementById("optimizationModal");e&&e.remove(),document.body.insertAdjacentHTML("beforeend",`
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
        `),new bootstrap.Modal(document.getElementById("optimizationModal")).show(),document.getElementById("optimizationModal").addEventListener("hidden.bs.modal",r),window.currentOptimizationNoteId=t,h(t)}async function h(t){try{const e=await l(t);f(e)}catch(e){console.error("Error loading optimization questions:",e),c(e.message)}}function f(t){const e=document.getElementById("optimizationLoading"),i=document.getElementById("optimizationContent");if(!t.questions||t.questions.length===0){c("No optimization questions available for this note.");return}e.style.display="none",i.style.display="block",a(25,"Requesting clarification..."),window.optimizationQuestions=t.questions,window.currentQuestionIndex=0,window.selectedAnswers=new Array(t.questions.length).fill(null);const o=`
            <form id="optimizationForm">
                <div id="questionContainer">
                    <!-- Current question will be displayed here -->
                </div>
                
                <!-- Progress dots -->
                <div class="text-center mt-4 mb-3" id="progressDots">
                    ${t.questions.map((n,s)=>`<span class="progress-dot ${s===0?"active":""}" data-question="${s}"></span>`).join("")}
                </div>
            
            </form>
        `;i.innerHTML=o,q(),d()}function c(t){const e=document.getElementById("optimizationLoading"),i=document.getElementById("optimizationContent");e.style.display="none",i.style.display="block",i.innerHTML=`
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>
                <strong>Error:</strong> ${t}
            </div>
        `}function a(t,e){const i=document.getElementById("progressBar"),o=document.getElementById("progressLabel");i&&(i.style.width=`${t}%`,i.setAttribute("aria-valuenow",t)),o&&(o.textContent=e)}function z(){if(!window.optimizationQuestions||!window.selectedAnswers)return 25;const t=window.optimizationQuestions.length;return 25+window.selectedAnswers.filter(n=>n!==null).length/t*50}function q(){document.querySelectorAll(".progress-dot").forEach(e=>{e.addEventListener("click",()=>{const i=parseInt(e.getAttribute("data-question"));window.currentQuestionIndex=i,d()})})}function d(){const t=document.getElementById("questionContainer"),e=window.optimizationQuestions[window.currentQuestionIndex];let i=`
            <div class="question-slide">
                <div class="mb-3">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h6 class="text-muted mb-0">Question ${window.currentQuestionIndex+1} of ${window.optimizationQuestions.length}</h6>
                    </div>
                    <label class="form-label fw-bold fs-5">${e.question}</label>
                </div>
                <div class="mt-3">
        `;e.potential_answers.forEach((n,s)=>{const b=`current_question_answer_${s}`,M=window.selectedAnswers[window.currentQuestionIndex]===n||e.selected_answer===n;i+=`
                <div class="form-check mb-2">
                    <input class="form-check-input" type="radio" name="current_question" 
                           id="${b}" value="${n}" ${M?"checked":""}>
                    <label class="form-check-label" for="${b}">
                        ${n}
                    </label>
                </div>
            `}),i+=`
                </div>
            </div>
        `,t.innerHTML=i,t.querySelectorAll('input[name="current_question"]').forEach(n=>{n.addEventListener("change",()=>{if(n.checked){window.selectedAnswers[window.currentQuestionIndex]=n.value,w();const s=z();a(s,"Requesting clarification..."),setTimeout(()=>{window.currentQuestionIndex<window.optimizationQuestions.length-1?(window.currentQuestionIndex++,d()):u()},500)}})}),w()}function u(){const t=document.getElementById("questionContainer"),e=document.getElementById("progressDots");e&&(e.style.display="none"),a(75,"Submitting answers...");const i=`
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
        `;t.innerHTML=i,m()}async function m(){const t=window.currentOptimizationNoteId;if(!t){console.error("No note ID available for submitting answers");return}try{const e=await fetch(`/api/v1/opnote/${t}/optimize/questions/`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({selected_answers:window.selectedAnswers||[]})});if(!e.ok)throw new Error(`HTTP error! status: ${e.status}`);const i=await e.json();console.log("Optimization answers submitted successfully:",i),a(75,"Generating optimizations...");const o=document.getElementById("questionContainer"),n=`
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
            `;o.innerHTML=n,p()}catch(e){console.error("Error submitting optimization answers:",e),g("Failed to submit answers: "+e.message)}}async function p(){const t=window.currentOptimizationNoteId;if(!t){console.error("No note ID available for optimization");return}try{const e=await fetch(`/api/v1/opnote/${t}/optimize/suggestions/`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({selected_answers:window.selectedAnswers||[]})});if(!e.ok)throw new Error(`HTTP error! status: ${e.status}`);const i=await e.json();console.log("Optimization suggestions received:",i),window.optimizationSuggestions=i,x()}catch(e){console.error("Error generating optimization suggestions:",e),g(e.message)}}function x(){const t=document.getElementById("questionContainer");a(100,"Optimizations complete!");const e=`
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
        `;t.innerHTML=e}function g(t){const e=document.getElementById("questionContainer");a(75,"Error generating optimizations");const i=`
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
        `;e.innerHTML=i}function E(){r()}function I(){const t=document.getElementById("questionContainer"),e=document.getElementById("progressDots");e&&(e.style.display="block");let i=`
            <div class="question-review">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h5 class="mb-0">Review Your Answers</h5>
                    <button type="button" class="btn btn-sm btn-outline-primary" onclick="backToFinalState()">
                        Done Reviewing
                    </button>
                </div>
        `;window.optimizationQuestions.forEach((o,n)=>{const s=window.selectedAnswers[n];i+=`
                <div class="card mb-3">
                    <div class="card-body">
                        <h6 class="card-title">Question ${n+1}</h6>
                        <p class="card-text">${o.question}</p>
                        <div class="alert alert-info mb-0">
                            <strong>Your answer:</strong> ${s}
                        </div>
                    </div>
                </div>
            `}),i+="</div>",t.innerHTML=i}function L(){u()}function w(){document.querySelectorAll(".progress-dot").forEach((e,i)=>{e.classList.remove("active","answered"),i===window.currentQuestionIndex&&e.classList.add("active"),window.selectedAnswers[i]!==null&&e.classList.add("answered")})}window.fetchOptimizationQuestions=l,window.showOptimizationModal=v,window.hideOptimizationModal=r,window.showQuestionReview=I,window.backToFinalState=L,window.submitOptimizationAnswers=m,window.generateOptimizationSuggestions=p,window.reviewSuggestedChanges=E})();
