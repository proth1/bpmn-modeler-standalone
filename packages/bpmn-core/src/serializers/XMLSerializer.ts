import { BPMNProcess, BPMNElement } from '../models/BPMNProcess';
import * as xmljs from 'xml-js';

export class XMLSerializer {
  serialize(process: BPMNProcess): string {
    const bpmnDefinitions = {
      _declaration: {
        _attributes: {
          version: '1.0',
          encoding: 'UTF-8'
        }
      },
      'bpmn:definitions': {
        _attributes: {
          'xmlns:bpmn': 'http://www.omg.org/spec/BPMN/20100524/MODEL',
          'xmlns:bpmndi': 'http://www.omg.org/spec/BPMN/20100524/DI',
          'xmlns:dc': 'http://www.omg.org/spec/DD/20100524/DC',
          'xmlns:di': 'http://www.omg.org/spec/DD/20100524/DI',
          'xmlns:camunda': 'http://camunda.org/schema/1.0/bpmn',
          'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
          'xmlns:modeler': 'http://camunda.org/schema/modeler/1.0',
          'id': `Definitions_${process.id}`,
          'targetNamespace': 'http://bpmn.io/schema/bpmn',
          'exporter': 'BPMN Modeler',
          'exporterVersion': '1.0.0',
          'modeler:executionPlatform': 'Camunda Platform',
          'modeler:executionPlatformVersion': '7.23.0'
        },
        'bpmn:process': this.serializeProcess(process),
        'bpmndi:BPMNDiagram': this.serializeDiagram(process)
      }
    };

    return xmljs.js2xml(bpmnDefinitions, { compact: true, spaces: 2 });
  }

  private serializeProcess(process: BPMNProcess): any {
    const processElement: any = {
      _attributes: {
        id: process.id,
        name: process.name,
        isExecutable: process.isExecutable,
        'camunda:versionTag': process.versionTag,
        'camunda:historyTimeToLive': process.historyTimeToLive
      }
    };

    // Add elements
    process.getElements().forEach(element => {
      const elementKey = element.type;
      if (!processElement[elementKey]) {
        processElement[elementKey] = [];
      }
      processElement[elementKey].push(this.serializeElement(element));
    });

    return processElement;
  }

  private serializeElement(element: BPMNElement): any {
    const serialized: any = {
      _attributes: {
        id: element.id
      }
    };

    if (element.name) {
      serialized._attributes.name = element.name;
    }

    // Add Camunda attributes
    if (element.properties.assignee) {
      serialized._attributes['camunda:assignee'] = element.properties.assignee;
    }
    if (element.properties.candidateUsers) {
      serialized._attributes['camunda:candidateUsers'] = element.properties.candidateUsers;
    }
    if (element.properties.candidateGroups) {
      serialized._attributes['camunda:candidateGroups'] = element.properties.candidateGroups;
    }
    if (element.properties.dueDate) {
      serialized._attributes['camunda:dueDate'] = element.properties.dueDate;
    }
    if (element.properties.formKey) {
      serialized._attributes['camunda:formKey'] = element.properties.formKey;
    }
    if (element.properties.javaClass) {
      serialized._attributes['camunda:class'] = element.properties.javaClass;
    }
    if (element.properties.implementation === 'external') {
      serialized._attributes['camunda:type'] = 'external';
      if (element.properties.topic) {
        serialized._attributes['camunda:topic'] = element.properties.topic;
      }
    }

    // Add documentation
    if (element.documentation) {
      serialized['bpmn:documentation'] = {
        _text: element.documentation
      };
    }

    // Add execution listeners
    if (element.executionListeners && element.executionListeners.length > 0) {
      serialized['bpmn:extensionElements'] = {
        'camunda:executionListener': element.executionListeners.map(listener => ({
          _attributes: {
            event: listener.event,
            class: listener.class,
            expression: listener.expression,
            delegateExpression: listener.delegateExpression
          }
        }))
      };
    }

    // Add input/output parameters
    if ((element.inputParameters && element.inputParameters.length > 0) ||
        (element.outputParameters && element.outputParameters.length > 0)) {
      if (!serialized['bpmn:extensionElements']) {
        serialized['bpmn:extensionElements'] = {};
      }
      
      serialized['bpmn:extensionElements']['camunda:inputOutput'] = {};
      
      if (element.inputParameters && element.inputParameters.length > 0) {
        serialized['bpmn:extensionElements']['camunda:inputOutput']['camunda:inputParameter'] = 
          element.inputParameters.map(param => ({
            _attributes: { name: param.name },
            _text: param.value
          }));
      }
      
      if (element.outputParameters && element.outputParameters.length > 0) {
        serialized['bpmn:extensionElements']['camunda:inputOutput']['camunda:outputParameter'] = 
          element.outputParameters.map(param => ({
            _attributes: { name: param.name },
            _text: param.value
          }));
      }
    }

    return serialized;
  }

  private serializeDiagram(process: BPMNProcess): any {
    return {
      _attributes: {
        id: 'BPMNDiagram_1'
      },
      'bpmndi:BPMNPlane': {
        _attributes: {
          id: 'BPMNPlane_1',
          bpmnElement: process.id
        },
        'bpmndi:BPMNShape': process.getElements().map(element => ({
          _attributes: {
            id: `${element.id}_di`,
            bpmnElement: element.id
          },
          'dc:Bounds': {
            _attributes: {
              x: element.position?.x || 100,
              y: element.position?.y || 100,
              width: element.size?.width || (element.type.includes('Event') ? 36 : 100),
              height: element.size?.height || (element.type.includes('Event') ? 36 : 80)
            }
          }
        }))
      }
    };
  }

  deserialize(xml: string): BPMNProcess {
    const parsed = xmljs.xml2js(xml, { compact: true }) as any;
    const definitions = parsed['bpmn:definitions'];
    const processElement = definitions['bpmn:process'];
    
    const process = new BPMNProcess(processElement._attributes.id);
    process.name = processElement._attributes.name || 'Imported Process';
    process.isExecutable = processElement._attributes.isExecutable === 'true';
    
    // Clear default start event
    const elements = process.getElements();
    elements.forEach(e => process.removeElement(e.id));
    
    // Import elements
    Object.keys(processElement).forEach(key => {
      if (key.startsWith('bpmn:') && key !== 'bpmn:process') {
        const elementArray = Array.isArray(processElement[key]) ? processElement[key] : [processElement[key]];
        elementArray.forEach((elem: any) => {
          if (elem._attributes) {
            const element = process.addElement(key, {
              id: elem._attributes.id,
              name: elem._attributes.name
            });
            
            // Import Camunda properties
            if (elem._attributes['camunda:assignee']) {
              element.properties.assignee = elem._attributes['camunda:assignee'];
            }
          }
        });
      }
    });
    
    return process;
  }

  validate(xml: string): void {
    // Basic XML validation
    try {
      xmljs.xml2js(xml, { compact: true });
    } catch (error) {
      throw new Error(`Invalid XML: ${error}`);
    }
  }
}