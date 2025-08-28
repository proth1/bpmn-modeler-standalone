import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PropertiesPanel, PropertyGroup, PropertyEntry } from '../PropertiesPanel';
import { BPMNElement } from '@bpmn-modeler/core';

describe('PropertiesPanel', () => {
  const mockOnChange = jest.fn();
  const mockOnValidate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Panel Rendering', () => {
    it('should render empty state when no element is selected', () => {
      render(<PropertiesPanel element={null} onChange={mockOnChange} />);
      
      expect(screen.getByText('Select an element to view properties')).toBeInTheDocument();
      expect(screen.queryByRole('form')).not.toBeInTheDocument();
    });

    it('should render property groups for selected element', () => {
      const element: BPMNElement = {
        id: 'UserTask_1',
        type: 'bpmn:UserTask',
        name: 'Review Document',
        properties: {}
      };

      render(<PropertiesPanel element={element} onChange={mockOnChange} />);
      
      expect(screen.getByText('General')).toBeInTheDocument();
      expect(screen.getByText('Assignment')).toBeInTheDocument();
      expect(screen.getByText('Forms')).toBeInTheDocument();
      expect(screen.getByText('Execution')).toBeInTheDocument();
    });

    it('should show element type and ID in header', () => {
      const element: BPMNElement = {
        id: 'ServiceTask_1',
        type: 'bpmn:ServiceTask',
        name: 'Process Payment'
      };

      render(<PropertiesPanel element={element} onChange={mockOnChange} />);
      
      expect(screen.getByText('Service Task')).toBeInTheDocument();
      expect(screen.getByText('ServiceTask_1')).toBeInTheDocument();
    });
  });

  describe('General Properties', () => {
    const element: BPMNElement = {
      id: 'UserTask_1',
      type: 'bpmn:UserTask',
      name: 'Initial Name',
      documentation: 'Initial documentation',
      properties: {}
    };

    it('should display and edit element ID', async () => {
      render(<PropertiesPanel element={element} onChange={mockOnChange} />);
      
      const idInput = screen.getByLabelText('ID');
      expect(idInput).toHaveValue('UserTask_1');
      
      await userEvent.clear(idInput);
      await userEvent.type(idInput, 'NewTaskId');
      
      expect(mockOnChange).toHaveBeenCalledWith('id', 'NewTaskId');
    });

    it('should validate ID format', async () => {
      render(<PropertiesPanel element={element} onChange={mockOnChange} onValidate={mockOnValidate} />);
      
      const idInput = screen.getByLabelText('ID');
      await userEvent.clear(idInput);
      await userEvent.type(idInput, 'Invalid ID!');
      
      expect(mockOnValidate).toHaveBeenCalledWith('id', 'Invalid ID!', expect.stringContaining('Invalid ID format'));
    });

    it('should display and edit element name', async () => {
      render(<PropertiesPanel element={element} onChange={mockOnChange} />);
      
      const nameInput = screen.getByLabelText('Name');
      expect(nameInput).toHaveValue('Initial Name');
      
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'Updated Name');
      
      expect(mockOnChange).toHaveBeenCalledWith('name', 'Updated Name');
    });

    it('should display and edit documentation', async () => {
      render(<PropertiesPanel element={element} onChange={mockOnChange} />);
      
      const docTextarea = screen.getByLabelText('Documentation');
      expect(docTextarea).toHaveValue('Initial documentation');
      
      await userEvent.clear(docTextarea);
      await userEvent.type(docTextarea, 'Detailed process documentation');
      
      expect(mockOnChange).toHaveBeenCalledWith('documentation', 'Detailed process documentation');
    });
  });

  describe('User Task Assignment Properties', () => {
    const userTask: BPMNElement = {
      id: 'UserTask_1',
      type: 'bpmn:UserTask',
      name: 'Approval Task',
      properties: {
        assignee: 'john.doe',
        candidateUsers: 'jane.doe,bob.smith',
        candidateGroups: 'managers,reviewers',
        dueDate: 'PT48H',
        priority: '1'
      }
    };

    it('should display assignee field', () => {
      render(<PropertiesPanel element={userTask} onChange={mockOnChange} />);
      
      const assigneeInput = screen.getByLabelText('Assignee');
      expect(assigneeInput).toHaveValue('john.doe');
    });

    it('should handle assignee expression', async () => {
      render(<PropertiesPanel element={userTask} onChange={mockOnChange} />);
      
      const assigneeInput = screen.getByLabelText('Assignee');
      await userEvent.clear(assigneeInput);
      await userEvent.type(assigneeInput, '${initiator}');
      
      expect(mockOnChange).toHaveBeenCalledWith('assignee', '${initiator}');
    });

    it('should display and edit candidate users', async () => {
      render(<PropertiesPanel element={userTask} onChange={mockOnChange} />);
      
      const candidateUsersInput = screen.getByLabelText('Candidate Users');
      expect(candidateUsersInput).toHaveValue('jane.doe,bob.smith');
      
      await userEvent.clear(candidateUsersInput);
      await userEvent.type(candidateUsersInput, 'user1,user2,user3');
      
      expect(mockOnChange).toHaveBeenCalledWith('candidateUsers', 'user1,user2,user3');
    });

    it('should display and edit due date', async () => {
      render(<PropertiesPanel element={userTask} onChange={mockOnChange} />);
      
      const dueDateInput = screen.getByLabelText('Due Date');
      expect(dueDateInput).toHaveValue('PT48H');
      
      await userEvent.clear(dueDateInput);
      await userEvent.type(dueDateInput, 'P7D');
      
      expect(mockOnChange).toHaveBeenCalledWith('dueDate', 'P7D');
    });

    it('should display priority dropdown', async () => {
      render(<PropertiesPanel element={userTask} onChange={mockOnChange} />);
      
      const prioritySelect = screen.getByLabelText('Priority');
      expect(prioritySelect).toHaveValue('1');
      
      fireEvent.change(prioritySelect, { target: { value: '3' } });
      
      expect(mockOnChange).toHaveBeenCalledWith('priority', '3');
    });
  });

  describe('Service Task Implementation Properties', () => {
    const serviceTask: BPMNElement = {
      id: 'ServiceTask_1',
      type: 'bpmn:ServiceTask',
      name: 'Process Order',
      properties: {
        implementation: 'class',
        javaClass: 'com.example.OrderProcessor'
      }
    };

    it('should display implementation type dropdown', () => {
      render(<PropertiesPanel element={serviceTask} onChange={mockOnChange} />);
      
      const implementationSelect = screen.getByLabelText('Implementation');
      expect(implementationSelect).toHaveValue('class');
      
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(5); // class, expression, delegateExpression, external, connector
    });

    it('should show Java class field for class implementation', () => {
      render(<PropertiesPanel element={serviceTask} onChange={mockOnChange} />);
      
      const javaClassInput = screen.getByLabelText('Java Class');
      expect(javaClassInput).toHaveValue('com.example.OrderProcessor');
    });

    it('should show topic field for external task', async () => {
      const externalTask: BPMNElement = {
        ...serviceTask,
        properties: {
          implementation: 'external',
          topic: 'payment-processing'
        }
      };

      const { rerender } = render(<PropertiesPanel element={serviceTask} onChange={mockOnChange} />);
      
      const implementationSelect = screen.getByLabelText('Implementation');
      fireEvent.change(implementationSelect, { target: { value: 'external' } });
      
      rerender(<PropertiesPanel element={externalTask} onChange={mockOnChange} />);
      
      expect(screen.getByLabelText('Topic')).toBeInTheDocument();
      expect(screen.getByLabelText('Topic')).toHaveValue('payment-processing');
    });

    it('should validate Java class name format', async () => {
      render(<PropertiesPanel element={serviceTask} onChange={mockOnChange} onValidate={mockOnValidate} />);
      
      const javaClassInput = screen.getByLabelText('Java Class');
      await userEvent.clear(javaClassInput);
      await userEvent.type(javaClassInput, 'InvalidClass!');
      
      expect(mockOnValidate).toHaveBeenCalledWith(
        'javaClass',
        'InvalidClass!',
        expect.stringContaining('Invalid Java class name')
      );
    });
  });

  describe('Form Configuration', () => {
    const userTask: BPMNElement = {
      id: 'UserTask_1',
      type: 'bpmn:UserTask',
      name: 'Form Task',
      properties: {
        formKey: 'embedded:app:forms/approval.html',
        formFields: []
      }
    };

    it('should display form key input', () => {
      render(<PropertiesPanel element={userTask} onChange={mockOnChange} />);
      
      const formKeyInput = screen.getByLabelText('Form Key');
      expect(formKeyInput).toHaveValue('embedded:app:forms/approval.html');
    });

    it('should add form fields', async () => {
      render(<PropertiesPanel element={userTask} onChange={mockOnChange} />);
      
      const addFieldButton = screen.getByText('Add Form Field');
      fireEvent.click(addFieldButton);
      
      await waitFor(() => {
        expect(screen.getByLabelText('Field ID')).toBeInTheDocument();
      });
      
      const fieldIdInput = screen.getByLabelText('Field ID');
      const fieldLabelInput = screen.getByLabelText('Field Label');
      const fieldTypeSelect = screen.getByLabelText('Field Type');
      
      await userEvent.type(fieldIdInput, 'approved');
      await userEvent.type(fieldLabelInput, 'Approved');
      fireEvent.change(fieldTypeSelect, { target: { value: 'boolean' } });
      
      const saveButton = screen.getByText('Save Field');
      fireEvent.click(saveButton);
      
      expect(mockOnChange).toHaveBeenCalledWith('formFields', expect.arrayContaining([
        expect.objectContaining({
          id: 'approved',
          label: 'Approved',
          type: 'boolean'
        })
      ]));
    });

    it('should validate form field IDs are unique', async () => {
      const taskWithFields: BPMNElement = {
        ...userTask,
        properties: {
          ...userTask.properties,
          formFields: [
            { id: 'field1', label: 'Field 1', type: 'string' }
          ]
        }
      };

      render(<PropertiesPanel element={taskWithFields} onChange={mockOnChange} onValidate={mockOnValidate} />);
      
      const addFieldButton = screen.getByText('Add Form Field');
      fireEvent.click(addFieldButton);
      
      const fieldIdInput = screen.getByLabelText('Field ID');
      await userEvent.type(fieldIdInput, 'field1');
      
      expect(mockOnValidate).toHaveBeenCalledWith(
        'formFieldId',
        'field1',
        'Field ID must be unique'
      );
    });
  });

  describe('Execution Listeners', () => {
    it('should add task listeners', async () => {
      const userTask: BPMNElement = {
        id: 'UserTask_1',
        type: 'bpmn:UserTask',
        name: 'Task',
        properties: {},
        executionListeners: []
      };

      render(<PropertiesPanel element={userTask} onChange={mockOnChange} />);
      
      const addListenerButton = screen.getByText('Add Task Listener');
      fireEvent.click(addListenerButton);
      
      await waitFor(() => {
        expect(screen.getByLabelText('Event')).toBeInTheDocument();
      });
      
      const eventSelect = screen.getByLabelText('Event');
      const listenerTypeSelect = screen.getByLabelText('Listener Type');
      
      fireEvent.change(eventSelect, { target: { value: 'create' } });
      fireEvent.change(listenerTypeSelect, { target: { value: 'class' } });
      
      const classInput = screen.getByLabelText('Java Class');
      await userEvent.type(classInput, 'com.example.TaskCreateListener');
      
      const saveButton = screen.getByText('Save Listener');
      fireEvent.click(saveButton);
      
      expect(mockOnChange).toHaveBeenCalledWith('executionListeners', expect.arrayContaining([
        expect.objectContaining({
          event: 'create',
          listenerType: 'class',
          class: 'com.example.TaskCreateListener'
        })
      ]));
    });

    it('should support script listeners', async () => {
      const userTask: BPMNElement = {
        id: 'UserTask_1',
        type: 'bpmn:UserTask',
        name: 'Task',
        properties: {},
        executionListeners: []
      };

      render(<PropertiesPanel element={userTask} onChange={mockOnChange} />);
      
      const addListenerButton = screen.getByText('Add Task Listener');
      fireEvent.click(addListenerButton);
      
      const listenerTypeSelect = screen.getByLabelText('Listener Type');
      fireEvent.change(listenerTypeSelect, { target: { value: 'script' } });
      
      await waitFor(() => {
        expect(screen.getByLabelText('Script Format')).toBeInTheDocument();
      });
      
      const scriptFormatSelect = screen.getByLabelText('Script Format');
      const scriptTextarea = screen.getByLabelText('Script');
      
      fireEvent.change(scriptFormatSelect, { target: { value: 'javascript' } });
      await userEvent.type(scriptTextarea, 'console.log("Task created");');
      
      const saveButton = screen.getByText('Save Listener');
      fireEvent.click(saveButton);
      
      expect(mockOnChange).toHaveBeenCalledWith('executionListeners', expect.arrayContaining([
        expect.objectContaining({
          listenerType: 'script',
          scriptFormat: 'javascript',
          script: 'console.log("Task created");'
        })
      ]));
    });
  });

  describe('Conditional Expressions', () => {
    it('should edit sequence flow conditions', async () => {
      const sequenceFlow: BPMNElement = {
        id: 'Flow_1',
        type: 'bpmn:SequenceFlow',
        name: 'Approved Flow',
        sourceRef: 'Gateway_1',
        targetRef: 'Task_1',
        properties: {
          conditionExpression: '${approved == true}'
        }
      };

      render(<PropertiesPanel element={sequenceFlow} onChange={mockOnChange} />);
      
      const conditionInput = screen.getByLabelText('Condition Expression');
      expect(conditionInput).toHaveValue('${approved == true}');
      
      await userEvent.clear(conditionInput);
      await userEvent.type(conditionInput, '${amount > 1000}');
      
      expect(mockOnChange).toHaveBeenCalledWith('conditionExpression', '${amount > 1000}');
    });

    it('should validate expression syntax', async () => {
      const sequenceFlow: BPMNElement = {
        id: 'Flow_1',
        type: 'bpmn:SequenceFlow',
        properties: {}
      };

      render(<PropertiesPanel element={sequenceFlow} onChange={mockOnChange} onValidate={mockOnValidate} />);
      
      const conditionInput = screen.getByLabelText('Condition Expression');
      await userEvent.type(conditionInput, '${unclosed');
      
      expect(mockOnValidate).toHaveBeenCalledWith(
        'conditionExpression',
        '${unclosed',
        expect.stringContaining('Invalid expression')
      );
    });
  });
});