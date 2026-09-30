export type SkillCategory =
  | 'engineering-architecture'
  | 'engineering-quality'
  | 'engineering-systems'
  | 'engineering-devops'
  | 'engineering-frontend'
  | 'engineering-agentic'
  | 'school'
  | 'daycare'
  | 'household'
  | 'health'
  | 'finance'
  | 'automation';

export interface SkillField {
  key: string;
  label: string;
  placeholder: string;
  type: 'text' | 'date' | 'number' | 'textarea';
}

export interface AgentSkill {
  id: string;
  name: string;
  category: SkillCategory;
  icon: string;
  summary: string;
  capabilities: string[];
  directives?: string[];
  applicableAgents?: ('chat' | 'coding' | 'browser')[];
  fields: SkillField[];
  mcpEndpoint: string;
  version: string;
  installedByDefault: boolean;
}

export const SKILL_CATEGORIES: { id: SkillCategory; label: string; color: string; badge?: string }[] = [
  { id: 'engineering-architecture', label: 'Architecture & Design', color: '#8B5FBF', badge: 'ENG' },
  { id: 'engineering-quality', label: 'Quality, TDD & Security', color: '#EF4444', badge: 'ENG' },
  { id: 'engineering-systems', label: 'Systems & Backend', color: '#3B82F6', badge: 'ENG' },
  { id: 'engineering-frontend', label: 'Frontend & A11y', color: '#10B981', badge: 'ENG' },
  { id: 'engineering-devops', label: 'DevOps & Git Flow', color: '#F59E0B', badge: 'ENG' },
  { id: 'engineering-agentic', label: 'Agentic & MCP Server', color: '#EC4899', badge: 'ENG' },
  { id: 'school', label: 'School & Students', color: '#8B5FBF' },
  { id: 'daycare', label: 'Daycare & Activities', color: '#E8A0BF' },
  { id: 'household', label: 'Household & Logistics', color: '#D9A441' },
  { id: 'health', label: 'Health & Appointments', color: '#10B981' },
  { id: 'finance', label: 'Finance & Ledgers', color: '#3B82F6' },
  { id: 'automation', label: 'Automation & Mesh', color: '#22D3EE' },
];

