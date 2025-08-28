import { v4 as uuidv4 } from 'uuid';
import { XMLSerializer } from '../serializers/XMLSerializer';
import { ElementFactory } from '../factories/ElementFactory';

export interface BPMNElement {
  id: string;
  type: string;
  name?: string;
  documentation?: string;
  properties: Record<string, any>;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  executionListeners?: ExecutionListener[];
  inputParameters?: Parameter[];
  outputParameters?: Parameter[];
  sourceRef?: string;
  targetRef?: string;
  incoming?: string[];
  outgoing?: string[];
}

export interface ExecutionListener {
  event: string;
  listenerType: 'class' | 'expression' | 'delegateExpression' | 'script';
  class?: string;
  expression?: string;
  delegateExpression?: string;
  script?: string;
  scriptFormat?: string;
}

export interface Parameter {
  name: string;
  value: string;
  type?: string;
}

export interface ProcessValidationError {
  type: 'error' | 'warning';
  message: string;
  elementId?: string;
}

export class BPMNProcess {
  public id: string;
  public name: string;
  public isExecutable: boolean;
  public versionTag: string;
  public historyTimeToLive: string;
  private elements: Map<string, BPMNElement>;
  private sequenceFlows: Map<string, BPMNElement>;

  constructor(id?: string) {
    this.id = id || `Process_${this.generateId()}`;
    this.name = 'New Process';
    this.isExecutable = true;
    this.versionTag = '1.0.0';
    this.historyTimeToLive = 'P30D';
    this.elements = new Map();
    this.sequenceFlows = new Map();
    
    // Add default start event
    this.addElement('bpmn:StartEvent');
  }

  private generateId(): string {
    return uuidv4().substring(0, 8);
  }

  public addElement(type: string, properties: Partial<BPMNElement> = {}): BPMNElement {
    const elementType = type.split(':')[1] || type;
    const id = properties.id || `${elementType}_${this.generateId()}`;
    
    const element: BPMNElement = {
      id,
      type,
      name: properties.name,
      documentation: properties.documentation,
      properties: properties.properties || {},
      position: properties.position,
      size: properties.size,
      executionListeners: properties.executionListeners || [],
      inputParameters: properties.inputParameters || [],
      outputParameters: properties.outputParameters || [],
      incoming: [],
      outgoing: []
    };

    // Handle specific properties
    if (properties.assignee) element.properties.assignee = properties.assignee;
    if (properties.candidateUsers) element.properties.candidateUsers = properties.candidateUsers;
    if (properties.candidateGroups) element.properties.candidateGroups = properties.candidateGroups;
    if (properties.dueDate) element.properties.dueDate = properties.dueDate;
    if (properties.followUpDate) element.properties.followUpDate = properties.followUpDate;
    if (properties.priority) element.properties.priority = properties.priority;
    if (properties.formKey) element.properties.formKey = properties.formKey;
    if (properties.formFields) element.properties.formFields = properties.formFields;
    if (properties.implementation) element.properties.implementation = properties.implementation;
    if (properties.javaClass) element.properties.javaClass = properties.javaClass;
    if (properties.topic) element.properties.topic = properties.topic;
    if (properties.taskPriority) element.properties.taskPriority = properties.taskPriority;

    this.elements.set(id, element);
    return element;
  }

  public removeElement(elementId: string): void {
    this.elements.delete(elementId);
    
    // Remove related sequence flows
    this.sequenceFlows.forEach((flow, flowId) => {
      if (flow.sourceRef === elementId || flow.targetRef === elementId) {
        this.sequenceFlows.delete(flowId);
      }
    });
  }

  public updateElement(elementId: string, updates: Partial<BPMNElement>): void {
    const element = this.elements.get(elementId);
    if (!element) return;

    if (updates.name !== undefined) element.name = updates.name;
    if (updates.assignee) element.properties.assignee = updates.assignee;
    if (updates.candidateGroups) element.properties.candidateGroups = updates.candidateGroups;
    
    Object.assign(element.properties, updates);
  }

  public getElementById(elementId: string): BPMNElement | undefined {
    return this.elements.get(elementId) || this.sequenceFlows.get(elementId);
  }

  public getElements(): BPMNElement[] {
    return Array.from(this.elements.values());
  }

  public addSequenceFlow(sourceId: string, targetId: string, properties: Partial<BPMNElement> = {}): BPMNElement {
    const id = properties.id || `Flow_${this.generateId()}`;
    
    const flow: BPMNElement = {
      id,
      type: 'bpmn:SequenceFlow',
      sourceRef: sourceId,
      targetRef: targetId,
      properties: properties.properties || {}
    };

    // Update source and target elements
    const source = this.elements.get(sourceId);
    const target = this.elements.get(targetId);
    
    if (source) {
      source.outgoing = source.outgoing || [];
      source.outgoing.push(id);
    }
    
    if (target) {
      target.incoming = target.incoming || [];
      target.incoming.push(id);
    }

    this.sequenceFlows.set(id, flow);
    return flow;
  }

