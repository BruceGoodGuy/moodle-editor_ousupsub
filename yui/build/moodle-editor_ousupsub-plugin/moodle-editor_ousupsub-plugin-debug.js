YUI.add('moodle-editor_ousupsub-plugin', function (Y, NAME) {

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
 * ousupsub editor plugin.
 *
 * @module moodle-editor_ousupsub-plugin
 * @submodule plugin-base
 * @package    editor_ousupsub
 * @copyright  2014 Andrew Nicols
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * A Plugin for the ousupsub Editor used in Moodle.
 *
 * This class should not be directly instantiated, and all Editor plugins
 * should extend this class.
 *
 * @namespace M.editor_ousupsub
 * @class EditorPlugin
 * @main
 * @constructor
 * @uses M.editor_ousupsub.EditorPluginButtons
 */

function EditorPlugin() {
    EditorPlugin.superclass.constructor.apply(this, arguments);
}

var GROUPSELECTOR = '.ousupsub_group.',
    GROUP = '_group';

Y.extend(EditorPlugin, Y.Base, {
    /**
     * The name of the current plugin.
     *
     * @property name
     * @type string
     */
    name: null,

    /**
     * A Node reference to the editor.
     *
     * @property editor
     * @type Node
     */
    editor: null,

    /**
     * A Node reference to the editor toolbar.
     *
     * @property toolbar
     * @type Node
     */
    toolbar: null,

    /**
     * Event Handles to clear on plugin destruction.
     *
     * @property _eventHandles
     * @private
     */
    _eventHandles: null,

    initializer: function(config) {
        // Set the references to configuration parameters.
        this.name = config.name;
        this.toolbar = config.toolbar;
        this.editor = config.editor;

        // Set up the prototypal properties.
        // These must be set up here becuase prototypal arrays and objects are copied across instances.
        this.buttons = {};
        this.buttonNames = [];
        this.buttonStates = {};
        this.menus = {};
        this._primaryKeyboardShortcut = [];
        this._buttonHandlers = [];
        this._menuHideHandlers = [];
        this._highlightQueue = {};
        this._eventHandles = [];
    },

    destructor: function() {
        // Detach all EventHandles.
        new Y.EventHandle(this._eventHandles).detach();
    },

    /**
     * Mark the content ediable content as having been changed.
     *
     * This is a convenience function and passes through to {{#crossLink "M.editor_ousupsub.EditorTextArea/updateOriginal"}}updateOriginal{{/crossLink}}.
     *
     * @method markUpdated
     */
    markUpdated: function() {
        // Save selection after changes to the DOM. If you don't do this here,
        // subsequent calls to restoreSelection() will fail expecting the
        // previous DOM state.
        this.get('host').saveSelection();

        return this.get('host').updateOriginal();
    },

    /**
     * Register an event handle for disposal in the destructor.
     *
     * @method registerEventHandle
     * @param {EventHandle} The Event Handle as returned by Y.on, and Y.delegate.
     */
    registerEventHandle: function(handle) {
        this._eventHandles.push(handle);
    }
}, {
    NAME: 'editorPlugin',
    ATTRS: {
        /**
         * The editor instance that this plugin was instantiated by.
         *
         * @attribute host
         * @type M.editor_ousupsub.Editor
         * @writeOnce
         */
        host: {
            writeOnce: true
        },

        /**
         * The toolbar group that this button belongs to.
         *
         * When setting, the name of the group should be specified.
         *
         * When retrieving, the Node for the toolbar group is returned. If
         * the group doesn't exist yet, then it is created first.
         *
         * @attribute group
         * @type Node
         * @writeOnce
         */
        group: {
            writeOnce: true,
            getter: function(groupName) {
                var group = this.toolbar.one(GROUPSELECTOR + groupName + GROUP);
                if (!group) {
                    group = Y.Node.create('<div class="ousupsub_group ' +
                            groupName + GROUP + '"></div>');
                    this.toolbar.append(group);
                }

                return group;
            }
        }
    }
});

Y.namespace('M.editor_ousupsub').EditorPlugin = EditorPlugin;
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
 * @module moodle-editor_ousupsub-plugin
 * @submodule buttons
 */

/**
 * Button functions for an ousupsub Plugin.
 *
 * See {{#crossLink "M.editor_ousupsub.EditorPlugin"}}{{/crossLink}} for details.
 *
 * @namespace M.editor_ousupsub
 * @class EditorPluginButtons
 */

var MENUTEMPLATE = '' +
        '<button class="{{buttonClass}} ousupsub_hasmenu" ' +
            'tabindex="-1" ' +
            'type="button" ' +
            'title="{{title}}">' +
            '<img class="icon" aria-hidden="true" role="presentation" width="16" height="16" ' +
                'style="background-color:{{config.menuColor}};" src="{{config.iconurl}}" />' +
            '<img class="icon" aria-hidden="true" role="presentation" width="16" height="16" src="{{image_url "t/expanded" "moodle"}}"/>' +
        '</button>';

var DISABLED = 'disabled',
    HIGHLIGHT = 'highlight',
    LOGNAME = 'moodle-editor_ousupsub-editor-plugin',
    CSS = {
        EDITORWRAPPER: '.editor_ousupsub_content'
    };

function EditorPluginButtons() {}

EditorPluginButtons.ATTRS = {
};

EditorPluginButtons.prototype = {
    /**
     * All of the buttons that belong to this plugin instance.
     *
     * Buttons are stored by button name.
     *
     * @property buttons
     * @type object
     */
    buttons: null,

    /**
     * A list of each of the button names.
     *
     * @property buttonNames
     * @type array
     */
    buttonNames: null,

    /**
     * A read-only view of the current state for each button. Mappings are stored by name.
     *
     * Possible states are:
     * <ul>
     * <li>{{#crossLink "M.editor_ousupsub.EditorPluginButtons/ENABLED:property"}}{{/crossLink}}; and</li>
     * <li>{{#crossLink "M.editor_ousupsub.EditorPluginButtons/DISABLED:property"}}{{/crossLink}}.</li>
     * </ul>
     *
     * @property buttonStates
     * @type object
     */
    buttonStates: null,

    /**
     * The menus belonging to this plugin instance.
     *
     * @property menus
     * @type object
     */
    menus: null,

    /**
     * The state for a disabled button.
     *
     * @property DISABLED
     * @type Number
     * @static
     * @value 0
     */
    DISABLED: 0,

    /**
     * The state for an enabled button.
     *
     * @property ENABLED
     * @type Number
     * @static
     * @value 1
     */
    ENABLED: 1,

    /**
     * The list of Event Handlers for buttons.
     *
     * @property _buttonHandlers
     * @protected
     * @type array
     */
    _buttonHandlers: null,

    /**
     * Hide handlers which are cancelled when the menu is hidden.
     *
     * @property _menuHideHandlers
     * @protected
     * @type array
     */
    _menuHideHandlers: null,

    /**
     * A textual description of the primary keyboard shortcut for this
     * plugin.
     *
     * This will be null if no keyboard shortcut has been registered.
     *
     * @property _primaryKeyboardShortcut
     * @protected
     * @type String
     * @default null
     */
    _primaryKeyboardShortcut: null,

    /**
     * An list of objects returned by Y.soon().
     *
     * The keys will be the buttonName of the button, and the value the Y.soon() object.
     *
     * @property _highlightQueue
     * @protected
     * @type Object
     * @default null
     */
    _highlightQueue: null,

    /**
     * Add a button for this plugin to the toolbar.
     *
     * @method addButton
     * @param {object} config The configuration for this button
     * @param {string} [config.iconurl] The URL for the icon. If not specified, then the icon and component will be used instead.
     * @param {string} [config.icon] The icon identifier.
     * @param {string} [config.iconComponent='core'] The icon component.
     * @param {string} [config.keys] The shortcut key that can call this plugin from the keyboard.
     * @param {string} [config.keyDescription] An optional description for the keyboard shortcuts.
     * If not specified, this is automatically generated based on config.keys.
     * If multiple key bindings are supplied to config.keys, then only the first is used.
     * If set to false, then no description is added to the title.
     * @param {string} [config.tags] The tags that trigger this button to be highlighted.
     * @param {boolean} [config.tagMatchRequiresAll=true] Working in combination with the tags parameter, when true
     * every tag of the selection has to match. When false, only one match is needed. Only set this to false when
     * necessary as it is much less efficient.
     * See {{#crossLink "M.editor_ousupsub.EditorSelection/selectionFilterMatches:method"}}{{/crossLink}} for more information.
     * @param {string} [config.title=this.name] The string identifier in the plugin's language file.
     * @param {string} [config.buttonName=this.name] The name of the button. This is used in the buttons object, and if
     * specified, in the class for the button.
     * @param {function} config.callback A callback function to call when the button is clicked.
     * @param {object} [config.callbackArgs] Any arguments to pass to the callback.
     * @return {Node} The Node representing the newly created button.
     */
    addButton: function(config) {
        Y.log('addButton', 'debug', 'addButton');
        var group = this.get('group'),
            pluginname = this.name,
            buttonClass = 'ousupsub_' + pluginname + '_button',
            button,
            host = this.get('host');

        if (config.exec) {
            buttonClass = buttonClass + '_' + config.exec;
        }

        if (!config.buttonName) {
            // Set a default button name - this is used as an identifier in the button object.
            config.buttonName = config.exec || pluginname;
        } else {
            buttonClass = buttonClass + '_' + config.buttonName;
        }
        config.buttonClass = buttonClass;

        // Normalize icon configuration.
        config = this._normalizeIcon(config);

        if (!config.title) {
            config.title = 'pluginname';
        }
        var title = M.util.get_string(config.title, 'ousupsub_' + pluginname);

        // Create the actual button.
        button = Y.Node.create('<button type="button" class="' + buttonClass + '"' +
                'tabindex="-1">' +
                    '<img class="icon" aria-hidden="true" role="presentation" width="16" height="16" src="' +
                            config.iconurl + '"/>' +
                '</button>');
        button.setAttribute('title', title);

        // Append it to the group.
        group.append(button);

        var currentfocus = this.toolbar.getAttribute('aria-activedescendant');
        if (!currentfocus) {
            // Initially set the first button in the toolbar to be the default on keyboard focus.
            button.setAttribute('tabindex', '0');
            this.toolbar.setAttribute('aria-activedescendant', button.generateID());
            this.get('host')._tabFocus = button;
        }
        // Normalize the callback parameters.
        config = this._normalizeCallback(config);

        // Add the standard click handler to the button.
        this._buttonHandlers.push(
            this.toolbar.delegate('click', config.callback, '.' + buttonClass, this)
        );

        // Handle button click via shortcut key.
        if (config.keys) {
            if (typeof config.keyDescription !== 'undefined') {
                // A keyboard shortcut description was specified - use it.
                this._primaryKeyboardShortcut[buttonClass] = config.keyDescription;
            }
            //this._addKeyboardListener(config.callback, config.keys, buttonClass);

            if (this._primaryKeyboardShortcut[buttonClass]) {
                // If we have a valid keyboard shortcut description, then set it with the title.
                button.setAttribute('title', M.util.get_string('plugin_title_shortcut', 'editor_ousupsub', {
                        title: title,
                        shortcut: this._primaryKeyboardShortcut[buttonClass]
                    }));
            }
        }

        // Handle highlighting of the button.
        if (config.tags) {
            var tagMatchRequiresAll = true;
            if (typeof config.tagMatchRequiresAll === 'boolean') {
                tagMatchRequiresAll = config.tagMatchRequiresAll;
            }
            this._buttonHandlers.push(
                host.on(['ousupsub:selectionchanged', 'change'], function(e) {
                    if (typeof this._highlightQueue[config.buttonName] !== 'undefined') {
                        this._highlightQueue[config.buttonName].cancel();
                    }
                    // Async the highlighting.
                    this._highlightQueue[config.buttonName] = Y.soon(Y.bind(function(e) {
                        if (host.selectionFilterMatches(config.tags, e.selectedNodes, tagMatchRequiresAll)) {
                            this.highlightButtons(config.buttonName);
                        } else {
                            this.unHighlightButtons(config.buttonName);
                        }
                    }, this, e));
                }, this)
            );
        }

        // Prevent carriage return to produce a new line.
        this._preventEnter();

        // Trigger keys like up/down-arrow.
        this._handle_key_press();

        // Add the button reference to the buttons array for later reference.
        this.buttonNames.push(config.buttonName);
        this.buttons[config.buttonName] = button;
        this.buttonStates[config.buttonName] = this.ENABLED;
        return button;
    },

   /**
    * Prevent carriage return to produce a new line.
    */
    _preventEnter: function() {
        var keyEvent = 'keypress';
        if (Y.UA.webkit || Y.UA.ie) {
            keyEvent = 'keydown';
        }
        this.editor.on(keyEvent, function(e) {
            //Cross browser event object.
            var evt = window.event || e;
            if (evt.keyCode === 13) { // Enter.
                // do nothing.
                evt.preventDefault();
            }
        }, this);
    },

    /**
     * 
     */
    _handle_key_press: function() {
        var keyEvent = 'keypress';
        if (Y.UA.webkit || Y.UA.ie) {
            keyEvent = 'keydown';
        }
        this.editor.on(keyEvent, function(e) {
            //Cross browser event object.
            var evt = window.event || e;
            //Y.log(evt.keyCode, 'debug', 'You have pressed');

            // Call superscript.
            if ((evt.keyCode === 38) || (evt.keyCode === 94)) {
                //document.execCommand('superscript', false, null);
                //Y.log(evt.keyCode + '(up-arrow or ^), so trigger superscript', 'debug', 'You have pressed');
                this._applyTextCommand(1);
             // Call subscript.
             } else if ((evt.keyCode === 40) || (evt.keyCode === 95)) {
                 //document.execCommand('subscript', false, null);
                 //Y.log(evt.keyCode + '(down-arrow or _), so trigger subscript', 'debug', 'You have pressed');
                 this._applyTextCommand(-1);
             }
             //this._buttonHandlers.push(this.editor.delegate('key', 'down', evt.keyCode, CSS.EDITORWRAPPER, this));
        }, this);
    },


    /**
     * Add a basic button which ties into the execCommand.
     *
     * See {{#crossLink "M.editor_ousupsub.EditorPluginButtons/addButton:method"}}addButton{{/crossLink}} for full details of the optional parameters.
     *
     * @method addBasicButton
     * @param {object} config The button configuration
     * @param {string} config.exec The execCommand to call on the document.
     * @param {string} [config.iconurl] The URL for the icon. If not specified, then the icon and component will be used instead.
     * @param {string} [config.icon] The icon identifier.
     * @param {string} [config.iconComponent='core'] The icon component.
     * @param {string} [config.keys] The shortcut key that can call this plugin from the keyboard.
     * @param {string} [config.tags] The tags that trigger this button to be highlighted.
     * @param {boolean} [config.tagMatchRequiresAll=false] Working in combination with the tags parameter, highlight
     * this button when any match is good enough.
     *
     * See {{#crossLink "M.editor_ousupsub.EditorSelection/selectionFilterMatches:method"}}{{/crossLink}} for more information.
     * @param {string} [config.title=this.name] The string identifier in the plugin's language file.
     * @param {string} [config.buttonName=this.name] The name of the button. This is used in the buttons object, and if
     * specified, in the class for the button.
     * @return {Node} The Node representing the newly created button.
     */
    addBasicButton: function(config) {
        if (!config.exec) {
            Y.log('No exec command specified. Cannot proceed.',
                    'warn', 'moodle-editor_ousupsub-plugin');
            return null;
        }

        // The default icon - true for most core plugins.
        if (!config.icon) {
            config.icon = 'e/' + config.exec;
        }

        // The default callback.
        config.callback = function() {
            document.execCommand(config.exec, false, null);

            // And mark the text area as updated.
            this.markUpdated();
        };

        // Return the newly created button.
        return this.addButton(config);
    },

    /**
     * Add a menu for this plugin to the editor toolbar.
     *
     * @method addToolbarMenu
     * @param {object} config The configuration for this button
     * @param {string} [config.iconurl] The URL for the icon. If not specified, then the icon and component will be used instead.
     * @param {string} [config.icon] The icon identifier.
     * @param {string} [config.iconComponent='core'] The icon component.
     * @param {string} [config.title=this.name] The string identifier in the plugin's language file.
     * @param {string} [config.buttonName=this.name] The name of the button. This is used in the buttons object, and if
     * specified, in the class for the button.
     * @param {function} config.callback A callback function to call when the button is clicked.
     * @param {object} [config.callbackArgs] Any arguments to pass to the callback.
     * @param {array} config.entries List of menu entries with the string (entry.text) and the handlers (entry.handler).
     * @param {number} [config.overlayWidth=14] The width of the menu. This will be suffixed with the 'em' unit.
     * @param {string} [config.menuColor] menu icon background color
     * @return {Node} The Node representing the newly created button.
     */
    addToolbarMenu: function(config) {
        var group = this.get('group'),
            pluginname = this.name,
            buttonClass = 'ousupsub_' + pluginname + '_button',
            button,
            currentFocus;

        if (!config.buttonName) {
            // Set a default button name - this is used as an identifier in the button object.
            config.buttonName = pluginname;
        } else {
            buttonClass = buttonClass + '_' + config.buttonName;
        }
        config.buttonClass = buttonClass;

        // Normalize icon configuration.
        config = this._normalizeIcon(config);

        if (!config.title) {
            config.title = 'pluginname';
        }
        var title = M.util.get_string(config.title, 'ousupsub_' + pluginname);

        if (!config.menuColor) {
            config.menuColor = 'transparent';
        }

        // Create the actual button.
        var template = Y.Handlebars.compile(MENUTEMPLATE);
        button = Y.Node.create(template({
            buttonClass: buttonClass,
            config: config,
            title: title
        }));

        // Append it to the group.
        group.append(button);

        currentFocus = this.toolbar.getAttribute('aria-activedescendant');
        if (!currentFocus) {
            // Initially set the first button in the toolbar to be the default on keyboard focus.
            button.setAttribute('tabindex', '0');
            this.toolbar.setAttribute('aria-activedescendant', button.generateID());
        }

        // Add the standard click handler to the menu.
        this._buttonHandlers.push(
            this.toolbar.delegate('click', this._showToolbarMenu, '.' + buttonClass, this, config),
            this.toolbar.delegate('key', this._showToolbarMenuAndFocus, '40, 32, enter', '.' + buttonClass, this, config)
        );

        // Add the button reference to the buttons array for later reference.
        this.buttonNames.push(config.buttonName);
        this.buttons[config.buttonName] = button;
        this.buttonStates[config.buttonName] = this.ENABLED;

        return button;
    },

    /**
     * Display a toolbar menu.
     *
     * @method _showToolbarMenu
     * @param {EventFacade} e
     * @param {object} config The configuration for the whole toolbar.
     * @param {Number} [config.overlayWidth=14] The width of the menu
     * @private
     */
    _showToolbarMenu: function(e, config) {
        // Prevent default primarily to prevent arrow press changes.
        e.preventDefault();

        if (!this.isEnabled()) {
            // Exit early if the plugin is disabled.
            return;
        }

        if (e.currentTarget.ancestor('button', true).hasAttribute(DISABLED)) {
            // Exit early if the clicked button was disabled.
            return;
        }

        var menuDialogue;

        if (!this.menus[config.buttonClass]) {
            if (!config.overlayWidth) {
                config.overlayWidth = '14';
            }

            if (!config.innerOverlayWidth) {
                config.innerOverlayWidth = parseInt(config.overlayWidth, 10) - 2 + 'em';
            }
            config.overlayWidth = parseInt(config.overlayWidth, 10) + 'em';

            this.menus[config.buttonClass] = new Y.M.editor_ousupsub.Menu(config);

            this.menus[config.buttonClass].get('contentBox').delegate('click',
                    this._chooseMenuItem, '.ousupsub_menuentry a', this, config);
        }

        // Clear the focusAfterHide for any other menus which may be open.
        Y.Array.each(this.get('host').openMenus, function(menu) {
            menu.set('focusAfterHide', null);
        });

        // Ensure that we focus on this button next time.
        var creatorButton = this.buttons[config.buttonName];
        creatorButton.focus();
        this.get('host')._setTabFocus(creatorButton);

        // Get a reference to the menu dialogue.
        menuDialogue = this.menus[config.buttonClass];

        // Focus on the button by default after hiding this menu.
        menuDialogue.set('focusAfterHide', creatorButton);

        // Display the menu.
        menuDialogue.show();

        // Position it next to the button which opened it.
        menuDialogue.align(this.buttons[config.buttonName], [Y.WidgetPositionAlign.TL, Y.WidgetPositionAlign.BL]);

        this.get('host').openMenus = [menuDialogue];
    },

    /**
     * Display a toolbar menu and focus upon the first item.
     *
     * @method _showToolbarMenuAndFocus
     * @param {EventFacade} e
     * @param {object} config The configuration for the whole toolbar.
     * @param {Number} [config.overlayWidth=14] The width of the menu
     * @private
     */
    _showToolbarMenuAndFocus: function(e, config) {
        this._showToolbarMenu(e, config);

        // Focus on the first element in the menu.
        this.menus[config.buttonClass].get('boundingBox').one('a').focus();
    },

    /**
     * Select a menu item and call the appropriate callbacks.
     *
     * @method _chooseMenuItem
     * @param {EventFacade} e
     * @param {object} config
     * @param {M.core.dialogue} menuDialogue The Dialogue to hide.
     * @private
     */
    _chooseMenuItem: function(e, config, menuDialogue) {
        // Get the index from the clicked anchor.
        var index = e.target.ancestor('a', true).getData('index'),

            // And the normalized callback configuration.
            buttonConfig = this._normalizeCallback(config.items[index], config.globalItemConfig);

            menuDialogue = this.menus[config.buttonClass];

        // Prevent the dialogue to be closed because of some browser weirdness.
        menuDialogue.set('preventHideMenu', true);

        // Call the callback for this button.
        buttonConfig.callback(e, buttonConfig._callback, buttonConfig.callbackArgs);

        // Cancel the hide menu prevention.
        menuDialogue.set('preventHideMenu', false);

        // Set the focus after hide so that focus is returned to the editor and changes are made correctly.
        menuDialogue.set('focusAfterHide', this.get('host').editor);
        menuDialogue.hide(e);
    },

    /**
     * Normalize and sanitize the configuration variables relating to callbacks.
     *
     * @method _normalizeCallback
     * @param {object} config
     * @param {function} config.callback A callback function to call when the button is clicked.
     * @param {object} [config.callbackArgs] Any arguments to pass to the callback.
     * @param {object} [inheritFrom] A parent configuration that this configuration may inherit from.
     * @return {object} The normalized configuration
     * @private
     */
    _normalizeCallback: function(config, inheritFrom) {
        if (config._callbackNormalized) {
            // Return early if the callback has already been normalized.
            return config;
        }

        if (!inheritFrom) {
            // Create an empty inheritFrom to make life easier below.
            inheritFrom = {};
        }

        // We wrap the callback in function to prevent the default action, check whether the editor is
        // active and focus it, and then mark the field as updated.
        config._callback = config.callback || inheritFrom.callback;
        config.callback = Y.rbind(this._callbackWrapper, this, config._callback, config.callbackArgs);

        config._callbackNormalized = true;

        return config;
    },

    /**
     * Normalize and sanitize the configuration variables relating to icons.
     *
     * @method _normalizeIcon
     * @param {object} config
     * @param {string} [config.iconurl] The URL for the icon. If not specified, then the icon and component will be used instead.
     * @param {string} [config.icon] The icon identifier.
     * @param {string} [config.iconComponent='core'] The icon component.
     * @return {object} The normalized configuration
     * @private
     */
    _normalizeIcon: function(config) {
        if (!config.iconurl) {
            // The default icon component.
            if (!config.iconComponent) {
                config.iconComponent = 'core';
            }
            config.iconurl = M.util.image_url(config.icon, config.iconComponent);
        }

        return config;
    },

    /**
     * A wrapper in which to run the callbacks.
     *
     * This handles common functionality such as:
     * <ul>
     *  <li>preventing the default action; and</li>
     *  <li>focusing the editor if relevant.</li>
     * </ul>
     *
     * @method _callbackWrapper
     * @param {EventFacade} e
     * @param {Function} callback The function to call which makes the relevant changes.
     * @param {Array} [callbackArgs] The arguments passed to this callback.
     * @return {Mixed} The value returned by the callback.
     * @private
     */
    _callbackWrapper: function(e, callback, callbackArgs) {
        e.preventDefault();

        if (!this.isEnabled()) {
            // Exit early if the plugin is disabled.
            return;
        }

        var creatorButton = e.currentTarget.ancestor('button', true);

        if (creatorButton && creatorButton.hasAttribute(DISABLED)) {
            // Exit early if the clicked button was disabled.
            return;
        }

        if (!(YUI.Env.UA.android || this.get('host').isActive())) {
            // We must not focus for Android here, even if the editor is not active because the keyboard auto-completion
            // changes the cursor position.
            // If we save that change, then when we restore the change later we get put in the wrong place.
            // Android is fine to save the selection without the editor being in focus.
            this.get('host').focus();
        }

        // Save the selection.
        this.get('host').saveSelection();

        // Ensure that we focus on this button next time.
        if (creatorButton) {
            this.get('host')._setTabFocus(creatorButton);
        }

        // Build the arguments list, but remove the callback we're calling.
        var args = [e, callbackArgs];

        // Restore selection before making changes.
        this.get('host').restoreSelection();

        // Actually call the callback now.
        return callback.apply(this, args);
    },

    /**
     * Add a keyboard listener to call the callback.
     *
     * The keyConfig will take either an array of keyConfigurations, in
     * which case _addKeyboardListener is called multiple times; an object
     * containing an optional eventtype, optional container, and a set of
     * keyCodes, or just a string containing the keyCodes. When keyConfig is
     * not an object, it is wrapped around a function that ensures that
     * only the expected key modifiers were used. For instance, it checks
     * that space+ctrl is not triggered when the user presses ctrl+shift+space.
     * When using an object, the developer should check that manually.
     *
     * @method _addKeyboardListener
     * @param {function} callback
     * @param {array|object|string} keyConfig
     * @param {string} [keyConfig.eventtype=key] The type of event
     * @param {string} [keyConfig.container=.editor_ousupsub_content] The containing element.
     * @param {string} keyConfig.keyCodes The keycodes to user for the event.
     * @private
     *
     */
    _addKeyboardListener: function(callback, keyConfig, buttonName) {
        var eventtype = 'key',
            container = CSS.EDITORWRAPPER,
            keys,
            handler,
            modifier;

        if (Y.Lang.isArray(keyConfig)) {
            // If an Array was specified, call the add function for each element.
            Y.Array.each(keyConfig, function(config) {
                this._addKeyboardListener(callback, config, buttonName);
            }, this);

            return this;

        } else if (typeof keyConfig === "object") {
            if (keyConfig.eventtype) {
                eventtype = keyConfig.eventtype;
            }

            if (keyConfig.container) {
                container = keyConfig.container;
            }

            // Must be specified.
            keys = keyConfig.keyCodes;
            handler = callback;

        } else {
            modifier = '';//this._getDefaultMetaKey();
            //keys = this._getKeyEvent() + keyConfig + '+' + modifier;
            keys = keyConfig;
            Y.log(keys, 'debug', 'keys 333');
            if (typeof this._primaryKeyboardShortcut[buttonName] === 'undefined') {
                this._primaryKeyboardShortcut[buttonName] = this._getDefaultMetaKeyDescription(keyConfig);
            }
            // Wrap the callback into a handler to check if it uses the specified modifiers, not more.
            handler = Y.bind(function(modifiers, e) {
                if (buttonName === 'ousupsub_superscript_button_superscript') {
                    if ((keys === '40') || (keys === '95')) {
                        return;
                    }
                    callback.apply(this, [e]);
                } else if (buttonName === 'ousupsub_subscript_button_subscript') {
                    Y.log(buttonName, 'debug', 'sub');
                    if ((keys === '38') || (keys === '94')) {
                        return;
                    }
                    callback.apply(this, [e]);
                }
            }, this, [modifier]);
        }

        this._buttonHandlers.push(
            this.editor.delegate(
                eventtype,
                handler,
                keys,
                container,
                this
            )
        );

        Y.log('ousupsub shortcut registered: ' + keys + ' now triggers for ' + buttonName,
                'debug', LOGNAME);
    },

    /**
     * Checks if a key event was strictly defined for the modifiers passed.
     *
     * @method _eventUsesExactKeyModifiers
     * @param  {Array} modifiers List of key modifiers to check for (alt, ctrl, meta or shift).
     * @param  {EventFacade} e The event facade.
     * @return {Boolean} True if the event was stricly using the modifiers specified.
     */
    _eventUsesExactKeyModifiers: function(modifiers, e) {
        var exactMatch = true,
            hasKey;

        if (e.type !== 'key') {
            return false;
        }

        hasKey = Y.Array.indexOf(modifiers, 'alt') > -1;
        exactMatch = exactMatch && ((e.altKey && hasKey) || (!e.altKey && !hasKey));
        hasKey = Y.Array.indexOf(modifiers, 'ctrl') > -1;
        exactMatch = exactMatch && ((e.ctrlKey && hasKey) || (!e.ctrlKey && !hasKey));
        hasKey = Y.Array.indexOf(modifiers, 'meta') > -1;
        exactMatch = exactMatch && ((e.metaKey && hasKey) || (!e.metaKey && !hasKey));
        hasKey = Y.Array.indexOf(modifiers, 'shift') > -1;
        exactMatch = exactMatch && ((e.shiftKey && hasKey) || (!e.shiftKey && !hasKey));

        return exactMatch;
    },

    /**
     * Determine if this plugin is enabled, based upon the state of it's buttons.
     *
     * @method isEnabled
     * @return {boolean}
     */
    isEnabled: function() {
        // The first instance of an undisabled button will make this return true.
        var found = Y.Object.some(this.buttonStates, function(button) {
            return (button === this.ENABLED);
        }, this);

        return found;
    },

    /**
     * Enable one button, or all buttons relating to this Plugin.
     *
     * If no button is specified, all buttons are disabled.
     *
     * @method disableButtons
     * @param {String} [button] The name of a specific plugin to enable.
     * @chainable
     */
    disableButtons: function(button) {
        return this._setButtonState(false, button);
    },

    /**
     * Enable one button, or all buttons relating to this Plugin.
     *
     * If no button is specified, all buttons are enabled.
     *
     * @method enableButtons
     * @param {String} [button] The name of a specific plugin to enable.
     * @chainable
     */
    enableButtons: function(button) {
        return this._setButtonState(true, button);
    },

    /**
     * Set the button state for one button, or all buttons associated with this plugin.
     *
     * @method _setButtonState
     * @param {Boolean} enable Whether to enable this button.
     * @param {String} [button] The name of a specific plugin to set state for.
     * @chainable
     * @private
     */
    _setButtonState: function(enable, button) {
        var attributeChange = 'setAttribute';
        if (enable) {
            attributeChange = 'removeAttribute';
        }
        if (button) {
            if (this.buttons[button]) {
                this.buttons[button][attributeChange](DISABLED, DISABLED);
                this.buttonStates[button] = enable ? this.ENABLED : this.DISABLED;
            }
        } else {
            Y.Array.each(this.buttonNames, function(button) {
                this.buttons[button][attributeChange](DISABLED, DISABLED);
                this.buttonStates[button] = enable ? this.ENABLED : this.DISABLED;
            }, this);
        }

        this.get('host').checkTabFocus();
        return this;
    },

    /**
     * Highlight a button, or buttons in the toolbar.
     *
     * If no button is specified, all buttons are highlighted.
     *
     * @method highlightButtons
     * @param {string} [button] If a plugin has multiple buttons, the specific button to highlight.
     * @chainable
     */
    highlightButtons: function(button) {
        return this._changeButtonHighlight(true, button);
    },

    /**
     * Un-highlight a button, or buttons in the toolbar.
     *
     * If no button is specified, all buttons are un-highlighted.
     *
     * @method unHighlightButtons
     * @param {string} [button] If a plugin has multiple buttons, the specific button to highlight.
     * @chainable
     */
    unHighlightButtons: function(button) {
        return this._changeButtonHighlight(false, button);
    },

    /**
     * Highlight a button, or buttons in the toolbar.
     *
     * @method _changeButtonHighlight
     * @param {boolean} highlight true
     * @param {string} [button] If a plugin has multiple buttons, the specific button to highlight.
     * @protected
     * @chainable
     */
    _changeButtonHighlight: function(highlight, button) {
        var method = 'addClass';

        if (!highlight) {
            method = 'removeClass';
        }
        if (button) {
            if (this.buttons[button]) {
                this.buttons[button][method](HIGHLIGHT);
            }
        } else {
            Y.Object.each(this.buttons, function(button) {
                button[method](HIGHLIGHT);
            }, this);
        }

        return this;
    },

    /**
     * Get the default meta key to use with keyboard events.
     *
     * On a Mac, this will be the 'meta' key for Command; otherwise it will
     * be the Control key.
     *
     * @method _getDefaultMetaKey
     * @return {string}
     * @private
     */
    _getDefaultMetaKey: function() {
        if (Y.UA.os === 'macintosh') {
            return 'meta';
        } else {
            return 'ctrl';
        }
    },

    /**
     * Get the user-visible description of the meta key to use with keyboard events.
     *
     * On a Mac, this will be 'Command' ; otherwise it will be 'Control'.
     *
     * @method _getDefaultMetaKeyDescription
     * @return {string}
     * @private
     */
    _getDefaultMetaKeyDescription: function(keyCode) {
        Y.log('_getDefaultMetaKeyDescription', 'debug', '_getDefaultMetaKeyDescription');
        if (Y.UA.os === 'macintosh') {
            return M.util.get_string('editor_command_keycode', 'editor_ousupsub', String.fromCharCode(keyCode).toLowerCase());
        } else {
            return M.util.get_string('editor_control_keycode', 'editor_ousupsub', String.fromCharCode(keyCode).toLowerCase());
        }
    },

    /**
     * Get the standard key event to use for keyboard events.
     *
     * @method _getKeyEvent
     * @return {string}
     * @private
     */
    _getKeyEvent: function() {
        return 'down:';
    },

    /**
     * Add sup/sup related methods.
     */

    /**
     * Apply the given document.execCommand and tidy up the editor dom afterwards.
     *
     * @method _applyTextCommand
     * @private
     * @return void
     */
    _applyTextCommand: function(type) {
        Y.log(type, 'debug', '111 _applyTextCommand')
        Y.log(this._config.exec, 'debug', '2222 _applyTextCommand');

        // TODO: Trigger supperscript when type is 1, trigger subscript when type is -1.

        document.execCommand(this._config.exec, false, null);
        this._normaliseTextareaAndGetSelectedNodes();

     // And mark the text area as updated.
        this.markUpdated();
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
     * @method _normaliseTextareaAndGetSelectedNodes
     * @private
     * @return string.
     */
    _normaliseTextareaAndGetSelectedNodes: function() {

        // Save the current selection (cursor position).
        var selection = window.rangy.saveSelection();
        // Remove all the span tags added to the editor textarea by the browser.
        // Get the html directly inside the editor <p> tag and remove span tags from the html inside it.
        
        var editor = this._getEditor();
        editor.cleanEditorHTML();
        var editor_node = this._getEditorNode();
        this._removeSingleNodesByName(editor_node, 'br');
        
        // Remove specific tags.
        var tagsToRemove = new Array('p', 'b', 'i', 'span', 'u', 'ul', 'ol', 'li');
        for (var i=0; i<tagsToRemove.length; i++) {
            this._removeNodesByName(editor_node, tagsToRemove[i]);
        }
        this._normaliseTagInTextarea('sup');
        this._normaliseTagInTextarea('sub');

        // Restore the selection (cursor position).
        window.rangy.restoreSelection(selection);
        var host = this.get('host');
        selection = host.getSelection()[0];

        // Get the editor html from the <p>.
        var editor_node = this._getEditorNode(host);

        // Normalise the editor html.
        editor_node.normalize();
//        this.set('host', host);

        return;

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
        
        return host;
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
            if (parentNode.firstChild == node && parentNode.nodeName.toLowerCase() == name) {
                removeParent = true;
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
   }
};


Y.Base.mix(Y.M.editor_ousupsub.EditorPlugin, [EditorPluginButtons]);


}, '@VERSION@', {"requires": ["node", "base", "escape", "event", "event-outside", "handlebars", "event-custom", "timers"]});
