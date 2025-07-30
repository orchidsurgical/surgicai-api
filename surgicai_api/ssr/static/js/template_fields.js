let p=null,j=new Map,u=!1,C={x:0,y:0},c=null,v=-1,m=0,x=!1;const B=["Postoperative Diagnosis","Procedures"];function L(){const t=A();if(!t){console.warn("No Quill instance found for field initialization");return}p=t,z(),setTimeout(()=>{b()},100),console.log("Fields functionality initialized successfully"),console.log("Quill instance:",t)}function U(t){return t.toLowerCase().replace(/\s+/g,"_")}function A(){let t=window.quill;if(!t&&window.Quill){const n=document.getElementById("editor");n&&n.__quill&&(t=n.__quill)}return t}function G(t,n){const e=A();if(!e)return;let i;t==="ai"?i=`[aifield: ${n}][/aifield]`:i=`[field: ${t}][/field]`;const o=e.getSelection(!0);let l=o?o.index:e.getLength();e.insertText(l,i,"silent"),e.setSelection(l+i.length,0,"silent"),setTimeout(()=>{b()},50)}function V(t,n){}function K(t){}function R(){if(!editorElement)return[];const t=[];return editorElement.querySelectorAll(".field-component, .aifield-component").forEach((e,i)=>{const o=e.getAttribute("data-field-name"),l=e.getAttribute("data-field-text"),r=e.classList.contains("aifield-component");o&&t.push({name:o,value:l,isAIField:r,element:e})}),t}function X(){return{success:!0,errors:[]}}function J(){}function N(){const t=p;if(!t)return"";const n=t.container.querySelector(".ql-editor");if(!n)return t.getText();const e=n.cloneNode(!0);e.querySelectorAll(".field-component, .aifield-component").forEach(s=>{const d=s.getAttribute("data-field-text");if(d){const a=document.createTextNode(d);s.parentNode.replaceChild(a,s)}});let o=e.innerHTML;o=o.replace(/<br\s*\/?>/gi,`
`),o=o.replace(/<\/p>/gi,`
`),o=o.replace(/<p[^>]*>/gi,""),o=o.replace(/<div[^>]*>/gi,""),o=o.replace(/<\/div>/gi,`
`);const l=document.createElement("div");l.innerHTML=o;let r=l.textContent||l.innerText||"";return r=r.replace(/\n\s*\n\s*\n/g,`

`),r=r.trim(),r}function Y(){if(!p)return{content:"",fields:[]};const n=N(),e=R();return{content:n,fields:e}}function Z(t){}function ee(t){}function z(){const t=p;t&&(t.on("text-change",function(n,e,i){if(i!=="user"||x)return;console.log("Text change detected:",n),clearTimeout(window.fieldStylingTimeout),window.fieldStylingTimeout=setTimeout(()=>{console.log("Debounced field styling triggered"),b()},500);const o=n.ops;if(o&&o.length>0){const l=o[o.length-1];if(console.log("Last operation:",l),l.insert==="/"){console.log("Slash detected! Showing menu...");const r=t.getSelection();r&&(v=r.index-1,setTimeout(()=>{O(r.index)},10))}else u&&l.insert&&typeof l.insert=="string"&&ie()}}),document.addEventListener("click",function(n){u&&!n.target.closest(".slash-menu")&&!n.target.closest(".ql-editor")&&S()}),document.addEventListener("keydown",function(n){n.key==="Escape"&&u?S():u&&n.key==="Enter"?(n.preventDefault(),n.stopPropagation(),le()):u&&(n.key==="ArrowUp"||n.key==="ArrowDown")?(n.preventDefault(),n.stopPropagation(),oe(n.key==="ArrowDown"?1:-1)):n.key==="Backspace"&&!u?ne(n):(n.key==="ArrowLeft"||n.key==="ArrowRight")&&!u&&te(n)},!0))}function te(t){const n=p;if(!n)return;const e=n.getSelection();if(!e||e.length>0)return;const i=e.index,o=t.key==="ArrowLeft",l=t.key==="ArrowRight";if(o&&i>0){const r=n.getText(0,i),s=/\[(ai)?field:\s*([^\]]+)\]\[\/\1?field\]$/,d=r.match(s);if(d){const a=d[0],f=i-a.length;console.log("Arrow left: jumping to start of field:",a),t.preventDefault(),t.stopPropagation(),n.setSelection(f,0,"user")}}else if(l&&i<n.getLength()-1){const r=n.getText(i),s=/^\[(ai)?field:\s*([^\]]+)\]\[\/\1?field\]/,d=r.match(s);if(d){const a=d[0],f=i+a.length;console.log("Arrow right: jumping to end of field:",a),t.preventDefault(),t.stopPropagation(),n.setSelection(f,0,"user")}}}function ne(t){const n=p;if(!n)return;const e=n.getSelection();if(!e||e.length>0)return;const i=e.index;if(i===0)return;const o=n.container.querySelector(".ql-editor");if(!o)return;const l=n.getBounds(i-1,1),r=document.elementFromPoint(o.getBoundingClientRect().left+l.left+l.width,o.getBoundingClientRect().top+l.top+l.height/2);let s=null;if(r&&(s=r.closest(".field-component, .aifield-component"),!s&&r.previousSibling&&r.previousSibling.classList&&(r.previousSibling.classList.contains("field-component")||r.previousSibling.classList.contains("aifield-component"))&&(s=r.previousSibling)),!s){const d=n.getText(0,i),a=/\[(ai)?field:\s*([^\]]+)\]\[\/\1?field\]$/,f=d.match(a);if(f){const g=f[0],h=i-g.length;console.log("Deleting field (text pattern):",g,"from position",h),t.preventDefault(),t.stopPropagation(),n.deleteText(h,g.length,"user"),n.setSelection(h,0,"user"),setTimeout(()=>{b()},10);return}}if(s){console.log("Deleting field component:",s),t.preventDefault(),t.stopPropagation();const d=s.getAttribute("data-field-text");if(d){const f=n.getText().indexOf(d.replace(/\[field:\s*/,"[field: "));f!==-1&&(n.deleteText(f,d.length,"user"),n.setSelection(f,0,"user"))}s.remove(),setTimeout(()=>{b()},10)}}function ie(){if(!u||v===-1)return;const t=p;if(!t)return;const n=t.getSelection();if(!n)return;const e=t.getText(v+1,n.index-v-1);console.log("Text after slash:",e),H(e)}function oe(t){if(!c)return;const n=c.querySelectorAll(".slash-menu-item");n.length!==0&&(m=Math.max(0,Math.min(n.length-1,m+t)),M())}function le(){if(!c)return;const t=c.querySelectorAll(".slash-menu-item");if(t.length===0)return;const n=t[m];n&&n.click()}function M(){if(!c)return;c.querySelectorAll(".slash-menu-item").forEach((n,e)=>{e===m?n.style.backgroundColor="#f3f4f6":n.style.backgroundColor="transparent"})}function O(t){const n=p;if(!n||u)return;console.log("Showing slash menu at index:",t);const e=n.getBounds(t),i=n.container.getBoundingClientRect();C={x:i.left+e.left,y:i.top+e.top+e.height+5},console.log("Menu position:",C),H(""),u=!0}function S(){c&&(c.remove(),c=null),u=!1,v=-1,m=0}function H(t=""){c&&c.remove();const e=[{label:"AI Field",icon:"🤖",description:"Insert a predefined AI field",action:"ai"},{label:"Field",icon:"📝",description:"Create a custom field",action:"field"}].filter(i=>i.label.toLowerCase().startsWith(t.toLowerCase()));if(e.sort((i,o)=>i.label.localeCompare(o.label)),m=Math.min(m,e.length-1),e.length===0){S();return}c=document.createElement("div"),c.className="slash-menu",c.style.cssText=`
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
    `,e.forEach((i,o)=>{const l=se(i.label,i.icon,i.description);l.addEventListener("click",()=>{S(),i.action==="field"?P():i.action==="ai"&&W()}),c.appendChild(l)}),document.body.appendChild(c),M()}function se(t,n,e){const i=document.createElement("div");return i.className="slash-menu-item",i.style.cssText=`
        padding: 12px 16px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 12px;
        transition: background-color 0.15s ease;
    `,i.innerHTML=`
        <span style="font-size: 16px;">${n}</span>
        <div>
            <div style="font-weight: 500; color: #1a1a1a;">${t}</div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">${e}</div>
        </div>
    `,i.addEventListener("mouseenter",function(){const o=c?c.querySelectorAll(".slash-menu-item"):[];m=Array.from(o).indexOf(this),M()}),i.addEventListener("mouseleave",function(){}),i}function q(t,n=!1){const e=p;if(!e)return;const i=n?`[aifield: ${t}][/aifield]`:`[field: ${t}][/field]`,o=e.getSelection(!0);if(o){let l=-1;const r=o.index;for(let s=r-1;s>=0;s--){const d=e.getText(s,1);if(d==="/"){l=s;break}if(d===" "||d===`
`||d==="	")break}if(l!==-1){const s=r-l;e.deleteText(l,s,"silent"),e.insertText(l,i,"silent"),e.setSelection(l+i.length,0,"silent")}else e.insertText(r,i,"silent"),e.setSelection(r+i.length,0,"silent")}else{const l=e.getLength();e.insertText(l-1,i,"silent"),e.setSelection(l-1+i.length,0,"silent")}setTimeout(()=>{console.log("Applying field styling after insertion"),b()},50)}function b(){const t=p;if(!t)return;if(x){console.log("Already applying styling, skipping...");return}x=!0,console.log("Applying field styling...");const n=t.container.querySelector(".ql-editor");if(!n){console.log("No editor element found"),x=!1;return}const e=t.getSelection(),i=t.hasFocus();let o=null;if(e&&i){const d=window.getSelection();d.rangeCount>0&&(o=d.getRangeAt(0).cloneRange())}const l=document.createTreeWalker(n,NodeFilter.SHOW_TEXT,null,!1),r=[];let s;for(;s=l.nextNode();)/\[(ai)?field:\s*[^\]]+\]\[\/\1?field\]/.test(s.textContent)&&r.push(s);if(r.length===0){x=!1;return}r.forEach(d=>{const a=d.textContent,f=/\[(ai)?field:\s*([^\]]+)\]\[\/\1?field\]/g;let g;const h=[];for(;(g=f.exec(a))!==null;)h.push({fullMatch:g[0],fieldName:g[2].trim(),isAIField:g[1]==="ai",startIndex:g.index,endIndex:g.index+g[0].length});if(h.length>0){const T=d.parentNode;let w=a,E=0;h.forEach(y=>{const $=document.createElement("div");$.innerHTML=y.isAIField?de(y.fieldName):re(y.fieldName);const Q=$.firstChild,D=w.substring(0,y.startIndex-E),k=w.substring(y.endIndex-E);if(D){const F=document.createTextNode(D);T.insertBefore(F,d)}if(T.insertBefore(Q,d),k===""||k.charAt(0)!==" "){const F=document.createTextNode("​");T.insertBefore(F,d)}w=k,E=y.endIndex}),w?d.textContent=w:T.removeChild(d)}}),i&&setTimeout(()=>{try{if(t.focus(),o){const d=window.getSelection();d.removeAllRanges(),d.addRange(o)}else e&&t.setSelection(e.index,e.length,"silent")}catch(d){console.log("Could not restore cursor position:",d),t.focus()}},1),setTimeout(()=>{x=!1,console.log("Styling application complete")},10)}function re(t){const n=`field-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,e=`<span class="field-component" data-field-text="[field: ${t}][/field]" data-field-name="${t}" id="${n}" contenteditable="false" style="display: inline-block; background: #fefce8; border: 1px solid #eab308; border-radius: 4px; padding: 2px 6px 4px 6px; margin: 0 2px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; cursor: default; vertical-align: baseline; line-height: 1.2; isolation: isolate;">
        <span class="field-label" style="display: block; font-size: 9px; color: #a16207; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1; margin-bottom: 1px;">Field</span>
        <span class="field-content" style="display: block; font-size: 12px; color: #92400e; font-weight: 500; line-height: 1;">${t}</span>
    </span>`;return console.log("Generated field HTML:",e),e}function de(t){const n=`aifield-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,e=`<span class="aifield-component" data-field-text="[aifield: ${t}][/aifield]" data-field-name="${t}" id="${n}" contenteditable="false" style="display: inline-block; background: #dbeafe; border: 1px solid #3b82f6; border-radius: 4px; padding: 2px 6px 4px 6px; margin: 0 2px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; cursor: default; vertical-align: baseline; line-height: 1.2; isolation: isolate;">
        <span class="field-label" style="display: block; font-size: 9px; color: #1d4ed8; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1; margin-bottom: 1px;">AI Field</span>
        <span class="field-content" style="display: block; font-size: 12px; color: #1e40af; font-weight: 500; line-height: 1;">${t}</span>
    </span>`;return console.log("Generated AI field HTML:",e),e}function P(){const t=p;if(!t)return;const n=t.getSelection(!0);if(n){let e=-1;const i=n.index;for(let o=i-1;o>=0;o--){const l=t.getText(o,1);if(l==="/"){e=o;break}if(l===" "||l===`
`||l==="	")break}if(e!==-1){const o=i-e;t.deleteText(e,o,"silent"),t.insertText(e,"***","silent"),t.setSelection(e+3,0,"silent")}else t.insertText(i,"***","silent"),t.setSelection(i+3,0,"silent")}else{const e=t.getLength();t.insertText(e-1,"***","silent"),t.setSelection(e-1+3,0,"silent")}}function ae(){const t=_("Create Field","Enter a name for this field:"),n=function(a){a.key==="Enter"&&a.target!==e&&(a.preventDefault(),a.stopPropagation())};document.addEventListener("keydown",n,!0);const e=document.createElement("input");e.type="text",e.placeholder="e.g., Patient Name, Surgeon Name",e.style.cssText=`
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
    `;const o=I("Cancel","secondary"),l=I("Create Field","primary"),r=()=>{document.removeEventListener("keydown",n,!0),t.remove()};o.addEventListener("click",r),l.addEventListener("click",()=>{const a=e.value.trim();if(a){let f=U(a);console.log("Creating field with name:",a,"and ID:",f),q(a,!1),r()}else e.style.borderColor="#ef4444",e.focus()}),e.addEventListener("keydown",function(a){a.key==="Enter"?(a.preventDefault(),l.click()):a.key==="Escape"&&(a.preventDefault(),r())}),i.appendChild(o),i.appendChild(l);const s=t.querySelector(".modal-content");s.appendChild(e),s.appendChild(i);const d=t.remove;t.remove=function(){document.removeEventListener("keydown",n,!0),d.call(this)},setTimeout(()=>e.focus(),100)}function W(){const t=_("Select AI Field","Choose a predefined AI field to insert:"),n=document.createElement("div");n.style.cssText=`
        max-height: 300px;
        overflow-y: auto;
        margin: 16px 0;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
    `,B.forEach((l,r)=>{const s=document.createElement("div");s.className="ai-field-option",s.style.cssText=`
            padding: 12px 16px;
            cursor: pointer;
            border-bottom: 1px solid #f3f4f6;
            transition: background-color 0.15s ease;
        `,r===B.length-1&&(s.style.borderBottom="none"),s.innerHTML=`
            <div style="font-weight: 500; color: #1a1a1a;">${l}</div>
        `,s.addEventListener("mouseenter",function(){this.style.backgroundColor="#f8fafc"}),s.addEventListener("mouseleave",function(){this.style.backgroundColor="transparent"}),s.addEventListener("click",()=>{console.log("Selected AI field:",l),q(l,!0),t.remove()}),n.appendChild(s)});const e=document.createElement("div");e.style.cssText=`
        display: flex;
        justify-content: flex-end;
        margin-top: 16px;
    `;const i=I("Cancel","secondary");i.addEventListener("click",()=>{t.remove()}),e.appendChild(i);const o=t.querySelector(".modal-content");o.appendChild(n),o.appendChild(e)}function _(t,n){const e=document.createElement("div");e.className="field-modal",e.style.cssText=`
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
        <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #1a1a1a;">${t}</h3>
        <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">${n}</p>
    `,e.appendChild(i),document.body.appendChild(e),e.addEventListener("click",function(l){l.target===e&&e.remove()});const o=function(l){l.key==="Escape"&&(e.remove(),document.removeEventListener("keydown",o))};return document.addEventListener("keydown",o),e}function I(t,n="primary"){const e=document.createElement("button");e.textContent=t;const i=`
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        border: 1px solid;
        transition: all 0.15s ease;
    `;return n==="primary"?(e.style.cssText=i+`
            background: #3b82f6;
            border-color: #3b82f6;
            color: white;
        `,e.addEventListener("mouseenter",function(){this.style.backgroundColor="#2563eb",this.style.borderColor="#2563eb"}),e.addEventListener("mouseleave",function(){this.style.backgroundColor="#3b82f6",this.style.borderColor="#3b82f6"})):(e.style.cssText=i+`
            background: white;
            border-color: #d1d5db;
            color: #374151;
        `,e.addEventListener("mouseenter",function(){this.style.backgroundColor="#f9fafb"}),e.addEventListener("mouseleave",function(){this.style.backgroundColor="white"})),e}function ce(){S(),document.querySelectorAll(".field-modal").forEach(n=>n.remove()),window.fieldStylingTimeout&&(clearTimeout(window.fieldStylingTimeout),window.fieldStylingTimeout=null),p=null,u=!1,c=null,x=!1,j.clear()}function fe(){document.readyState==="loading"?document.addEventListener("DOMContentLoaded",function(){setTimeout(L,100)}):setTimeout(L,100)}window.initializeFields=L;window.getQuillInstance=A;window.insertField=G;window.updateField=V;window.removeField=K;window.getAllFields=R;window.getTextWithFields=N;window.validateFields=X;window.toggleFieldsHighlight=J;window.exportWithFields=Y;window.importWithFields=Z;window.handleFieldShortcuts=ee;window.showSlashMenu=O;window.showFieldNameInput=ae;window.insertSimpleField=P;window.showAIFieldOptions=W;window.insertFieldIntoDocument=q;window.setupFieldEventListeners=z;window.cleanupFields=ce;fe();
