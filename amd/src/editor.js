// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * OUSupSub Editor Manager.
 *
 * @module editor_ousupsub/editor
 * @copyright  2024 The Open University.
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

const defaultActions = {
    sup: {
        name: 'superscript',
        tag: 'sup',
        class: 'ousupsub_superscript_button_superscript',
    },
    sub: {
        name: 'subscript',
        tag: 'sub',
        class: 'ousupsub_subscript_button_subscript',
    },
};

class OUSupSubEditor {

    // The editor's initial default settings.
    defaultSetting = {
        element: '',
        type: 'both',
        classes: {
            wrap: 'ousupsub-wrap',
            editor: 'editor_ousupsub',
            contentWrap: 'editor_ousupsub_content_wrap',
            content: 'editor_ousupsub_content',
            toolbar: 'editor_ousupsub_toolbar',
            toolbarGroup: 'ousupsub_group',
            button: 'ousupsub-button',
        },
        custom: {
            editor: '',
            content: '',
            toolbar: '',
            button: '',
            contentWrap: '',
            wrap: '',
            toolbarGroup: '',
        },
    };

    // Support for undo/redo with history data and history index.
    history = [];
    historyIndex = -1;

    /**
     * Constructor of the editor.
     * @constructor
     *
     * @param {Object} settings - The editor settings.
     */
    constructor(settings) {
        this.settings = Object.assign(this.defaultSetting, settings);
        this.init();
    }

    /**
     * Initial the editor.
     */
    init() {
        const textareaElement = this.getTextArea();
        const { classes, custom } = this.settings;

        if (!textareaElement) {
            return;
        }
        // Hidden origin text area.
        textareaElement.style.display = 'none';

        const editorElement = this.createElement('div', {
            'class': (classes.editor + ' ' + (custom?.editor ?? '')).trim(),
            id: classes.editor + '-' + this.settings.element,
        });

        // Make editor container.
        const editorWrap = this.createElement('div', {
            'class': (classes.wrap + ' ' + custom.wrap).trim(),
        });

        // Make toolbar containers.
        const toolbarEl = this.initEditorToolbar();
        this.appendChild(editorWrap, toolbarEl);

        // Make the content for editor.
        const contentElementWrap = this.initEditorContent();
        const contentEditor = contentElementWrap.querySelector(`.${this.settings.classes.content}`);

        // Append the editor's elements to the DOM.
        this.appendChild(editorWrap, contentElementWrap);
        this.appendChild(editorElement, editorWrap);

        // Calculate the editor size based on the attributes 'cols' and 'rows'.
        const width = (this.getTextArea().getAttribute('cols') * 6 + 41) + 'px';
        contentEditor.style.width = width;
        contentEditor.style.minWidth = width;
        contentEditor.style.maxWidth = width;

        const rows = this.getTextArea().getAttribute('rows');
        const height = (rows * 6 + 13);
        const heightEditor = `${height - 10}px`;
        const lineHeightEditor = `${height - 6}px`;

        // Set the size of the editor.
        contentEditor.style.height = heightEditor;
        contentEditor.style.minHeight = heightEditor;
        contentEditor.style.maxHeight = heightEditor;
        contentEditor.style.lineHeight = lineHeightEditor;

        const heightContent = `${height + 1}px`;
        contentElementWrap.style.minHeight = heightContent;

        const textareaLabel = document.querySelector('[for="' + this.settings.element + '"]');

        textareaLabel.style.display = 'inline-block';
        textareaLabel.style.margin = 0;
        textareaLabel.style.height = heightContent;
        textareaLabel.style.minHeight = heightContent;
        textareaLabel.style.maxHeight = heightContent;

        // Align for the case using Supsub on the editor.
        if (textareaLabel.classList.contains('accesshide')) {
            textareaLabel.classList.remove('accesshide');
            textareaLabel.style.visibility = 'hidden';
            editorElement.style.marginLeft = `-${parseInt(textareaLabel.offsetWidth)}px`;
        } else {
            // Get parent node of the label.
            const labelParentNode = textareaLabel.parentNode;
            labelParentNode.style.paddingBottom = heightEditor;
            textareaLabel.style.verticalAlign = 'bottom';
        }

        textareaElement.insertAdjacentElement('beforebegin', editorElement);
        // Set the editor's content for the first time.
        this.getEditorContent().innerHTML = this.getContent();

        // Save the history from the beginning.
        this.saveHistory();

        // Wait until the editor element is added to the DOM before calculating
        // its size to ensure it aligns with the others elements.
        requestAnimationFrame(() => {
            textareaLabel.style.lineHeight = contentEditor.style.lineHeight;
            const heightWrapper = height + 1 + parseInt(toolbarEl.offsetHeight);
            editorElement.style.height = heightWrapper + 'px';
            editorElement.style.minHeight = heightWrapper + 'px';
            editorElement.style.maxHeight = heightWrapper + 'px';
        });

        document.addEventListener('click', (e) => {
            if (!editorElement.contains(e.target)) {
                // Get clean data.
                const cleanData = this.getCleanHTML();
                // Set it in both the hidden text area and the editor content.
                this.getTextArea().value = cleanData;
                this.getEditorContent().innerHTML = cleanData;
                this.setActiveButton(false);
            }
        });
    }

