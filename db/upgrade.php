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
 * OU sup-sub editor upgrade script.
 *
 * @package    editor_ousupsub
 * @copyright  2018 The Open University
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Run all OU sup-sub editor upgrade steps between the current DB version and
 * the current version on disk.
 *
 * @param int $oldversion The old version of atto in the DB.
 * @return bool
 */
function xmldb_editor_ousupsub_upgrade($oldversion) {
    global $CFG;

    if ($oldversion < 2018052300) {

        // Remove the old config setting for which editor to use.
        unset_config('use', 'editor_ousupsub');

        // If the old sub-sub editor is installed, remove it.
        if (core_plugin_manager::instance()->get_plugin_info('editor_supsub')) {
            uninstall_plugin('editor', 'supsub');
        }

        // Stack savepoint reached.
        upgrade_plugin_savepoint(true, 2018052300, 'editor', 'ousubsub');
    }

    return true;
}
