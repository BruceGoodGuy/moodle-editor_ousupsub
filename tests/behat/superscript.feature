@ou @ouvle @editor @editor_ousupsub @_bug_phantomjs
Feature: ousupsub superscript button
  To format text in ousupsub, I need to use the superscript button.

  @javascript
  Scenario: Superscript some text
    Given I log in as "admin"
    And I am on the integrated "sup" editor test page
    And I "enter" the text "Helicopter" in the "Input" ousupsub editor
    And I select the text in the "Input" ousupsub editor
    When I click on "Superscript" "button"
    Then I should see "<sup>Helicopter</sup>" in the "Input" ousupsub editor

    # Apply superscript inside existing superscript
    And I select the range "'sup',2,'sup',5" in the "Input" ousupsub editor
    And I click on "Superscript" "button"
    And I should see "<sup>He</sup>lic<sup>opter</sup>" in the "Input" ousupsub editor

    # Revert superscript
    And I click on "Superscript" "button"
    And I should see "<sup>Helicopter</sup>" in the "Input" ousupsub editor

    # Select existing superscript block
    And I select the range "'sup',0,'sup',10" in the "Input" ousupsub editor
    And I click on "Superscript" "button"
    And I should see "Helicopter" in the "Input" ousupsub editor

    # Apply superscript again
    And I select the range "'',3,'',5" in the "Input" ousupsub editor
    And I click on "Superscript" "button"
    And I should see "Hel<sup>ic</sup>opter" in the "Input" ousupsub editor

    # Select outside sup tags. Click button
    And I select the range "'sup',0,'sup',2" in the "Input" ousupsub editor
    And I click on "Superscript" "button"
    And I should see "Helicopter" in the "Input" ousupsub editor

    # Create adjoining sup tags. Click button
    And I select the range "'',1,'',3" in the "Input" ousupsub editor
    And I click on "Superscript" "button"
    And I select the range "2,0,2,2" in the "Input" ousupsub editor
    And I click on "Superscript" "button"
    And I should see "H<sup>elic</sup>opter" in the "Input" ousupsub editor

    # Apply superscript inside existing superscript not from the start of the word
    And I "enter" the text "Helicopter" in the "Input" ousupsub editor
    And I select the range "'',2,'',9" in the "Input" ousupsub editor
    And I click on "Superscript" "button"
    And I should see "He<sup>licopte</sup>r" in the "Input" ousupsub editor

    And I select the range "'sup',2,'sup',4" in the "Input" ousupsub editor
    And I click on "Superscript" "button"
    And I should see "He<sup>li</sup>co<sup>pte</sup>r" in the "Input" ousupsub editor

    # Apply superscript inside existing superscript using a longer phrase
    And I "enter" the text "He<sup>lic</sup>opter" in the "Input" ousupsub editor
    And I select the range "'sup',0,2,3" in the "Input" ousupsub editor
    And I click on "Superscript" "button"
    And I should see "He<sup>licopt</sup>er" in the "Input" ousupsub editor

    # Apply superscript to the end of a string. Triggers empty spaces at the end of the string
    And I "enter" the text "Helicopter" in the "Input" ousupsub editor
    And I select the range "'',10,'',10" in the "Input" ousupsub editor
    And I click on "Superscript" "button"
    And I should see "Helicopter" in the "Input" ousupsub editor

    # Apply superscript to the end of a string. Triggers empty spaces at the start of the string
    And I "enter" the text "Helicopter" in the "Input" ousupsub editor
    And I select the range "'',1,'',1" in the "Input" ousupsub editor
    And I click on "Superscript" "button"
    And I should see "Helicopter" in the "Input" ousupsub editor

    # Apply superscript to the end of a string. Triggers empty spaces in the middle of the string
    And I "enter" the text "Helicopter" in the "Input" ousupsub editor
    And I select the range "'',4,'',4" in the "Input" ousupsub editor
    And I click on "Superscript" "button"
    And I should see "Helicopter" in the "Input" ousupsub editor