    /**
     * Make a content area for the editor.
     *
     * @return {HTMLElement} The content area element.
     */
    initEditorContent = () => {
        const { classes, custom } = this.settings;
        const contentElement = this.createElement('div', {
            'class': (classes.content + ' ' + (custom.content ?? '')).trim(),
            contenteditable: true,
            autocapitalize: 'none',
            autocorrect: 'off',
            role: 'textbox',
            spellcheck: false,
            'aria-live': 'off',
            id: `${this.settings.element.replace(/:/g, ":")}editable`,
        });

        contentElement.addEventListener('blur', (event) => {
            this.saveHistory();
        })

        // Listen for the selection change event.
        document.addEventListener('selectionchange', () => this.handleSelectionChange());

        // Set up hotkeys for the editor and prevent the Enter key from making the text content a single line.
        contentElement.addEventListener('keydown', (event) => {
            // Selection range.
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);
            const keyMap = {
                key: {
                    'ArrowUp': 'sup',
                    '94': 'sup',
                    'ArrowDown': 'sub',
                    '95': 'sub',

                },
                shiftKey: {
                    '^': 'sup',
                    '_': 'sub',
                }
            };
            if (keyMap.key[event.key] || (event.shiftKey && keyMap.shiftKey[event.key])) {
                event.preventDefault();
                this.handleSupSubHotKey(keyMap[event.key]);
            }

            if (event.ctrlKey) {
                this.saveHistory();
            }

            if (event.key === 'Enter') {
                event.preventDefault();
            }

            // Handle undo/redo action.
            if (event.ctrlKey && event.key === 'z') {
                event.preventDefault();
                this.handleUndo();
            }

            if (event.ctrlKey && event.key === 'y') {
                event.preventDefault();
                this.handleRedo();
            }

            // In case the editor is empty we need to reset format
            // to prevent it remember the previous format.
            if (this.cleanHTML(event.target.innerHTML) === '' &&
                    !this.isSelectionInsideSubSup()) {
                const emptyText = document.createTextNode('\uFEFF');
                range.insertNode(emptyText);
            }

            this.getTextArea().value = this.getCleanHTML();
        });

        contentElement.addEventListener('paste', event => {
            this.handlePaste(event);
        });

        const wrapContent = this.createElement('div', {
            'class': (classes.contentWrap + ' ' + (custom.contentWrap ?? '')).trim(),
        });

        this.appendChild(wrapContent, contentElement);

