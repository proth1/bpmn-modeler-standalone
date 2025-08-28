Feature: Deploy Process to Camunda Engine
  As a process administrator
  I want to deploy processes to Camunda Engine
  So that they can be executed

  Background:
    Given Camunda Engine is running on port 8082
    And I am authenticated with deployment permissions
    And I have the BPMN modeler open

  Scenario: Successful deployment
    Given I have a valid BPMN process named "order-processing"
    And the process has:
      | Property | Value |
      | Process ID | OrderProcessing |
      | Version Tag | 1.0.0 |
      | Tenant ID | default |
    When I click the "Deploy to Camunda" button
    And I enter deployment details:
      | Field | Value |
      | Deployment Name | Order Processing v1.0 |
      | Deployment Source | BPMN Modeler |
      | Enable Duplicate Filtering | true |
    And I click "Deploy"
    Then I should see "Validating process..."
    And I should see "Deploying to Camunda..."
    And I should see "Deployment successful!"
    And the deployment should return:
      | Field | Example Value |
      | Deployment ID | 3fa85f64-5717-4562-b3fc-2c963f66afa6 |
      | Deployment Time | 2024-01-15T10:30:00Z |
      | Deployed Process Definitions | 1 |
    And the process should be visible in Camunda Cockpit

  Scenario: Deployment with validation errors
    Given I have a BPMN process with errors:
      | Error Type | Description |
      | Missing Implementation | ServiceTask_1 has no implementation |
      | Invalid Expression | Gateway_1 has malformed condition |
      | Missing Form Key | UserTask_1 has no form key |
    When I attempt to deploy the process
    Then I should see "Validation failed"
    And the errors should be listed:
      | Element | Issue | Severity |
      | ServiceTask_1 | No implementation specified | Error |
      | Gateway_1 | Invalid expression syntax | Error |
      | UserTask_1 | Form key recommended | Warning |
    And deployment should be prevented
    And error elements should be highlighted in red on canvas

  Scenario: Deploy with DMN decision table
    Given I have a process that references DMN decision "credit-check"
    And I have the DMN file "credit-check.dmn"
    When I click "Deploy to Camunda"
    Then I should see an option to "Include referenced DMN files"
    When I check this option
    And I click "Deploy"
    Then both BPMN and DMN should be deployed together
    And the deployment should show:
      | Resource | Type | Status |
      | order-processing.bpmn | Process Definition | Deployed |
      | credit-check.dmn | Decision Definition | Deployed |

  Scenario: Deploy to specific tenant
    Given I have multi-tenancy enabled in Camunda
    When I click "Deploy to Camunda"
    Then I should see a "Tenant ID" field
    When I enter "customer-a" as the tenant ID
    And I complete the deployment
    Then the process should be deployed to tenant "customer-a"
    And it should not be visible to other tenants

  Scenario: Deployment history
    Given I have deployed a process multiple times
    When I click "Deployment History"
    Then I should see a list of previous deployments:
      | Version | Deployment ID | Date | Status | Actions |
      | 1.0.0 | dep-001 | 2024-01-10 | Active | View, Undeploy |
      | 1.1.0 | dep-002 | 2024-01-12 | Active | View, Undeploy |
      | 1.2.0 | dep-003 | 2024-01-15 | Active | View, Undeploy |
    When I click "Undeploy" for version 1.0.0
    Then I should see a confirmation dialog
    And upon confirmation, the deployment should be removed

  Scenario: Connection failure handling
    Given Camunda Engine is not accessible
    When I attempt to deploy a process
    Then I should see "Connection failed"
    And the error should show "Unable to connect to Camunda at http://localhost:8082"
    And I should have options to:
      | Option | Action |
      | Retry | Attempt deployment again |
      | Configure | Change Camunda URL |
      | Save Locally | Save for later deployment |

  Scenario: Deploy with process variables
    Given I have a process with defined variables:
      | Variable | Type | Default Value |
      | orderAmount | Double | 0.0 |
      | customerType | String | standard |
      | rushOrder | Boolean | false |
    When I deploy the process
    Then the variables should be registered in Camunda
    And they should be available for process instances

  Scenario: Authentication required
    Given I am not authenticated with Camunda
    When I attempt to deploy a process
    Then I should see an authentication dialog
    When I enter valid credentials:
      | Field | Value |
      | Username | admin |
      | Password | *** |
    Then authentication should succeed
    And deployment should proceed

  Scenario: Deployment rollback
    Given I have deployed a faulty process version
    And process instances are failing
    When I click "Rollback Deployment"
    And I select the previous stable version
    Then the faulty deployment should be removed
    And the previous version should be restored
    And running instances should be migrated if possible