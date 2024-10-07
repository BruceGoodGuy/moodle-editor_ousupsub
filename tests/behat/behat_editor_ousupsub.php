<?php
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
 * ousupsub custom steps definitions.
 *
 * @package   editor_ousupsub
 * @category  test
 * @copyright 2015 The Open University
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// NOTE: no MOODLE_INTERNAL test here, this file may be required by behat before including /config.php.
use Behat\Mink\Exception\ExpectationException as ExpectationException;

/**
 * Steps definitions to deal with the ousupsub text editor
 *
 * @copyright 2015 The Open University
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class behat_editor_ousupsub extends behat_base {

    /**
     * Opens an ousupsubtest page.
     *
     * @Given /^I am on the integrated "(sup|sub|both)" editor test page$/
     * @param string $type
     */
    public function i_am_on_integrated_test_page($type) {
        $this->getSession()->visit($this->locate_path(
                '/lib/editor/ousupsub/tests/fixtures/editortestpage.php?type=' . $type));
    }

    /**
     * Opens the stand-alone test page.
     *
     * @Given /^I am on the stand-alone supsub editor test page$/
     */
    public function i_am_on_standalone_test_page() {
        $this->getSession()->visit($this->locate_path('/lib/editor/ousupsub/standalone/index.html'));
    }

    /**
     * Select the text in an ousupsub field.
     *
     * @Given /^I select the text in the "([^"]*)" ousupsub editor$/
     * @throws ElementNotFoundException Thrown by behat_base::find
     * @param string $fieldlocator
     * @return void
     */
    public function select_the_text_in_the_ousupsub_editor($fieldlocator) {
        if (!$this->running_javascript()) {
            throw new coding_exception('Selecting text requires javascript.');
        }
        // We delegate to behat_form_field class, it will
        // guess the type properly.
        $field = behat_field_manager::get_form_field_from_label($fieldlocator, $this);

        if (!method_exists($field, 'select_text')) {
            throw new coding_exception('Field does not support the select_text function.');
        }
        $field->select_text();
    }

    /**
     * Check the text in an ousupsub field.
     *
     * @Given /^I should see "([^"]*)" in the "([^"]*)" ousupsub editor$/
     * @throws ElementNotFoundException Thrown by behat_base::find
     * @param string $text
     * @param string $fieldlocator
     * @return void
     */
    public function should_see_in_the_ousupsub_editor($text, $fieldlocator) {
        if (!$this->running_javascript()) {
            throw new coding_exception('Selecting text requires javascript.');
        }
        // We delegate to behat_form_field class, it will
        // guess the type properly.
        $field = behat_field_manager::get_form_field_from_label($fieldlocator, $this);

        if (!method_exists($field, 'get_value')) {
            throw new coding_exception('Field does not support the get_value function.');
        }

        if (!$field->matches($text)) {
            throw new ExpectationException("The field '" . $fieldlocator .
                    "' does not contain the text '" . $text . "'. It contains '" . $field->get_value() . "'.", $this->getSession());
        }
    }

    /**
     * Set the contents of a stand-alone supsub field.
     *
     * @Given /^I set the "([^"]*)" stand-alone ousupsub editor to "([^"]*)"$/
     * @throws ElementNotFoundException Thrown by behat_base::find
     * @param string $label the field label.
     * @param string $text the text to insert into the field.
     */
    public function i_set_the_standalone_ousupsub_editor_to($label, $text) {
        if (!$this->running_javascript()) {
            throw new coding_exception('Setting text requires javascript.');
        }

        // We delegate to behat_form_field class, which thinks this is an (Atto) editor.
        $field = $this->find_field($label);

        // Unfortunately, Atto uses Y to set the field value, which we don't have with
        // our nicely encapsulated JavaScript, so do it manually.
        $id = $field->getAttribute('id');
        $js = 'editor_ousupsub.getEditor("' . $id . '").editor.setHTML("' . $text . '");';
        $this->getSession()->executeScript($js);
    }

    /**
     * Set the given range in a stand-alone ousupsub field.
     *
     * @Given /^I select the range "([^"]*)" in the "([^"]*)" ousupsub editor$/
     * @throws ElementNotFoundException Thrown by behat_base::find
     * @param string $range
     * @param string $fieldlocator
     */
    public function select_range_in_the_ousupsub_editor($range, $fieldlocator) {
        // NodeElement.keyPress simply doesn't work.
        if (!$this->running_javascript()) {
            throw new coding_exception('Selecting text requires javascript.');
        }
        // We delegate to behat_form_field class, it will
        // guess the type properly.
        $field = behat_field_manager::get_form_field_from_label($fieldlocator, $this);

        if (!method_exists($field, 'get_value')) {
            throw new coding_exception('Field does not support the get_value function.');
        }

        $editorid = $this->find_field($fieldlocator)->getAttribute('id');

        // Get query values for the range.
        list($startquery, $startoffset, $endquery, $endoffset) = explode(",", $range);
        $js = '
    function getNode(editor, query, node) {
       if (query !== "" && !isNaN(query)) {
           node = editor.childNodes[query];
       } else {
           node = query ? editor.querySelector(query) : editor;
           node = node.firstChild;
       }
       if (node.firstChild) {
           return node.firstChild;
       }
       return node;
    }
    function SelectTextBehat() {
        const editorId = "'.$editorid.'", startQuery = '.$startquery.', startOffset = '.$startoffset.',
            endQuery  = '.$endquery.', endOffset = '.$endoffset.';
        const editor = GetEditor(editorId).getEditorContent();
        if (!editor) {
            console.error("Editor element not found!");
            return;
        }

        const range = document.createRange(); // Create a new range object
        const selection = window.getSelection(); // Get the current selection object

        editor.focus(); // Focus the editor

        // Determine start and end nodes for selection
        const startNode = getNode(editor, startQuery, startOffset);
        const endNode = getNode(editor, endQuery, endOffset);

        if (startNode && endNode) {
            // Set the range based on the start and end positions
            selection.removeAllRanges();
            range.setStart(startNode, startOffset);
            range.setEnd(endNode, endOffset);
        } else {
            // Default selection: select all contents of the first child
            range.selectNodeContents(editor.firstChild);
             // Clear existing selections and apply the new range
            selection.removeAllRanges();
        }
        selection.addRange(range);
    }
    SelectTextBehat();';
        $js = $this->get_js_get_editor() . $js;
        $this->getSession()->executeScript($js);
    }

    /**
     * Press key(s) in an ousupsub field.
     *
     * @Given /^I press the key "([^"]*)" in the "([^"]*)" ousupsub editor$/
     * @throws ElementNotFoundException Thrown by behat_base::find
     * @param string $keys
     * @param string $fieldlocator
     */
    public function press_key_in_the_ousupsub_editor($keys, $fieldlocator) {
        // NodeElement.keyPress simply doesn't work.
        if (!$this->running_javascript()) {
            throw new coding_exception('Pressing keys requires javascript.');
        }
        // We delegate to behat_form_field class, it will
        // guess the type properly.
        $field = behat_field_manager::get_form_field_from_label($fieldlocator, $this);

        if (!method_exists($field, 'get_value')) {
            throw new coding_exception('Field does not support the get_value function.');
        }

        $editorid = $this->find_field($fieldlocator)->getAttribute('id');

        // Trigger the key press through javascript.
        $js = '
    function TriggerKeyPressBehat(id, keys) {
        const node = document.getElementById(id + "editable");

        if (!node) {
            console.error("Element not found");
            return;
        }

        node.focus();

        const eventOptions = {
            bubbles: true,
            cancelable: true,
            key: "",       // the key value will be assigned later
            code: "",      // the key code value will be assigned later
            ctrlKey: false,
            shiftKey: false,
            altKey: false,
            metaKey: false
        };

        // Set modifier keys if they are included
        if (keys.includes("ctrlKey")) {
            eventOptions.ctrlKey = true;
        }
        if (keys.includes("shiftKey")) {
            eventOptions.shiftKey = true;
        }
        if (keys.includes("altKey")) {
            eventOptions.altKey = true;
        }
        if (keys.includes("metaKey")) { // Windows or Command key on macOS
            eventOptions.metaKey = true;
        }

        // Remove modifier keys from the array to get the actual key
        const actualKey = keys.filter(key => !["ctrlKey", "shiftKey", "altKey", "metaKey"].includes(key))[0];

        // Set the key and code in event options
        if (actualKey) {
            eventOptions.key = actualKey;
            eventOptions.code = actualKey;
        }

        // Create the keyboard event
        const keyboardEvent = new KeyboardEvent("keydown", eventOptions);

        // Dispatch the event to the target element
        node.dispatchEvent(keyboardEvent);

    // Update the textarea text from the contenteditable div we just changed.
    UpdateTextArea(id);
}
    TriggerKeyPressBehat("'.$editorid.'", ['.$keys.']);';
        $js = $this->get_js_update_textarea() . $js;
        $this->getSession()->executeScript($js);
    }

    /**
     * Enter text in a stand-alone ousupsub field.
     *
     * @Given /^I "([^"]*)" the text "([^"]*)" in the "([^"]*)" ousupsub editor$/
     * @throws ElementNotFoundException Thrown by behat_base::find
     * @param string $action 'enter', 'insert' or 'append' text.
     * @param string $text
     * @param string $fieldlocator
     */
    public function enter_text_in_the_ousupsub_editor($action, $text, $fieldlocator) {
        // NodeElement.keyPress simply doesn't work.
        if (!$this->running_javascript()) {
            throw new coding_exception('Entering text requires javascript.');
        }
        // We delegate to behat_form_field class, it will
        // guess the type properly.
        $field = behat_field_manager::get_form_field_from_label($fieldlocator, $this);

        $editorid = $this->find_field($fieldlocator)->getAttribute('id');

        // Trigger the key press through javascript.
        $js = '
    function EnterTextBehat (action, id, text) {
    // Only works in chrome.
    const target = document.getElementById(id + "editable");
    // Update the textarea text from the contenteditable div we just changed.
    if (action == "enter") {
        target.innerHTML = text;
    } else if (action == "insert") {
        target.firstChild.innerHTML = text;
    } else {
        target.innerHTML = target.innerHTML + text;
    }
    UpdateTextArea(id);
}
    EnterTextBehat("'.$action.'", "'.$editorid.'", "'.$text.'");';
        $js = $this->get_js_update_textarea() . $js;
        $this->getSession()->executeScript($js);

    }

    /**
     * Paste text in a stand-alone ousupsub field.
     *
     * @Given /^I paste the text "([^"]*)" in the "([^"]*)" ousupsub editor$/
     * @throws ElementNotFoundException Thrown by behat_base::find
     * @param string $text
     * @param string $fieldlocator
     */
    public function paste_text_in_the_ousupsub_editor($text, $fieldlocator) {
        // NodeElement.keyPress simply doesn't work.
        if (!$this->running_javascript()) {
            throw new coding_exception('Pasting text requires javascript.');
        }
        // We delegate to behat_form_field class, it will
        // guess the type properly.
        $field = behat_field_manager::get_form_field_from_label($fieldlocator, $this);

        $editorid = $this->find_field($fieldlocator)->getAttribute('id');

        // Trigger the key press through javascript.
        // The clibpoardData object is not created correctly in chrome. Pass our own.
        $js = '
    function ClipboardData() {}
ClipboardData.prototype = {
    data: null,
    types: [],

    getData: function() {
        return this.data;
    },

    setData: function(mimeType, data) {
        this.types.push(mimeType);
        this.data = data;
    }
}

function PasteTextBehat (id, text) {
    // Would use ClipboardEvent but in chrome it instantiates with a null clipboardData object
    // that you cannot override.
    var target = document.getElementById(id + "editable");
    var evt = document.createEvent("TextEvent");
    evt.initEvent ("paste", true, true, window, text, 0, "en-US");
    evt.clipboardData = new ClipboardData();
    evt.clipboardData.setData("text/html", text);
    target.focus();
    target.dispatchEvent(evt);
    // Update the textarea text from the contenteditable div we just changed.
    UpdateTextArea(id);
}
    PasteTextBehat("'.$editorid.'", "'.$text.'");';
        $js = $this->get_js_update_textarea() . $js;
        $this->getSession()->executeScript($js);

    }

    /**
     * Select the first button in a stand-alone ousupsub field.
     *
     * @Given /^I select and click the first button in the "([^"]*)" ousupsub editor$/
     * @param string $fieldlocator
     */
    public function select_and_click_first_button_in_the_ousupsub_editor($fieldlocator) {
        // NodeElement.keyPress simply doesn't work.
        if (!$this->running_javascript()) {
            throw new coding_exception('Pasting text requires javascript.');
        }
        // We delegate to behat_form_field class, it will
        // guess the type properly.
        $field = behat_field_manager::get_form_field_from_label($fieldlocator, $this);

        $editorid = $this->find_field($fieldlocator)->getAttribute('id');

        // Trigger the key press through javascript.
        // The clibpoardData object is not created correctly in chrome. Pass our own.
        $js = '
            function SelectAndClickFirstButtonBehat (id) {
                GetEditor(id).getButtonContainer()[0].focus();
                document.activeElement.click();
            }
            SelectAndClickFirstButtonBehat("'.$editorid.'");';
        $js = $this->get_js_get_editor() . $js;
        $this->getSession()->executeScript($js);

    }

    /**
     * Press the superscript key in an ousupsub field.
     *
     * @Given /^I press the superscript key in the "([^"]*)" ousupsub editor$/
     */
    public function i_press_superscript_key_in_the_ousupsub_edito() {
        $this->execute('behat_editor_ousupsub::press_key_in_the_ousupsub_editor',
                ['94', 'Input']);
    }

    /**
     * Press the subscript key in an ousupsub field.
     *
     * @Given /^I press the subscript key in the "([^"]*)" ousupsub editor$/
     */
    public function i_press_subscript_key_in_the_ousupsub_edito() {
        $this->execute('behat_editor_ousupsub::press_key_in_the_ousupsub_editor',
                ['95', 'Input']);
    }

    /**
     * Press the up arrow key in an ousupsub field.
     *
     * @Given /^I press the up arrow key in the "([^"]*)" ousupsub editor$/
     */
    public function i_press_up_arrow_key_in_the_ousupsub_edito() {
        $this->execute('behat_editor_ousupsub::press_key_in_the_ousupsub_editor',
                ['\'ArrowUp\'', 'Input']);
    }

    /**
     * Press the down arrow key in a stand-alone ousupsub field.
     *
     * @Given /^I press the down arrow key in the "([^"]*)" ousupsub editor$/
     */
    public function i_press_down_arrow_key_in_the_ousupsub_edito() {
        $this->execute('behat_editor_ousupsub::press_key_in_the_ousupsub_editor',
                ['\'ArrowDown\'', 'Input']);
    }

    /**
     * Press the undo key in an ousupsub field.
     *
     * @Given /^I press the undo key in the "([^"]*)" ousupsub editor$/
     */
    public function i_press_undo_key_in_the_ousupsub_edito() {
        $this->execute('behat_editor_ousupsub::press_key_in_the_ousupsub_editor',
                ['\'ctrlKey\', \'z\'', 'Input']);
    }

    /**
     * Press the redo key in an ousupsub field.
     *
     * @Given /^I press the redo key in the "([^"]*)" ousupsub editor$/
     */
    public function i_press_redo_key_in_the_ousupsub_edito() {
        $this->execute('behat_editor_ousupsub::press_key_in_the_ousupsub_editor',
                ['\'ctrlKey\', \'y\'', 'Input']);
    }

    /**
     * Returns a javascript helper method to update the textarea text from the contenteditable div
     * and trigger required key and html events for the editor.
     */
    protected function get_js_update_textarea() {
        $js = $this->get_js_get_editor();
        $js .= '
function UpdateTextArea(id) {
    const editor = GetEditor(id);
    editor.getTextArea().value = editor.getCleanHTML();
}';
        return $js;
    }

    /**
     * Returns a javascript helper method to update the textarea text from the contenteditable div
     * and trigger required key and html events for the editor.
     */
    protected function get_js_get_editor() {
        $js = '
function GetEditor (id) {
    return OUSupSubEditor.getEditorById(id);
}';
        return $js;
    }
}