        return wrapContent;
    };

    /**
     * Handle event paste.
     *
     * @param {Event} event Event object.
     */
    handlePaste(event) {
        event.preventDefault();
        const types = event.clipboardData.types;
        let isHTML = false;

        // Check for different methods to determine if 'text/html' is present
        if (types?.contains) {
            isHTML = types.contains('text/html');
        } else if (types?.includes) {
            isHTML = types.includes('text/html');
        }

        let content;
        if (isHTML) {
            content = this.cleanPasteHTML(event.clipboardData.getData('text/html'));
        } else {
            content = event.clipboardData.getData('text');
        }

        // We need to clean the data before inserting it into the editor.
        const cleanData = content.replaceAll(/[\r\n]+/g, '');
        document.execCommand('insertHTML', false, cleanData);
        this.saveHistory();
        this.getTextArea().value = this.getCleanHTML();
    }

    /**
     * Handle event undo.
     */
    handleUndo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.getEditorContent().innerHTML = this.history[this.historyIndex];
            this.getTextArea().value = this.history[this.historyIndex];
        }
    }

    /**
     * Handle event redo.
     */
    handleRedo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.getEditorContent().innerHTML = this.history[this.historyIndex];
            this.getTextArea().value = this.history[this.historyIndex];
        }
    }

    /**
     * Handle event sup/sub.
     *
     * @param {String} action The sup/sub action.
     */
    handleSupSubHotKey(action) {
        const nodeEl = this.isSelectionInsideSubSup();
        if (nodeEl) {
            const nodeName = nodeEl.nodeName.toLowerCase();
            if (nodeName !== action) {
                this.setFormat(this.getActions(nodeName === 'sup' ? 'sub' : 'sup')[0]);
            }
            return;
        }
        if (this.isSupportSupSub(action)) {
            this.setFormat(this.getActions(action)[0]);
        }
    }

    /**
     * Based on the user's selection change, we will detect the pointer position to determine whether
     * the cursor is inside the sup/sub tag. Depending on this result, we will activate the corresponding button.
     */
    handleSelectionChange() {
        const selection = window.getSelection();

        // When the user makes a selection change inside the editor.
        if (this.getEditorContent().contains(selection.anchorNode)) {
            // Detect whether the pointer is inside the sup/sub tag.
            const node = this.isSelectionInsideSubSup();

            if (node) {
                // Activate the corresponding button in the toolbar.
                this.setActiveButton(node.nodeName.toLowerCase());
            } else {
                // Deactivate all the buttons.
                this.setActiveButton(false);
            }
        }
    }

    /**
     * Utility function to create a element with attributes.
     *
     * @param {String} tag - HTML tag name.
     * @param {Object} attributes - The attributes of the element, such as class, id, etc.
     * @return {HTMLElement} The element that was created.
     */
    createElement(tag, attributes = {}) {
        const element = document.createElement(tag);
        for (let attribute in attributes) {
            element.setAttribute(attribute, attributes[attribute]);
        }

        return element;
    }

    /**
     * Utility function to check whether the current selection is inside the sup/sub tag. Returns false if it's not.
     *
     * @return {Boolean|ParentNode} Return the node if the selection is inside a sup/sub tag; otherwise, return false.
     */
    isSelectionInsideSubSup() {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) {
            return false;
        }
        const range = selection.getRangeAt(0);
        const tagName = range.commonAncestorContainer.parentNode.nodeName;
        // If user doesn't select any text.
        if (selection.isCollapsed) {
            if (this.isSupSubTag(tagName)) {
                return range.commonAncestorContainer.parentNode;
            }
            return false;
        }
        let nodeNames;
        const selectionNodes = range.cloneContents().childNodes;
        for (let node of selectionNodes) {
            const nodeName = node.nodeName;
            if (node.textContent === '') {
                continue;
            }
            if (!(this.isSupSubTag(nodeName)) &&
                    (nodeName === '#text' && !this.isSupSubTag(tagName))) {
                return false;
            }
            if (!nodeNames) {
                nodeNames = node;
            }
            if (!nodeNames.isEqualNode(node)) {
                return false;
            }
        }

        if (nodeNames.nodeName === '#text' || this.isSupSubTag(tagName)) {
            return range.commonAncestorContainer.parentNode;
        }

        return nodeNames;
    }

    /**
     * Check if the given tag name is 'sup' or 'sub'. Return true if it is.
     *
     * @param {String} tagName - Tag name need to check.
     * @return {Boolean|ParentNode} Return the node if the selection is inside a sup/sub tag; otherwise, return false.
     */
    isSupSubTag(tagName) {
        return ['SUB', 'SUP'].includes(tagName);
    }

    /**
     * Utility function to highlight the sup/sub button.
     *
     * @param {String|Boolean} type - The type of the button: sup or sub.
     */
    setActiveButton(type) {
        const { toolbar, button } = this.settings.classes;
        // Deactivate all the existing buttons.
        this.getEditor().querySelectorAll(`.${toolbar} .${button}`)
            .forEach(button => button.classList.remove('highlight'));
        if (type !== false) {
            this.getSupSubButton(type)?.classList?.add('highlight');
        }
    }

    /**
     * Utility function to append a child node to a parent node.
     *
     * @param {HTMLElement} parent - The parent node that will contain the child node.
     * @param {HTMLElement} child - The child node.
     */
    appendChild(parent, child) {
        parent.appendChild(child);
    }

    /**
     * Utility function to create a toolbar element that contains sup and sub buttons.
     *
     * @return {HTMLElement} The toolbar element.
     */
    initEditorToolbar() {
        const toolbarGroup = this.createElement('div', {
            'class': (this.settings.classes.toolbarGroup + ' ' + (this.settings?.custom?.toolbarGroup ?? '')).trim(),
        });
        this.getActions(this.settings.type).forEach((action) => {
            const button = this.createElement('button', {
                'class': this.settings?.classes.button + ' ' + action.class,
                title: this.settings.buttons[action.name].title,
                type: 'button',
                'data-action': action.name,
            });

            button.innerHTML = this.settings.buttons[action.name].icon;
            button.setAttribute('type', 'button');
            button.onclick = (event) => {
                const selection = window.getSelection();
                const nodeEl = this.isSelectionInsideSubSup();
                if (selection.isCollapsed && nodeEl !== false) {
                    if (nodeEl.nodeName.toLowerCase() !== action.tag) {
                        button.blur();
                        this.getEditorContent().focus();
                        return;
                    }
                }

                this.getEditorContent().focus();
                this.setFormat(action);
            };

            this.appendChild(toolbarGroup, button);
        });
        const toolbarEl = this.createElement('div', {
            'class': (this.settings.classes.toolbar + ' ' + (this.settings?.custom?.toolbar ?? '')).trim(),
        });
        this.appendChild(toolbarEl, toolbarGroup);

        return toolbarEl;
    }

    /**
     * Based on the action (sup/sub), this function will format the selected text accordingly.
     *
     * @param {Object} action - The sup/sub action object.
     */
    setFormat(action) {
        // Selection text.
        const selection = window.getSelection();
        // Selection range.
        const range = selection.getRangeAt(0);
        const { tag } = action;
        const nodeEl = this.isSelectionInsideSubSup();
        // In case the user doesn't select any text.
        if (selection.isCollapsed) {
            // We need to check whether the current position of the pointer is inside a sub or sup tag.
            const parentNode = range.commonAncestorContainer.parentNode;
            if (parentNode.nodeName.toLowerCase() === tag) {
                // In this case, the pointer is inside a sub or sup tag, so we need to select all the text within the tag.
                // Then, we will slice it into two parts, using the current position of the cursor as the border.
                // The first part will extend from position 0 to the border, and the second part will span from
                // the border to the end.
                // After that, we will wrap each part in the corresponding sub or sup tag. The result will be:
                // <sup>First</sup> and <sup>Second</sup>.
                // Finally, we will create a text node with empty content (\uFEFF) and place it at the border
                // of the two parts, resulting in:
                // <sup>First</sup>#textnode#<sup>Second</sup>.
                // Create the first part.
                const beforeText = this.createElement(tag);
                beforeText.innerText = parentNode.textContent.slice(0, range.startOffset);
                // Make an empty textnode.
                const emptyText = document.createTextNode('\uFEFF');
                // Create an empty text node.
                const afterText = this.createElement(tag);
                afterText.innerText = parentNode.textContent.slice(range.startOffset);
                // Insert it into the DOM next to the parent node.
                if (afterText.innerHTML !== '') {
                    parentNode.parentNode.insertBefore(afterText, parentNode.nextSibling);
                }
                parentNode.parentNode.insertBefore(emptyText, parentNode.nextSibling);
                if (beforeText.innerHTML !== '') {
                    parentNode.parentNode.insertBefore(beforeText, parentNode.nextSibling);
                }

                // Remove the parent node.
                parentNode.remove();
                // We set the position of the cursor to be in the empty text node.
                range.setStart(emptyText, 1);
                range.setEnd(emptyText, 1);
                selection.removeAllRanges();
                selection.addRange(range);
            } else {
                // In case the user didn't select anything, we must create a sup/sub
                // tag with an empty string and move the cursor into it.
                const node = this.createElement(tag);
                // Zero-width space to keep the tag visible.
                node.appendChild(document.createTextNode('\uFEFF'));
                // Update the new range within the existing one.
                range.insertNode(node);
                // Set the selection index at the next available space.
                range.setStart(node.firstChild, 1);
                range.setEnd(node.firstChild, 1);
                // Remove all existing ranges from the selection.
                selection.removeAllRanges();
                // Add the updated range object to the current selection.
                selection.addRange(range);
            }
        } else if (nodeEl) {
            // This means the user is selecting some text that is inside the sub or sup tag.
            // In this case, we only need to move the selected text inside the sub/sup tag outside of it.
            // For example: <sup>123[456]789</sup>. If the selected text is 456, we will
            // move it outside the <sup> tag, resulting in <sup>123</sup>456<sup>789</sup>.
            // Retrieve the selected text.
            // Retrieve the current tag (sub/sup) that wraps the selection
            const selectedText = range.toString();
            const parentElement = nodeEl;
            const nextSibling = parentElement.nextSibling;
            const beforeText = parentElement.textContent.slice(0, range.startOffset);
            const afterText = parentElement.textContent.slice(range.endOffset);
            if (beforeText) {
                const start = this.createElement(parentElement.nodeName.toLowerCase());
                start.textContent = beforeText;
                parentElement.parentNode.insertBefore(start, nextSibling);
            }
            // Create a text node based on the selected text.
            const textNode = document.createTextNode(selectedText);
            parentElement.parentNode.insertBefore(textNode, nextSibling);
            if (afterText) {
                const end = this.createElement(parentElement.nodeName.toLowerCase());
                end.textContent = afterText;
                parentElement.parentNode.insertBefore(end, nextSibling);
            }

            parentElement.remove();

            // Create a new range to select the inserted content
            range.setStart(textNode, 0);
            range.setEnd(textNode, selectedText.length);
            selection.removeAllRanges();
            selection.addRange(range);
            this.getTextArea().value = this.getCleanHTML();
        } else {
            // This case is user select a text that is not inside subsup.
            //  We retrieve the selected text and then delete it in DOM.
            const selectedText = range.toString();
            range.deleteContents();
            const previousNode = range.commonAncestorContainer.previousSibling;
            const nextNode = range.commonAncestorContainer.nextSibling;
            // In addition, we will merge adjacent sup/sub tags into a single sup/sub tag.
            if (previousNode || nextNode) {
                const newNode = this.createElement(tag);
                let startOffset = 0;
                let endOffset = 0;
                let content = '';
                if (previousNode && previousNode?.nodeName?.toLowerCase() === tag) {
                    content = previousNode.textContent;
                    startOffset = content.length;
                    previousNode.remove();
                }
                content += selectedText;
                endOffset = content.length;
                if (nextNode && nextNode?.nodeName?.toLowerCase() === tag) {
                    content += nextNode.textContent;
                    nextNode.remove();
                }
                newNode.textContent = content;
                if (content !== selectedText) {
                    range.insertNode(newNode);
                    range.setStart(newNode.firstChild, startOffset);
                    range.setEnd(newNode.firstChild, endOffset);
                    this.getTextArea().value = this.getCleanHTML();
                    return;
                }
            }

            // Create a sup/sub tag that wrap the selected text.
            const newNode = document.createElement(tag);
            newNode.appendChild(document.createTextNode(selectedText));
            // Make a selection to the selected text.
            selection.removeAllRanges();
            // Insert it into DOM.
            range.insertNode(newNode);
            range.selectNodeContents(newNode.firstChild);
            selection.addRange(range);
            // Clean up all the empty text.
            this.getEditorContent().childNodes.forEach(el => {
                if(el.nodeName === '#text' && el.textContent === '') {
                    el.remove();
                }
            });
            this.getTextArea().value = this.getCleanHTML();
        }
        // Clean up.
        this.getEditorContent().childNodes.forEach(el => {
            if(el.nodeName === '#text' && el.textContent === '') {
                el.remove();
            }
        });
        this.saveHistory();
    }

    /**
     * Save history for undo/redo actions.
     */
    saveHistory() {
        const content = this.getCleanHTML();
        if (this.historyIndex === -1 || content !== this.history[this.historyIndex]) {
            this.history.splice(this.historyIndex + 1);
            this.history.push(content);
            this.historyIndex++;
        }
    }

    /**
     * Cleanup html that comes from WYSIWYG paste events. These are more likely to contain messy code that we should strip.
     *
     * @param {String} content - The content data need to be clean.
     */
    cleanPasteHTML(content) {
        // Return an empty string if passed an invalid or empty object.
        if (!content || content.length === 0) {
            return "";
        }

        // Rules that get rid of the real-nasties and don't care about normalize code (correct quotes, white spaces, etc.).
        let rules = [
            { regex: /<\s*\/html\s*>([\s\S]+)$/gi, replace: "" },
            { regex: /<!--\[if[\s\S]*?endif\]-->/gi, replace: "" },
            { regex: /<!--(Start|End)Fragment-->/gi, replace: "" },
            { regex: /<xml[^>]*>[\s\S]*?<\/xml>/gi, replace: "" },
            { regex: /<\?xml[^>]*>[\s\S]*?<\\\?xml>/gi, replace: "" },
            { regex: /<\/?\w+:[^>]*>/gi, replace: "" }
        ];

        // Apply the first set of harsher rules.
        content = this.filterContentWithRules(content, rules);

        // Apply the standard rules, which mainly cleans things like headers, links, and style blocks.
        content = this.cleanHTML(content);

        // Check if the string is empty or only contains whitespace.
        if (content.length === 0 || !/\S/.test(content)) {
            return content;
        }

        // Normalize the code by loading it into the DOM.
        const holder = document.createElement('div');
        holder.innerHTML = content;
        content = holder.innerHTML;

        // Free up the DOM memory.
        holder.innerHTML = "";

        // Run some more rules that care about quotes and whitespace.
        rules = [
            { regex: /(<[^>]*?style\s*?=\s*?"[^>"]*?)(?:[\s]*MSO[-:][^>;"]*;?)+/gi, replace: "$1" },
            { regex: /(<[^>]*?class\s*?=\s*?"[^>"]*?)(?:[\s]*MSO[_a-zA-Z0-9\-]*)+/gi, replace: "$1" },
            { regex: /(<[^>]*?class\s*?=\s*?"[^>"]*?)(?:[\s]*Apple-[_a-zA-Z0-9\-]*)+/gi, replace: "$1" },
            { regex: /<a [^>]*?name\s*?=\s*?"OLE_LINK\d*?"[^>]*?>\s*?<\/a>/gi, replace: "" },
        ];

        // Apply the rules.
        content = this.filterContentWithRules(content, rules);

        // Reapply the standard cleaner to the content.
        return this.cleanHTML(content);
    }

    /**
     * Check if the editor allows the use of sub or sup features.
     *
     * @param {String} action - Sub/sup action to check.
     * @return {Boolean} The result after verifying whether it is allowed.
     */
    isSupportSupSub(action) {
        const { type } = this.settings;
        return type === 'both' || type === action;
    }

    /**
     * Utility function to filter the content based on the given rules.
     *
     * @param {String} content - The content need to be filtered.
     * @param {Object} rules - The rules list.
     * @return {String} The cleaned content will be returned.
     */
    filterContentWithRules(content, rules) {
        for (const element of rules) {
            content = content.replace(element.regex, element.replace);
        }
        return content;
    }

    /**
     * Utility function to clean the HTML.
     *
     * @param {String} content - The content need to be filter.
     * @return {String} The cleaned content will be returned.
     */
    cleanHTML(content) {
        // Removing limited things that can break the page or a disallowed, like unclosed comments, style blocks, etc.

        const rules = [
            //Remove empty paragraphs.
            { regex: /<p[^>]*>(&nbsp;|\s)*<\/p>/gi, replace: "" },

            //Remove attributes on sup and sub tags.
            { regex: /<sup[^>]*(&nbsp;|\s)*>/gi, replace: "<sup>" },
            { regex: /<sub[^>]*(&nbsp;|\s)*>/gi, replace: "<sub>" },

            //Replace &nbsp; with space.
            { regex: /&nbsp;/gi, replace: " " },

            //Combine matching tags with spaces in between.
            { regex: /<\/sup>(\s*)+<sup>/gi, replace: "$1" },
            { regex: /<\/sub>(\s*)+<sub>/gi, replace: "$1" },

            //Move spaces after start sup and sub tags to before.
            { regex: /<sup>(\s*)+/gi, replace: "$1<sup>" },
            { regex: /<sub>(\s*)+/gi, replace: "$1<sub>" },

            //Move spaces before end sup and sub tags to after.
            { regex: /(\s*)+<\/sup>/gi, replace: "</sup>$1" },
            { regex: /(\s*)+<\/sub>/gi, replace: "</sub>$1" },

            //Remove empty br tags.
            { regex: /<br>/gi, replace: "" },

            // Remove any style blocks. Some browsers do not work well with them in a contenteditable.
            // Plus style blocks are not allowed in body html, except with "scoped", which most browsers don't support as of 2015.
            // Reference: "http://stackoverflow.com/questions/1068280/javascript-regex-multiline-flag-doesnt-work"
            { regex: /<style[^>]*>[\s\S]*?<\/style>/gi, replace: "" },

            // Remove any open HTML comment opens that are not followed by a close. This can completely break page layout.
            { regex: /<!--(?![\s\S]*?-->)/gi, replace: "" },

            // Remove elements that can not contain visible text.
            { regex: /<script[^>]*>[\s\S]*?<\/script>/gi, replace: "" },

            // Source: "http://www.codinghorror.com/blog/2006/01/cleaning-words-nasty-html.html"
            // Remove forbidden tags for content, title, meta, style, st0-9, head, font, html, body, link.
            { regex: /<\/?(?:br|title|meta|style|std|font|html|body|link|a|ul|li|ol)[^>]*?>/gi, replace: "" },
            { regex: /<\/?(?:b|i|u|ul|ol|li|img)[^>]*?>/gi, replace: "" },
            // Source:"https://developer.mozilla.org/en/docs/Web/HTML/Element"
            // Remove all elements except sup and sub.
            { regex: /<\/?(?:abbr|address|area|article|aside|audio|base|bdi|bdo|blockquote)[^>]*?>/gi, replace: "" },
            { regex: /<\/?(?:button|canvas|caption|cite|code|col|colgroup|content|data)[^>]*?>/gi, replace: "" },
            { regex: /<\/?(?:datalist|dd|decorator|del|details|dialog|dfn|div|dl|dt|element)[^>]*?>/gi, replace: "" },
            { regex: /<\/?(?:em|embed|fieldset|figcaption|figure|footer|form|h1|h2|h3|h4|h5)[^>]*?>/gi, replace: "" },
            { regex: /<\/?(?:h6|header|hgroup|hr|iframe|input|ins|kbd|keygen|label|legend)[^>]*?>/gi, replace: "" },
            { regex: /<\/?(?:main|map|mark|menu|menuitem|meter|nav|noscript|object|optgroup)[^>]*?>/gi, replace: "" },
            { regex: /<\/?(?:option|output|p|param|pre|progress|q|rp|rt|rtc|ruby|samp)[^>]*?>/gi, replace: "" },
            { regex: /<\/?(?:section|select|script|shadow|small|source|std|strong|summary)[^>]*?>/gi, replace: "" },
            { regex: /<\/?(?:svg|table|tbody|td|template|textarea|time|tfoot|th|thead|tr|track)[^>]*?>/gi, replace: "" },
            { regex: /<\/?(?:var|wbr|video)[^>]*?>/gi, replace: "" },

            // Deprecated elements that might still be used by older sites.
            { regex: /<\/?(?:acronym|applet|basefont|big|blink|center|dir|frame|frameset|isindex)[^>]*?>/gi, replace: "" },
            { regex: /<\/?(?:listing|noembed|plaintext|spacer|strike|tt|xmp)[^>]*?>/gi, replace: "" },

            // Elements from common sites including google.com.
            { regex: /<\/?(?:jsl|nobr)[^>]*?>/gi, replace: "" },

            { regex: /<span(?![^>]*?rangySelectionBoundary[^>]*?)[^>]*>[\s\S]*?([\s\S]*?)<\/span>/gi, replace: "$1" },

            // Remove empty spans, but not ones from Rangy.
            { regex: /<span(?![^>]*?rangySelectionBoundary[^>]*?)[^>]*>(&nbsp;|\s)*<\/span>/gi, replace: "" },
            { regex: /<span(?![^>]*?rangySelectionBoundary[^>]*?)[^>]*>[\s\S]*?([\s\S]*?)<\/span>/gi, replace: "$1" },

            // Remove empty sup and sub tags that appear after pasting text.
            { regex: /<sup[^>]*>(&nbsp;|\s)*<\/sup>/gi, replace: "" },
            { regex: /<sub[^>]*>(&nbsp;|\s)*<\/sub>/gi, replace: "" },

            // Remove special xml namespace tag xmlns generate by browser plugin.
            { regex: /<xmlns.*?>(.*?)<\/xmlns.*?>/gi, replace: "$1" },
            { regex: /\uFEFF/gi, replace: "" }
        ];

        return this.filterContentWithRules(content, rules);
    }

    /**
     * Clean the generated HTML content without modifying the editor content.
     *
     * This includes removing all YUI IDs from the generated content.
     *
     * @return {string} The cleaned HTML content.
     */
    getCleanHTML() {
        // Clone the editor so that we don't actually modify the real content.
        const editorClone = this.getEditorContent().cloneNode(true);
        let html;

        html = editorClone.innerHTML;

        // Define contents that are considered empty.
        const emptyContents = [
            '<p></p>',
            '<p><br></p>',
            '<br>',
            '<p dir="rtl" style="text-align: right;"></p>',
            '<p dir="rtl" style="text-align: right;"><br></p>',
            '<p dir="ltr" style="text-align: left;"></p>',
            '<p dir="ltr" style="text-align: left;"><br></p>',
            '<p>&nbsp;</p>',
            '<p><br>&nbsp;</p>',
            '<p dir="rtl" style="text-align: right;">&nbsp;</p>',
            '<p dir="rtl" style="text-align: right;"><br>&nbsp;</p>',
            '<p dir="ltr" style="text-align: left;">&nbsp;</p>',
            '<p dir="ltr" style="text-align: left;"><br>&nbsp;</p>'
        ];

        if (emptyContents.includes(html)) {
            return '';
        }

        // Clean the HTML content.
        return this.cleanHTML(html);
    }


    /**
     * Utility function to get the content element of the editor.
     *
     * @return {HTMLElement} The editor content element.
     */
    getEditorContent() {
        return this.getEditor().querySelector(`.${this.settings.classes.content}`);
    }

    /**
     * Utility function to get the editor element. This element will contain all the components of the editor.
     *
     * @return {HTMLElement} The editor element.
     */
    getEditor() {
        return document.getElementById(`${this.settings.classes.editor}-${this.settings.element}`);
    }

    /**
     * Utility function to retrieve the button element based on the given type.
     *
     * @param {String} type - The type of the button: sup or sub.
     * @return {HTMLElement} The corresponding button.
     */
    getSupSubButton(type) {
        const { toolbar, button } = this.settings.classes;
        return this.getEditor().querySelector(`.${toolbar} .${button}[data-action^="${type}"]`);
    }

    /**
     * Utility function to get button settings (sup/sub) based on the given type.
     *
     * @param {String} type - The type of the button can be either sup or sub.
     * @return {Object} The settings for the given button.
     */
    getActions(type) {
        if (defaultActions[type]) {
            return [defaultActions[type]];
        }

        return Object.values(defaultActions);
    }

    /**
     * Utility to get the button container for the editor.
     *
     * @return {HTMLElement} The button container.
     */
    getButtonContainer() {
        return this.getEditor().querySelectorAll(`.${this.settings.classes.toolbar} .${this.settings.classes.button}`);
    }

    /**
     * Utility function to get the content of the original textarea.
     *
     * @return {String} The content.
     */
    getContent() {
        return this.getTextArea().value;
    }

    /**
     * Utility function to get id of the element.
     *
     * @return {String} The element id.
     */
    getEditorId() {
        return this.settings.element;
    }

    /**
     * Return the text area element.
     *
     * @return {HTMLElement} Text area element.
     */
    getTextArea() {
        return document.getElementById(this.settings.element);
    }

}

/**
 * Load editor based on the given setting.
 *
 * @param {Object} settings - The editor setting.
 */
export const loadEditor = settings => {
    const editor = new OUSupSubEditor(settings);
    // We need to do this for a specific reason, currently only for the Behat test.
    // We can easily utilize the editor's API.
    if (!window.OUSupSubEditor) {
        window.OUSupSubEditor = {
            instances: {
                [settings.element]: editor,
            },
            addEditor: function (editor) {
                this.instances[editor.getEditorId()] = editor;
            },
            getEditorById: function (editorId) {
                return this.instances[editorId];
            },
        };
    } else {
        window.OUSupSubEditor.addEditor(editor);
    }
};
