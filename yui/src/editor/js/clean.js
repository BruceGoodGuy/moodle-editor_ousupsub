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
 * @module moodle-editor_ousupsub-editor
 * @submodule clean
 */

/**
 * Functions for the ousupsub editor to clean the generated content.
 *
 * See {{#crossLink "M.editor_ousupsub.Editor"}}{{/crossLink}} for details.
 *
 * @namespace M.editor_ousupsub
 * @class EditorClean
 */

function EditorClean() {}

EditorClean.ATTRS = {
};

EditorClean.prototype = {
    /**
     * Clean the generated HTML content without modifying the editor content.
     *
     * This includes removes all YUI ids from the generated content.
     *
     * @return {string} The cleaned HTML content.
     */
    getCleanHTML: function() {
        // Clone the editor so that we don't actually modify the real content.
        var editorClone = this.editor.cloneNode(true),
            html, startParagraph = '', endParagraph = '';

        // Remove all YUI IDs.
        Y.each(editorClone.all('[id^="yui"]'), function(node) {
            node.removeAttribute('id');
        });

        // Remove all selection nodes.
        Y.each(editorClone.all('[id^="selectionBoundary_"]'), function(node) {
            node.remove();
        });

//     // Remove all br nodes.
//        Y.each(editorClone.all('br'), function(node) {
//            node.remove();
//        });

        editorClone.all('.ousupsub_control').remove(true);
        html = editorClone.get('innerHTML');

        // Revert untouched editor contents to an empty string.
        if (html === '' || html === '<br>') {
            return '';
        }

        // Revert untouched editor contents to an empty string.
        if (html.indexOf(startParagraph) === 0) {
            var length = html.length - (startParagraph.length + endParagraph.length);
            html = html.substr(startParagraph.length, length);
        }

        // Remove any and all nasties from source.
       return this._cleanHTML(html);
    },

    /**
     * Clean the HTML content of the editor.
     *
     * @method cleanEditorHTML
     * @chainable
     */
    cleanEditorHTML: function() {
        this.editor.set('innerHTML', this._cleanHTML(this.editor.get('innerHTML')));
        return this;
    },

    /**
     * Clean the specified HTML content and remove any content which could cause issues.
     *
     * @method _cleanHTML
     * @private
     * @param {String} content The content to clean
     * @return {String} The cleaned HTML
     */
    _cleanHTML: function(content) {
        // Removing limited things that can break the page or a disallowed, like unclosed comments, style blocks, etc.

        var rules = [
            //Remove empty paragraphs.
            {regex: /<p[^>]*>(&nbsp;|\s)*<\/p>/gi, replace: ""},

            //Remove attributes on sup and sub tags.
            {regex: /<sup[^>]*(&nbsp;|\s)*>/gi, replace: "<sup>"},
            {regex: /<sub[^>]*(&nbsp;|\s)*>/gi, replace: "<sub>"},

            //Replace &nbsp; with space.
            {regex: /&nbsp;/gi, replace: " "},

            //Combine matching tags with a space in between.
            {regex: /<\/sup> <sup>/gi, replace: " "},
            {regex: /<\/sub> <sub>/gi, replace: " "},

            //Move spaces before sup and sub tags to after.
            {regex: / <\/sup>/gi, replace: "</sup> "},
            {regex: / <\/sub>/gi, replace: "</sub> "},

            //Remove empty br tags.
            {regex: /<br>/gi, replace: ""},

            // Remove any style blocks. Some browsers do not work well with them in a contenteditable.
            // Plus style blocks are not allowed in body html, except with "scoped", which most browsers don't support as of 2015.
            // Reference: "http://stackoverflow.com/questions/1068280/javascript-regex-multiline-flag-doesnt-work"
            {regex: /<style[^>]*>[\s\S]*?<\/style>/gi, replace: ""},

            // Remove any open HTML comment opens that are not followed by a close. This can completely break page layout.
            {regex: /<!--(?![\s\S]*?-->)/gi, replace: ""},

            // Source: "http://www.codinghorror.com/blog/2006/01/cleaning-words-nasty-html.html"
            // Remove forbidden tags for content, title, meta, style, st0-9, head, font, html, body, link.
            {regex: /<\/?(?:br|title|meta|style|st\d|head|font|html|body|link)[^>]*?>/gi, replace: ""}
        ];

        return this._filterContentWithRules(content, rules);
    },

    /**
     * Take the supplied content and run on the supplied regex rules.
     *
     * @method _filterContentWithRules
     * @private
     * @param {String} content The content to clean
     * @param {Array} rules An array of structures: [ {regex: /something/, replace: "something"}, {...}, ...]
     * @return {String} The cleaned content
     */
    _filterContentWithRules: function(content, rules) {
        var i = 0;
        for (i = 0; i < rules.length; i++) {
            content = content.replace(rules[i].regex, rules[i].replace);
        }

        return content;
    },

    /**
     * Intercept and clean html paste events.
     *
     * @method pasteCleanup
     * @param {Object} sourceEvent The YUI EventFacade  object
     * @return {Boolean} True if the passed event should continue, false if not.
     */
    pasteCleanup: function(sourceEvent) {
        // We only expect paste events, but we will check anyways.
        if (sourceEvent.type === 'paste') {
            // The YUI event wrapper doesn't provide paste event info, so we need the underlying event.
            var event = sourceEvent._event;
            // Check if we have a valid clipboardData object in the event.
            // IE has a clipboard object at window.clipboardData, but as of IE 11, it does not provide HTML content access.
            if (event && event.clipboardData && event.clipboardData.getData) {
                // Check if there is HTML type to be pasted, this is all we care about.
                var types = event.clipboardData.types;
                var isHTML = false;
                // Different browsers use different things to hold the types, so test various functions.
                if (!types) {
                    isHTML = false;
                } else if (typeof types.contains === 'function') {
                    isHTML = types.contains('text/html');
                } else if (typeof types.indexOf === 'function') {
                    isHTML = (types.indexOf('text/html') > -1);
                    if (!isHTML) {
                        if ((types.indexOf('com.apple.webarchive') > -1) || (types.indexOf('com.apple.iWork.TSPNativeData') > -1)) {
                            // This is going to be a specialized Apple paste paste. We cannot capture this, so clean everything.
                            this.fallbackPasteCleanupDelayed();
                            return true;
                        }
                    }
                } else {
                    // We don't know how to handle the clipboard info, so wait for the clipboard event to finish then fallback.
                    this.fallbackPasteCleanupDelayed();
                    return true;
                }

                if (isHTML) {
                    // Get the clipboard content.
                    var content;
                    try {
                        content = event.clipboardData.getData('text/html');
                    } catch (error) {
                        // Something went wrong. Fallback.
                        this.fallbackPasteCleanupDelayed();
                        return true;
                    }

                    // Stop the original paste.
                    sourceEvent.preventDefault();

                    // Scrub the paste content.
                    content = this._cleanPasteHTML(content);

                    // Save the current selection.
                    // Using saveSelection as it produces a more consistent experience.
                    var selection = window.rangy.saveSelection();

                    // Insert the content.
                    this.insertContentAtFocusPoint(content);

                    // Restore the selection, and collapse to end.
                    window.rangy.restoreSelection(selection);
                    window.rangy.getSelection().collapseToEnd();

                    // Update the text area.
                    this.updateOriginal();
                    this._normaliseTextarea();
                    return false;
                } else {
                    // This is a non-html paste event, we can just let this continue on and call updateOriginalDelayed.
                    this.updateOriginalDelayed();
                    return true;
                }
            } else {
                // If we reached a here, this probably means the browser has limited (or no) clipboard support.
                // Wait for the clipboard event to finish then fallback.
                this.fallbackPasteCleanupDelayed();
                return true;
            }
        }

        // We should never get here - we must have received a non-paste event for some reason.
        // Um, just call updateOriginalDelayed() - it's safe.
        this.updateOriginalDelayed();
        return true;
    },

    /**
     * Cleanup code after a paste event if we couldn't intercept the paste content.
     *
     * @method fallbackPasteCleanup
     * @chainable
     */
    fallbackPasteCleanup: function() {
        Y.log('Using fallbackPasteCleanup for ousupsub cleanup', 'debug', LOGNAME);

        // Save the current selection (cursor position).
        var selection = window.rangy.saveSelection();

        // Get, clean, and replace the content in the editable.
        var content = this.editor.get('innerHTML');
        this.editor.set('innerHTML', this._cleanPasteHTML(content));

        // Update the textarea.
        this.updateOriginal();

        // Restore the selection (cursor position).
        window.rangy.restoreSelection(selection);

        return this;
    },

    /**
     * Calls fallbackPasteCleanup on a short timer to allow the paste event handlers to complete.
     *
     * @method fallbackPasteCleanupDelayed
     * @chainable
     */
    fallbackPasteCleanupDelayed: function() {
        Y.soon(Y.bind(this.fallbackPasteCleanup, this));

        return this;
    },

    /**
     * Cleanup html that comes from WYSIWYG paste events. These are more likely to contain messy code that we should strip.
     *
     * @method _cleanPasteHTML
     * @private
     * @param {String} content The html content to clean
     * @return {String} The cleaned HTML
     */
    _cleanPasteHTML: function(content) {
        // Return an empty string if passed an invalid or empty object.
        if (!content || content.length === 0) {
            return "";
        }

        // Rules that get rid of the real-nasties and don't care about normalize code (correct quotes, white spaces, etc).
        var rules = [
            // Stuff that is specifically from MS Word and similar office packages.
            // Remove all garbage after closing html tag.
            {regex: /<\s*\/html\s*>([\s\S]+)$/gi, replace: ""},
            // Remove if comment blocks.
            {regex: /<!--\[if[\s\S]*?endif\]-->/gi, replace: ""},
            // Remove start and end fragment comment blocks.
            {regex: /<!--(Start|End)Fragment-->/gi, replace: ""},
            // Remove any xml blocks.
            {regex: /<xml[^>]*>[\s\S]*?<\/xml>/gi, replace: ""},
            // Remove any <?xml><\?xml> blocks.
            {regex: /<\?xml[^>]*>[\s\S]*?<\\\?xml>/gi, replace: ""},
            // Remove <o:blah>, <\o:blah>.
            {regex: /<\/?\w+:[^>]*>/gi, replace: ""}
        ];

        // Apply the first set of harsher rules.
        content = this._filterContentWithRules(content, rules);

        // Apply the standard rules, which mainly cleans things like headers, links, and style blocks.
        content = this._cleanHTML(content);

        // Check if the string is empty or only contains whitespace.
        if (content.length === 0 || !content.match(/\S/)) {
            return content;
        }

        // Now we let the browser normalize the code by loading it into the DOM and then get the html back.
        // This gives us well quoted, well formatted code to continue our work on. Word may provide very poorly formatted code.
        var holder = document.createElement('div');
        holder.innerHTML = content;
        content = holder.innerHTML;
        // Free up the DOM memory.
        holder.innerHTML = "";

        // Run some more rules that care about quotes and whitespace.
        rules = [
            // Remove MSO-blah, MSO:blah in style attributes. Only removes one or more that appear in succession.
            {regex: /(<[^>]*?style\s*?=\s*?"[^>"]*?)(?:[\s]*MSO[-:][^>;"]*;?)+/gi, replace: "$1"},
            // Remove MSO classes in class attributes. Only removes one or more that appear in succession.
            {regex: /(<[^>]*?class\s*?=\s*?"[^>"]*?)(?:[\s]*MSO[_a-zA-Z0-9\-]*)+/gi, replace: "$1"},
            // Remove Apple- classes in class attributes. Only removes one or more that appear in succession.
            {regex: /(<[^>]*?class\s*?=\s*?"[^>"]*?)(?:[\s]*Apple-[_a-zA-Z0-9\-]*)+/gi, replace: "$1"},
            // Remove OLE_LINK# anchors that may litter the code.
            {regex: /<a [^>]*?name\s*?=\s*?"OLE_LINK\d*?"[^>]*?>\s*?<\/a>/gi, replace: ""},
            // Remove empty spans, but not ones from Rangy.
            {regex: /<span(?![^>]*?rangySelectionBoundary[^>]*?)[^>]*>(&nbsp;|\s)*<\/span>/gi, replace: ""}
        ];

        // Apply the rules.
        content = this._filterContentWithRules(content, rules);

        // Reapply the standard cleaner to the content.
        content = this._cleanHTML(content);

        return content;
    },

    /**
     * Apply the given document.execCommand and tidy up the editor dom afterwards.
     *
     * @method _applyTextCommand
     * @private
     * @return void
     */
    _applyTextCommand: function(command, type) {
        /*
        if (type === 1) {
            document.execCommand('superscript', false, null);
        } else if (type === -1) {
            document.execCommand('subscript', false, null);
        } else if (type === 0) {
            //document.execComand('', false, null);
        }
        */
        // TODO: Trigger supperscript when type is 1, trigger subscript when type is -1.
        /*
         * Store a clone of the editor contents or the selection contents before
         * applying sup/sub. Then you can determine the initial state and what the result should be.
         */

        document.execCommand(command, false, null);
        this._normaliseTextarea();

        // And mark the text area as updated.
     // Save selection after changes to the DOM. If you don't do this here,
        // subsequent calls to restoreSelection() will fail expecting the
        // previous DOM state.
        this.saveSelection();
        this.updateOriginal();
    },

    /**
     * Helper method to get the current selection from the editor
     *
     * @method _getCurrentSelection
     * @private
     * @return mixed.
     */
    _getCurrentSelection: function() {
        var selection = this.get('host').getSelection();
        return (!selection || selection.length === 0) ? null : selection[0];
    },

    /**
     * Find the text relevant in a particular node selection.
     *
     * @method _getWholeText
     * @private
     * @return string.
     */
    _getWholeText: function(selection) {
        var wholetext = '';
        // Matching common ancestor
        if (selection.startContainer === selection.commonAncestorContainer &&
                        selection.endContainer === selection.commonAncestorContainer) {
            wholetext = selection.commonAncestorContainer.wholeText;
        }
        return wholetext;
    },

    /**
     * Get a normalised array of the currently selected nodes. Chrome splits text nodes
     * at the end of each selection and also creates empty text nodes. Fix these changes
     * and provide a standard array of nodes to match the existing selection to.
     *
     * @method _normaliseTextarea
     * @private
     * @return string
     */
    _normaliseTextarea: function() {

        // Save the current selection (cursor position).
        var selection = window.rangy.saveSelection();
        // Remove all the span tags added to the editor textarea by the browser.
        // Get the html directly inside the editor <p> tag and remove span tags from the html inside it.
        
        var editor = this._getEditor();
        editor.cleanEditorHTML();
        var editor_node = this._getEditorNode();
        this._removeSingleNodesByName(editor_node, 'br');
        
        // Remove specific tags.
        var tagsToRemove = new Array('p', 'b', 'i', 'u', 'ul', 'ol', 'li');
        for (var i=0; i<tagsToRemove.length; i++) {
            this._removeNodesByName(editor_node, tagsToRemove[i]);
        }
        this._normaliseTagInTextarea('sup');
        this._normaliseTagInTextarea('sub');
        this._removeNodesByName(editor_node, 'span');

        // Restore the selection (cursor position).
        window.rangy.restoreSelection(selection);

        // Normalise the editor html.
        editor_node.normalize();
    },

    /**
     * Get a normalised array of the currently selected nodes. Chrome splits text nodes
     * at the end of each selection and also creates empty text nodes. Fix these changes
     * and provide a standard array of nodes to match the existing selection to.
     *
     * @method _normaliseTextarea
     * @private
     * @return string.
     */
    _getSelectedNodes: function() {
        // Get the html directly inside the editor <p> tag.
        var nodes = this.get('host').editor._node.childNodes[0].childNodes;

//        this.get('host').getSelectedNodes()._nodes[0] == this.get('host').getSelection()[0].startContainer
//        this.get('host').getSelectedNodes()._nodes[7] == this.get('host').getSelection()[0].endContainer
        var offset = 0, startContainerIndex = 0, endContainerIndex = 0, currentContainerIndex = 0,
            matchesStartContainer = false, matchesEndContainer = false, depth = 0;
        for (var i = 0; i < nodes.length; i++) {
            node = nodes[i];
            matchesStartContainer = false, matchesEndContainer = false;
            if (this._matchesSelectedNode(node, selection.startContainer)) {
                matchesStartContainer = true;
            }
            if (this._matchesSelectedNode(node, selection.endContainer)) {
                matchesEndContainer = true;
            }

            // Keep track of the index of the new child node;
            if (node.children || (node.previousSibling && node.previousSibling.children)) {
                currentContainerIndex++;
                offset = 0;
            }
            if (matchesStartContainer) {
                selection.startOffset = selection.startOffset + offset;
                startContainerIndex = currentContainerIndex;
            }
            if (matchesEndContainer) {
                selection.endOffset = selection.endOffset + offset;
                endContainerIndex = currentContainerIndex;
            }

            if(node.nodeValue) {
                offset += node.nodeValue.length;
            }
        }

        // Get the editor html from the <p>.
        var editor_node = this._getEditorNode(host);

        // Normalise the editor html.
        editor_node.normalize();
        this.set('host', host);

        // Update the selection objects.
        var startNode = this._getTranslatedSelectionNode(editor_node, startContainerIndex);
        var endNode = this._getTranslatedSelectionNode(editor_node, endContainerIndex);
//        this._updateSelection(startNode, selection.startOffset, endNode, selection.endOffset);

        return nodes;
    },

    /**
     * Check whether a node matches or contains a given node.
    *
    * @method _matchesSelectedNode
    * @private
    * @return bool.
    */
   _updateSelection: function(startNode, startOffset, endNode, endOffset) {
       var host = this.get('host');
       var ranges = host.getSelection();
       var selection = ranges[0];

       // Update the selection objects.
       selection.setStart(startNode, startOffset);
       selection.setEnd(endNode, endOffset);
       host.setSelection(ranges);
       this.set('host', host);
   },

    /**
     * Check whether a node matches or contains a given node.
     *
     * @method _matchesSelectedNode
     * @private
     * @return bool.
     */
    _matchesSelectedNode: function(container_node, selected_node) {
        return container_node == selected_node || container_node.contains(selected_node);
    },

    /**
     * Remove all tags nested inside other tags of the same name. No nesting of
     * similar tags e.g. <sup><sup></sup></sup> is not allowed.
     *
     * @method _normaliseTagInTextarea
     * @private
     * @param string name Name of tag to normalise.
     * @return string.
     */
    _normaliseTagInTextarea: function(name) {
        var nodes = new Array(), container = this._getEditorNode();

        // Remove nested nodes.
        
        /*
         * Where the node.firstChild == nodes[i+1] since it ignores text elements 
         * I know it's the first node. Since the two elements match they should cancel 
         * each other out. Currently we remove only the child sup. We should remove 
         * both and move their children out.
         */
        var container_nodes = container.querySelectorAll(name);
        for (i = 0; i < container_nodes.length; i++) {
            nodes.push(container_nodes.item(i));
        }

        var parentNode, removeParent = false;
        // Nodelists change as nodes are added and removed. Use an array of nodes instead.
        for (var i = 0; i < nodes.length; i++) {
            node = nodes[i];
            parentNode = node.parentNode;
            removeParent = false;
            if (parentNode == container ) {
                continue;
            }
            if (parentNode.firstChild == node && parentNode.lastChild == node && 
                            parentNode.nodeName.toLowerCase() == name) {
                removeParent = true;
            }
            
            if (!removeParent && node && parentNode.nodeName.toLowerCase() == name) {
                removeParent = true;
                this._splitParentNode(parentNode, name);
            }
            this._removeNodesByName(node, name);

            if (removeParent) {
                this._removeNodesByName(parentNode, name);
            }
        }

        // Combine Sibling nodes.
        // Get fresh nodelist.
        var container_nodes = container.querySelectorAll(name);

        // Get a new node array and fill with the nodelist.
        nodes = new Array();
        for (i = 0; i < container_nodes.length; i++) {
            nodes.push(container_nodes.item(i));
        }

        for (var i = 0; i < nodes.length; i++) {
            node = nodes[i];
            // Combine Sibling tags.
            if (!node.previousSibling || node.previousSibling.nodeName.toLowerCase() != name) {
                continue;
            }
            this._mergeNodes(node, node.previousSibling);
        }
    },

    /**
     * Merge the from and to nodes by moving all elements in from node to the to node.
     * Append nodes in order to the to node.
     *
     * Can't use other dom methods like querySelectorAll because they don't return text elements.
     * @method _mergeNodes
     * @private
     * @return void.
     */
    _mergeNodes: function(from, to) {
        var nodes = new Array();
        var merge_nodes = from.childNodes;

        // Node lists reduce in size as nodes are removed. Use an array of nodes instead.
        for (i = 0; i < merge_nodes.length; i++) {
            nodes.push(merge_nodes.item(i));
        }

        for (var i = 0; i < nodes.length; i++) {
            node = nodes[i];
            to.appendChild(node);
        }
        from.remove();
    },

    /**
     * Split the parent node into two with the node with the given name in the middle.
     *
     * Can't use other dom methods like querySelectorAll because they don't return text elements.
     * @method _splitParentNode
     * @private
     * @return void.
     */
    _splitParentNode: function(container_node, name) {
        var nodes = [], node, nodeToAppend;
        for (var i = 0; i < container_node.childNodes.length; i++) {
            nodes[i] = container_node.childNodes[i];
        }

        for (i = 0; i < nodes.length; i++) {
            node = nodes[i];
            if (node.nodeName.toLowerCase() == name) {
                nodeToAppend = node.firstChild;
//                container_node.parentNode.appendChild(node.firstChild, container_node);
//                continue;
            } else {
                nodeToAppend = document.createElement(name);
                nodeToAppend.appendChild(node);
            }
            container_node.parentNode.appendChild(nodeToAppend, container_node);
        }
    },

    /**
     * Move all elements in container node before the reference node.
     * If recursive mode is equired then where childnodes exist that are not
     * text nodes. Move their children and remove the existing node.
     *
     * Can't use other dom methods like querySelectorAll because they don't return text elements.
     * @method _removeNodesByName
     * @private
     * @return void.
     */
    _removeNodesByName: function(container_node, name) {
        var node, remove_node = container_node.nodeName.toLowerCase() == name;
        var nodes = new Array();
        var container_nodes = container_node.childNodes;

        // Don't remove the span used by rangy to save and restore the user selection.
        if (container_node.nodeName.toLowerCase() == 'span' &&
                container_node.id.indexOf('selectionBoundary_') > -1) {
            remove_node = false;
        }

        for (i = 0; i < container_nodes.length; i++) {
            nodes.push(container_nodes.item(i));
        }
        for (var i = 0; i < nodes.length; i++) {
            node = nodes[i];
            if (node.childNodes && node.childNodes.length) {
                this._removeNodesByName(node, name);

            }
            if (remove_node) {
                var parentNode = container_node.parentNode;
                parentNode.insertBefore(node, container_node);
            }

        }
        if (remove_node) {
            container_node.remove();
        }
    },
    
    /**
     * Recursively remove any tag with the given name. Removes child nodes too.
     *
     * Can't use other dom methods like querySelectorAll because they don't return text elements.
     * @method _removeSingleNodesByName
     * @private
     * @return void.
     */
    _removeSingleNodesByName: function(container_node, name) {
        if (!container_node.childNodes) {
            return;
        }
        var node;
        var nodes = new Array();
        var container_nodes = container_node.childNodes;

        for (i = 0; i < container_nodes.length; i++) {
            nodes.push(container_nodes.item(i));
        }
        for (var i = 0; i < nodes.length; i++) {
            node = nodes[i];
            if (node.childNodes && node.childNodes.length) {
                this._removeSingleNodesByName(node, name);
            }

            if (node.nodeName.toLowerCase() == name) {
                node.remove();
            }
        }
    },

    /**
     * Find the selectable node from a given adjusted node.
    *
    * @method _getTranslatedSelectionNode
    * @private
    * @return node.
    */
    _getTranslatedSelectionNode: function(node, index) {
        var translatedNode = node.childNodes[index];
        if(node.childNodes[index].nodeName !== '#text') {
            translatedNode = node.childNodes[index].childNodes[0];
        }
        return this._getSelectionNode(translatedNode);
    },

    /**
     * Return a selectable node from the given node.
    *
    * @method _getSelectionNode
    * @private
    * @return node
    */
    _getSelectionNode: function(node) {
        if(node.nodeName == '#text') {
            return node;
        }
        return node.childNodes[0];
    },

    /**
     * Return an array containing the position of every sup and sub start and end tag
    *
    * @method _getAdjustedOffset
    * @private
    * @return array.
    */
   _getAdjustedOffset: function(text, offset, tag_positions) {
       if(!tag_positions || !tag_positions.length){
           return offset;
       }
       var tag_position = null;
       for(var x = 0; x < tag_positions.length; x++) {
           tag_position = tag_positions[x];
           if (tag_position.position > offset) {
               break;
           }
           offset += tag_position.tag.length;
       }
       return offset;
   },

   /**
    * Get the editor object.
    *
    * @method _getEditor
    * @private
    * @return node.
    */
   _getEditor: function(host) {
       if (!host) {
           host = this.get('host');
       }
       
       return this;
   },

   /**
    * Get the node containing the editor html to be updated.
    *
    * @method _getEditorNode
    * @private
    * @return node.
    */
   _getEditorNode: function(host) {
       return this._getEditor(host).editor._node;
   }
};

Y.Base.mix(Y.M.editor_ousupsub.Editor, [EditorClean]);
