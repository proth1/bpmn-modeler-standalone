# BPMN Modeler Standalone

A comprehensive, standalone BPMN process modeler with full Camunda support, built using TDD/BDD methodology with complete compliance and traceability.

## Features

- 🎨 **Full BPMN 2.0 Support** - All BPMN elements with complete property configuration
- 🔧 **Camunda Integration** - Full support for Camunda-specific properties and deployment
- 💾 **Complete CRUD Operations** - Create, Read, Update, Delete BPMN processes
- 📊 **Comprehensive Properties Panel** - All element properties with validation
- 🚀 **Direct Deployment** - Deploy to Camunda Engine (port 8082) with one click
- 📦 **Reusable Package** - NPM package for integration in multiple projects
- 🐳 **Docker Ready** - Containerized deployment option
- ✅ **TDD/BDD** - 100% test coverage for critical paths

## Quick Start

### Development Mode

```bash
# Install dependencies
npm install

# Run tests (TDD mode)
npm test:watch

# Start development server
npm run dev

# Open http://localhost:3000
```

### Docker Mode

```bash
# Build container
docker build -t bpmn-modeler .

# Run container
docker run -p 3000:3000 bpmn-modeler
```

### NPM Package Usage

```bash
# Install in your project
npm install @policy2control/bpmn-modeler
```

```typescript
import { BPMNModeler } from '@policy2control/bpmn-modeler';

const modeler = new BPMNModeler({
  container: '#canvas',
  propertiesPanel: '#properties',
  camundaUrl: 'http://localhost:8082'
});

// Load existing process
await modeler.importXML(bpmnXml);

// Save process
const xml = await modeler.saveXML();

// Deploy to Camunda
const deployment = await modeler.deploy('My Process v1.0');
```

## Architecture

```
bpmn-modeler-standalone/
├── apps/
│   ├── web/                    # Next.js web application
│   │   ├── src/
│   │   │   ├── pages/          # Application pages
│   │   │   ├── components/     # UI components
│   │   │   └── hooks/          # Custom React hooks
│   │   └── package.json
│   │
│   └── api/                     # Backend API service
│       ├── src/
│       │   ├── routes/         # API endpoints
│       │   ├── services/       # Business logic
│       │   └── middleware/     # Express middleware
│       └── package.json
│
├── packages/
│   ├── bpmn-core/              # Core BPMN modeling logic
│   │   ├── src/
│   │   │   ├── models/         # BPMN element models
│   │   │   ├── factories/     # Element factories
│   │   │   ├── serializers/   # XML serialization
│   │   │   └── validators/    # Process validation
│   │   └── package.json
│   │
│   ├── bpmn-properties/        # Properties panel components
│   │   ├── src/
│   │   │   ├── panels/         # Property panel UI
│   │   │   ├── fields/        # Form field components
│   │   │   └── validators/    # Property validation
│   │   └── package.json
│   │
│   ├── bpmn-deployment/        # Camunda deployment logic
│   │   ├── src/
│   │   │   ├── client/        # Camunda REST client
│   │   │   ├── validators/    # Deployment validation
│   │   │   └── history/       # Deployment history
│   │   └── package.json
│   │
│   └── bpmn-storage/           # File storage management
│       ├── src/
│       │   ├── providers/     # Storage providers
│       │   ├── versioning/    # Version control
│       │   └── recovery/      # Auto-recovery
│       └── package.json
│
├── tests/
│   ├── unit/                   # Unit tests (TDD)
│   ├── integration/            # Integration tests
│   └── e2e/                    # End-to-end tests (BDD)
│       └── features/           # Gherkin feature files
│
├── docker/                     # Docker configuration
├── docs/                       # Documentation
└── .github/                    # GitHub Actions CI/CD
```

## Testing Strategy

### TDD (Test-Driven Development)

All core functionality is built using TDD methodology:

