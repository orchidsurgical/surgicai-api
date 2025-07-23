let p=null,F=new Map,u=!1,x={x:0,y:0},a=null,g=-1,f=0;const E=["Postoperative Diagnosis","Procedures"];function y(){const n=w();if(!n){console.warn("No Quill instance found for field initialization");return}p=n,k(),console.log("Fields functionality initialized successfully"),console.log("Quill instance:",n)}function T(n){return n.toLowerCase().replace(/\s+/g,"_")}function w(){let n=window.quill;if(!n&&window.Quill){const t=document.getElementById("editor");t&&t.__quill&&(n=t.__quill)}return n}function I(n,t){const e=w();if(!e)return;let o;n==="ai"?o="<aifield></aifield> ":o=`<field id='${n}'></field> `;const l=e.getSelection(!0);let i=l?l.index:e.getLength();e.insertText(i,o,"silent"),e.setSelection(i+o.length,0,"silent")}function A(n,t){}function M(n){}function q(){return[]}function D(){return{success:!0,errors:[]}}function z(){}function B(){return{content:"",fields:[]}}function N(n){}function $(n){}function k(){const n=p;n&&(n.on("text-change",function(t,e,o){if(o!=="user")return;console.log("Text change detected:",t);const l=t.ops;if(l&&l.length>0){const i=l[l.length-1];if(console.log("Last operation:",i),i.insert==="/"){console.log("Slash detected! Showing menu...");const r=n.getSelection();r&&(g=r.index-1,setTimeout(()=>{W(r.index)},10))}else u&&i.insert&&typeof i.insert=="string"&&P()}}),document.addEventListener("click",function(t){u&&!t.target.closest(".slash-menu")&&!t.target.closest(".ql-editor")&&h()}),document.addEventListener("keydown",function(t){t.key==="Escape"&&u?h():u&&t.key==="Enter"?(t.preventDefault(),t.stopPropagation(),Q()):u&&(t.key==="ArrowUp"||t.key==="ArrowDown")?(t.preventDefault(),t.stopPropagation(),_(t.key==="ArrowDown"?1:-1)):t.key==="Backspace"&&!u?O(t):(t.key==="ArrowLeft"||t.key==="ArrowRight")&&!u&&R(t)},!0))}function R(n){const t=p;if(!t)return;const e=t.getSelection();if(!e||e.length>0)return;const o=e.index,l=n.key==="ArrowLeft",i=n.key==="ArrowRight";if(l&&o>0){const r=t.getText(0,o),s=/\[(ai)?field:\s*([^\]]+)\]$/,c=r.match(s);if(c){const d=c[0],m=o-d.length;console.log("Arrow left: jumping to start of field:",d),n.preventDefault(),n.stopPropagation(),t.setSelection(m,0,"user")}}else if(i&&o<t.getLength()-1){const r=t.getText(o),s=/^\[(ai)?field:\s*([^\]]+)\]/,c=r.match(s);if(c){const d=c[0],m=o+d.length;console.log("Arrow right: jumping to end of field:",d),n.preventDefault(),n.stopPropagation(),t.setSelection(m,0,"user")}}}function O(n){const t=p;if(!t)return;const e=t.getSelection();if(!e||e.length>0)return;const o=e.index;if(o===0)return;const l=t.getText(0,o),i=/\[(ai)?field:\s*([^\]]+)\]$/,r=l.match(i);if(r){const s=r[0],c=o-s.length;console.log("Deleting field:",s,"from position",c),n.preventDefault(),n.stopPropagation(),t.deleteText(c,s.length,"user"),t.setSelection(c,0,"user")}}function P(){if(!u||g===-1)return;const n=p;if(!n)return;const t=n.getSelection();if(!t)return;const e=n.getText(g+1,t.index-g-1);console.log("Text after slash:",e),C(e)}function _(n){if(!a)return;const t=a.querySelectorAll(".slash-menu-item");t.length!==0&&(f=Math.max(0,Math.min(t.length-1,f+n)),b())}function Q(){if(!a)return;const n=a.querySelectorAll(".slash-menu-item");if(n.length===0)return;const t=n[f];t&&t.click()}function b(){if(!a)return;a.querySelectorAll(".slash-menu-item").forEach((t,e)=>{e===f?t.style.backgroundColor="#f3f4f6":t.style.backgroundColor="transparent"})}function W(n){const t=p;if(!t||u)return;console.log("Showing slash menu at index:",n);const e=t.getBounds(n),o=t.container.getBoundingClientRect();x={x:o.left+e.left,y:o.top+e.top+e.height+5},console.log("Menu position:",x),C(""),u=!0}function h(){a&&(a.remove(),a=null),u=!1,g=-1,f=0}function C(n=""){a&&a.remove();const e=[{label:"AI Field",icon:"🤖",description:"Insert a predefined AI field",action:"ai"},{label:"Field",icon:"📝",description:"Create a custom field",action:"field"}].filter(o=>o.label.toLowerCase().startsWith(n.toLowerCase()));if(e.sort((o,l)=>o.label.localeCompare(l.label)),f=Math.min(f,e.length-1),e.length===0){h();return}a=document.createElement("div"),a.className="slash-menu",a.style.cssText=`
        position: fixed;
        left: ${x.x}px;
        top: ${x.y}px;
        background: white;
        border: 1px solid #e1e5e9;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        min-width: 200px;
        padding: 8px 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
    `,e.forEach((o,l)=>{const i=j(o.label,o.icon,o.description);i.addEventListener("click",()=>{h(),o.action==="field"?H():o.action==="ai"&&U()}),a.appendChild(i)}),document.body.appendChild(a),b()}function j(n,t,e){const o=document.createElement("div");return o.className="slash-menu-item",o.style.cssText=`
        padding: 12px 16px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 12px;
        transition: background-color 0.15s ease;
    `,o.innerHTML=`
        <span style="font-size: 16px;">${t}</span>
        <div>
            <div style="font-weight: 500; color: #1a1a1a;">${n}</div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">${e}</div>
        </div>
    `,o.addEventListener("mouseenter",function(){const l=a?a.querySelectorAll(".slash-menu-item"):[];f=Array.from(l).indexOf(this),b()}),o.addEventListener("mouseleave",function(){}),o}function S(n,t=!1){const e=p;if(!e)return;const o=t?`[aifield: ${n}]`:`[field: ${n}]`,l=e.getSelection(!0);if(l){let i=-1;const r=l.index;for(let s=r-1;s>=0;s--){const c=e.getText(s,1);if(c==="/"){i=s;break}if(c===" "||c===`
`||c==="	")break}if(i!==-1){const s=r-i;e.deleteText(i,s,"silent"),e.insertText(i,o,"silent"),e.setSelection(i+o.length,0,"silent")}else e.insertText(r,o,"silent"),e.setSelection(r+o.length,0,"silent")}else{const i=e.getLength();e.insertText(i-1,o,"silent"),e.setSelection(i-1+o.length,0,"silent")}}function H(){const n=L("Create Field","Enter a name for this field:"),t=function(d){d.key==="Enter"&&d.target!==e&&(d.preventDefault(),d.stopPropagation())};document.addEventListener("keydown",t,!0);const e=document.createElement("input");e.type="text",e.placeholder="e.g., Patient Name, Surgeon Name",e.style.cssText=`
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 14px;
        margin: 16px 0;
        outline: none;
    `,e.addEventListener("focus",function(){this.style.borderColor="#3b82f6",this.style.boxShadow="0 0 0 3px rgba(59, 130, 246, 0.1)"}),e.addEventListener("blur",function(){this.style.borderColor="#d1d5db",this.style.boxShadow="none"});const o=document.createElement("div");o.style.cssText=`
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        margin-top: 16px;
    `;const l=v("Cancel","secondary"),i=v("Create Field","primary"),r=()=>{document.removeEventListener("keydown",t,!0),n.remove()};l.addEventListener("click",r),i.addEventListener("click",()=>{const d=e.value.trim();if(d){let m=T(d);console.log("Creating field with name:",d,"and ID:",m),S(d,!1),r()}else e.style.borderColor="#ef4444",e.focus()}),e.addEventListener("keydown",function(d){d.key==="Enter"?(d.preventDefault(),i.click()):d.key==="Escape"&&(d.preventDefault(),r())}),o.appendChild(l),o.appendChild(i);const s=n.querySelector(".modal-content");s.appendChild(e),s.appendChild(o);const c=n.remove;n.remove=function(){document.removeEventListener("keydown",t,!0),c.call(this)},setTimeout(()=>e.focus(),100)}function U(){const n=L("Select AI Field","Choose a predefined AI field to insert:"),t=document.createElement("div");t.style.cssText=`
        max-height: 300px;
        overflow-y: auto;
        margin: 16px 0;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
    `,E.forEach((i,r)=>{const s=document.createElement("div");s.className="ai-field-option",s.style.cssText=`
            padding: 12px 16px;
            cursor: pointer;
            border-bottom: 1px solid #f3f4f6;
            transition: background-color 0.15s ease;
        `,r===E.length-1&&(s.style.borderBottom="none"),s.innerHTML=`
            <div style="font-weight: 500; color: #1a1a1a;">${i}</div>
        `,s.addEventListener("mouseenter",function(){this.style.backgroundColor="#f8fafc"}),s.addEventListener("mouseleave",function(){this.style.backgroundColor="transparent"}),s.addEventListener("click",()=>{console.log("Selected AI field:",i),S(i,!0),n.remove()}),t.appendChild(s)});const e=document.createElement("div");e.style.cssText=`
        display: flex;
        justify-content: flex-end;
        margin-top: 16px;
    `;const o=v("Cancel","secondary");o.addEventListener("click",()=>{n.remove()}),e.appendChild(o);const l=n.querySelector(".modal-content");l.appendChild(t),l.appendChild(e)}function L(n,t){const e=document.createElement("div");e.className="field-modal",e.style.cssText=`
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
    `;const o=document.createElement("div");o.className="modal-content",o.style.cssText=`
        background: white;
        border-radius: 12px;
        padding: 24px;
        min-width: 400px;
        max-width: 500px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    `,o.innerHTML=`
        <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #1a1a1a;">${n}</h3>
        <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">${t}</p>
    `,e.appendChild(o),document.body.appendChild(e),e.addEventListener("click",function(i){i.target===e&&e.remove()});const l=function(i){i.key==="Escape"&&(e.remove(),document.removeEventListener("keydown",l))};return document.addEventListener("keydown",l),e}function v(n,t="primary"){const e=document.createElement("button");e.textContent=n;const o=`
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        border: 1px solid;
        transition: all 0.15s ease;
    `;return t==="primary"?(e.style.cssText=o+`
            background: #3b82f6;
            border-color: #3b82f6;
            color: white;
        `,e.addEventListener("mouseenter",function(){this.style.backgroundColor="#2563eb",this.style.borderColor="#2563eb"}),e.addEventListener("mouseleave",function(){this.style.backgroundColor="#3b82f6",this.style.borderColor="#3b82f6"})):(e.style.cssText=o+`
            background: white;
            border-color: #d1d5db;
            color: #374151;
        `,e.addEventListener("mouseenter",function(){this.style.backgroundColor="#f9fafb"}),e.addEventListener("mouseleave",function(){this.style.backgroundColor="white"})),e}function V(){h(),document.querySelectorAll(".field-modal").forEach(t=>t.remove()),p=null,u=!1,a=null,F.clear()}function K(){document.readyState==="loading"?document.addEventListener("DOMContentLoaded",function(){setTimeout(y,100)}):setTimeout(y,100)}window.initializeFields=y;window.getQuillInstance=w;window.insertField=I;window.updateField=A;window.removeField=M;window.getAllFields=q;window.validateFields=D;window.toggleFieldsHighlight=z;window.exportWithFields=B;window.importWithFields=N;window.handleFieldShortcuts=$;window.setupFieldEventListeners=k;window.cleanupFields=V;K();
