Feature: BPMN Element Properties Panel
  As a process designer
  I want to configure all properties for BPMN elements
  So that processes execute correctly in Camunda

  Background:
    Given I have the BPMN modeler open
    And I have created a process with multiple elements

  Scenario: View all User Task properties
    Given I have a User Task on the canvas
    When I select the User Task
    Then the properties panel should display the following groups:
      | Group | Properties |
      | General | ID, Name, Documentation |
      | Assignment | Assignee, Candidate Users, Candidate Groups, Due Date, Follow Up Date, Priority |
      | Forms | Form Key, Form Fields, Form Field Validation |
      | Execution | Async Before, Async After, Exclusive, Job Retries, Retry Time Cycle |
      | Multi Instance | Collection, Element Variable, Completion Condition |
      | Listeners | Task Listeners, Execution Listeners |
      | Extensions | Properties, Input Parameters, Output Parameters |

  Scenario: Configure Service Task implementation
    Given I have a Service Task selected
    When I open the Implementation dropdown
    Then I should see the following options:
      | Option | Description |
      | Java Class | Specify a Java class name |
      | Expression | Define an expression |
      | Delegate Expression | Use a delegate expression |
      | External | Configure as external task |
      | Connector | Use a connector |
    When I select "Java Class"
    And I enter "com.example.ProcessDelegate" in the Java Class field
    Then the XML should contain class="com.example.ProcessDelegate"

  Scenario: Configure External Task
    Given I have a Service Task selected
    When I set Implementation to "External"
    And I enter "payment-processing" in the Topic field
    And I enter "3" in the Task Priority field
    And I enter "PT10M" in the Lock Duration field
    Then the XML should contain the following attributes:
      | Attribute | Value |
      | camunda:type | external |
      | camunda:topic | payment-processing |
      | camunda:taskPriority | 3 |
      | camunda:lockDuration | PT10M |

  Scenario: Add form fields to User Task
    Given I have a User Task selected
    When I click "Add Form Field" in the Forms section
    And I configure the form field with:
      | Property | Value |
      | ID | customerName |
      | Label | Customer Name |
      | Type | string |
      | Default Value | |
      | Required | true |
    Then the form field should appear in the list
    And the XML should contain the form field configuration

  Scenario: Configure gateway conditions
    Given I have an Exclusive Gateway selected
    And it has two outgoing sequence flows
    When I select the first sequence flow
    And I enter "${amount > 1000}" in the Condition Expression field
    And I select the second sequence flow
    And I mark it as "Default Flow"
    Then the first flow should have the condition expression
    And the second flow should be marked as default
    And the XML should reflect both configurations

  Scenario: Add execution listeners
    Given I have a User Task selected
    When I click "Add Listener" in the Listeners section
    And I configure the listener with:
      | Property | Value |
      | Event | start |
      | Listener Type | Java Class |
      | Java Class | com.example.TaskStartListener |
    Then the listener should appear in the list
    And the XML should contain the task listener configuration

  Scenario: Configure timer event
    Given I have a Timer Start Event selected
    When I select "Cycle" as the timer type
    And I enter "0 0 9 * * MON-FRI" in the Timer Definition field
    Then the XML should contain:
      | Element | Value |
      | timerEventDefinition | |
      | timeCycle | 0 0 9 * * MON-FRI |

  Scenario: Input/Output mapping
    Given I have a Service Task selected
    When I click "Add Input Parameter"
    And I configure:
      | Name | orderId |
      | Type | Text |
      | Value | ${execution.getVariable('orderId')} |
    And I click "Add Output Parameter"
    And I configure:
      | Name | result |
      | Type | Text |
      | Value | ${processingResult} |
    Then both parameters should appear in the Extensions section
    And the XML should contain the input/output mappings