export const AGENT_SKILLS: AgentSkill[] = [
  // =========================================================================
  // 20 SPECIALIZED ENGINEERING SKILLS REGISTRY
  // =========================================================================
  {
    id: 'frontend-architecture',
    name: 'Frontend Architecture & Design Systems',
    category: 'engineering-architecture',
    icon: 'Layout',
    summary: 'Build accessible, fluid user interfaces. Prioritize clean visual hierarchy, semantic markup, zero layout shift, responsive grid/flex layouts, and consistent typography tokens.',
    capabilities: [
      'Design responsive layout grids and fluid token systems',
      'Enforce zero Cumulative Layout Shift (CLS) and anti-AI slop typography',
      'Implement tokenized color and spacing primitives',
      'Structure reusable atom, molecule, and organism components',
    ],
    directives: [
      'Prioritize clean visual hierarchy and semantic HTML markup',
      'Eliminate arbitrary margins and enforce consistent typography scale',
      'Optimize viewport presence and zero-pill discipline',
    ],
    applicableAgents: ['chat', 'coding', 'browser'],
    fields: [
      { key: 'designTokens', label: 'Theme Tokens Path', placeholder: 'src/styles/tokens.json', type: 'text' },
      { key: 'fontSystem', label: 'Primary Font Pair', placeholder: 'Plus Jakarta Sans / Inter', type: 'text' },
    ],
    mcpEndpoint: 'mcp://engineering.skills/frontend-architecture',
    version: '2.0.0',
    installedByDefault: true,
  },
  {
    id: 'fullstack-scaffolding',
    name: 'Full-Stack Application Scaffolding',
    category: 'engineering-systems',
    icon: 'Layers',
    summary: 'Bootstrap production-grade boilerplates cleanly. Set up modular folder hierarchies, strict TypeScript configurations, routing boundaries, and consistent environment variable patterns.',
    capabilities: [
      'Scaffold modular full-stack client/server folder trees',
      'Configure strict TypeScript tsconfig paths and boundaries',
      'Define end-to-end typed contract boundaries',
      'Set up resilient runtime entry points and dev servers',
    ],
    directives: [
      'Keep separation of concerns between client and server layers',
      'Enforce strict typing with zero implicit any',
      'Validate environment variables at process startup',
    ],
    applicableAgents: ['chat', 'coding'],
    fields: [
      { key: 'serverFramework', label: 'Backend Framework', placeholder: 'Express 4 / Node 22', type: 'text' },
      { key: 'clientFramework', label: 'Client Framework', placeholder: 'React 19 / Vite', type: 'text' },
    ],
    mcpEndpoint: 'mcp://engineering.skills/fullstack-scaffolding',
    version: '2.1.0',
    installedByDefault: true,
  },
  {
    id: 'adversarial-review',
    name: 'Adversarial Code Review',
    category: 'engineering-quality',
    icon: 'ShieldAlert',
    summary: 'Inspect codebases with a strict critical eye. Identify memory leaks, race conditions, edge-case null pointers, unhandled async promises, and maintainability antipatterns.',
    capabilities: [
      'Hunt unhandled Promise rejections and async race conditions',
      'Detect resource leaks, dangling listeners, and stale closures',
      'Flag missing null/undefined safety guards',
      'Identify cognitive complexity and maintainability antipatterns',
    ],
    directives: [
      'Scrutinize every async pathway for unhandled errors',
      'Audit hook dependencies and effect cleanup lifecycles',
      'Provide actionable, regression-free code alternatives',
    ],
    applicableAgents: ['chat', 'coding', 'browser'],
    fields: [
      { key: 'strictness', label: 'Review Strictness', placeholder: 'High / Paranoid', type: 'text' },
      { key: 'focusAreas', label: 'Priority Audit Targets', placeholder: 'Async lifecycles, memory, auth guards', type: 'textarea' },
    ],
    mcpEndpoint: 'mcp://engineering.skills/adversarial-review',
    version: '2.0.4',
    installedByDefault: true,
  },
  {
    id: 'tdd-vitest',
    name: 'Test-Driven Development (TDD) & Vitest/Jest',
    category: 'engineering-quality',
    icon: 'CheckCheck',
    summary: 'Write deterministic tests. Focus on high-value unit tests, API integration suites, mock boundaries, and edge coverage before writing implementation code.',
    capabilities: [
      'Author deterministic unit and integration tests with Vitest',
      'Mock network boundaries and third-party SDK dependencies',
      'Formulate negative test cases, malformed payloads, and edge bounds',
      'Verify regression prevention with snapshot and schema assertions',
    ],
    directives: [
      'Write tests verifying expected failures and edge cases',
      'Ensure tests are completely deterministic without timing flakes',
      'Maintain clear test boundaries between mocked externals and business logic',
    ],
    applicableAgents: ['chat', 'coding'],
    fields: [
      { key: 'testRunner', label: 'Test Runner', placeholder: 'Vitest 3 / v8', type: 'text' },
      { key: 'minCoverage', label: 'Target Statement Coverage (%)', placeholder: '85', type: 'number' },
    ],
    mcpEndpoint: 'mcp://engineering.skills/tdd-vitest',
    version: '2.2.0',
    installedByDefault: true,
  },
  {
    id: 'api-design-rest',
    name: 'API Design & REST/OpenAPI Architecture',
    category: 'engineering-systems',
    icon: 'Network',
    summary: 'Standardize endpoints using RESTful conventions or RPC standards. Ensure strict payload typing, predictable status codes, proper pagination, and idempotency keys on mutation endpoints.',
    capabilities: [
      'Design predictable RESTful and JSON-RPC API contracts',
      'Enforce idempotent mutations using deduplication keys',
      'Standardize error envelopes with machine-readable error codes',
      'Implement cursor-based pagination and filter schemas',
    ],
    directives: [
      'Always use standard HTTP status codes (200, 201, 400, 401, 403, 404, 429, 500)',
      'Validate all incoming request bodies before processing',
      'Document endpoint contracts with explicit request and response types',
    ],
    applicableAgents: ['chat', 'coding'],
    fields: [
      { key: 'specFormat', label: 'Schema Standard', placeholder: 'OpenAPI 3.1 / JSON Schema', type: 'text' },
      { key: 'idempotencyHeader', label: 'Idempotency Header', placeholder: 'Idempotency-Key', type: 'text' },
    ],
    mcpEndpoint: 'mcp://engineering.skills/api-design-rest',
    version: '1.9.0',
    installedByDefault: true,
  },
  {
    id: 'refactoring-decoupling',
    name: 'Refactoring & Code Decoupling',
    category: 'engineering-architecture',
    icon: 'Scissors',
    summary: 'Break down monolithic code. Extract pure helper functions, split bloated UI components, isolate data fetching into custom hooks, and eliminate circular dependencies.',
    capabilities: [
      'Deconstruct monolithic components into focused modular units',
      'Extract pure computational logic into deterministic helper functions',
      'Encapsulate remote API calls and side-effects in custom React hooks',
      'Detect and untangle circular module imports',
    ],
    directives: [
      'Single Responsibility Principle for all modules and components',
      'Keep UI presentation strictly separate from data-fetching logic',
      'Never duplicate shared logic across distinct domain files',
    ],
    applicableAgents: ['chat', 'coding'],
    fields: [
      { key: 'maxComponentLines', label: 'Max Component Line Count', placeholder: '250', type: 'number' },
    ],
    mcpEndpoint: 'mcp://engineering.skills/refactoring-decoupling',
    version: '1.8.0',
    installedByDefault: true,
  },
  {
    id: 'database-modeling',
    name: 'Database Modeling & Query Optimization',
    category: 'engineering-systems',
    icon: 'Database',
    summary: 'Design normalized relational schemas and optimized indexing strategies. Eliminate N+1 query patterns, enforce foreign key constraints, and write safe database migrations.',
    capabilities: [
      'Design normalized schema structures with composite indexes',
      'Audit queries to eliminate N+1 select bottlenecks',
      'Formulate safe, backwards-compatible schema migrations',
      'Enforce referential integrity and document partition schemes',
    ],
    directives: [
      'Index high-cardinality search, filter, and foreign key columns',
      'Prevent unindexed collection scans and table sweeps',
      'Separate cold archival records from hot real-time transaction state',
    ],
    applicableAgents: ['chat', 'coding'],
    fields: [
      { key: 'primaryEngine', label: 'Database Engine', placeholder: 'PostgreSQL / Firestore', type: 'text' },
      { key: 'migrationTool', label: 'Migration Tool', placeholder: 'Drizzle ORM / Prisma', type: 'text' },
    ],
    mcpEndpoint: 'mcp://engineering.skills/database-modeling',
    version: '2.0.1',
    installedByDefault: true,
  },
  {
    id: 'security-audit',
    name: 'Security Audit & Secret Hardening',
    category: 'engineering-quality',
    icon: 'Lock',
    summary: 'Prevent security vulnerabilities proactively. Guard against XSS, SQL injection, CSRF, insecure CORS headers, SSRF, and unhashed credentials. Ensure zero hardcoded keys.',
    capabilities: [
      'SSRF defense with private IP range and DNS-rebinding guards',
      'XSS and HTML injection prevention across all dynamic user input',
      'Cryptographic token verification and scoped RBAC access control',
      'Audit dependencies and configs to guarantee zero leaked secrets',
    ],
    directives: [
      'Never expose secrets, service keys, or private tokens in client bundles',
      'Guard all network fetch calls against private/internal hostnames',
      'Fail closed on missing, malformed, or invalid authorization tokens',
    ],
    applicableAgents: ['chat', 'coding', 'browser'],
    fields: [
      { key: 'ssrfProtection', label: 'SSRF Mode', placeholder: 'Strict (RFC1918 + Loopback blocked)', type: 'text' },
      { key: 'corsOrigins', label: 'Allowed CORS Origin', placeholder: 'Self / Authorized domains only', type: 'text' },
    ],
    mcpEndpoint: 'mcp://engineering.skills/security-audit',
    version: '2.3.0',
    installedByDefault: true,
  },
  {
    id: 'cicd-pipeline',
    name: 'CI/CD Pipeline Engineering',
    category: 'engineering-devops',
    icon: 'GitMerge',
    summary: 'Design reliable GitHub Actions workflows. Configure cached dependency steps, parallel test matrix runners, automated lint gates, and reliable staging/production deployment stages.',
    capabilities: [
      'Configure dependency caching and parallelized test jobs',
      'Enforce strict lint and typecheck gates prior to build',
      'Build immutable container artifacts with provenance',
      'Formulate canary rollout and zero-downtime traffic shifts',
    ],
    directives: [
      'Fail fast on lint and test errors before initiating deployment',
      'Keep pipeline execution deterministic and idempotent',
      'Isolate secrets securely using environment store secrets',
    ],
    applicableAgents: ['chat', 'coding'],
    fields: [
      { key: 'platform', label: 'Pipeline Platform', placeholder: 'GitHub Actions / Cloud Build', type: 'text' },
      { key: 'nodeVersion', label: 'Target Node Version', placeholder: '22.x LTS', type: 'text' },
    ],
    mcpEndpoint: 'mcp://engineering.skills/cicd-pipeline',
    version: '1.7.0',
    installedByDefault: false,
  },
  {
    id: 'git-flow',
    name: 'Git Flow & Release Orchestration',
    category: 'engineering-devops',
    icon: 'GitBranch',
    summary: 'Standardize version control conventions. Author Conventional Commits (feat:, fix:, refactor:, chore:), manage atomic branches, generate clean changelogs, and support semantic versioning.',
    capabilities: [
      'Author Conventional Commit messages and change summaries',
      'Orchestrate atomic feature branching and trunk-based rebasing',
      'Automate semantic versioning (SemVer) and release notes',
      'Formulate clean cherry-pick and hotfix release strategies',
    ],
    directives: [
      'Adhere strictly to Conventional Commit formatting',
      'Keep git commits atomic, focused, and independently reviewable',
      'Tag stable release candidates with descriptive changelogs',
    ],
    applicableAgents: ['chat', 'coding'],
    fields: [
      { key: 'mainBranch', label: 'Production Branch', placeholder: 'main', type: 'text' },
      { key: 'semverCadence', label: 'Release Cadence', placeholder: 'Automated on tag', type: 'text' },
    ],
    mcpEndpoint: 'mcp://engineering.skills/git-flow',
    version: '1.5.0',
    installedByDefault: false,
  },
  {
    id: 'dockerization',
    name: 'Dockerization & Container Optimization',
    category: 'engineering-devops',
    icon: 'Container',
    summary: 'Write multi-stage Dockerfiles. Minimize image footprint using minimal base images (Alpine/Distroless), order build caching layers properly, and enforce unprivileged user execution.',
    capabilities: [
      'Formulate multi-stage Dockerfiles separating build from runtime',
      'Optimize layer ordering to maximize Docker layer caching',
      'Enforce non-root unprivileged container users',
      'Minimize final container image footprint to under 100MB',
    ],
    directives: [
      'Never run container processes as root in production',
      'Exclude secrets, tests, and source maps from production image layers',
      'Handle SIGTERM and SIGINT gracefully for zero-downtime restarts',
    ],
    applicableAgents: ['chat', 'coding'],
    fields: [
      { key: 'baseImage', label: 'Base Docker Image', placeholder: 'node:22-alpine', type: 'text' },
      { key: 'containerPort', label: 'Exposed Port', placeholder: '3000', type: 'number' },
    ],
    mcpEndpoint: 'mcp://engineering.skills/dockerization',
    version: '1.9.2',
    installedByDefault: false,
  },
  {
    id: 'tailwind-styling',
    name: 'Tailwind CSS & Modern Utility Styling',
    category: 'engineering-frontend',
    icon: 'Palette',
    summary: 'Build interfaces using mobile-first utility classes. Avoid arbitrary values unless strictly required by design tokens, prevent CSS specificity conflicts, and maintain responsive consistency.',
    capabilities: [
      'Construct responsive mobile-first Tailwind layouts',
      'Avoid arbitrary one-off values by leveraging design theme tokens',
      'Build dark/light theme variants using CSS variables and clean classes',
      'Prevent CSS specificity conflicts and bloated CSS artifacts',
    ],
    directives: [
      'Mobile-first breakpoints: default -> sm -> md -> lg -> xl',
      'Use semantic color tokens instead of hardcoded hex values',
      'Ensure fluid layout responsiveness across phone, tablet, and desktop',
    ],
    applicableAgents: ['chat', 'coding', 'browser'],
    fields: [
      { key: 'tailwindVersion', label: 'Tailwind Engine', placeholder: 'Tailwind CSS v4', type: 'text' },
      { key: 'darkModeStrategy', label: 'Dark Mode Strategy', placeholder: 'class / data-theme', type: 'text' },
    ],
    mcpEndpoint: 'mcp://engineering.skills/tailwind-styling',
    version: '2.0.0',
    installedByDefault: true,
  },
  {
    id: 'accessibility-wcag',
    name: 'Accessibility (a11y) & WCAG AA Compliance',
    category: 'engineering-frontend',
    icon: 'Eye',
    summary: 'Implement keyboard-navigable components, proper focus management, accurate ARIA roles/labels, valid color contrast ratios, and screen-reader accessibility.',
    capabilities: [
      'Implement complete keyboard navigation and focus trapping',
      'Audit color contrast to ensure WCAG AA (minimum 4.5:1 ratio)',
      'Provide descriptive ARIA roles, states, and screen-reader labels',
      'Support reduced motion preferences (prefers-reduced-motion)',
    ],
    directives: [
      'Every interactive element must be focusable via Tab and Enter/Space',
      'Form fields must have associated labels or aria-label attributes',
      'Modals and drawers must trap focus and close on Escape',
    ],
    applicableAgents: ['chat', 'coding', 'browser'],
    fields: [
      { key: 'targetLevel', label: 'Compliance Level', placeholder: 'WCAG 2.2 Level AA', type: 'text' },
      { key: 'screenReaderMode', label: 'Audited Reader', placeholder: 'VoiceOver / NVDA', type: 'text' },
    ],
    mcpEndpoint: 'mcp://engineering.skills/accessibility-wcag',
    version: '2.1.0',
    installedByDefault: true,
  },
  {
    id: 'state-management',
    name: 'State Management Architecture',
    category: 'engineering-architecture',
    icon: 'Workflow',
    summary: 'Organize client and server states cleanly. Prevent prop drilling, isolate fast-changing state from global stores, and utilize optimistic updates for responsive user feedback.',
    capabilities: [
      'Architect partitioned React Context and lightweight stores',
      'Isolate high-frequency local state to prevent re-render cascades',
      'Implement optimistic UI updates with automatic rollback on failure',
      'Synchronize server state with automatic cache invalidation',
    ],
    directives: [
      'Separate transient UI state from persistent domain entity state',
      'Colocate state as close as possible to the components that need it',
      'Provide deterministic fallback values for all asynchronous reads',
    ],
    applicableAgents: ['chat', 'coding'],
    fields: [
      { key: 'syncProtocol', label: 'Remote Sync Strategy', placeholder: 'Firestore Realtime / Optimistic REST', type: 'text' },
    ],
    mcpEndpoint: 'mcp://engineering.skills/state-management',
    version: '1.8.4',
    installedByDefault: true,
  },
  {
    id: 'tech-docs-runbook',
    name: 'Technical Documentation & Runbook Authoring',
    category: 'engineering-systems',
    icon: 'FileCode',
    summary: 'Write comprehensive, scannable technical documentation. Provide architecture overviews, curl examples, quick-start guides, and recovery runbooks.',
    capabilities: [
      'Author architectural documentation and system flow diagrams',
      'Write reproducible cURL commands and API request examples',
      'Draft operational recovery runbooks and incident response checklists',
      'Maintain scannable changelogs and onboarding walkthroughs',
    ],
    directives: [
      'Use concise, scannable markdown with code snippets',
      'Document prerequisite environment variables and permissions',
      'State exact failure recovery procedures step-by-step',
    ],
    applicableAgents: ['chat', 'coding'],
    fields: [
      { key: 'outputFormat', label: 'Documentation Format', placeholder: 'Markdown / OpenAPI Specification', type: 'text' },
    ],
    mcpEndpoint: 'mcp://engineering.skills/tech-docs-runbook',
    version: '1.6.0',
    installedByDefault: false,
  },
  {
    id: 'multiagent-orchestration',
    name: 'Multi-Agent Orchestration & Context Management',
    category: 'engineering-agentic',
    icon: 'Cpu',
    summary: 'Manage agentic loops effectively. Structure clean tool-handoff prompts, preserve prompt tokens through summarization, and prevent infinite reasoning loops.',
    capabilities: [
      'Coordinate multi-agent delegation between orchestrator and specialists',
      'Compress conversation history to preserve context token windows',
      'Prevent circular agent tool delegation and infinite loops',
      'Author structured JSON tool contracts and response parsers',
    ],
    directives: [
      'Orchestrator delegates specialized tasks directly to designated sub-agents',
      'Cap reasoning loops with strict iteration and recursion bounds',
      'Preserve executive user persona and memory ledger across agent handoffs',
    ],
    applicableAgents: ['chat', 'coding', 'browser'],
    fields: [
      { key: 'maxRecursionDepth', label: 'Max Agent Handoff Depth', placeholder: '3', type: 'number' },
      { key: 'contextCompactionThreshold', label: 'Token Compaction Window', placeholder: '10000', type: 'number' },
    ],
    mcpEndpoint: 'mcp://engineering.skills/multiagent-orchestration',
    version: '2.5.0',
    installedByDefault: true,
  },
  {
    id: 'bug-triaging',
    name: 'Bug Triaging & Root-Cause Analysis (RCA)',
    category: 'engineering-quality',
    icon: 'AlertCircle',
    summary: 'Deconstruct failure logs methodically. Trace stack traces back to root causes, reproduce errors with minimal reproductions, and implement regression-preventing fixes.',
    capabilities: [
      'Dissect server and client crash stack traces down to the exact root cause',
      'Isolate reproductions into minimal self-contained vitest test cases',
      'Identify silent failures, missing error handlers, and unhandled rejections',
      'Formulate permanent regression-preventing architectural fixes',
    ],
    directives: [
      'Never patch symptoms blindly; identify the fundamental trigger',
      'Verify fixes with automated reproduction test cases before release',
      'Document root cause and preventative measures clearly',
    ],
    applicableAgents: ['chat', 'coding', 'browser'],
    fields: [
      { key: 'logLevel', label: 'Telemetry Verbosity', placeholder: 'Verbose with stack trace capture', type: 'text' },
    ],
    mcpEndpoint: 'mcp://engineering.skills/bug-triaging',
    version: '2.1.2',
    installedByDefault: true,
  },
  {
    id: 'env-secrets-isolation',
    name: 'Environment Configuration & Secrets Isolation',
    category: 'engineering-systems',
    icon: 'KeyRound',
    summary: 'Enforce explicit separation across development, staging, and production .env files. Validate schemas with Zod/Joi at process startup.',
    capabilities: [
      'Validate environment configuration at process startup with Zod schemas',
      'Prevent accidental leakage of server-only secrets to client bundles',
      'Maintain clean .env.example templates with descriptive documentation',
      'Enforce runtime fail-fast guards when required keys are absent',
    ],
    directives: [
      'Prefix all client-accessible environment variables with VITE_',
      'Never commit production secrets or real API keys to repository files',
      'Provide sensible defaults for local development where safe',
    ],
    applicableAgents: ['chat', 'coding'],
    fields: [
      { key: 'envExamplePath', label: 'Template File', placeholder: '.env.example', type: 'text' },
      { key: 'validationEngine', label: 'Schema Validator', placeholder: 'Zod 3 / Node process.env', type: 'text' },
    ],
    mcpEndpoint: 'mcp://engineering.skills/env-secrets-isolation',
    version: '1.4.0',
    installedByDefault: true,
  },
  {
    id: 'performance-profiling',
    name: 'Performance Profiling & Bundle Optimization',
    category: 'engineering-quality',
    icon: 'Gauge',
    summary: 'Minimize runtime overhead. Eliminate redundant re-renders, implement dynamic code-splitting, tree-shake dead packages, and audit Core Web Vitals.',
    capabilities: [
      'Profile main-thread hitches, long tasks, and frame drops',
      'Audit bundle size with dynamic code-splitting and lazy loading',
      'Optimize Time To First Token (TTFT) and API response latencies',
      'Eliminate unnecessary React component re-renders with memoization',
    ],
    directives: [
      'Target 60 FPS UI responsiveness and sub-50ms main thread tasks',
      'Lazy-load heavy modal and canvas components with React.lazy',
      'Measure and report live performance telemetry continuously',
    ],
    applicableAgents: ['chat', 'coding', 'browser'],
    fields: [
      { key: 'hitchThresholdMs', label: 'Hitch Alert Threshold (ms)', placeholder: '50', type: 'number' },
      { key: 'sampleWindowSeconds', label: 'Telemetry Heartbeat Window (s)', placeholder: '60', type: 'number' },
    ],
    mcpEndpoint: 'mcp://engineering.skills/performance-profiling',
    version: '2.2.0',
    installedByDefault: true,
  },
  {
    id: 'mcp-server-builder',
    name: 'MCP Server Builder',
    category: 'engineering-agentic',
    icon: 'Server',
    summary: 'Develop and scaffold compliant Model Context Protocol servers. Implement JSON-RPC 2.0 schemas, expose ergonomic tool definitions, and write robust server-side error-handling wrappers.',
    capabilities: [
      'Scaffold JSON-RPC 2.0 compliant Model Context Protocol servers',
      'Define typed tool input schemas using JSON Schema standards',
      'Implement resilient error handling and status code mapping',
      'Expose MCP endpoints for live cloud runner consumption',
    ],
    directives: [
      'Strictly follow the Model Context Protocol (MCP) specification',
      'Define explicit types, descriptions, and required fields for all tool inputs',
      'Return structured content blocks and machine-parseable error responses',
    ],
    applicableAgents: ['chat', 'coding', 'browser'],
    fields: [
      { key: 'protocolVersion', label: 'MCP Protocol Version', placeholder: '2024-11-05 / v1', type: 'text' },
      { key: 'transport', label: 'Transport Type', placeholder: 'stdio / SSE', type: 'text' },
    ],
    mcpEndpoint: 'mcp://engineering.skills/mcp-server-builder',
    version: '1.2.0',
    installedByDefault: true,
  },

  // =========================================================================
  // FAMILY, LIFESTYLE & DOMAIN WORKFLOW SKILLS
  // =========================================================================
  {
    id: 'school-scheduler',
    name: 'Student & School Scheduling',
    category: 'school',
    icon: 'GraduationCap',
    summary: 'Syncs school calendars, parent-teacher portals, and extracurricular bus runs.',
    capabilities: [
      'Import district calendar (ICS) and flag early releases',
      'Watch parent portal for grade + attendance changes',
      'Auto-plan bus and carpool runs against your work blocks',
      'Draft teacher emails from a one-line intent',
    ],
    applicableAgents: ['chat'],
    fields: [
      { key: 'student', label: 'Student name', placeholder: 'Ava', type: 'text' },
      { key: 'school', label: 'School / district', placeholder: 'Cherry Creek Elementary', type: 'text' },
      { key: 'portal', label: 'Parent portal URL', placeholder: 'https://portal.district.org', type: 'text' },
    ],
    mcpEndpoint: 'mcp://carol-ann.skills/school-scheduler',
    version: '1.4.0',
    installedByDefault: true,
  },
  {
    id: 'daycare-tracker',
    name: 'Daycare & Activity Tracker',
    category: 'daycare',
    icon: 'Baby',
    summary: 'Pickup authorization logs, tuition tracking, diaper and snack inventory.',
    capabilities: [
      'Maintain authorized pickup roster with photo IDs',
      'Track weekly tuition + auto-reconcile receipts',
      'Low-supply alerts for diapers, wipes, snacks',
      'Log daily reports into the memory ledger',
    ],
    applicableAgents: ['chat'],
    fields: [
      { key: 'center', label: 'Center name', placeholder: 'Bright Horizons', type: 'text' },
      { key: 'tuition', label: 'Weekly tuition', placeholder: '285', type: 'number' },
      { key: 'pickup', label: 'Authorized pickups', placeholder: 'Grandma Ruth, Uncle Ben', type: 'textarea' },
    ],
    mcpEndpoint: 'mcp://carol-ann.skills/daycare-tracker',
    version: '1.1.2',
    installedByDefault: true,
  },
  {
    id: 'holiday-planner',
    name: 'Household Logistics & Holiday Planner',
    category: 'household',
    icon: 'Gift',
    summary: 'Thanksgiving and Christmas gift budgets, guest lists, and meal plans.',
    capabilities: [
      'Per-person gift budget with running spend total',
      'Guest list with dietary restrictions',
      'Meal plan generator with oven-time sequencing',
      'Shopping list handoff to the Whole Foods runner',
    ],
    applicableAgents: ['chat', 'browser'],
    fields: [
      { key: 'holiday', label: 'Holiday', placeholder: 'Thanksgiving', type: 'text' },
      { key: 'budget', label: 'Total budget', placeholder: '1200', type: 'number' },
      { key: 'guests', label: 'Guest list', placeholder: 'Mom, Dad, Kate + 2', type: 'textarea' },
    ],
    mcpEndpoint: 'mcp://carol-ann.skills/holiday-planner',
    version: '2.0.1',
    installedByDefault: true,
  },
  {
    id: 'appointment-booker',
    name: 'Doctor & Appointment Booking',
    category: 'health',
    icon: 'Stethoscope',
    summary: 'Pediatrician routines, dentist recalls, and auto-form filling.',
    capabilities: [
      'Watch recall windows and open booking portals',
      'Auto-fill intake forms from stored family records',
      'Hold two candidate slots before confirming',
      'Push confirmations to the household calendar',
    ],
    applicableAgents: ['chat', 'browser'],
    fields: [
      { key: 'provider', label: 'Provider', placeholder: 'Dr. Nguyen — Pediatrics', type: 'text' },
      { key: 'patient', label: 'Patient', placeholder: 'Ava', type: 'text' },
      { key: 'window', label: 'Preferred window', placeholder: 'Weekday mornings', type: 'text' },
    ],
    mcpEndpoint: 'mcp://carol-ann.skills/appointment-booker',
    version: '1.7.3',
    installedByDefault: false,
  },
  {
    id: 'quickbooks-ledger',
    name: 'QuickBooks Ledger Bridge',
    category: 'finance',
    icon: 'Receipt',
    summary: 'Two-way sync of household and business expense categories.',
    capabilities: [
      'Categorize receipts captured from the phone camera',
      'Monthly household vs business split report',
      'Flag duplicate subscriptions',
    ],
    applicableAgents: ['chat'],
    fields: [
      { key: 'realm', label: 'Company realm ID', placeholder: '4620816365...', type: 'text' },
      { key: 'categories', label: 'Watched categories', placeholder: 'Groceries, Childcare, Software', type: 'textarea' },
    ],
    mcpEndpoint: 'mcp://carol-ann.skills/quickbooks-ledger',
    version: '0.9.4',
    installedByDefault: false,
  },
  {
    id: 'calendar-mesh',
    name: 'Calendar & Email Mesh',
    category: 'automation',
    icon: 'CalendarRange',
    summary: 'Unifies personal, work, school, and partner calendars into one conflict map.',
    capabilities: [
      'Conflict detection across five calendar sources',
      'Auto-decline meetings that collide with pickup runs',
      'Daily 6am agenda brief read aloud on the remote',
    ],
    applicableAgents: ['chat'],
    fields: [
      { key: 'sources', label: 'Calendar sources', placeholder: 'Google Personal, Outlook Work', type: 'textarea' },
      { key: 'brief', label: 'Brief time', placeholder: '06:00', type: 'text' },
    ],
    mcpEndpoint: 'mcp://carol-ann.skills/calendar-mesh',
    version: '3.2.0',
    installedByDefault: true,
  },
  {
    id: 'grocery-runner',
    name: 'Grocery & Delivery Runner',
    category: 'automation',
    icon: 'ShoppingCart',
    summary: 'Parses lists into cart population and delivery-window reservation.',
    capabilities: [
      'Parse freeform or photographed grocery lists',
      'Match pantry staples to prior purchase SKUs',
      'Reserve the earliest window that clears your calendar',
    ],
    applicableAgents: ['chat', 'browser'],
    fields: [
      { key: 'store', label: 'Preferred store', placeholder: 'Whole Foods', type: 'text' },
      { key: 'window', label: 'Preferred window', placeholder: 'Sat 8–10 AM', type: 'text' },
    ],
    mcpEndpoint: 'mcp://carol-ann.skills/grocery-runner',
    version: '2.5.0',
    installedByDefault: true,
  },
  {
    id: 'tutor-coordinator',
    name: 'Tutor & Extracurricular Coordinator',
    category: 'school',
    icon: 'BookMarked',
    summary: 'Books tutors, tracks practice hours, and manages season signups.',
    capabilities: [
      'Season registration deadlines with reminders',
      'Practice-hour ledger per child',
      'Coach and tutor contact directory',
    ],
    applicableAgents: ['chat'],
    fields: [
      { key: 'activity', label: 'Activity', placeholder: 'Club volleyball', type: 'text' },
      { key: 'cadence', label: 'Weekly cadence', placeholder: 'Tue/Thu 5–7pm', type: 'text' },
    ],
    mcpEndpoint: 'mcp://carol-ann.skills/tutor-coordinator',
    version: '1.0.6',
    installedByDefault: false,
  },
  {
    id: 'home-ops',
    name: 'Home Ops & Maintenance',
    category: 'household',
    icon: 'Wrench',
    summary: 'Seasonal maintenance, vendor dispatch, and warranty ledger.',
    capabilities: [
      'HVAC filter and gutter cadence reminders',
      'Vendor quotes side-by-side comparison',
      'Warranty and receipt archive',
    ],
    applicableAgents: ['chat', 'browser'],
    fields: [
      { key: 'home', label: 'Property label', placeholder: 'Main house', type: 'text' },
      { key: 'vendors', label: 'Preferred vendors', placeholder: 'Summit HVAC, Rossi Plumbing', type: 'textarea' },
    ],
    mcpEndpoint: 'mcp://carol-ann.skills/home-ops',
    version: '1.3.1',
    installedByDefault: false,
  },
];

