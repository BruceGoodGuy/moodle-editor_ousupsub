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
 * YUI text editor integration.
 *
 * @package   editor_ousupsub
 * @copyright 2014 The Open University
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();


/**
 * This is the texteditor implementation.
 * @copyright  2013 Damyon Wiese  <damyon@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class ousupsub_texteditor extends texteditor {

    /**
     * Is the current browser supported by this editor?
     *
     * Of course!
     * @return bool
     */
    public function supported_by_browser() {
        return true;
    }

    /**
     * Returns array of supported text formats.
     * @return array
     */
    public function get_supported_formats() {
        // FORMAT_MOODLE is not supported here, sorry.
        return array(FORMAT_HTML => FORMAT_HTML);
    }

    /**
     * Returns text format preferred by this editor.
     * @return int
     */
    public function get_preferred_format() {
        return FORMAT_HTML;
    }

    /**
     * Does this editor support picking from repositories?
     * @return bool
     */
    public function supports_repositories() {
        return false;
    }

    /**
     * Use this editor for given element.
     *
     * @param string $elementid
     * @param array $options
     * @param null $fpoptions
     */
    public function use_editor($elementid, array $options = null, $fpoptions = null) {
        global $PAGE, $OUTPUT;

        if (empty($options['context'])) {
            $options['context'] = context_system::instance();
        }
        if (empty($options['supsub'])) {
            $options['supsub'] = 'both';
        }

        switch ($options['supsub']) {
            case 'both':
                $groups = array('style1' => array('superscript', 'subscript'));
                break;

            case 'sup':
                $groups = array('style1' => array('superscript'));
                break;

            case 'sub':
                $groups = array('style1' => array('subscript'));
                break;

            default:
                throw new coding_exception("Invalid value '" .$options['supsub'] .
                        "' for option 'supsub'. Must be one of 'both', 'sup' or 'sub'.");
        }

        $groupplugins = array();
        foreach ($groups['style1'] as $plugin) {
            $groupplugins[] = array('name' => $plugin, 'params' => array());
        }

        $PAGE->requires->js_call_amd('editor_ousupsub/editor', 'loadEditor', [
            [
                'element' => $elementid,
                'type' => $options['supsub'],
                'buttons' => [
                    'superscript' => [
                        'icon' => $OUTPUT->pix_icon('e/superscript', '', 'core'),
                        'title' => get_string('button_sup_title', 'editor_ousupsub'),
                    ],
                    'subscript' => [
                        'icon' => $OUTPUT->pix_icon('e/subscript', '', 'core'),
                        'title' => get_string('button_sub_title', 'editor_ousupsub'),
                    ]
                ]
            ]
        ]);
    }

    /**
     * Create a params array to init the editor.
     *
     * @param string $elementid
     * @param array $options
     * @param array $fpoptions
     */
    protected function get_init_params($elementid, array $options = null, array $fpoptions = null, $plugins = null) {
        global $PAGE;

        $directionality = get_string('thisdirection', 'langconfig');
        $strtime        = get_string('strftimetime');
        $strdate        = get_string('strftimedaydate');
        $lang           = current_language();
        $contentcss     = $PAGE->theme->editor_css_url()->out(false);

        $params = array(
            'elementid' => $elementid,
            'content_css' => $contentcss,
            'contextid' => $options['context']->id,
            'language' => $lang,
            'directionality' => $directionality,
            'filepickeroptions' => array(),
            'plugins' => $plugins,
            'pageHash' => sha1($PAGE->url)
        );
        if ($fpoptions) {
            $params['filepickeroptions'] = $fpoptions;
        }

        return $params;
    }
}
