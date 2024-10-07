@ou @ouvle @editor @editor_ousupsub @_bug_phantomjs
Feature: Sup/Sup keyboard support
  To format text in ousupsub, I need to use both the superscript and subscript buttons.
  The tests must be built initially in a specific order because we are relying on CSS selectors to select
  specific pieces of text. It is very easy to get into a situation where pieces of text cannot be selected.

  We are using Rangy to create a selection range between specific nodes https://code.google.com/p/rangy/wiki/RangySelection
  and document.querySelector() https://developer.mozilla.org/en-US/docs/Web/API/document.querySelector
  to select the specific nodes. This requires css selector syntax http://www.w3schools.com/cssref/css_selectors.asp

  Many of these tests highlight specific bugs in the existing atto/ousupsub editor implementation while also
  demonstrating how to use the text selection behat method created for this plugin.

  @javascript
  Scenario: Applying Subscript and Superscript on text using keyboard
    Given I log in as "admin"
    And I am on the integrated "both" editor test page
    And I "enter" the text "Superscript and Subscript" in the "Input" ousupsub editor

    # Apply subscript
    When I select the range "'',16,'',25" in the "Input" ousupsub editor
    And I press the subscript key in the "Input" ousupsub editor
    Then I should see "Superscript and <sub>Subscript</sub>" in the "Input" ousupsub editor

    # Apply superscript
    And I select the range "'',0,'',11" in the "Input" ousupsub editor
    And I press the superscript key in the "Input" ousupsub editor
    And I should see "<sup>Superscript</sup> and <sub>Subscript</sub>" in the "Input" ousupsub editor

    # Return superscript to normal
    And I select the range "'sup',0,'sup',11" in the "Input" ousupsub editor
    And I press the subscript key in the "Input" ousupsub editor
    And I should see "Superscript and <sub>Subscript</sub>" in the "Input" ousupsub editor

    # Return subscript to normal
    And I select the range "'sub',0,'sub',9" in the "Input" ousupsub editor
    And I press the superscript key in the "Input" ousupsub editor
    And I should see "Superscript and Subscript" in the "Input" ousupsub editor

    # Apply subscript across existing superscript
    And I "enter" the text "Super<sup>script</sup> and Subscript" in the "Input" ousupsub editor
    And I select the range "'sup',3,2,8" in the "Input" ousupsub editor
    And I press the subscript key in the "Input" ousupsub editor
    And I should see "Super<sup>scr</sup><sub>ipt and Sub</sub>script" in the "Input" ousupsub editor

    # Apply superscript across existing subscript
    And I select the range "'sub',0,'sub',3" in the "Input" ousupsub editor
    And I press the superscript key in the "Input" ousupsub editor
    And I should see "Super<sup>scr</sup>ipt <sub>and Sub</sub>script" in the "Input" ousupsub editor
