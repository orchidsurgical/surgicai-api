// Fields utility for working with Quill editors
// This file is designed to be used in <script> tags on pages with Quill editors

// Global state variables
let isFieldsActive = false;
let currentQuillInstance = null;
let fieldComponents = new Map(); // Track field components by ID
let slashMenuVisible = false;
let slashMenuPosition = { x: 0, y: 0 };
let slashMenuElement = null;
let slashStartIndex = -1; // Track where the slash started
let selectedMenuIndex = 0; // Track which menu item is selected
let isApplyingStyling = false; // Flag to prevent infinite loops

// AI Field options
const AI_FIELD_OPTIONS = [
    "Postoperative Diagnosis",
    "Procedures",
];

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

    // Set up field event listeners
    setupFieldEventListeners();

    // Apply initial field styling to any existing fields
    setTimeout(() => {
        applyFieldStyling();
    }, 100);

    console.log('Fields functionality initialized successfully');
    console.log('Quill instance:', quill);
}

/**
 * Convert a field name to a valid field ID
 * @param {string} fieldName - The human-readable field name
 * @returns {string} The field ID (lowercase with underscores)
 */
function convertNameToId(fieldName) {
    return fieldName.toLowerCase().replace(/\s+/g, '_');
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
 * Insert a field at the current cursor position
 * @param {string} fieldName - The name of the field to insert
 * @param {string} fieldValue - The value to insert for the field
 */
function insertField(fieldName, fieldValue) {
    const quill = getQuillInstance();
    if (!quill) return;

    // Determine field type and create field text
    let fieldText;
    if (fieldName === 'ai') {
        fieldText = `[aifield: ${fieldValue}][/aifield]`;
    } else {
        fieldText = `[field: ${fieldName}][/field]`;
    }

    // Insert at current cursor position
    const range = quill.getSelection(true);
    let index = range ? range.index : quill.getLength();
    quill.insertText(index, fieldText, 'silent');
    quill.setSelection(index + fieldText.length, 0, 'silent');
    
    // Apply field styling after insertion
    setTimeout(() => {
        applyFieldStyling();
    }, 50);
}

/**
 * Update an existing field in the editor
 * @param {string} fieldName - The name of the field to update
 * @param {string} newValue - The new value for the field
 */
function updateField(fieldName, newValue) {
    // TODO: Implement field update logic
    // - Find existing field in the editor
    // - Replace with new value
    // - Maintain proper formatting
}

/**
 * Remove a field from the editor
 * @param {string} fieldName - The name of the field to remove
 */
function removeField(fieldName) {
    // TODO: Implement field removal logic
    // - Find field in the editor
    // - Remove field and clean up formatting
}

/**
 * Get all fields present in the editor
 * @returns {Array} Array of field objects with name and value
 */
function getAllFields() {
    if (!editorElement) return [];
    
    const fields = [];
    const fieldComponents = editorElement.querySelectorAll('.field-component, .aifield-component');
    
    fieldComponents.forEach((component, index) => {
        const fieldName = component.getAttribute('data-field-name');
        const fieldText = component.getAttribute('data-field-text');
        const isAIField = component.classList.contains('aifield-component');
        
        if (fieldName) {
            fields.push({ 
                name: fieldName, 
                value: fieldText,
                isAIField: isAIField,
                element: component 
            });
        }
    });
    
    return fields;
}

/**
 * Validate fields in the editor
 * @returns {Object} Validation result with success status and any errors
 */
function validateFields() {
    // TODO: Implement field validation logic
    // - Check required fields are present
    // - Validate field formats
    // - Return validation results
    return { success: true, errors: [] };
}

/**
 * Toggle fields highlighting in the editor
 */
function toggleFieldsHighlight() {
    // TODO: Implement field highlighting toggle
    // - Find all fields in the editor
    // - Apply or remove highlighting
    // - Update UI state
}

/**
 * Get text content with fields in their proper format for API saving
 * @returns {string} Text content with fields as [field: fieldname] format
 */
function getTextWithFields() {
    const quill = currentQuillInstance;
    if (!quill) return '';
    
    const editorElement = quill.container.querySelector('.ql-editor');
    if (!editorElement) return quill.getText();
    
    // Clone the editor content to avoid modifying the original
    const clonedEditor = editorElement.cloneNode(true);
    
    // Find all field components in the cloned content
    const fieldComponents = clonedEditor.querySelectorAll('.field-component, .aifield-component');
    
    // Replace each field component with its original field text
    fieldComponents.forEach(component => {
        const fieldText = component.getAttribute('data-field-text');
        if (fieldText) {
            // Create a text node with the original field format
            const textNode = document.createTextNode(fieldText);
            component.parentNode.replaceChild(textNode, component);
        }
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
 * Export editor content with field data
 * @returns {Object} Object containing formatted content and field metadata
 */
function exportWithFields() {
    const quill = currentQuillInstance;
    if (!quill) return { content: '', fields: [] };
    
    const content = getTextWithFields();
    const fields = getAllFields();
    
    return { 
        content: content, 
        fields: fields 
    };
}

/**
 * Import content with field data into the editor
 * @param {Object} data - Data object containing content and field information
 */
function importWithFields(data) {
    // TODO: Implement import functionality
    // - Clear existing content
    // - Insert content with proper field formatting
    // - Set up field interactions
}

/**
 * Handle field-related keyboard shortcuts
 * @param {KeyboardEvent} event - The keyboard event
 */
function handleFieldShortcuts(event) {
    // TODO: Implement keyboard shortcut handling
    // - Check for field-related shortcuts
    // - Execute appropriate field actions
}

/**
 * Set up field-related event listeners
 */
function setupFieldEventListeners() {
    const quill = currentQuillInstance;
    if (!quill) return;

    // Listen for text changes to detect slash
    quill.on('text-change', function(delta, oldDelta, source) {
        if (source !== 'user') return;
        if (isApplyingStyling) return; // Prevent infinite loops
        
        console.log('Text change detected:', delta);
        
        // Apply field styling after any text change (with debounce)
        clearTimeout(window.fieldStylingTimeout);
        window.fieldStylingTimeout = setTimeout(() => {
            console.log('Debounced field styling triggered');
            applyFieldStyling();
        }, 500);
        
        // Check if the last operation was inserting a slash
        const ops = delta.ops;
        if (ops && ops.length > 0) {
            const lastOp = ops[ops.length - 1];
            console.log('Last operation:', lastOp);
            
            if (lastOp.insert === '/') {
                console.log('Slash detected! Showing menu...');
                // Get current selection and store slash position
                const selection = quill.getSelection();
                if (selection) {
                    slashStartIndex = selection.index - 1;
                    // Show slash menu after a brief delay
                    setTimeout(() => {
                        showSlashMenu(selection.index);
                    }, 10);
                }
            } else if (slashMenuVisible && lastOp.insert && typeof lastOp.insert === 'string') {
                // User is typing after the slash - filter menu options
                updateSlashMenuFilter();
            }
        }
    });

    // Listen for clicks outside the editor to hide menu
    document.addEventListener('click', function(e) {
        if (slashMenuVisible && !e.target.closest('.slash-menu') && !e.target.closest('.ql-editor')) {
            hideSlashMenu();
        }
    });

    // Listen for escape key to hide menu
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && slashMenuVisible) {
            hideSlashMenu();
        } else if (slashMenuVisible && e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            executeSelectedMenuOption();
        } else if (slashMenuVisible && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
            e.preventDefault();
            e.stopPropagation();
            navigateMenu(e.key === 'ArrowDown' ? 1 : -1);
        } else if (e.key === 'Backspace' && !slashMenuVisible) {
            // Handle field deletion on backspace
            handleFieldBackspace(e);
        } else if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !slashMenuVisible) {
            // Handle field navigation with arrow keys
            handleFieldArrowNavigation(e);
        }
    }, true); // Use capture phase to intercept before Quill handles it
}

