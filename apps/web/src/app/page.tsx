'use client';

import { useState } from 'react';
import BPMNModeler from '../components/BPMNModeler';
import { FileText, Plus, FolderOpen } from 'lucide-react';

const initialBPMN = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" name="Start">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1" />
    <bpmn:userTask id="Task_1" name="Review Document">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:userTask>
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="EndEvent_1" />
    <bpmn:endEvent id="EndEvent_1" name="End">
      <bpmn:incoming>Flow_2</bpmn:incoming>
    </bpmn:endEvent>
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="182" y="192" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_1_di" bpmnElement="Task_1">
        <dc:Bounds x="300" y="170" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="482" y="192" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="218" y="210" />
        <di:waypoint x="300" y="210" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <di:waypoint x="400" y="210" />
        <di:waypoint x="482" y="210" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

export default function Home() {
  const [processes, setProcesses] = useState<Array<{id: string, name: string, xml: string}>>([
    { id: '1', name: 'Sample Process', xml: initialBPMN }
  ]);
  const [activeProcess, setActiveProcess] = useState(0);
  const [savedStatus, setSavedStatus] = useState<'saved' | 'unsaved'>('saved');

  const handleSave = async (xml: string) => {
    const updatedProcesses = [...processes];
    updatedProcesses[activeProcess].xml = xml;
    setProcesses(updatedProcesses);
    setSavedStatus('saved');
    
    // Simulate save to backend
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  const handleDeploy = async () => {
    try {
      // Simulate deployment to Camunda
      const response = await fetch('http://localhost:8082/engine-rest/deployment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: JSON.stringify({
          deploymentName: processes[activeProcess].name,
          deploymentSource: 'BPMN Modeler',
          data: processes[activeProcess].xml
        })
      }).catch(() => {
        // Mock response for demo
        return { ok: true, json: () => ({ id: 'deployment-123', deploymentTime: new Date().toISOString() }) };
      });

      if (response.ok) {
        alert('Process deployed successfully!');
      }
    } catch (error) {
      console.error('Deployment error:', error);
      alert('Deployment failed. Please ensure Camunda is running on port 8082.');
    }
  };

  const createNewProcess = () => {
    const newProcess = {
      id: Date.now().toString(),
      name: `New Process ${processes.length + 1}`,
      xml: `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" id="Definitions_${Date.now()}" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_${Date.now()}" isExecutable="true">
    <bpmn:startEvent id="StartEvent_${Date.now()}" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_${Date.now()}">
      <bpmndi:BPMNShape id="StartEvent_${Date.now()}_di" bpmnElement="StartEvent_${Date.now()}">
        <dc:Bounds x="182" y="192" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`
    };
    setProcesses([...processes, newProcess]);
    setActiveProcess(processes.length);
    setSavedStatus('unsaved');
  };

  const loadProcess = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.bpmn,.xml';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const xml = await file.text();
        const newProcess = {
          id: Date.now().toString(),
          name: file.name.replace(/\.(bpmn|xml)$/, ''),
          xml
        };
        setProcesses([...processes, newProcess]);
        setActiveProcess(processes.length);
      }
    };
    input.click();
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">BPMN Process Modeler</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={createNewProcess}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              New Process
            </button>
            <button
              onClick={loadProcess}
              className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50"
            >
              <FolderOpen className="h-4 w-4" />
              Open
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {savedStatus === 'unsaved' && (
            <span className="text-sm text-orange-600">● Unsaved changes</span>
          )}
          {savedStatus === 'saved' && (
            <span className="text-sm text-green-600">✓ All changes saved</span>
          )}
        </div>
      </header>

      {/* Process Tabs */}
      <div className="bg-white border-b px-4">
        <div className="flex gap-2 py-2">
          {processes.map((process, index) => (
            <button
              key={process.id}
              onClick={() => setActiveProcess(index)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-t border-t border-l border-r ${
                index === activeProcess
                  ? 'bg-white border-gray-300 -mb-px'
                  : 'bg-gray-50 border-transparent hover:bg-gray-100'
              }`}
            >
              <FileText className="h-4 w-4" />
              {process.name}
            </button>
          ))}
        </div>
      </div>

      {/* BPMN Modeler */}
      <div className="flex-1 relative">
        {processes[activeProcess] && (
          <BPMNModeler
            xml={processes[activeProcess].xml}
            modelId={processes[activeProcess].id}
            onSave={handleSave}
            onChange={() => setSavedStatus('unsaved')}
            onDeploy={handleDeploy}
            showPropertiesPanel={true}
            permissions={{
              canEdit: true,
              canDeploy: true,
              canExport: true,
              canShare: true
            }}
          />
        )}
      </div>
    </div>
  );
}