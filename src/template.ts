export const DEFAULT_AGENT_TEMPLATE = `# Agent Task Specification 🤖

## Context
<!-- Provide a high-level overview of the project, its purpose, and its architecture -->
Describe what the project does, its primary goal, and how the architecture is organized.

## Stack
<!-- Specify programming languages, frameworks, runtime versions, and databases used -->
- **Language & Runtime:** Node.js v22.x, TypeScript v5.x
- **CLI Framework:** Commander.js
- **Key Libraries:** Conf, Dotenv

## Objective
<!-- Define the exact goal you want to achieve in this execution session -->
Clear description of the expected outcome or feature to be implemented/refactored.

## AI Guidelines & Directives
<!-- Rules, constraints, and safety guidelines for the AI agent -->
- [ ] Use input/context data strictly for the requested task scope.
- [ ] Ask for human confirmation before executing any destructive action.
- [ ] Always append a detailed Report and Test Results under each Task section upon completion.
- [ ] Follow clean code principles, maintaining strict type safety.

---

## Tasks

### Task 1: Initialize Project Task
Describe the specific sub-task or feature to develop or fix.

#### Report
*Pending execution...*

#### Test Results
*Pending execution...*
`;