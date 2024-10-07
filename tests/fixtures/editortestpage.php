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
 * This page just displayes the ousupsub editor so it can be tested.
 *
 * @package   editor_ousupsub
 * @category  test
 * @copyright 2015 The Open University
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../../../../config.php');

$PAGE->set_context(context_system::instance());
$PAGE->set_url('/lib/editor/ousupsub/tests/fixtures/editortestpage.php');

$type = optional_param('type', 'both', PARAM_ALPHA);
require_login();
require_capability('moodle/site:config', context_system::instance());

if (!in_array($type, ['both', 'sub', 'sup'])) {
    throw new coding_exception("'type' in the URL must be 'both', 'sub', or 'sup'.");
}

$neweditor = get_texteditor('ousupsub');
$attoeditor = get_texteditor('atto');

$PAGE->set_title('Test superscript/subscript editor');
$PAGE->set_heading('Test superscript/subscript editor');

echo $OUTPUT->header();
echo html_writer::tag('h2', 'New supsub');
echo html_writer::label('Input', 'supsub') . ' ';
echo html_writer::tag('textarea', '', ['name' => 'supsub', 'id' => 'supsub', 'rows' => 2, 'cols' => 20]);
$neweditor->use_editor('supsub', ['supsub' => $type]);
$submitoptions = ['id' => 'submitsupsub', 'type' => 'submit', 'value' => 'submit supsub',
        'onClick' => 'emulateSubmit(this.id.substring(6, this.id.length));'];
echo ' ', html_writer::tag('input', '', $submitoptions);

echo html_writer::tag('h2', 'New supsub rows 4, cols 40');
echo html_writer::label('Input rows 4 cols 40', 'supsub2') . ' ';
echo html_writer::tag('textarea', '', ['name' => 'supsub2', 'id' => 'supsub2', 'rows' => 4, 'cols' => 40]);
$neweditor->use_editor('supsub2', ['supsub' => $type]);

$submitoptions['id'] = 'submitsupsub2';
$submitoptions['value'] = 'submit supsub2';
echo  ' ', html_writer::tag('input', '', $submitoptions);

echo html_writer::tag('h2', 'ATTO Editor');
echo html_writer::label('ATTO Input', 'attoeditor');
echo html_writer::tag('textarea', '', ['name' => 'attoeditor', 'id' => 'attoeditor', 'rows' => 2, 'cols' => 20]);
$attoeditor->use_editor('attoeditor', ['supsub' => $type]);
$submitoptions['id'] = 'submitattoeditor';
echo html_writer::tag('input', '', $submitoptions);
echo $OUTPUT->footer();
