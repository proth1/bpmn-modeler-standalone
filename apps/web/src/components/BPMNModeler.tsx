'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Save, 
  Download,
  Upload,
  ZoomIn,
  ZoomOut,
  Maximize,
  Play,
  Eye,
  EyeOff,
  Code,
  Settings,
  GitBranch,
  Clock,
  Users,
  Shield,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Package,
  Server
} from 'lucide-react';

// BPMN.js imports - These will be dynamically imported to avoid SSR issues
import dynamic from 'next/dynamic';

interface BPMNModelerProps {
  xml: string;
  modelId?: string;
  onSave?: (xml: string) => Promise<void>;
  onChange?: (xml: string) => void;
  onDeploy?: () => Promise<void>;
  readOnly?: boolean;
  showPropertiesPanel?: boolean;
  permissions?: {
    canEdit: boolean;
    canDeploy: boolean;
    canExport: boolean;
    canShare: boolean;
  };
}

interface SelectedElement {
  id: string;
  type: string;
  businessObject: any;
}

interface PropertyGroup {
  id: string;
  label: string;
  icon: React.ReactNode;
  entries: PropertyEntry[];
}

interface PropertyEntry {
  id: string;
  label: string;
  type: 'text' | 'select' | 'checkbox' | 'number' | 'textarea';
  value: any;
  options?: { value: string; label: string }[];
  description?: string;
  validation?: (value: any) => string | null;
}