  public addExecutionListener(elementId: string, listener: ExecutionListener): void {
    const element = this.elements.get(elementId);
    if (!element) return;
    
    if (!element.executionListeners) {
      element.executionListeners = [];
    }
    element.executionListeners.push(listener);
  }

  public addInputParameter(elementId: string, name: string, value: string): void {
    const element = this.elements.get(elementId);
    if (!element) return;
    
    if (!element.inputParameters) {
      element.inputParameters = [];
    }
    element.inputParameters.push({ name, value });
  }

  public addOutputParameter(elementId: string, name: string, value: string): void {
    const element = this.elements.get(elementId);
    if (!element) return;
    
    if (!element.outputParameters) {
      element.outputParameters = [];
    }
    element.outputParameters.push({ name, value });
  }

  public validate(): ProcessValidationError[] {
    const errors: ProcessValidationError[] = [];
    
    // Check for start events
    const startEvents = Array.from(this.elements.values()).filter(e => e.type === 'bpmn:StartEvent');
    if (startEvents.length === 0) {
      errors.push({
        type: 'error',
        message: 'Process must have at least one start event'
      });
    }
    
    // Check for end events
    const endEvents = Array.from(this.elements.values()).filter(e => e.type === 'bpmn:EndEvent');
    if (endEvents.length === 0) {
      errors.push({
        type: 'warning',
        message: 'Process should have at least one end event'
      });
    }
    
    // Check element connections
    this.elements.forEach(element => {
      if (element.type !== 'bpmn:StartEvent' && (!element.incoming || element.incoming.length === 0)) {
        errors.push({
          type: 'error',
          elementId: element.id,
          message: `Element ${element.id} has no incoming connections`
        });
      }
      
      if (element.type !== 'bpmn:EndEvent' && (!element.outgoing || element.outgoing.length === 0)) {
        errors.push({
          type: 'error',
          elementId: element.id,
          message: `Element ${element.id} has no outgoing connections`
        });
      }
    });
    
    // Check gateways
    this.elements.forEach(element => {
      if (element.type === 'bpmn:ExclusiveGateway') {
        const outgoingFlows = element.outgoing || [];
        if (outgoingFlows.length > 1) {
          const hasConditions = outgoingFlows.some(flowId => {
            const flow = this.sequenceFlows.get(flowId);
            return flow && flow.properties.conditionExpression;
          });
          
          if (!hasConditions) {
            errors.push({
              type: 'warning',
              elementId: element.id,
              message: 'Exclusive gateway should have conditions on outgoing flows'
            });
          }
        }
      }
    });
    
    // Check service tasks
    this.elements.forEach(element => {
      if (element.type === 'bpmn:ServiceTask') {
        if (!element.properties.implementation && !element.properties.javaClass && !element.properties.topic) {
          errors.push({
            type: 'error',
            elementId: element.id,
            message: 'Service task must have an implementation'
          });
        }
      }
    });
    
    return errors;
  }

  public toXML(): string {
    const serializer = new XMLSerializer();
    return serializer.serialize(this);
  }

  public static fromXML(xml: string): BPMNProcess {
    const serializer = new XMLSerializer();
    return serializer.deserialize(xml);
  }

  public clone(): BPMNProcess {
    const cloned = new BPMNProcess();
    cloned.name = this.name;
    cloned.isExecutable = this.isExecutable;
    cloned.versionTag = this.versionTag;
    cloned.historyTimeToLive = this.historyTimeToLive;
    
    // Clear default start event
    cloned.elements.clear();
    
    // Clone elements with new IDs
    const idMap = new Map<string, string>();
    
    this.elements.forEach(element => {
      const newElement = { ...element };
      newElement.id = `${element.type.split(':')[1]}_${cloned.generateId()}`;
      idMap.set(element.id, newElement.id);
      cloned.elements.set(newElement.id, newElement);
    });
    
    // Clone sequence flows with updated references
    this.sequenceFlows.forEach(flow => {
      const newFlow = { ...flow };
      newFlow.id = `Flow_${cloned.generateId()}`;
      if (flow.sourceRef) newFlow.sourceRef = idMap.get(flow.sourceRef) || flow.sourceRef;
      if (flow.targetRef) newFlow.targetRef = idMap.get(flow.targetRef) || flow.targetRef;
      cloned.sequenceFlows.set(newFlow.id, newFlow);
    });
    
    return cloned;
  }
}