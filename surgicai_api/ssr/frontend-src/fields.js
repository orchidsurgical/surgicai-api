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

    // Determine field type
    let fieldTag;
    if (fieldName === 'ai') {
        fieldTag = `<aifield></aifield> `;
    } else {
        fieldTag = `<field id='${fieldName}'></field> `;
    }

    // Insert at current cursor position
    const range = quill.getSelection(true);
    let index = range ? range.index : quill.getLength();
    quill.insertText(index, fieldTag, 'silent');
    quill.setSelection(index + fieldTag.length, 0, 'silent');
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
    // TODO: Implement logic to extract all fields from the editor
    // - Parse editor content
    // - Identify field markers
    // - Return structured field data
    return [];
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
 * Export editor content with field data
 * @returns {Object} Object containing formatted content and field metadata
 */
function exportWithFields() {
    // TODO: Implement export functionality
    // - Get editor content
    // - Extract field data
    // - Return structured export data
    return { content: '', fields: [] };
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
        
        console.log('Text change detected:', delta);
        
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
        const fieldRegex = /\[(ai)?field:\s*([^\]]+)\]$/;
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
        const fieldRegex = /^\[(ai)?field:\s*([^\]]+)\]/;
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
    
    // Look backwards from cursor to find if we're right after a field
    const textBeforeCursor = quill.getText(0, cursorIndex);
    
    // Regex to match field patterns at the end of text: [field: something] or [aifield: something]
    const fieldRegex = /\[(ai)?field:\s*([^\]]+)\]$/;
    const match = textBeforeCursor.match(fieldRegex);
    
    if (match) {
        // We found a field right before the cursor
        const fieldText = match[0]; // The entire field text like "[field: patient_name]"
        const fieldStart = cursorIndex - fieldText.length;
        
        console.log('Deleting field:', fieldText, 'from position', fieldStart);
        
        // Prevent default backspace behavior
        e.preventDefault();
        e.stopPropagation();
        
        // Delete the entire field
        quill.deleteText(fieldStart, fieldText.length, 'user');
        
        // Set cursor position after deletion
        quill.setSelection(fieldStart, 0, 'user');
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
                showFieldNameInput();
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
    const fieldText = isAIField ? `[aifield: ${fieldId}]` : `[field: ${fieldId}]`;
    
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
    
    // Reset state variables
    isFieldsActive = false;
    currentQuillInstance = null;
    slashMenuVisible = false;
    slashMenuElement = null;
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
window.validateFields = validateFields;
window.toggleFieldsHighlight = toggleFieldsHighlight;
window.exportWithFields = exportWithFields;
window.importWithFields = importWithFields;
window.handleFieldShortcuts = handleFieldShortcuts;
window.setupFieldEventListeners = setupFieldEventListeners;
window.cleanupFields = cleanupFields;

// Auto-initialize when script loads
initializeOnLoad();