/**
 * Handle arrow key navigation around fields
 */
function handleFieldArrowNavigation(e) {
    const quill = currentQuillInstance;
    if (!quill) return;
    
    const selection = quill.getSelection();
    if (!selection || selection.length > 0) return; // Only handle when cursor is at a single position
    
    const cursorIndex = selection.index;
    const isLeftArrow = e.key === 'ArrowLeft';
    const isRightArrow = e.key === 'ArrowRight';
    
    if (isLeftArrow && cursorIndex > 0) {
        // Left arrow: check if we're at the end of a field, jump to beginning
        const textBeforeCursor = quill.getText(0, cursorIndex);
        const fieldRegex = /\[(ai)?field:\s*([^\]]+)\]\[\/\1?field\]$/;
        const match = textBeforeCursor.match(fieldRegex);
        
        if (match) {
            // We're at the end of a field, jump to the beginning
            const fieldText = match[0];
            const fieldStart = cursorIndex - fieldText.length;
            
            console.log('Arrow left: jumping to start of field:', fieldText);
            
            e.preventDefault();
            e.stopPropagation();
            quill.setSelection(fieldStart, 0, 'user');
        }
    } else if (isRightArrow && cursorIndex < quill.getLength() - 1) {
        // Right arrow: check if we're at the beginning of a field, jump to end
        const textFromCursor = quill.getText(cursorIndex);
        const fieldRegex = /^\[(ai)?field:\s*([^\]]+)\]\[\/\1?field\]/;
        const match = textFromCursor.match(fieldRegex);
        
        if (match) {
            // We're at the beginning of a field, jump to the end
            const fieldText = match[0];
            const fieldEnd = cursorIndex + fieldText.length;
            
            console.log('Arrow right: jumping to end of field:', fieldText);
            
            e.preventDefault();
            e.stopPropagation();
            quill.setSelection(fieldEnd, 0, 'user');
        }
    }
}

