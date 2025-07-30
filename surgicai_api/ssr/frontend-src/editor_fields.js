(function() {
    // Global variable to track the current Quill instance
    let currentQuillInstance = null;
    let isApplyingStyling = false;

    /**
     * Initialize fields functionality
     * Sets up the Quill editor instance and any necessary event listeners
     */
    function initializeFields() {
        const quill = getQuillInstance();
        if (!quill) {
            console.warn('No Quill instance found for field initialization');
            return;
        }

        currentQuillInstance = quill;
        isFieldsActive = true;

        console.log('Fields functionality initialized successfully');
        console.log('Quill instance:', quill);
    }

    /**
     * Get the active Quill editor instance
     * @returns {Object|null} The Quill editor instance or null if not found
     */
    function getQuillInstance() {
        // TODO: Implement logic to find and return the Quill editor instance
        // Similar to how transcribe.js finds the editor
        let quillInstance = window.quill;
        if (!quillInstance && window.Quill) {
            const editorElem = document.getElementById('editor');
            if (editorElem && editorElem.__quill) {
                quillInstance = editorElem.__quill;
            }
        }
        return quillInstance;
    }

    /**
     * Apply visual styling to fields in the editor
     */
    function applyFieldStyling() {
        const quill = currentQuillInstance;
        if (!quill) return;
        
        // Prevent infinite loops
        if (isApplyingStyling) {
            console.log('Already applying styling, skipping...');
            return;
        }
        
        isApplyingStyling = true;
        console.log('Applying field styling...');
        
        const editorElement = quill.container.querySelector('.ql-editor');
        if (!editorElement) {
            console.log('No editor element found');
            isApplyingStyling = false;
            return;
        }
        
        // Store cursor position and focus state with more precision
        const selection = quill.getSelection();
        const hadFocus = quill.hasFocus();
        let savedRange = null;
        
        // Save the actual DOM selection for more accurate cursor restoration
        if (selection && hadFocus) {
            const domSelection = window.getSelection();
            if (domSelection.rangeCount > 0) {
                savedRange = domSelection.getRangeAt(0).cloneRange();
            }
        }
        
        // Find all text nodes that contain field patterns
        const walker = document.createTreeWalker(
            editorElement,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            // Check if this text node contains a field pattern (regular or AI field)
            if (/\[(ai)?field:\s*([^\]]+)\]([\s\S]*?)\[\/(?:\1)?field\]/.test(node.textContent)) {
                textNodes.push(node);
            }
        }
        
        // Only proceed if we actually found fields to process
        if (textNodes.length === 0) {
            isApplyingStyling = false;
            return;
        }
        
        // Process each text node that contains field patterns
        textNodes.forEach(textNode => {
            const text = textNode.textContent;
            // Updated regex: matches [field: field name]content[/field] and [aifield: field name]content[/aifield]
            const fieldRegex = /\[(ai)?field:\s*([^\]]+)\]([\s\S]*?)\[\/(?:\1)?field\]/g;
            let match;
            const replacements = [];
            
            while ((match = fieldRegex.exec(text)) !== null) {
                replacements.push({
                    fullMatch: match[0],
                    fieldName: match[2].trim(),
                    content: match[3],
                    isAIField: match[1] === 'ai',
                    startIndex: match.index,
                    endIndex: match.index + match[0].length
                });
            }
            
            // If we found field patterns in this text node, replace them
            if (replacements.length > 0) {
                const parent = textNode.parentNode;
                let currentText = text;
                let offset = 0;
                
                replacements.forEach(replacement => {
                    // Create a temporary container to hold the new HTML
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = replacement.isAIField 
                        ? createAIFieldComponentHtml(replacement.fieldName, replacement.content)
                        : createFieldComponentHtml(replacement.fieldName, replacement.content);
                    const fieldComponent = tempDiv.firstChild;
                    
                    // Split the text node at the field boundaries
                    const beforeText = currentText.substring(0, replacement.startIndex - offset);
                    const afterText = currentText.substring(replacement.endIndex - offset);
                    
                    // Create new text nodes if needed
                    if (beforeText) {
                        const beforeNode = document.createTextNode(beforeText);
                        parent.insertBefore(beforeNode, textNode);
                    }
                    
                    // Insert the field component
                    parent.insertBefore(fieldComponent, textNode);
                    
                    // Add event listener to handle empty content
                    const fieldContentElement = fieldComponent.querySelector('.field-content');
                    if (fieldContentElement && !fieldContentElement.hasAttribute('data-listeners-added')) {
                        fieldContentElement.addEventListener('input', function() {
                            if (this.textContent.trim() === '') {
                                this.textContent = '***';

                                // Select all the *** text
                                const range = document.createRange();
                                const selection = window.getSelection();
                                range.selectNodeContents(this);
                                selection.removeAllRanges();
                                selection.addRange(range);
                            }
                        });
                        
                        fieldContentElement.addEventListener('focus', function() {
                            // If the content is just the placeholder ***, select it for easy overwriting
                            if (this.textContent.trim() === '***') {
                                setTimeout(() => {
                                    const range = document.createRange();
                                    const selection = window.getSelection();
                                    range.selectNodeContents(this);
                                    selection.removeAllRanges();
                                    selection.addRange(range);
                                }, 1); // Small delay to ensure focus is fully established
                            }
                        });
                        
                        fieldContentElement.addEventListener('blur', function() {
                            if (this.textContent.trim() === '') {
                                this.textContent = '***';
                            }
                        });
                        
                        // Add paste event listener to handle cursor positioning
                        fieldContentElement.addEventListener('paste', function(e) {
                            e.stopPropagation(); // Prevent Quill from handling this paste event
                            
                            // Get the current selection
                            const selection = window.getSelection();
                            if (selection.rangeCount > 0) {
                                const range = selection.getRangeAt(0);
                                
                                // Get the pasted text
                                const pastedText = (e.clipboardData || window.clipboardData).getData('text/plain');
                                
                                // Delete any selected content
                                range.deleteContents();
                                
                                // Insert the pasted text at the cursor position
                                const textNode = document.createTextNode(pastedText);
                                range.insertNode(textNode);
                                
                                // Move cursor to end of pasted text
                                range.setStartAfter(textNode);
                                range.setEndAfter(textNode);
                                selection.removeAllRanges();
                                selection.addRange(range);
                            }
                            
                            e.preventDefault(); // Prevent default paste behavior
                        });
                        
                        // Mark that listeners have been added
                        fieldContentElement.setAttribute('data-listeners-added', 'true');
                    }
                    
                    // Add a zero-width space after the field component to prevent style inheritance
                    if (afterText === '' || afterText.charAt(0) !== ' ') {
                        const spacerNode = document.createTextNode('\u200B'); // Zero-width space
                        parent.insertBefore(spacerNode, textNode);
                    }
                    
                    // Update the remaining text
                    currentText = afterText;
                    offset = replacement.endIndex;
                });
                
                // Update or remove the original text node
                if (currentText) {
                    textNode.textContent = currentText;
                } else {
                    parent.removeChild(textNode);
                }
            }
        });
        
        // Restore focus and cursor position using the most reliable method
        if (hadFocus) {
            setTimeout(() => {
                try {
                    quill.focus();
                    
                    // Try to restore the DOM selection first (most accurate)
                    if (savedRange) {
                        const domSelection = window.getSelection();
                        domSelection.removeAllRanges();
                        domSelection.addRange(savedRange);
                    } else if (selection) {
                        // Fallback to Quill's selection API
                        quill.setSelection(selection.index, selection.length, 'silent');
                    }
                } catch (e) {
                    console.log('Could not restore cursor position:', e);
                    // Final fallback: just focus the editor
                    quill.focus();
                }
            }, 1); // Reduced timeout for faster cursor restoration
        }
        
        // Reset the flag after a brief delay to allow Quill to process
        setTimeout(() => {
            isApplyingStyling = false;
            console.log('Styling application complete');
        }, 10);
    }

    /**
     * Create HTML for a field component
     */
    function createFieldComponentHtml(fieldName, content) {
        const componentId = `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        content = content || '***'; // Ensure content is defined
        
        const html = `<span class="field-component" data-field-text="[field: ${fieldName}][/field]" data-field-name="${fieldName}" id="${componentId}" contenteditable="false" style="display: inline-block; background: #fefce8; border: 1px solid #eab308; border-radius: 4px; padding: 2px 6px 4px 6px; margin: 0 2px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; cursor: default; vertical-align: baseline; line-height: 1.2; isolation: isolate;">
            <span class="field-content" style="display: block; font-size: 1em; color: #92400e; font-weight: 500; line-height: 1; word-wrap: break-word; white-space: pre-wrap; cursor: text; outline: none; caret-color: #92400e;" contenteditable="true">${content}</span>
        </span>`;
        
        console.log('Generated field HTML:', html);
        return html;
    }

    /**
     * Create HTML for an AI field component
     */
    function createAIFieldComponentHtml(fieldName, content) {
        const componentId = `aifield-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        content = content || '{auto-generated field}'; // Ensure content is defined
        
        const html = `<span class="aifield-component" data-field-text="[aifield: ${fieldName}][/aifield]" data-field-name="${fieldName}" id="${componentId}" contenteditable="false" style="display: inline-block; background: #dbeafe; border: 1px solid #3b82f6; border-radius: 4px; padding: 2px 6px 4px 6px; margin: 0 2px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; cursor: default; vertical-align: baseline; line-height: 1.2; isolation: isolate;">
            <span class="field-content" style="display: block; font-size: 1em; color: #1e40af; font-weight: 500; line-height: 1; word-wrap: break-word; white-space: pre-wrap; cursor: text; outline: none; caret-color: #1e40af;" contenteditable="true">${content}</span>
        </span>`;
        
        console.log('Generated AI field HTML:', html);
        return html;
    }

    /**
     * Parse the Quill editor content and convert field components back to text format
     * @returns {string} The editor content with field components converted to text format
     */
    function parseQuillTextWithFields() {
        const quill = currentQuillInstance;
        if (!quill) {
            console.warn('No Quill instance found for parsing');
            return '';
        }
        
        const editorElement = quill.container.querySelector('.ql-editor');
        if (!editorElement) {
            console.warn('No editor element found for parsing');
            return quill.getText();
        }
        
        // Clone the editor content to avoid modifying the original
        const clonedEditor = editorElement.cloneNode(true);
        
        // Find all field components in the cloned content
        const fieldComponents = clonedEditor.querySelectorAll('.field-component, .aifield-component');
        
        // Replace each field component with its text format
        fieldComponents.forEach(component => {
            const fieldName = component.getAttribute('data-field-name');
            const fieldContent = component.querySelector('.field-content');
            const content = fieldContent ? fieldContent.textContent : '';
            const isAIField = component.classList.contains('aifield-component');
            
            // Create the field text in proper format
            const fieldText = isAIField 
                ? `[aifield: ${fieldName}]${content}[/aifield]`
                : `[field: ${fieldName}]${content}[/field]`;
            
            // Create a text node with the field format
            const textNode = document.createTextNode(fieldText);
            component.parentNode.replaceChild(textNode, component);
        });
        
        // Get text while preserving line breaks by using innerHTML and converting <br> and <p> tags
        let html = clonedEditor.innerHTML;
        
        // Convert HTML line breaks to actual newlines
        html = html.replace(/<br\s*\/?>/gi, '\n');
        html = html.replace(/<\/p>/gi, '\n');
        html = html.replace(/<p[^>]*>/gi, '');
        html = html.replace(/<div[^>]*>/gi, '');
        html = html.replace(/<\/div>/gi, '\n');
        
        // Create a temporary element to decode HTML entities and get clean text
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // Get the text content which now preserves the line structure
        let text = tempDiv.textContent || tempDiv.innerText || '';
        
        // Clean up multiple consecutive newlines but preserve intentional line breaks
        text = text.replace(/\n\s*\n\s*\n/g, '\n\n'); // Max of double newlines
        text = text.trim(); // Remove leading/trailing whitespace
        
        return text;
    }

    /**
     * Global Tab navigation function to move between field components and *** markers on the page
     * @param {boolean} reverse - Whether to go to previous field (Shift+Tab)
     */
    function navigateToNextField(reverse = false) {
        // Find all field content elements in the document
        const allFieldContents = document.querySelectorAll('.field-content');
        
        // Find all *** text markers in the document
        const quill = currentQuillInstance;
        const editorElement = quill ? quill.container.querySelector('.ql-editor') : document.querySelector('.ql-editor');
        const allAsterisks = [];
        
        if (editorElement) {
            // Create a tree walker to find all text nodes
            const walker = document.createTreeWalker(
                editorElement,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: function(node) {
                        // Accept text nodes that contain *** and are not inside field components
                        if (node.textContent.includes('***') && 
                            !node.parentElement.closest('.field-component, .aifield-component')) {
                            return NodeFilter.FILTER_ACCEPT;
                        }
                        return NodeFilter.FILTER_REJECT;
                    }
                },
                false
            );
            
            let textNode;
            while (textNode = walker.nextNode()) {
                const text = textNode.textContent;
                let match;
                const regex = /\*\*\*/g;
                
                while ((match = regex.exec(text)) !== null) {
                    allAsterisks.push({
                        textNode: textNode,
                        startOffset: match.index,
                        endOffset: match.index + 3
                    });
                }
            }
        }
        
        // Combine field components and *** markers, then sort by document position
        const allNavigationTargets = [];
        
        // Add field components
        allFieldContents.forEach(field => {
            allNavigationTargets.push({
                type: 'field',
                element: field,
                position: getDocumentPosition(field)
            });
        });
        
        // Add *** markers
        allAsterisks.forEach(asterisk => {
            allNavigationTargets.push({
                type: 'asterisk',
                textNode: asterisk.textNode,
                startOffset: asterisk.startOffset,
                endOffset: asterisk.endOffset,
                position: getDocumentPosition(asterisk.textNode)
            });
        });
        
        if (allNavigationTargets.length === 0) {
            return false; // No navigation targets found
        }
        
        // Sort by document position
        allNavigationTargets.sort((a, b) => a.position - b.position);
        
        // Find current position
        const activeElement = document.activeElement;
        const selection = window.getSelection();
        let currentIndex = -1;
        
        // Check if we're currently in a field component
        if (activeElement && activeElement.classList.contains('field-content')) {
            currentIndex = allNavigationTargets.findIndex(target => 
                target.type === 'field' && target.element === activeElement
            );
        } 
        // Check if we're currently at a *** marker
        else if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const startNode = range.startContainer;
            const startOffset = range.startOffset;
            
            currentIndex = allNavigationTargets.findIndex(target => 
                target.type === 'asterisk' && 
                target.textNode === startNode &&
                startOffset >= target.startOffset && 
                startOffset <= target.endOffset
            );
        }
        
        // Determine next target index
        let nextIndex;
        if (currentIndex === -1) {
            // No target currently focused, go to first or last
            nextIndex = reverse ? allNavigationTargets.length - 1 : 0;
        } else {
            // Calculate next index with wrap-around
            if (reverse) {
                nextIndex = (currentIndex - 1 + allNavigationTargets.length) % allNavigationTargets.length;
            } else {
                nextIndex = (currentIndex + 1) % allNavigationTargets.length;
            }
        }
        
        const nextTarget = allNavigationTargets[nextIndex];
        if (nextTarget) {
            if (nextTarget.type === 'field') {
                // Focus the field component
                nextTarget.element.focus();
                
                // Position cursor appropriately
                setTimeout(() => {
                    const range = document.createRange();
                    const selection = window.getSelection();
                    
                    // If the content is just ***, select it all
                    if (nextTarget.element.textContent.trim() === '***') {
                        range.selectNodeContents(nextTarget.element);
                    } else {
                        // Otherwise, position cursor at the end
                        range.selectNodeContents(nextTarget.element);
                        range.collapse(false); // Collapse to end
                    }
                    
                    selection.removeAllRanges();
                    selection.addRange(range);
                }, 1);
            } else if (nextTarget.type === 'asterisk') {
                // Navigate to *** marker and select the entire *** text
                const range = document.createRange();
                const selection = window.getSelection();
                
                // Select the entire *** marker
                range.setStart(nextTarget.textNode, nextTarget.startOffset);
                range.setEnd(nextTarget.textNode, nextTarget.endOffset);
                
                selection.removeAllRanges();
                selection.addRange(range);
                
                // Ensure the editor has focus
                if (quill) {
                    quill.focus();
                }
            }
            
            return true; // Successfully navigated
        }
        
        return false; // Failed to navigate
    }
    
    /**
     * Get the document position of an element or text node for sorting
     * @param {Node} node - The node to get position for
     * @returns {number} The document position
     */
    function getDocumentPosition(node) {
        let position = 0;
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_ALL,
            null,
            false
        );
        
        let currentNode;
        while (currentNode = walker.nextNode()) {
            if (currentNode === node) {
                return position;
            }
            position++;
        }
        return position;
    }

    /**
     * Initialize fields functionality when the page loads
     */
    function initializeOnLoad() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                // Wait a bit for Quill to be fully initialized
                setTimeout(initializeFields, 100);
            });
        } else {
            // Wait a bit for Quill to be fully initialized
            setTimeout(initializeFields, 100);
        }
    }

    // Make functions available globally
    window.applyFieldStyling = applyFieldStyling;
    window.parseQuillTextWithFields = parseQuillTextWithFields;
    window.navigateToNextField = navigateToNextField;

    // Initialize fields functionality on page load
    initializeOnLoad();
})();
