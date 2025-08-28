import { BPMNElement } from '../models/BPMNProcess';

export class ElementFactory {
  static createElement(type: string, properties: Partial<BPMNElement> = {}): Partial<BPMNElement> {
    const baseElement: Partial<BPMNElement> = {
      type,
      properties: {},
      ...properties
    };

    // Set default properties based on element type
    switch (type) {
      case 'bpmn:UserTask':
        return {
          ...baseElement,
          size: { width: 100, height: 80 },
          properties: {
            ...baseElement.properties,
            asyncBefore: false,
            asyncAfter: false,
            exclusive: true
          }
        };
      
      case 'bpmn:ServiceTask':
        return {
          ...baseElement,
          size: { width: 100, height: 80 },
          properties: {
            ...baseElement.properties,
            asyncBefore: false,
            asyncAfter: false,
            exclusive: true
          }
        };
      
      case 'bpmn:StartEvent':
        return {
          ...baseElement,
          size: { width: 36, height: 36 }
        };
      
      case 'bpmn:EndEvent':
        return {
          ...baseElement,
          size: { width: 36, height: 36 }
        };
      
      case 'bpmn:ExclusiveGateway':
        return {
          ...baseElement,
          size: { width: 50, height: 50 }
        };
      
      case 'bpmn:ParallelGateway':
        return {
          ...baseElement,
          size: { width: 50, height: 50 }
        };
      
      default:
        return baseElement;
    }
  }

  static getElementTypes(): string[] {
    return [
      'bpmn:StartEvent',
      'bpmn:EndEvent',
      'bpmn:UserTask',
      'bpmn:ServiceTask',
      'bpmn:ScriptTask',
      'bpmn:BusinessRuleTask',
      'bpmn:SendTask',
      'bpmn:ReceiveTask',
      'bpmn:ManualTask',
      'bpmn:ExclusiveGateway',
      'bpmn:ParallelGateway',
      'bpmn:InclusiveGateway',
      'bpmn:EventBasedGateway',
      'bpmn:IntermediateCatchEvent',
      'bpmn:IntermediateThrowEvent',
      'bpmn:BoundaryEvent',
      'bpmn:SubProcess',
      'bpmn:CallActivity'
    ];
  }

  static getCamundaProperties(elementType: string): string[] {
    const commonProperties = [
      'asyncBefore',
      'asyncAfter',
      'exclusive',
      'jobRetryTimeCycle',
      'jobPriority'
    ];

    switch (elementType) {
      case 'bpmn:UserTask':
        return [
          ...commonProperties,
          'assignee',
          'candidateUsers',
          'candidateGroups',
          'dueDate',
          'followUpDate',
          'priority',
          'formKey'
        ];
      
      case 'bpmn:ServiceTask':
        return [
          ...commonProperties,
          'class',
          'delegateExpression',
          'expression',
          'resultVariable',
          'topic',
          'taskPriority'
        ];
      
      case 'bpmn:ScriptTask':
        return [
          ...commonProperties,
          'scriptFormat',
          'script',
          'resultVariable',
          'resource'
        ];
      
      default:
        return commonProperties;
    }
  }
}