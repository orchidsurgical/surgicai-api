let g=null,j=new Map,u=!1,C={x:0,y:0},c=null,w=-1,m=0,x=!1;const D=["Postoperative Diagnosis","Procedures"];function L(){const n=I();if(!n){console.warn("No Quill instance found for field initialization");return}g=n,R(),setTimeout(()=>{S()},100),console.log("Fields functionality initialized successfully"),console.log("Quill instance:",n)}function U(n){return n.toLowerCase().replace(/\s+/g,"_")}function I(){let n=window.quill;if(!n&&window.Quill){const t=document.getElementById("editor");t&&t.__quill&&(n=t.__quill)}return n}function V(n,t){const e=I();if(!e)return;let i;n==="ai"?i="<aifield></aifield> ":i=`<field id='${n}'></field> `;const o=e.getSelection(!0);let l=o?o.index:e.getLength();e.insertText(l,i,"silent"),e.setSelection(l+i.length,0,"silent")}function G(n,t){}function K(n){}function B(){if(!editorElement)return[];const n=[];return editorElement.querySelectorAll(".field-component, .aifield-component").forEach((e,i)=>{const o=e.getAttribute("data-field-name"),l=e.getAttribute("data-field-text"),r=e.classList.contains("aifield-component");o&&n.push({name:o,value:l,isAIField:r,element:e})}),n}function X(){return{success:!0,errors:[]}}function J(){}function N(){const n=g;if(!n)return"";const t=n.container.querySelector(".ql-editor");if(!t)return n.getText();const e=t.cloneNode(!0);e.querySelectorAll(".field-component, .aifield-component").forEach(s=>{const d=s.getAttribute("data-field-text");if(d){const a=document.createTextNode(d);s.parentNode.replaceChild(a,s)}});let o=e.innerHTML;o=o.replace(/<br\s*\/?>/gi,`
`),o=o.replace(/<\/p>/gi,`
`),o=o.replace(/<p[^>]*>/gi,""),o=o.replace(/<div[^>]*>/gi,""),o=o.replace(/<\/div>/gi,`
`);const l=document.createElement("div");l.innerHTML=o;let r=l.textContent||l.innerText||"";return r=r.replace(/\n\s*\n\s*\n/g,`

`),r=r.trim(),r}function Y(){if(!g)return{content:"",fields:[]};const t=N(),e=B();return{content:t,fields:e}}function Z(n){}function ee(n){}function R(){const n=g;n&&(n.on("text-change",function(t,e,i){if(i!=="user"||x)return;console.log("Text change detected:",t),clearTimeout(window.fieldStylingTimeout),window.fieldStylingTimeout=setTimeout(()=>{console.log("Debounced field styling triggered"),S()},500);const o=t.ops;if(o&&o.length>0){const l=o[o.length-1];if(console.log("Last operation:",l),l.insert==="/"){console.log("Slash detected! Showing menu...");const r=n.getSelection();r&&(w=r.index-1,setTimeout(()=>{z(r.index)},10))}else u&&l.insert&&typeof l.insert=="string"&&ie()}}),document.addEventListener("click",function(t){u&&!t.target.closest(".slash-menu")&&!t.target.closest(".ql-editor")&&v()}),document.addEventListener("keydown",function(t){t.key==="Escape"&&u?v():u&&t.key==="Enter"?(t.preventDefault(),t.stopPropagation(),le()):u&&(t.key==="ArrowUp"||t.key==="ArrowDown")?(t.preventDefault(),t.stopPropagation(),oe(t.key==="ArrowDown"?1:-1)):t.key==="Backspace"&&!u?ne(t):(t.key==="ArrowLeft"||t.key==="ArrowRight")&&!u&&te(t)},!0))}function te(n){const t=g;if(!t)return;const e=t.getSelection();if(!e||e.length>0)return;const i=e.index,o=n.key==="ArrowLeft",l=n.key==="ArrowRight";if(o&&i>0){const r=t.getText(0,i),s=/\[(ai)?field:\s*([^\]]+)\]$/,d=r.match(s);if(d){const a=d[0],f=i-a.length;console.log("Arrow left: jumping to start of field:",a),n.preventDefault(),n.stopPropagation(),t.setSelection(f,0,"user")}}else if(l&&i<t.getLength()-1){const r=t.getText(i),s=/^\[(ai)?field:\s*([^\]]+)\]/,d=r.match(s);if(d){const a=d[0],f=i+a.length;console.log("Arrow right: jumping to end of field:",a),n.preventDefault(),n.stopPropagation(),t.setSelection(f,0,"user")}}}function ne(n){const t=g;if(!t)return;const e=t.getSelection();if(!e||e.length>0)return;const i=e.index;if(i===0)return;const o=t.container.querySelector(".ql-editor");if(!o)return;const l=t.getBounds(i-1,1),r=document.elementFromPoint(o.getBoundingClientRect().left+l.left+l.width,o.getBoundingClientRect().top+l.top+l.height/2);let s=null;if(r&&(s=r.closest(".field-component, .aifield-component"),!s&&r.previousSibling&&r.previousSibling.classList&&(r.previousSibling.classList.contains("field-component")||r.previousSibling.classList.contains("aifield-component"))&&(s=r.previousSibling)),!s){const d=t.getText(0,i),a=/\[(ai)?field:\s*([^\]]+)\]$/,f=d.match(a);if(f){const p=f[0],h=i-p.length;console.log("Deleting field (text pattern):",p,"from position",h),n.preventDefault(),n.stopPropagation(),t.deleteText(h,p.length,"user"),t.setSelection(h,0,"user"),setTimeout(()=>{S()},10);return}}if(s){console.log("Deleting field component:",s),n.preventDefault(),n.stopPropagation();const d=s.getAttribute("data-field-text");if(d){const f=t.getText().indexOf(d.replace(/\[field:\s*/,"[field: "));f!==-1&&(t.deleteText(f,d.length,"user"),t.setSelection(f,0,"user"))}s.remove(),setTimeout(()=>{S()},10)}}function ie(){if(!u||w===-1)return;const n=g;if(!n)return;const t=n.getSelection();if(!t)return;const e=n.getText(w+1,t.index-w-1);console.log("Text after slash:",e),O(e)}function oe(n){if(!c)return;const t=c.querySelectorAll(".slash-menu-item");t.length!==0&&(m=Math.max(0,Math.min(t.length-1,m+n)),M())}function le(){if(!c)return;const n=c.querySelectorAll(".slash-menu-item");if(n.length===0)return;const t=n[m];t&&t.click()}function M(){if(!c)return;c.querySelectorAll(".slash-menu-item").forEach((t,e)=>{e===m?t.style.backgroundColor="#f3f4f6":t.style.backgroundColor="transparent"})}function z(n){const t=g;if(!t||u)return;console.log("Showing slash menu at index:",n);const e=t.getBounds(n),i=t.container.getBoundingClientRect();C={x:i.left+e.left,y:i.top+e.top+e.height+5},console.log("Menu position:",C),O(""),u=!0}function v(){c&&(c.remove(),c=null),u=!1,w=-1,m=0}function O(n=""){c&&c.remove();const e=[{label:"AI Field",icon:"🤖",description:"Insert a predefined AI field",action:"ai"},{label:"Field",icon:"📝",description:"Create a custom field",action:"field"}].filter(i=>i.label.toLowerCase().startsWith(n.toLowerCase()));if(e.sort((i,o)=>i.label.localeCompare(o.label)),m=Math.min(m,e.length-1),e.length===0){v();return}c=document.createElement("div"),c.className="slash-menu",c.style.cssText=`
        position: fixed;
        left: ${C.x}px;
        top: ${C.y}px;
        background: white;
        border: 1px solid #e1e5e9;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        min-width: 200px;
        padding: 8px 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
    `,e.forEach((i,o)=>{const l=se(i.label,i.icon,i.description);l.addEventListener("click",()=>{v(),i.action==="field"?P():i.action==="ai"&&W()}),c.appendChild(l)}),document.body.appendChild(c),M()}function se(n,t,e){const i=document.createElement("div");return i.className="slash-menu-item",i.style.cssText=`
        padding: 12px 16px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 12px;
        transition: background-color 0.15s ease;
    `,i.innerHTML=`
        <span style="font-size: 16px;">${t}</span>
        <div>
            <div style="font-weight: 500; color: #1a1a1a;">${n}</div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">${e}</div>
        </div>
    `,i.addEventListener("mouseenter",function(){const o=c?c.querySelectorAll(".slash-menu-item"):[];m=Array.from(o).indexOf(this),M()}),i.addEventListener("mouseleave",function(){}),i}function H(n,t=!1){const e=g;if(!e)return;const i=t?`[aifield: ${n}]`:`[field: ${n}]`,o=e.getSelection(!0);if(o){let l=-1;const r=o.index;for(let s=r-1;s>=0;s--){const d=e.getText(s,1);if(d==="/"){l=s;break}if(d===" "||d===`
`||d==="	")break}if(l!==-1){const s=r-l;e.deleteText(l,s,"silent"),e.insertText(l,i,"silent"),e.setSelection(l+i.length,0,"silent")}else e.insertText(r,i,"silent"),e.setSelection(r+i.length,0,"silent")}else{const l=e.getLength();e.insertText(l-1,i,"silent"),e.setSelection(l-1+i.length,0,"silent")}setTimeout(()=>{console.log("Applying field styling after insertion"),S()},50)}function S(){const n=g;if(!n)return;if(x){console.log("Already applying styling, skipping...");return}x=!0,console.log("Applying field styling...");const t=n.container.querySelector(".ql-editor");if(!t){console.log("No editor element found"),x=!1;return}const e=n.getSelection(),i=n.hasFocus();let o=null;if(e&&i){const d=window.getSelection();d.rangeCount>0&&(o=d.getRangeAt(0).cloneRange())}const l=document.createTreeWalker(t,NodeFilter.SHOW_TEXT,null,!1),r=[];let s;for(;s=l.nextNode();)/\[(ai)?field:\s*[^\]]+\]/.test(s.textContent)&&r.push(s);if(r.length===0){x=!1;return}r.forEach(d=>{const a=d.textContent,f=/\[(ai)?field:\s*([^\]]+)\]/g;let p;const h=[];for(;(p=f.exec(a))!==null;)h.push({fullMatch:p[0],fieldName:p[2].trim(),isAIField:p[1]==="ai",startIndex:p.index,endIndex:p.index+p[0].length});if(h.length>0){const T=d.parentNode;let b=a,E=0;h.forEach(y=>{const q=document.createElement("div");q.innerHTML=y.isAIField?de(y.fieldName):re(y.fieldName);const Q=q.firstChild,$=b.substring(0,y.startIndex-E),k=b.substring(y.endIndex-E);if($){const F=document.createTextNode($);T.insertBefore(F,d)}if(T.insertBefore(Q,d),k===""||k.charAt(0)!==" "){const F=document.createTextNode("​");T.insertBefore(F,d)}b=k,E=y.endIndex}),b?d.textContent=b:T.removeChild(d)}}),i&&setTimeout(()=>{try{if(n.focus(),o){const d=window.getSelection();d.removeAllRanges(),d.addRange(o)}else e&&n.setSelection(e.index,e.length,"silent")}catch(d){console.log("Could not restore cursor position:",d),n.focus()}},1),setTimeout(()=>{x=!1,console.log("Styling application complete")},10)}function re(n){const t=`field-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,e=`<span class="field-component" data-field-text="[field: ${n}]" data-field-name="${n}" id="${t}" contenteditable="false" style="display: inline-block; background: #fefce8; border: 1px solid #eab308; border-radius: 4px; padding: 2px 6px 4px 6px; margin: 0 2px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; cursor: default; vertical-align: baseline; line-height: 1.2; isolation: isolate;">
        <span class="field-label" style="display: block; font-size: 9px; color: #a16207; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1; margin-bottom: 1px;">Field</span>
        <span class="field-content" style="display: block; font-size: 12px; color: #92400e; font-weight: 500; line-height: 1;">${n}</span>
    </span>`;return console.log("Generated field HTML:",e),e}function de(n){const t=`aifield-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,e=`<span class="aifield-component" data-field-text="[aifield: ${n}]" data-field-name="${n}" id="${t}" contenteditable="false" style="display: inline-block; background: #dbeafe; border: 1px solid #3b82f6; border-radius: 4px; padding: 2px 6px 4px 6px; margin: 0 2px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; cursor: default; vertical-align: baseline; line-height: 1.2; isolation: isolate;">
        <span class="field-label" style="display: block; font-size: 9px; color: #1d4ed8; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1; margin-bottom: 1px;">AI Field</span>
        <span class="field-content" style="display: block; font-size: 12px; color: #1e40af; font-weight: 500; line-height: 1;">${n}</span>
    </span>`;return console.log("Generated AI field HTML:",e),e}function P(){const n=_("Create Field","Enter a name for this field:"),t=function(a){a.key==="Enter"&&a.target!==e&&(a.preventDefault(),a.stopPropagation())};document.addEventListener("keydown",t,!0);const e=document.createElement("input");e.type="text",e.placeholder="e.g., Patient Name, Surgeon Name",e.style.cssText=`
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 14px;
        margin: 16px 0;
        outline: none;
    `,e.addEventListener("focus",function(){this.style.borderColor="#3b82f6",this.style.boxShadow="0 0 0 3px rgba(59, 130, 246, 0.1)"}),e.addEventListener("blur",function(){this.style.borderColor="#d1d5db",this.style.boxShadow="none"});const i=document.createElement("div");i.style.cssText=`
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        margin-top: 16px;
    `;const o=A("Cancel","secondary"),l=A("Create Field","primary"),r=()=>{document.removeEventListener("keydown",t,!0),n.remove()};o.addEventListener("click",r),l.addEventListener("click",()=>{const a=e.value.trim();if(a){let f=U(a);console.log("Creating field with name:",a,"and ID:",f),H(a,!1),r()}else e.style.borderColor="#ef4444",e.focus()}),e.addEventListener("keydown",function(a){a.key==="Enter"?(a.preventDefault(),l.click()):a.key==="Escape"&&(a.preventDefault(),r())}),i.appendChild(o),i.appendChild(l);const s=n.querySelector(".modal-content");s.appendChild(e),s.appendChild(i);const d=n.remove;n.remove=function(){document.removeEventListener("keydown",t,!0),d.call(this)},setTimeout(()=>e.focus(),100)}function W(){const n=_("Select AI Field","Choose a predefined AI field to insert:"),t=document.createElement("div");t.style.cssText=`
        max-height: 300px;
        overflow-y: auto;
        margin: 16px 0;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
    `,D.forEach((l,r)=>{const s=document.createElement("div");s.className="ai-field-option",s.style.cssText=`
            padding: 12px 16px;
            cursor: pointer;
            border-bottom: 1px solid #f3f4f6;
            transition: background-color 0.15s ease;
        `,r===D.length-1&&(s.style.borderBottom="none"),s.innerHTML=`
            <div style="font-weight: 500; color: #1a1a1a;">${l}</div>
        `,s.addEventListener("mouseenter",function(){this.style.backgroundColor="#f8fafc"}),s.addEventListener("mouseleave",function(){this.style.backgroundColor="transparent"}),s.addEventListener("click",()=>{console.log("Selected AI field:",l),H(l,!0),n.remove()}),t.appendChild(s)});const e=document.createElement("div");e.style.cssText=`
        display: flex;
        justify-content: flex-end;
        margin-top: 16px;
    `;const i=A("Cancel","secondary");i.addEventListener("click",()=>{n.remove()}),e.appendChild(i);const o=n.querySelector(".modal-content");o.appendChild(t),o.appendChild(e)}function _(n,t){const e=document.createElement("div");e.className="field-modal",e.style.cssText=`
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;const i=document.createElement("div");i.className="modal-content",i.style.cssText=`
        background: white;
        border-radius: 12px;
        padding: 24px;
        min-width: 400px;
        max-width: 500px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    `,i.innerHTML=`
        <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #1a1a1a;">${n}</h3>
        <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">${t}</p>
    `,e.appendChild(i),document.body.appendChild(e),e.addEventListener("click",function(l){l.target===e&&e.remove()});const o=function(l){l.key==="Escape"&&(e.remove(),document.removeEventListener("keydown",o))};return document.addEventListener("keydown",o),e}function A(n,t="primary"){const e=document.createElement("button");e.textContent=n;const i=`
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        border: 1px solid;
        transition: all 0.15s ease;
    `;return t==="primary"?(e.style.cssText=i+`
            background: #3b82f6;
            border-color: #3b82f6;
            color: white;
        `,e.addEventListener("mouseenter",function(){this.style.backgroundColor="#2563eb",this.style.borderColor="#2563eb"}),e.addEventListener("mouseleave",function(){this.style.backgroundColor="#3b82f6",this.style.borderColor="#3b82f6"})):(e.style.cssText=i+`
            background: white;
            border-color: #d1d5db;
            color: #374151;
        `,e.addEventListener("mouseenter",function(){this.style.backgroundColor="#f9fafb"}),e.addEventListener("mouseleave",function(){this.style.backgroundColor="white"})),e}function ae(){v(),document.querySelectorAll(".field-modal").forEach(t=>t.remove()),window.fieldStylingTimeout&&(clearTimeout(window.fieldStylingTimeout),window.fieldStylingTimeout=null),g=null,u=!1,c=null,x=!1,j.clear()}function ce(){document.readyState==="loading"?document.addEventListener("DOMContentLoaded",function(){setTimeout(L,100)}):setTimeout(L,100)}window.initializeFields=L;window.getQuillInstance=I;window.insertField=V;window.updateField=G;window.removeField=K;window.getAllFields=B;window.getTextWithFields=N;window.validateFields=X;window.toggleFieldsHighlight=J;window.exportWithFields=Y;window.importWithFields=Z;window.handleFieldShortcuts=ee;window.showSlashMenu=z;window.showFieldNameInput=P;window.showAIFieldOptions=W;window.setupFieldEventListeners=R;window.cleanupFields=ae;ce();