export interface AgentStack {
  id: string;
  name: string;
  description: string;
  skillIds: string[];
  author: string;
  downloads: string;
}

export const AGENT_STACKS: AgentStack[] = [
  {
    id: 'stack-signal-forge-eng',
    name: 'Signal Forge 20-Skill Engineering Engine',
    description: 'Complete senior architect suite: Architecture, TDD, Security, Docker, Performance, and MCP Server Builder.',
    skillIds: [
      'frontend-architecture',
      'fullstack-scaffolding',
      'adversarial-review',
      'tdd-vitest',
      'api-design-rest',
      'refactoring-decoupling',
      'database-modeling',
      'security-audit',
      'cicd-pipeline',
      'git-flow',
      'dockerization',
      'tailwind-styling',
      'accessibility-wcag',
      'state-management',
      'tech-docs-runbook',
      'multiagent-orchestration',
      'bug-triaging',
      'env-secrets-isolation',
      'performance-profiling',
      'mcp-server-builder',
    ],
    author: 'Signal Forge Architect Core',
    downloads: '48.9k',
  },
  {
    id: 'stack-frontend-craft',
    name: 'Frontend & Design Craft Stack',
    description: 'Design systems, Tailwind utilities, WCAG AA compliance, and bundle performance.',
    skillIds: [
      'frontend-architecture',
      'tailwind-styling',
      'accessibility-wcag',
      'state-management',
      'performance-profiling',
    ],
    author: 'Signal Forge UI Labs',
    downloads: '29.3k',
  },
  {
    id: 'stack-systems-security',
    name: 'Systems, DB & Security Hardening Stack',
    description: 'Defensive architecture: SSRF guard, normalized schemas, API idempotency, and containerization.',
    skillIds: [
      'security-audit',
      'database-modeling',
      'api-design-rest',
      'dockerization',
      'env-secrets-isolation',
    ],
    author: 'Security Core',
    downloads: '31.4k',
  },
  {
    id: 'stack-quality-tdd',
    name: 'Quality, TDD & Root-Cause Analysis Stack',
    description: 'TDD Vitest suites, adversarial code reviews, bug triaging, and decoupled refactoring.',
    skillIds: [
      'tdd-vitest',
      'adversarial-review',
      'bug-triaging',
      'cicd-pipeline',
      'refactoring-decoupling',
    ],
    author: 'QA Architect',
    downloads: '24.1k',
  },
  {
    id: 'stack-school-year',
    name: 'School Year Command Stack',
    description: 'Everything for August through May: calendars, tutors, appointments, bus runs.',
    skillIds: ['school-scheduler', 'tutor-coordinator', 'appointment-booker', 'calendar-mesh'],
    author: 'Carol Labs',
    downloads: '12.4k',
  },
  {
    id: 'stack-toddler-ops',
    name: 'Toddler Ops Stack',
    description: 'Daycare ledgers, supply inventory, pediatric recalls, and grocery runs.',
    skillIds: ['daycare-tracker', 'appointment-booker', 'grocery-runner'],
    author: 'Carol Labs',
    downloads: '8.1k',
  },
  {
    id: 'stack-holiday-host',
    name: 'Holiday Host Stack',
    description: 'Guest lists, gift budgets, meal sequencing, and delivery staging.',
    skillIds: ['holiday-planner', 'grocery-runner', 'quickbooks-ledger'],
    author: 'Community',
    downloads: '5.7k',
  },
  {
    id: 'stack-founder-mode',
    name: 'Founder Mode Stack',
    description: 'Books, calendars, and household ops so the company gets your best hours.',
    skillIds: ['quickbooks-ledger', 'calendar-mesh', 'home-ops', 'fullstack-scaffolding', 'api-design-rest'],
    author: 'Community',
    downloads: '18.2k',
  },
];

export const getSkill = (id: string) => AGENT_SKILLS.find((s) => s.id === id);

export const getSkillsForAgent = (agentType: 'chat' | 'coding' | 'browser') =>
  AGENT_SKILLS.filter((s) => !s.applicableAgents || s.applicableAgents.includes(agentType));