const BPMNModeler: React.FC<BPMNModelerProps> = ({
  xml,
  modelId,
  onSave,
  onChange,
  onDeploy,
  readOnly = false,
  showPropertiesPanel = true,
  permissions = {
    canEdit: true,
    canDeploy: true,
    canExport: true,
    canShare: true
  }
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const modelerRef = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);
  
  const [currentZoom, setCurrentZoom] = useState(1);
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [isPropertiesPanelVisible, setIsPropertiesPanelVisible] = useState(showPropertiesPanel);
  const [showXmlView, setShowXmlView] = useState(false);
  const [xmlContent, setXmlContent] = useState(xml);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [propertyGroups, setPropertyGroups] = useState<PropertyGroup[]>([]);

  // Initialize BPMN Modeler on client side only
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !containerRef.current) return;

    const initModeler = async () => {
      // Dynamic import to avoid SSR issues
      const BpmnModeler = (await import('bpmn-js/lib/Modeler')).default;
      const {
        BpmnPropertiesPanelModule,
        BpmnPropertiesProviderModule,
      } = await import('bpmn-js-properties-panel');
      const camundaModdleDescriptor = (await import('camunda-bpmn-moddle/resources/camunda')).default;

      const modeler = new BpmnModeler({
        container: containerRef.current!,
        additionalModules: showPropertiesPanel ? [
          BpmnPropertiesPanelModule,
          BpmnPropertiesProviderModule
        ] : [],
        moddleExtensions: {
          camunda: camundaModdleDescriptor
        },
        keyboard: {
          bindTo: document
        }
      });

      modelerRef.current = modeler;

      // Import initial XML
      if (xml) {
        try {
          await modeler.importXML(xml);
        } catch (err) {
          console.error('Error importing BPMN:', err);
          setValidationErrors([(err as Error).message]);
        }
      }

      // Event listeners
      const eventBus = modeler.get('eventBus' as any);
      
      // Selection changed
      eventBus.on('selection.changed', (e: any) => {
        const selectedElements = e.newSelection;
        if (selectedElements.length === 1) {
          const element = selectedElements[0];
          setSelectedElement({
            id: element.id,
            type: element.type,
            businessObject: element.businessObject
          });
          updatePropertyGroups(element);
        } else {
          setSelectedElement(null);
          setPropertyGroups([]);
        }
      });

      // Element changed
      eventBus.on('commandStack.changed', async () => {
        try {
          const { xml } = await modeler.saveXML({ format: true });
          setXmlContent(xml || '');
          onChange?.(xml || '');
          validateDiagram();
        } catch (err) {
          console.error('Error saving XML:', err);
        }
      });
    };

    initModeler();

    return () => {
      if (modelerRef.current) {
        modelerRef.current.destroy();
      }
    };
  }, [isClient, xml]);

  // Update property groups based on selected element
  const updatePropertyGroups = (element: any) => {
    const groups: PropertyGroup[] = [];
    const bo = element.businessObject;

    // General properties
    groups.push({
      id: 'general',
      label: 'General',
      icon: <FileText className="h-4 w-4" />,
      entries: [
        {
          id: 'id',
          label: 'ID',
          type: 'text',
          value: bo.id,
          description: 'Technical identifier',
          validation: (value) => {
            if (!value) return 'ID is required';
            if (!/^[a-zA-Z0-9_-]+$/.test(value)) return 'Invalid ID format';
            return null;
          }
        },
        {
          id: 'name',
          label: 'Name',
          type: 'text',
          value: bo.name || '',
          description: 'Display name for the element'
        },
        {
          id: 'documentation',
          label: 'Documentation',
          type: 'textarea',
          value: bo.documentation?.[0]?.text || '',
          description: 'Detailed description'
        }
      ]
    });

    // Task-specific properties
    if (element.type.includes('Task')) {
      groups.push({
        id: 'execution',
        label: 'Execution',
        icon: <Play className="h-4 w-4" />,
        entries: [
          {
            id: 'async',
            label: 'Asynchronous',
            type: 'checkbox',
            value: bo.async || false,
            description: 'Execute task asynchronously'
          },
          {
            id: 'retries',
            label: 'Retry Count',
            type: 'number',
            value: bo.retries || 3,
            description: 'Number of retry attempts'
          },
          {
            id: 'priority',
            label: 'Priority',
            type: 'number',
            value: bo.priority || 0,
            description: 'Task priority (higher = more important)'
          }
        ]
      });

      // User Task properties
      if (element.type === 'bpmn:UserTask') {
        groups.push({
          id: 'assignment',
          label: 'Assignment',
          icon: <Users className="h-4 w-4" />,
          entries: [
            {
              id: 'assignee',
              label: 'Assignee',
              type: 'text',
              value: bo.assignee || '',
              description: 'User ID or expression'
            },
            {
              id: 'candidateUsers',
              label: 'Candidate Users',
              type: 'text',
              value: bo.candidateUsers || '',
              description: 'Comma-separated user IDs'
            },
            {
              id: 'candidateGroups',
              label: 'Candidate Groups',
              type: 'text',
              value: bo.candidateGroups || '',
              description: 'Comma-separated group IDs'
            },
            {
              id: 'dueDate',
              label: 'Due Date',
              type: 'text',
              value: bo.dueDate || '',
              description: 'Due date expression (e.g., PT48H)'
            }
          ]
        });

        // Form properties
        groups.push({
          id: 'forms',
          label: 'Forms',
          icon: <FileText className="h-4 w-4" />,
          entries: [
            {
              id: 'formKey',
              label: 'Form Key',
              type: 'text',
              value: bo.formKey || '',
              description: 'Form identifier or path'
            }
          ]
        });
      }

      // Service Task properties
      if (element.type === 'bpmn:ServiceTask') {
        groups.push({
          id: 'implementation',
          label: 'Implementation',
          icon: <Server className="h-4 w-4" />,
          entries: [
            {
              id: 'implementationType',
              label: 'Implementation',
              type: 'select',
              value: bo.class ? 'class' : bo.delegateExpression ? 'delegate' : bo.expression ? 'expression' : 'external',
              options: [
                { value: 'class', label: 'Java Class' },
                { value: 'delegate', label: 'Delegate Expression' },
                { value: 'expression', label: 'Expression' },
                { value: 'external', label: 'External Task' }
              ]
            },
            {
              id: 'topic',
              label: 'Topic',
              type: 'text',
              value: bo.topic || '',
              description: 'External task topic'
            }
          ]
        });
      }
    }

    // Gateway properties
    if (element.type.includes('Gateway')) {
      groups.push({
        id: 'gateway',
        label: 'Gateway',
        icon: <GitBranch className="h-4 w-4" />,
        entries: [
          {
            id: 'defaultFlow',
            label: 'Default Flow',
            type: 'text',
            value: bo.default?.id || '',
            description: 'Default sequence flow ID'
          }
        ]
      });
    }

    setPropertyGroups(groups);
  };

  // Handle property changes
  const handlePropertyChange = (groupId: string, entryId: string, value: any) => {
    if (!modelerRef.current || !selectedElement) return;

    const modeling = modelerRef.current.get('modeling' as any);
    const elementRegistry = modelerRef.current.get('elementRegistry' as any);
    const element = elementRegistry.get(selectedElement.id);

    if (!element) return;

    // Update the property based on the entry ID
    const updateObject: any = {};
    
    switch (entryId) {
      case 'name':
        modeling.updateProperties(element, { name: value });
        break;
      case 'documentation':
        modeling.updateProperties(element, {
          documentation: value ? [{ text: value }] : []
        });
        break;
      default:
        modeling.updateProperties(element, { [entryId]: value });
    }

    // Update property groups to reflect changes
    updatePropertyGroups(element);
  };

  // Validate BPMN diagram
  const validateDiagram = async () => {
    if (!modelerRef.current) return;

    const errors: string[] = [];
    const elementRegistry = modelerRef.current.get('elementRegistry' as any);
    
    // Check for start events
    const startEvents = elementRegistry.filter((element: any) => 
      element.type === 'bpmn:StartEvent'
    );
    if (startEvents.length === 0) {
      errors.push('Process must have at least one start event');
    }

    // Check for end events
    const endEvents = elementRegistry.filter((element: any) => 
      element.type === 'bpmn:EndEvent'
    );
    if (endEvents.length === 0) {
      errors.push('Process must have at least one end event');
    }

    setValidationErrors(errors);
  };

  // Toolbar actions
  const handleSave = async () => {
    if (!permissions.canEdit || !onSave) return;
    
    setIsSaving(true);
    try {
      await onSave(xmlContent);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeploy = async () => {
    if (!permissions.canDeploy || !onDeploy) return;
    
    setIsDeploying(true);
    try {
      await onDeploy();
    } catch (error) {
      console.error('Deploy error:', error);
    } finally {
      setIsDeploying(false);
    }
  };

  const handleExport = () => {
    if (!permissions.canExport) return;
    
    const blob = new Blob([xmlContent], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `process-${modelId || 'model'}.bpmn`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleZoomIn = () => {
    if (!modelerRef.current) return;
    const canvas = modelerRef.current.get('canvas' as any);
    const newZoom = Math.min(currentZoom * 1.2, 4);
    canvas.zoom(newZoom);
    setCurrentZoom(newZoom);
  };

  const handleZoomOut = () => {
    if (!modelerRef.current) return;
    const canvas = modelerRef.current.get('canvas' as any);
    const newZoom = Math.max(currentZoom / 1.2, 0.2);
    canvas.zoom(newZoom);
    setCurrentZoom(newZoom);
  };

  const handleZoomFit = () => {
    if (!modelerRef.current) return;
    const canvas = modelerRef.current.get('canvas' as any);
    canvas.zoom('fit-viewport');
    setCurrentZoom(1);
  };

  const handleUndo = () => {
    if (!modelerRef.current) return;
    const commandStack = modelerRef.current.get('commandStack' as any);
    if (commandStack.canUndo()) {
      commandStack.undo();
    }
  };

  const handleRedo = () => {
    if (!modelerRef.current) return;
    const commandStack = modelerRef.current.get('commandStack' as any);
    if (commandStack.canRedo()) {
      commandStack.redo();
    }
  };

  if (!isClient) {
    return <div className="flex h-full items-center justify-center">Loading modeler...</div>;
  }

  return (
    <div className="flex h-full bg-gray-50">
      {/* Main Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {permissions.canEdit && (
              <>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleUndo}
                  className="p-1.5 hover:bg-gray-100 rounded"
                  title="Undo (Ctrl+Z)"
                >
                  <RefreshCw className="h-4 w-4 rotate-180" />
                </button>
                <button
                  onClick={handleRedo}
                  className="p-1.5 hover:bg-gray-100 rounded"
                  title="Redo (Ctrl+Shift+Z)"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </>
            )}
            
            <div className="h-6 w-px bg-gray-300" />
            
            <button onClick={handleZoomOut} className="p-1.5 hover:bg-gray-100 rounded">
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-sm text-gray-600">{Math.round(currentZoom * 100)}%</span>
            <button onClick={handleZoomIn} className="p-1.5 hover:bg-gray-100 rounded">
              <ZoomIn className="h-4 w-4" />
            </button>
            <button onClick={handleZoomFit} className="p-1.5 hover:bg-gray-100 rounded">
              <Maximize className="h-4 w-4" />
            </button>
            
            <div className="h-6 w-px bg-gray-300" />
            
            <button
              onClick={() => setShowXmlView(!showXmlView)}
              className={`p-1.5 rounded ${showXmlView ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
            >
              <Code className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsPropertiesPanelVisible(!isPropertiesPanelVisible)}
              className={`p-1.5 rounded ${isPropertiesPanelVisible ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            {permissions.canExport && (
              <button
                onClick={handleExport}
                className="px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            )}
            {permissions.canDeploy && (
              <button
                onClick={handleDeploy}
                disabled={isDeploying || validationErrors.length > 0}
                className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                {isDeploying ? 'Deploying...' : 'Deploy to Camunda'}
              </button>
            )}
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Validation Issues</p>
                <ul className="text-sm text-red-700 mt-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Canvas or XML View */}
        {showXmlView ? (
          <div className="flex-1 p-4">
            <textarea
              value={xmlContent}
              onChange={(e) => setXmlContent(e.target.value)}
              className="w-full h-full font-mono text-sm border rounded p-4"
              readOnly={!permissions.canEdit}
            />
          </div>
        ) : (
          <div ref={containerRef} className="flex-1" />
        )}
      </div>

      {/* Properties Panel */}
      {isPropertiesPanelVisible && !showXmlView && (
        <div className="w-80 bg-white border-l flex flex-col">
          <div className="px-4 py-3 border-b">
            <h3 className="font-semibold text-gray-900">Properties</h3>
            {selectedElement && (
              <p className="text-sm text-gray-600 mt-1">
                {selectedElement.type.replace('bpmn:', '')} - {selectedElement.id}
              </p>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {selectedElement ? (
              <div className="space-y-6">
                {propertyGroups.map((group) => (
                  <div key={group.id} className="property-group">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      {group.icon}
                      {group.label}
                    </h4>
                    <div className="space-y-3">
                      {group.entries.map((entry) => (
                        <div key={entry.id} className="property-field">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {entry.label}
                          </label>
                          {renderPropertyInput(entry, group.id, permissions.canEdit)}
                          {entry.description && (
                            <p className="text-xs text-gray-500 mt-1">{entry.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Select an element to view its properties</p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // Helper function to render property input
  function renderPropertyInput(entry: PropertyEntry, groupId: string, canEdit: boolean) {
    const handleChange = (value: any) => {
      if (canEdit) {
        handlePropertyChange(groupId, entry.id, value);
      }
    };

    switch (entry.type) {
      case 'text':
        return (
          <input
            type="text"
            value={entry.value}
            onChange={(e) => handleChange(e.target.value)}
            disabled={!canEdit}
            className="w-full px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={entry.value}
            onChange={(e) => handleChange(parseInt(e.target.value))}
            disabled={!canEdit}
            className="w-full px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
          />
        );
      case 'textarea':
        return (
          <textarea
            value={entry.value}
            onChange={(e) => handleChange(e.target.value)}
            disabled={!canEdit}
            rows={3}
            className="w-full px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
          />
        );
      case 'select':
        return (
          <select
            value={entry.value}
            onChange={(e) => handleChange(e.target.value)}
            disabled={!canEdit}
            className="w-full px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
          >
            {entry.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={entry.value}
            onChange={(e) => handleChange(e.target.checked)}
            disabled={!canEdit}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
          />
        );
      default:
        return null;
    }
  }
};

export default BPMNModeler;