/**
 * Handle backspace key to delete entire fields
 */
function handleFieldBackspace(e) {
    const quill = currentQuillInstance;
    if (!quill) return;
    
    const selection = quill.getSelection();
    if (!selection || selection.length > 0) return; // Only handle when cursor is at a single position
    
    const cursorIndex = selection.index;
    if (cursorIndex === 0) return; // Can't delete before the start
    
    // Check if cursor is right after a field component
    const editorElement = quill.container.querySelector('.ql-editor');
    if (!editorElement) return;
    
    // Get the DOM range at cursor position
    const bounds = quill.getBounds(cursorIndex - 1, 1);
    const elementAtCursor = document.elementFromPoint(
        editorElement.getBoundingClientRect().left + bounds.left + bounds.width,
        editorElement.getBoundingClientRect().top + bounds.top + bounds.height / 2
    );
    
    // Check if the element or its parent is a field component
    let fieldComponent = null;
    if (elementAtCursor) {
        fieldComponent = elementAtCursor.closest('.field-component, .aifield-component');
        
        // If not found, also check the previous sibling
        if (!fieldComponent && elementAtCursor.previousSibling) {
            if (elementAtCursor.previousSibling.classList && 
                (elementAtCursor.previousSibling.classList.contains('field-component') ||
                 elementAtCursor.previousSibling.classList.contains('aifield-component'))) {
                fieldComponent = elementAtCursor.previousSibling;
            }
        }
    }
    
    // Fallback: Look backwards from cursor to find if we're right after a field pattern
    if (!fieldComponent) {
        const textBeforeCursor = quill.getText(0, cursorIndex);
        const fieldRegex = /\[(ai)?field:\s*([^\]]+)\]\[\/\1?field\]$/;
        const match = textBeforeCursor.match(fieldRegex);
        
        if (match) {
            // We found a field right before the cursor
            const fieldText = match[0]; // The entire field text like "[field: patient_name]"
            const fieldStart = cursorIndex - fieldText.length;
            
            console.log('Deleting field (text pattern):', fieldText, 'from position', fieldStart);
            
            // Prevent default backspace behavior
            e.preventDefault();
            e.stopPropagation();
            
            // Delete the entire field
            quill.deleteText(fieldStart, fieldText.length, 'user');
            
            // Set cursor position after deletion
            quill.setSelection(fieldStart, 0, 'user');
            
            // Re-apply styling after deletion
            setTimeout(() => {
                applyFieldStyling();
            }, 10);
            
            return;
        }
    }
    
    // If we found a field component, delete it
    if (fieldComponent) {
        console.log('Deleting field component:', fieldComponent);
        
        // Prevent default backspace behavior
        e.preventDefault();
        e.stopPropagation();
        
        // Get the field text to calculate position
        const fieldText = fieldComponent.getAttribute('data-field-text');
        if (fieldText) {
            // Find the position of this field in the Quill content
            const allText = quill.getText();
            const fieldIndex = allText.indexOf(fieldText.replace(/\[field:\s*/, '[field: '));
            
            if (fieldIndex !== -1) {
                // Delete the field text from Quill
                quill.deleteText(fieldIndex, fieldText.length, 'user');
                quill.setSelection(fieldIndex, 0, 'user');
            }
        }
        
        // Remove the component from DOM
        fieldComponent.remove();
        
        // Re-apply styling after deletion
        setTimeout(() => {
            applyFieldStyling();
        }, 10);
    }
}

