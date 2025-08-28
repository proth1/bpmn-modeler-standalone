Feature: Create New BPMN Process
  As a process designer
  I want to create new BPMN processes from scratch
  So that I can model business workflows

  Background:
    Given I am on the BPMN modeler application
    And I am authenticated as a process designer

  Scenario: Create a blank process
    When I click the "New Process" button
    Then I should see a blank canvas
    And the canvas should contain a start event with id "StartEvent_1"
    And the process should have a unique process ID
    And the properties panel should be visible on the right
    And the element palette should be visible on the left

  Scenario: Add a User Task to the process
    Given I have created a new blank process
    When I select "User Task" from the palette
    And I click on the canvas at position (300, 200)
    Then a User Task should appear at that position
    And the User Task should have a unique ID
    And the User Task should be selected
    And the properties panel should show User Task properties

  Scenario: Connect elements with sequence flow
    Given I have a process with a start event at (100, 200)
    And I have a User Task at (300, 200)
    When I select the sequence flow tool
    And I drag from the start event to the User Task
    Then a sequence flow should connect the two elements
    And the sequence flow should have a unique ID
    And the sequence flow should be selectable

  Scenario: Set element properties
    Given I have selected a User Task with id "UserTask_1"
    When I enter "Review Document" in the Name field
    And I enter "manager" in the Assignee field
    And I enter "review-form" in the Form Key field
    Then the User Task name should update to "Review Document"
    And the XML should contain assignee="manager"
    And the XML should contain formKey="review-form"

  Scenario: Validate process before saving
    Given I have a process with only a start event
    When I click the "Validate" button
    Then I should see a warning "Process has no end event"
    And I should see a warning "Start event has no outgoing flow"
    And the validation panel should list all issues

  Scenario: Auto-save functionality
    Given I have made changes to a process
    When I wait for 5 seconds
    Then the auto-save indicator should show "Saved"
    And the last saved timestamp should be updated
    And the process should be recoverable if browser crashes