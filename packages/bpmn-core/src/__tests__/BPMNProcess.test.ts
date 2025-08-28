import { BPMNProcess, BPMNElement, ProcessValidationError } from '../models/BPMNProcess';
import { ElementFactory } from '../factories/ElementFactory';
import { XMLSerializer } from '../serializers/XMLSerializer';

describe('BPMNProcess', () => {
  let process: BPMNProcess;

  beforeEach(() => {
    process = new BPMNProcess();
  });

  describe('Process Creation', () => {
    it('should create a new process with unique ID', () => {
      expect(process.id).toMatch(/^Process_[a-zA-Z0-9]+$/);
      expect(process.id).toHaveLength(16);
    });

    it('should initialize with a start event by default', () => {
      const elements = process.getElements();
      expect(elements).toHaveLength(1);
      expect(elements[0].type).toBe('bpmn:StartEvent');
      expect(elements[0].id).toMatch(/^StartEvent_[a-zA-Z0-9]+$/);
    });

    it('should have correct default properties', () => {
      expect(process.name).toBe('New Process');
      expect(process.isExecutable).toBe(true);
      expect(process.versionTag).toBe('1.0.0');
      expect(process.historyTimeToLive).toBe('P30D');
    });

    it('should generate valid BPMN 2.0 XML', () => {
      const xml = process.toXML();
      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"');
      expect(xml).toContain('targetNamespace="http://bpmn.io/schema/bpmn"');
    });

    it('should include Camunda namespace extensions', () => {
      const xml = process.toXML();
      expect(xml).toContain('xmlns:camunda="http://camunda.org/schema/1.0/bpmn"');
      expect(xml).toContain('camunda:historyTimeToLive="P30D"');
    });
  });

  describe('Element Management', () => {
    it('should add elements with unique IDs', () => {
      const task = process.addElement('bpmn:UserTask', { name: 'Review Document' });
      
      expect(task.id).toMatch(/^UserTask_[a-zA-Z0-9]+$/);
      expect(task.name).toBe('Review Document');
      expect(process.getElements()).toHaveLength(2);
    });

    it('should prevent duplicate element IDs', () => {
      const task1 = process.addElement('bpmn:UserTask');
      const task2 = process.addElement('bpmn:UserTask');
      
      expect(task1.id).not.toBe(task2.id);
    });

    it('should remove elements correctly', () => {
      const task = process.addElement('bpmn:UserTask');
      expect(process.getElements()).toHaveLength(2);
      
      process.removeElement(task.id);
      expect(process.getElements()).toHaveLength(1);
    });

    it('should update element properties', () => {
      const task = process.addElement('bpmn:UserTask');
      
      process.updateElement(task.id, {
        name: 'Updated Task',
        assignee: 'john.doe',
        candidateGroups: 'managers,reviewers'
      });
      
      const updated = process.getElementById(task.id);
      expect(updated?.name).toBe('Updated Task');
      expect(updated?.properties.assignee).toBe('john.doe');
      expect(updated?.properties.candidateGroups).toBe('managers,reviewers');
    });

    it('should handle sequence flows between elements', () => {
      const startEvent = process.getElements()[0];
      const task = process.addElement('bpmn:UserTask');
      
      const flow = process.addSequenceFlow(startEvent!.id, task.id);
      
      expect(flow.id).toMatch(/^Flow_[a-zA-Z0-9]+$/);
      expect(flow.sourceRef).toBe(startEvent!.id);
      expect(flow.targetRef).toBe(task.id);
    });
  });

  describe('Process Validation', () => {
    it('should validate process has at least one start event', () => {
      const errors = process.validate();
      expect(errors).toHaveLength(0); // Default process has start event
      
      process.removeElement(process.getElements()[0]!.id);
      const errorsAfterRemoval = process.validate();
      
      expect(errorsAfterRemoval).toContainEqual(
        expect.objectContaining({
          type: 'error',
          message: 'Process must have at least one start event'
        })
      );
    });

    it('should validate process has at least one end event', () => {
      const errors = process.validate();
      
      expect(errors).toContainEqual(
        expect.objectContaining({
          type: 'warning',
          message: 'Process should have at least one end event'
        })
      );
    });

    it('should validate all elements have connections', () => {
      const task = process.addElement('bpmn:UserTask');
      const errors = process.validate();
      
      expect(errors).toContainEqual(
        expect.objectContaining({
          type: 'error',
          elementId: task.id,
          message: `Element ${task.id} has no incoming connections`
        })
      );
    });

    it('should validate gateways have proper conditions', () => {
      const gateway = process.addElement('bpmn:ExclusiveGateway');
      const task1 = process.addElement('bpmn:UserTask');
      const task2 = process.addElement('bpmn:UserTask');
      
      process.addSequenceFlow(gateway.id, task1.id);
      process.addSequenceFlow(gateway.id, task2.id);
      
      const errors = process.validate();
      
      expect(errors).toContainEqual(
        expect.objectContaining({
          type: 'warning',
          elementId: gateway.id,
          message: 'Exclusive gateway should have conditions on outgoing flows'
        })
      );
    });

    it('should validate required properties for elements', () => {
      const serviceTask = process.addElement('bpmn:ServiceTask');
      const errors = process.validate();
      
      expect(errors).toContainEqual(
        expect.objectContaining({
          type: 'error',
          elementId: serviceTask.id,
          message: 'Service task must have an implementation'
        })
      );
    });
  });

  describe('Camunda-specific Properties', () => {
    it('should handle User Task assignment properties', () => {
      const task = process.addElement('bpmn:UserTask', {
        assignee: '${initiator}',
        candidateUsers: 'john,jane',
        candidateGroups: 'managers',
        dueDate: 'PT48H',
        followUpDate: 'PT24H',
        priority: '1'
      });
      
      const xml = process.toXML();
      expect(xml).toContain('camunda:assignee="${initiator}"');
      expect(xml).toContain('camunda:candidateUsers="john,jane"');
      expect(xml).toContain('camunda:candidateGroups="managers"');
      expect(xml).toContain('camunda:dueDate="PT48H"');
    });

    it('should handle Service Task implementations', () => {
      const javaTask = process.addElement('bpmn:ServiceTask', {
        implementation: 'class',
        javaClass: 'com.example.MyDelegate'
      });
      
      const externalTask = process.addElement('bpmn:ServiceTask', {
        implementation: 'external',
        topic: 'payment-processing',
        taskPriority: '10'
      });
      
      const xml = process.toXML();
      expect(xml).toContain('camunda:class="com.example.MyDelegate"');
      expect(xml).toContain('camunda:type="external"');
      expect(xml).toContain('camunda:topic="payment-processing"');
    });

    it('should handle form configurations', () => {
      const task = process.addElement('bpmn:UserTask', {
        formKey: 'embedded:app:forms/review-form.html',
        formFields: [
          {
            id: 'approved',
            label: 'Approved',
            type: 'boolean',
            defaultValue: 'false',
            validation: { required: true }
          },
          {
            id: 'comments',
            label: 'Comments',
            type: 'string',
            validation: { minLength: 10 }
          }
        ]
      });
      
      expect(task.properties.formKey).toBe('embedded:app:forms/review-form.html');
      expect(task.properties.formFields).toHaveLength(2);
    });

    it('should handle execution listeners', () => {
      const task = process.addElement('bpmn:UserTask');
      
      process.addExecutionListener(task.id, {
        event: 'start',
        listenerType: 'class',
        class: 'com.example.TaskStartListener'
      });
      
      process.addExecutionListener(task.id, {
        event: 'end',
        listenerType: 'expression',
        expression: '${myBean.onTaskComplete(execution)}'
      });
      
      const element = process.getElementById(task.id);
      expect(element?.executionListeners).toHaveLength(2);
    });

    it('should handle input/output parameters', () => {
      const task = process.addElement('bpmn:ServiceTask');
      
      process.addInputParameter(task.id, 'orderId', '${order.id}');
      process.addInputParameter(task.id, 'amount', '${order.total}');
      process.addOutputParameter(task.id, 'result', '${executionResult}');
      
      const element = process.getElementById(task.id);
      expect(element?.inputParameters).toHaveLength(2);
      expect(element?.outputParameters).toHaveLength(1);
    });
  });

  describe('XML Serialization', () => {
    it('should serialize to valid BPMN 2.0 XML', () => {
      const startEvent = process.getElements()[0];
      const task = process.addElement('bpmn:UserTask', { name: 'Review' });
      const endEvent = process.addElement('bpmn:EndEvent', { name: 'Done' });
      
      process.addSequenceFlow(startEvent!.id, task.id);
      process.addSequenceFlow(task.id, endEvent.id);
      
      const xml = process.toXML();
      const serializer = new XMLSerializer();
      
      expect(() => serializer.validate(xml)).not.toThrow();
    });

    it('should include BPMN DI layout information', () => {
      const task = process.addElement('bpmn:UserTask', {
        position: { x: 300, y: 200 },
        size: { width: 100, height: 80 }
      });
      
      const xml = process.toXML();
      expect(xml).toContain('<bpmndi:BPMNDiagram');
      expect(xml).toContain('<bpmndi:BPMNPlane');
      expect(xml).toContain(`bpmnElement="${task.id}"`);
      expect(xml).toContain('x="300" y="200"');
      expect(xml).toContain('width="100" height="80"');
    });

    it('should deserialize from XML correctly', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL">
          <bpmn:process id="TestProcess" name="Test" isExecutable="true">
            <bpmn:startEvent id="Start_1" name="Start" />
            <bpmn:userTask id="Task_1" name="Review" camunda:assignee="john" />
            <bpmn:endEvent id="End_1" name="End" />
          </bpmn:process>
        </bpmn:definitions>`;
      
      const importedProcess = BPMNProcess.fromXML(xml);
      
      expect(importedProcess.id).toBe('TestProcess');
      expect(importedProcess.name).toBe('Test');
      expect(importedProcess.getElements()).toHaveLength(3);
    });
  });

  describe('Process Cloning', () => {
    it('should create a deep clone with new IDs', () => {
      const task = process.addElement('bpmn:UserTask', { name: 'Original' });
      const clone = process.clone();
      
      expect(clone.id).not.toBe(process.id);
      expect(clone.getElements()).toHaveLength(process.getElements().length);
      
      const clonedTask = clone.getElements().find(e => e.type === 'bpmn:UserTask');
      expect(clonedTask?.id).not.toBe(task.id);
      expect(clonedTask?.name).toBe('Original');
    });
  });
});