/**
 * Update slash menu filtering based on user input
 */
function updateSlashMenuFilter() {
    if (!slashMenuVisible || slashStartIndex === -1) return;
    
    const quill = currentQuillInstance;
    if (!quill) return;
    
    // Get text after the slash
    const selection = quill.getSelection();
    if (!selection) return;
    
    const textAfterSlash = quill.getText(slashStartIndex + 1, selection.index - slashStartIndex - 1);
    console.log('Text after slash:', textAfterSlash);
    
    // Filter and recreate menu with matching options
    createSlashMenuWithFilter(textAfterSlash);
}

/**
 * Navigate menu with arrow keys
 */
function navigateMenu(direction) {
    if (!slashMenuElement) return;
    
    const items = slashMenuElement.querySelectorAll('.slash-menu-item');
    if (items.length === 0) return;
    
    // Update selected index
    selectedMenuIndex = Math.max(0, Math.min(items.length - 1, selectedMenuIndex + direction));
    
    // Update visual selection
    updateMenuSelection();
}

/**
 * Execute the currently selected menu option
 */
function executeSelectedMenuOption() {
    if (!slashMenuElement) return;
    
    const items = slashMenuElement.querySelectorAll('.slash-menu-item');
    if (items.length === 0) return;
    
    const selectedItem = items[selectedMenuIndex];
    if (selectedItem) {
        selectedItem.click();
    }
}

/**
 * Update visual selection in menu
 */
function updateMenuSelection() {
    if (!slashMenuElement) return;
    
    const items = slashMenuElement.querySelectorAll('.slash-menu-item');
    items.forEach((item, index) => {
        if (index === selectedMenuIndex) {
            item.style.backgroundColor = '#f3f4f6';
        } else {
            item.style.backgroundColor = 'transparent';
        }
    });
}

/**
 * Show the slash menu at the current cursor position
 */
function showSlashMenu(cursorIndex) {
    const quill = currentQuillInstance;
    if (!quill || slashMenuVisible) return;

    console.log('Showing slash menu at index:', cursorIndex);

    // Get cursor position in the editor
    const bounds = quill.getBounds(cursorIndex);
    const editorRect = quill.container.getBoundingClientRect();
    
    slashMenuPosition = {
        x: editorRect.left + bounds.left,
        y: editorRect.top + bounds.top + bounds.height + 5
    };

    console.log('Menu position:', slashMenuPosition);

    createSlashMenuWithFilter('');
    slashMenuVisible = true;
}

