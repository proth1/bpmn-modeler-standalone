Feature: Save and Load BPMN Files
  As a process designer
  I want to save and load BPMN files
  So that I can persist and reuse my work

  Background:
    Given I am using the BPMN modeler application

  Scenario: Save a new process
    Given I have created a process with:
      | Element Type | ID | Name |
      | Start Event | StartEvent_1 | Process Start |
      | User Task | UserTask_1 | Review Document |
      | Exclusive Gateway | Gateway_1 | Approval Decision |
      | End Event | EndEvent_1 | Process End |
    And I have connected all elements with sequence flows
    When I click the "Save" button
    And I enter "document-review-process" as the filename
    Then the file should be saved as "document-review-process.bpmn"
    And the file should contain valid BPMN 2.0 XML
    And the file should include BPMN DI layout information
    And all element properties should be preserved
    And I should see a success message "Process saved successfully"

  Scenario: Load an existing BPMN file
    Given I have a saved BPMN file "existing-process.bpmn"
    When I click the "Open" button
    And I select the file "existing-process.bpmn"
    Then the process should load in the canvas
    And all elements should be positioned correctly
    And all element properties should be loaded
    And the properties panel should show the correct values
    And the process should be immediately editable

  Scenario: Save with validation errors
    Given I have a process with validation errors:
      | Error | Description |
      | Missing End Event | Process has no end event |
      | Disconnected Task | UserTask_2 has no incoming flow |
    When I attempt to save the process
    Then I should see a warning dialog
    And the dialog should list all validation errors
    And I should have options to:
      | Option | Action |
      | Save Anyway | Save despite errors |
      | Fix Issues | Return to canvas |
      | Cancel | Cancel save operation |

  Scenario: Export as different formats
    Given I have a valid BPMN process
    When I click the "Export" button
    Then I should see export format options:
      | Format | Extension | Description |
      | BPMN 2.0 | .bpmn | Standard BPMN XML |
      | SVG | .svg | Vector image |
      | PNG | .png | Raster image |
      | PDF | .pdf | Document format |
    When I select "SVG" format
    Then the process should be exported as an SVG image
    And the image should maintain the visual layout

  Scenario: Auto-recovery after crash
    Given I was editing a process when the application crashed
    And I had unsaved changes
    When I restart the application
    Then I should see a recovery dialog
    And the dialog should show "Recover unsaved work?"
    When I click "Recover"
    Then my previous work should be restored
    And all unsaved changes should be present

  Scenario: Version control
    Given I have saved a process "my-process.bpmn"
    When I make changes and save again
    Then I should be prompted for version information:
      | Field | Example |
      | Version | 1.1.0 |
      | Change Description | Added approval gateway |
    And the version history should be updated
    And I should be able to view previous versions
    And I should be able to restore previous versions

  Scenario: Import from Camunda Modeler
    Given I have a BPMN file created in Camunda Modeler
    When I import this file
    Then all Camunda-specific properties should be preserved
    And the visual layout should be maintained
    And all extensions should be recognized
    And the process should be fully editable

  Scenario: Collaborative editing
    Given I have a process open for editing
    When another user opens the same process
    Then they should see a lock indicator
    And they should be able to open in read-only mode
    And they should see who is currently editing
    When I save and close the process
    Then the lock should be released
    And the other user should be notified