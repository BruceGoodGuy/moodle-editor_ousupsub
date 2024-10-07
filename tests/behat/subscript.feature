@ou @ouvle @editor @editor_ousupsub @_bug_phantomjs
Feature: Subscript button
  To format text in ousupsub, I need to use the subscript button.

  @javascript
  Scenario: Subscript some text
    Given I log in as "admin"
    And I am on the integrated "sub" editor test page
    And I "enter" the text "Helicopter" in the "Input" ousupsub editor
    And I select the text in the "Input" ousupsub editor
    When I click on "Subscript" "button"
    Then I should see "<sub>Helicopter</sub>" in the "Input" ousupsub editor

    # Apply subscript inside existing subscript
    And I select the range "'sub',2,'sub',5" in the "Input" ousupsub editor
    And I click on "Subscript" "button"
    And I should see "<sub>He</sub>lic<sub>opter</sub>" in the "Input" ousupsub editor

    # Revert subscript
    And I click on "Subscript" "button"
    And I should see "<sub>Helicopter</sub>" in the "Input" ousupsub editor

    # Select existing subscript block
    And I select the range "'sub',0,'sub',10" in the "Input" ousupsub editor
    And I click on "Subscript" "button"
    And I should see "Helicopter" in the "Input" ousupsub editor

    # Apply subscript again
    And I select the range "'',3,'',5" in the "Input" ousupsub editor
    And I click on "Subscript" "button"
    And I should see "Hel<sub>ic</sub>opter" in the "Input" ousupsub editor

    # Select outside sub tags. Click button
    And I select the range "'sub',0,'sub',2" in the "Input" ousupsub editor
    And I click on "Subscript" "button"
    And I should see "Helicopter" in the "Input" ousupsub editor

    # Create adjoining sub tags. Click button
    And I select the range "'',1,'',3" in the "Input" ousupsub editor
    And I click on "Subscript" "button"
    And I select the range "2,0,2,2" in the "Input" ousupsub editor
    And I click on "Subscript" "button"
    And I should see "H<sub>elic</sub>opter" in the "Input" ousupsub editor

    # Apply subscript inside existing subscript not from the start of the word
    And I "enter" the text "Helicopter" in the "Input" ousupsub editor
    And I select the range "'',2,'',9" in the "Input" ousupsub editor
    And I click on "Subscript" "button"
    And I should see "He<sub>licopte</sub>r" in the "Input" ousupsub editor

    And I select the range "'sub',2,'sub',4" in the "Input" ousupsub editor
    And I click on "Subscript" "button"
    And I should see "He<sub>li</sub>co<sub>pte</sub>r" in the "Input" ousupsub editor

    # Apply subscript inside existing subscript using a longer phrase
    And I "enter" the text "He<sub>lic</sub>opter" in the "Input" ousupsub editor
    And I select the range "'sub',0,2,3" in the "Input" ousupsub editor
    And I click on "Subscript" "button"
    And I should see "He<sub>licopt</sub>er" in the "Input" ousupsub editor