/**
 * Hide the slash menu
 */
function hideSlashMenu() {
    if (slashMenuElement) {
        slashMenuElement.remove();
        slashMenuElement = null;
    }
    slashMenuVisible = false;
    slashStartIndex = -1;
    selectedMenuIndex = 0;
}

/**
 * Create the slash menu element with filtering
 */
function createSlashMenuWithFilter(filterText = '') {
    if (slashMenuElement) {
        slashMenuElement.remove();
    }

    // Define menu options
    const menuOptions = [
        { label: 'AI Field', icon: '🤖', description: 'Insert a predefined AI field', action: 'ai' },
        { label: 'Field', icon: '📝', description: 'Create a custom field', action: 'field' }
    ];

    // Filter options based on input (case insensitive)
    const filteredOptions = menuOptions.filter(option => 
        option.label.toLowerCase().startsWith(filterText.toLowerCase())
    );

    // Sort alphabetically by label
    filteredOptions.sort((a, b) => a.label.localeCompare(b.label));

    // Reset selected index if needed
    selectedMenuIndex = Math.min(selectedMenuIndex, filteredOptions.length - 1);

    if (filteredOptions.length === 0) {
        hideSlashMenu();
        return;
    }

    slashMenuElement = document.createElement('div');
    slashMenuElement.className = 'slash-menu';
    slashMenuElement.style.cssText = `
        position: fixed;
        left: ${slashMenuPosition.x}px;
        top: ${slashMenuPosition.y}px;
        background: white;
        border: 1px solid #e1e5e9;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        min-width: 200px;
        padding: 8px 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
    `;

    // Create menu items
    filteredOptions.forEach((option, index) => {
        const menuItem = createSlashMenuItem(option.label, option.icon, option.description);
        
        menuItem.addEventListener('click', () => {
            hideSlashMenu();
            if (option.action === 'field') {
                insertSimpleField();
            } else if (option.action === 'ai') {
                showAIFieldOptions();
            }
        });

        slashMenuElement.appendChild(menuItem);
    });

    document.body.appendChild(slashMenuElement);
    
    // Update visual selection
    updateMenuSelection();
}

/**
 * Create a slash menu item
 */
function createSlashMenuItem(title, icon, description) {
    const item = document.createElement('div');
    item.className = 'slash-menu-item';
    item.style.cssText = `
        padding: 12px 16px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 12px;
        transition: background-color 0.15s ease;
    `;

    item.innerHTML = `
        <span style="font-size: 16px;">${icon}</span>
        <div>
            <div style="font-weight: 500; color: #1a1a1a;">${title}</div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">${description}</div>
        </div>
    `;

    item.addEventListener('mouseenter', function() {
        // Update selected index when hovering
        const items = slashMenuElement ? slashMenuElement.querySelectorAll('.slash-menu-item') : [];
        selectedMenuIndex = Array.from(items).indexOf(this);
        updateMenuSelection();
    });

    item.addEventListener('mouseleave', function() {
        // Visual selection is now handled by updateMenuSelection()
    });

    return item;
}

/**
 * Insert a field into the Quill document at the current cursor position
 * @param {string} fieldId - The ID of the field to insert
 * @param {boolean} isAIField - Whether this is an AI field or regular field
 */