1. **Write Test First** - Define expected behavior
2. **Red Phase** - Test fails (no implementation)
3. **Green Phase** - Implement minimum code to pass
4. **Refactor** - Improve code while keeping tests green

### BDD (Behavior-Driven Development)

User stories are defined in Gherkin format:

```gherkin
Feature: Create New BPMN Process
  As a process designer
  I want to create new BPMN processes
  So that I can model business workflows

  Scenario: Create blank process
    Given I am on the BPMN modeler
    When I click "New Process"
    Then I should see a blank canvas with a start event
```

### Coverage Requirements

- **Critical Paths**: 100% coverage required
- **Core Logic**: 95% minimum
- **Overall**: 90% minimum
- **E2E Scenarios**: All user stories covered

## Compliance & Traceability Matrix

| Requirement | Test Coverage | Implementation | Status |
|------------|---------------|----------------|--------|
| **Core BPMN Modeling** | | | |
| Create new process | `BPMNProcess.test.ts:15-25` | `BPMNProcess.ts:constructor` | ✅ |
| Add/remove elements | `BPMNProcess.test.ts:45-67` | `BPMNProcess.ts:addElement` | ✅ |
| Connect with flows | `BPMNProcess.test.ts:78-92` | `BPMNProcess.ts:addSequenceFlow` | ✅ |
| Validate process | `BPMNProcess.test.ts:95-125` | `BPMNProcess.ts:validate` | ✅ |
| **Properties Management** | | | |
| Edit element properties | `PropertiesPanel.test.tsx:35-78` | `PropertiesPanel.tsx:handleChange` | ✅ |
| Camunda properties | `PropertiesPanel.test.tsx:145-234` | `CamundaProperties.tsx` | ✅ |
| Form configuration | `PropertiesPanel.test.tsx:267-312` | `FormFields.tsx` | ✅ |
| Execution listeners | `PropertiesPanel.test.tsx:345-398` | `ExecutionListeners.tsx` | ✅ |
| **File Operations** | | | |
| Save process | `file-operations.feature:15-25` | `FileService.ts:save` | 🔄 |
| Load process | `file-operations.feature:27-36` | `FileService.ts:load` | 🔄 |
| Export formats | `file-operations.feature:52-63` | `ExportService.ts` | 🔄 |
| Auto-recovery | `file-operations.feature:65-74` | `RecoveryService.ts` | 🔄 |
| **Camunda Deployment** | | | |
| Deploy to engine | `camunda-deployment.feature:14-28` | `CamundaClient.ts:deploy` | 🔄 |
| Validation before deploy | `camunda-deployment.feature:30-44` | `DeploymentValidator.ts` | 🔄 |
| Deployment history | `camunda-deployment.feature:72-83` | `DeploymentHistory.ts` | 🔄 |

Legend: ✅ Complete | 🔄 In Progress | ❌ Not Started

## Property Groups Reference

### User Task Properties

| Group | Properties | Camunda Attribute |
|-------|------------|-------------------|
| **General** | ID, Name, Documentation | `id`, `name` |
| **Assignment** | Assignee, Candidate Users/Groups | `camunda:assignee`, `camunda:candidateUsers` |
| **Forms** | Form Key, Form Fields | `camunda:formKey` |
| **Execution** | Async Before/After, Retry | `camunda:asyncBefore`, `camunda:retryTimeCycle` |
| **Listeners** | Task/Execution Listeners | `camunda:taskListener` |
| **Multi-Instance** | Collection, Completion | `camunda:collection` |

### Service Task Properties

| Group | Properties | Camunda Attribute |
|-------|------------|-------------------|
| **Implementation** | Type (Class/Expression/External) | `camunda:class`, `camunda:expression` |
| **External Task** | Topic, Priority, Retries | `camunda:topic`, `camunda:taskPriority` |
| **Field Injection** | Fields | `camunda:field` |
| **Connector** | Connector ID, Input/Output | `camunda:connectorId` |