function insertFieldIntoDocument(fieldId, isAIField = false) {
    const quill = currentQuillInstance;
    if (!quill) return;

    // Create the field text based on type
    const fieldText = isAIField ? `[aifield: ${fieldId}][/aifield]` : `[field: ${fieldId}][/field]`;
    
    // Get current selection
    const selection = quill.getSelection(true);
    if (selection) {
        // Look backwards from cursor to find the slash
        let slashIndex = -1;
        const currentIndex = selection.index;
        
        // Search backwards for the slash character
        for (let i = currentIndex - 1; i >= 0; i--) {
            const char = quill.getText(i, 1);
            if (char === '/') {
                slashIndex = i;
                break;
            }
            // Stop if we hit whitespace or newline (slash should be recent)
            if (char === ' ' || char === '\n' || char === '\t') {
                break;
            }
        }
        
        if (slashIndex !== -1) {
            // Remove everything from the slash to the current cursor position
            const lengthToRemove = currentIndex - slashIndex;
            quill.deleteText(slashIndex, lengthToRemove, 'silent');
            // Insert field at the position where slash was
            quill.insertText(slashIndex, fieldText, 'silent');
            quill.setSelection(slashIndex + fieldText.length, 0, 'silent');
        } else {
            // No slash found, just insert at current position
            quill.insertText(currentIndex, fieldText, 'silent');
            quill.setSelection(currentIndex + fieldText.length, 0, 'silent');
        }
    } else {
        // No selection, insert at end of document
        const length = quill.getLength();
        quill.insertText(length - 1, fieldText, 'silent');
        quill.setSelection(length - 1 + fieldText.length, 0, 'silent');
    }
    
    // Apply field styling after insertion
    setTimeout(() => {
        console.log('Applying field styling after insertion');
        applyFieldStyling();
    }, 50);
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
        if (/\[(ai)?field:\s*[^\]]+\]\[\/\1?field\]/.test(node.textContent)) {
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
        const fieldRegex = /\[(ai)?field:\s*([^\]]+)\]\[\/\1?field\]/g;
        let match;
        const replacements = [];
        
        while ((match = fieldRegex.exec(text)) !== null) {
            replacements.push({
                fullMatch: match[0],
                fieldName: match[2].trim(),
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
                    ? createAIFieldComponentHtml(replacement.fieldName)
                    : createFieldComponentHtml(replacement.fieldName);
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
function createFieldComponentHtml(fieldName) {
    const componentId = `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const html = `<span class="field-component" data-field-text="[field: ${fieldName}][/field]" data-field-name="${fieldName}" id="${componentId}" contenteditable="false" style="display: inline-block; background: #fefce8; border: 1px solid #eab308; border-radius: 4px; padding: 2px 6px 4px 6px; margin: 0 2px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; cursor: default; vertical-align: baseline; line-height: 1.2; isolation: isolate;">
        <span class="field-label" style="display: block; font-size: 9px; color: #a16207; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1; margin-bottom: 1px;">Field</span>
        <span class="field-content" style="display: block; font-size: 12px; color: #92400e; font-weight: 500; line-height: 1;">${fieldName}</span>
    </span>`;
    
    console.log('Generated field HTML:', html);
    return html;
}

/**
 * Create HTML for an AI field component
 */
function createAIFieldComponentHtml(fieldName) {
    const componentId = `aifield-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const html = `<span class="aifield-component" data-field-text="[aifield: ${fieldName}][/aifield]" data-field-name="${fieldName}" id="${componentId}" contenteditable="false" style="display: inline-block; background: #dbeafe; border: 1px solid #3b82f6; border-radius: 4px; padding: 2px 6px 4px 6px; margin: 0 2px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; cursor: default; vertical-align: baseline; line-height: 1.2; isolation: isolate;">
        <span class="field-label" style="display: block; font-size: 9px; color: #1d4ed8; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1; margin-bottom: 1px;">AI Field</span>
        <span class="field-content" style="display: block; font-size: 12px; color: #1e40af; font-weight: 500; line-height: 1;">${fieldName}</span>
    </span>`;
    
    console.log('Generated AI field HTML:', html);
    return html;
}

/**
 * Insert a simple *** field without asking for a name
 */
function insertSimpleField() {
    // Simply insert *** without asking for a name
    const quill = currentQuillInstance;
    if (!quill) return;

    // Get current selection
    const selection = quill.getSelection(true);
    if (selection) {
        // Look backwards from cursor to find the slash
        let slashIndex = -1;
        const currentIndex = selection.index;
        
        // Search backwards for the slash character
        for (let i = currentIndex - 1; i >= 0; i--) {
            const char = quill.getText(i, 1);
            if (char === '/') {
                slashIndex = i;
                break;
            }
            // Stop if we hit whitespace or newline (slash should be recent)
            if (char === ' ' || char === '\n' || char === '\t') {
                break;
            }
        }
        
        if (slashIndex !== -1) {
            // Remove everything from the slash to the current cursor position
            const lengthToRemove = currentIndex - slashIndex;
            quill.deleteText(slashIndex, lengthToRemove, 'silent');
            // Insert *** at the position where slash was
            quill.insertText(slashIndex, '***', 'silent');
            quill.setSelection(slashIndex + 3, 0, 'silent');
        } else {
            // No slash found, just insert at current position
            quill.insertText(currentIndex, '***', 'silent');
            quill.setSelection(currentIndex + 3, 0, 'silent');
        }
    } else {
        // No selection, insert at end of document
        const length = quill.getLength();
        quill.insertText(length - 1, '***', 'silent');
        quill.setSelection(length - 1 + 3, 0, 'silent');
    }
}

/**
 * Show input for custom field name
 */
function showFieldNameInput() {
    const modal = createModal('Create Field', 'Enter a name for this field:');
    
    // Disable Enter key in Quill while modal is open (but allow it in the input)
    const handleModalKeydown = function(e) {
        if (e.key === 'Enter' && e.target !== input) {
            e.preventDefault();
            e.stopPropagation();
        }
    };
    document.addEventListener('keydown', handleModalKeydown, true);
    
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'e.g., Patient Name, Surgeon Name';
    input.style.cssText = `
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 14px;
        margin: 16px 0;
        outline: none;
    `;

    input.addEventListener('focus', function() {
        this.style.borderColor = '#3b82f6';
        this.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
    });

    input.addEventListener('blur', function() {
        this.style.borderColor = '#d1d5db';
        this.style.boxShadow = 'none';
    });

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        margin-top: 16px;
    `;

    const cancelBtn = createButton('Cancel', 'secondary');
    const createBtn = createButton('Create Field', 'primary');

    const closeModal = () => {
        document.removeEventListener('keydown', handleModalKeydown, true);
        modal.remove();
    };

    cancelBtn.addEventListener('click', closeModal);

    createBtn.addEventListener('click', () => {
        const fieldName = input.value.trim();
        if (fieldName) {
            let fieldId = convertNameToId(fieldName);
            console.log('Creating field with name:', fieldName, 'and ID:', fieldId);
            insertFieldIntoDocument(fieldName, false);
            closeModal();
        } else {
            input.style.borderColor = '#ef4444';
            input.focus();
        }
    });

    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            createBtn.click();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            closeModal();
        }
    });

    buttonContainer.appendChild(cancelBtn);
    buttonContainer.appendChild(createBtn);

    const modalContent = modal.querySelector('.modal-content');
    modalContent.appendChild(input);
    modalContent.appendChild(buttonContainer);

    // Override modal's default escape handler to also remove our keydown listener
    const originalRemove = modal.remove;
    modal.remove = function() {
        document.removeEventListener('keydown', handleModalKeydown, true);
        originalRemove.call(this);
    };

    // Focus the input
    setTimeout(() => input.focus(), 100);
}

/**
 * Show AI field options
 */
function showAIFieldOptions() {
    const modal = createModal('Select AI Field', 'Choose a predefined AI field to insert:');

    const optionsList = document.createElement('div');
    optionsList.style.cssText = `
        max-height: 300px;
        overflow-y: auto;
        margin: 16px 0;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
    `;

    AI_FIELD_OPTIONS.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'ai-field-option';
        optionElement.style.cssText = `
            padding: 12px 16px;
            cursor: pointer;
            border-bottom: 1px solid #f3f4f6;
            transition: background-color 0.15s ease;
        `;

        if (index === AI_FIELD_OPTIONS.length - 1) {
            optionElement.style.borderBottom = 'none';
        }

        optionElement.innerHTML = `
            <div style="font-weight: 500; color: #1a1a1a;">${option}</div>
        `;

        optionElement.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#f8fafc';
        });

        optionElement.addEventListener('mouseleave', function() {
            this.style.backgroundColor = 'transparent';
        });

        optionElement.addEventListener('click', () => {
            console.log('Selected AI field:', option);
            insertFieldIntoDocument(option, true);
            modal.remove();
        });

        optionsList.appendChild(optionElement);
    });

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        justify-content: flex-end;
        margin-top: 16px;
    `;

    const cancelBtn = createButton('Cancel', 'secondary');
    cancelBtn.addEventListener('click', () => {
        modal.remove();
    });

    buttonContainer.appendChild(cancelBtn);

    const modalContent = modal.querySelector('.modal-content');
    modalContent.appendChild(optionsList);
    modalContent.appendChild(buttonContainer);
}

/**
 * Create a modal dialog
 */
function createModal(title, description) {
    const modal = document.createElement('div');
    modal.className = 'field-modal';
    modal.style.cssText = `
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
    `;

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 24px;
        min-width: 400px;
        max-width: 500px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    `;

    modalContent.innerHTML = `
        <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #1a1a1a;">${title}</h3>
        <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">${description}</p>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Close on backdrop click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });

    // Close on Escape key
    const handleEscape = function(e) {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);

    return modal;
}

/**
 * Create a button element
 */
function createButton(text, type = 'primary') {
    const button = document.createElement('button');
    button.textContent = text;
    
    const baseStyle = `
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        border: 1px solid;
        transition: all 0.15s ease;
    `;

    if (type === 'primary') {
        button.style.cssText = baseStyle + `
            background: #3b82f6;
            border-color: #3b82f6;
            color: white;
        `;
        
        button.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#2563eb';
            this.style.borderColor = '#2563eb';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '#3b82f6';
            this.style.borderColor = '#3b82f6';
        });
    } else {
        button.style.cssText = baseStyle + `
            background: white;
            border-color: #d1d5db;
            color: #374151;
        `;
        
        button.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#f9fafb';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.backgroundColor = 'white';
        });
    }

    return button;
}