### Gateway Properties

| Group | Properties | Camunda Attribute |
|-------|------------|-------------------|
| **General** | ID, Name, Default Flow | `id`, `name`, `default` |
| **Conditions** | Expression, Script | `conditionExpression` |
| **Execution** | Async, Exclusive | `camunda:asyncBefore`, `camunda:exclusive` |

## Development Workflow

### 1. TDD Cycle

```bash
# 1. Write test first
npm run test:watch

# 2. See test fail (RED)
# 3. Write minimal code to pass (GREEN)
# 4. Refactor while keeping tests green
# 5. Repeat
```

### 2. BDD Scenarios

```bash
# Run BDD tests
npm run test:e2e

# Generate step definitions
npm run test:e2e:generate
```

### 3. Type Safety

TypeScript strict mode is enforced:

```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true
}
```

### 4. Code Quality

```bash
# Run all checks
npm run lint
npm run test
npm run test:coverage
npm run build
```

## API Reference

### BPMNModeler

```typescript
class BPMNModeler {
  constructor(config: ModelerConfig);
  
  // Core operations
  importXML(xml: string): Promise<void>;
  saveXML(options?: SaveOptions): Promise<string>;
  clear(): void;
  
  // Element operations
  addElement(type: string, properties?: any): Element;
  removeElement(elementId: string): void;
  updateElement(elementId: string, properties: any): void;
  
  // Deployment
  validate(): ValidationResult[];
  deploy(name: string, options?: DeployOptions): Promise<Deployment>;
  
  // Events
  on(event: string, callback: Function): void;
  off(event: string, callback: Function): void;
}
```

### Property Panel API

```typescript
interface PropertyPanel {
  setElement(element: BPMNElement): void;
  getProperties(): PropertyGroup[];
  updateProperty(key: string, value: any): void;
  validate(): ValidationResult[];
}
```

### Deployment API

```typescript
interface CamundaDeployer {
  deploy(process: BPMNProcess, options: DeployOptions): Promise<Deployment>;
  validateBeforeDeploy(process: BPMNProcess): ValidationResult[];
  getDeploymentHistory(): Deployment[];
  rollback(deploymentId: string): Promise<void>;
}
```

## Configuration

### Environment Variables

```env
# Application
PORT=3000
NODE_ENV=development

# Camunda
CAMUNDA_URL=http://localhost:8082
CAMUNDA_USERNAME=admin
CAMUNDA_PASSWORD=admin

# Storage
STORAGE_TYPE=local
STORAGE_PATH=./processes

# Features
ENABLE_AUTO_SAVE=true
AUTO_SAVE_INTERVAL=30000
ENABLE_RECOVERY=true
```

### Camunda Configuration

```javascript
const config = {
  camunda: {
    url: process.env.CAMUNDA_URL || 'http://localhost:8082',
    auth: {
      username: process.env.CAMUNDA_USERNAME,
      password: process.env.CAMUNDA_PASSWORD
    },
    tenant: 'default'
  }
};
```

## Contributing

### Development Setup

1. Fork the repository
2. Clone your fork
3. Install dependencies: `npm install`
4. Create feature branch: `git checkout -b feature/your-feature`
5. Write tests first (TDD)
6. Implement feature
7. Run tests: `npm test`
8. Submit PR with 90%+ coverage

### Commit Convention

```
feat: Add new feature
fix: Fix bug
docs: Update documentation
test: Add/update tests
refactor: Code refactoring
style: Format/style changes
chore: Maintenance tasks
```

## License

MIT

## Support

- Documentation: [https://docs.bpmn-modeler.io](https://docs.bpmn-modeler.io)
- Issues: [GitHub Issues](https://github.com/policy2control/bpmn-modeler/issues)
- Discussions: [GitHub Discussions](https://github.com/policy2control/bpmn-modeler/discussions)

---

Built with ❤️ using TDD/BDD methodology for enterprise-grade reliability.