/**
 * Clean up field functionality
 */
function cleanupFields() {
    // Hide any open menus
    hideSlashMenu();
    
    // Remove any open modals
    const modals = document.querySelectorAll('.field-modal');
    modals.forEach(modal => modal.remove());
    
    // Clear any pending styling timeouts
    if (window.fieldStylingTimeout) {
        clearTimeout(window.fieldStylingTimeout);
        window.fieldStylingTimeout = null;
    }
    
    // Reset state variables
    isFieldsActive = false;
    currentQuillInstance = null;
    slashMenuVisible = false;
    slashMenuElement = null;
    isApplyingStyling = false;
    fieldComponents.clear();
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

// Add functions to global context for script tag usage
window.initializeFields = initializeFields;
window.getQuillInstance = getQuillInstance;
window.insertField = insertField;
window.updateField = updateField;
window.removeField = removeField;
window.getAllFields = getAllFields;
window.getTextWithFields = getTextWithFields;
window.validateFields = validateFields;
window.toggleFieldsHighlight = toggleFieldsHighlight;
window.exportWithFields = exportWithFields;
window.importWithFields = importWithFields;
window.handleFieldShortcuts = handleFieldShortcuts;
window.showSlashMenu = showSlashMenu;
window.showFieldNameInput = showFieldNameInput;
window.insertSimpleField = insertSimpleField;
window.showAIFieldOptions = showAIFieldOptions;
window.insertFieldIntoDocument = insertFieldIntoDocument;
window.setupFieldEventListeners = setupFieldEventListeners;
window.cleanupFields = cleanupFields;

// Auto-initialize when script loads
initializeOnLoad();