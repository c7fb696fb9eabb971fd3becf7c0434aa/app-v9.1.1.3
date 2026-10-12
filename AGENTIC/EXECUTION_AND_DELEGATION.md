# Agent Execution, Efficiency, and Delegation

## Work Style

- Be concise. Avoid repetitive narration, speculative investigations, broad scans unrelated to the task, and repeated checks that add no evidence.
- First identify the acceptance criteria and relevant files; inspect the current worktree before editing. Make a bounded plan, then implement and verify the actual user-visible requirement.
- Do not claim work is complete based only on a build or unit test when browser, visual, integration, or production acceptance is required.
- Preserve user changes and report blockers or unverified behavior plainly. Ask only when an unresolved choice materially affects the result or permission.
- The project owner authorizes use of available local and GitHub tools for project work. Do not commit or push unless the current user request explicitly asks for that side effect; that explicit request is sufficient authorization for the requested operation. Before doing so, inspect staged changes, run relevant checks, and confirm no unrelated changes are included. Never force-push.
- For local app requests, start with `corepack pnpm@12.11.2 dev` immediately. When the VS Code integrated browser is available, open the local URL from Vite and the configured deployed URL in it rather than making the user copy URLs from chat. Do not run port or public-site probes first; troubleshoot only after an actual startup failure.
- For explicitly requested Git operations, reuse the configured repository and credentials. Check only the current repo/worktree, requested target, and commit identity if needed; do not repeat wiring/authentication or run extra connectivity checks. Execute the requested operation and report its actual result. Stop only for a concrete failure or an ambiguous target.

## Delegation Preference

The owner prefers a reasoning/coordination agent to define acceptance and review outcomes, while delegating bounded execution—especially code implementation, local commands/tests, browser interaction, and Git commit/push—to the project `Muai` agent when that agent is exposed by the current host.

- Use Muai for concrete execution tasks when available and when delegation is likely to save meaningful context or isolate work. Give it the exact scope, relevant files, prohibited side effects, verification command, and required result format.
- Keep project reasoning, requirements clarification, security decisions, integration of agent work, and final review with the coordinating agent.
- Browser tasks may be delegated only if Muai actually has the needed browser page/tool. Git pushes/commits may be delegated only when the user explicitly authorized them and Muai has the correct repository permissions.
- The `.agent.md` file does not make an agent, browser, shell, network, or credential available by itself. If Muai cannot be invoked, do not pretend delegation occurred: perform the bounded task with available tools if permitted, or report the missing capability and ask the user what to do.
- Do not delegate trivially small work, duplicate the same task across agents, or spawn agents “just in case.” Delegation should reduce total effort without creating redundant token usage.

## Verification and Reporting

- Give delegated agents testable acceptance criteria, not open-ended “look into it” requests.
- Review delegated diffs/results yourself. Run the minimum independent validation needed to establish the expected outcome.
- Browser verification must use the intended environment and actual target URL; distinguish local, deployed, signed-out, and authenticated states.
- For GitHub writes, distinguish repository commit, Actions/CI, and Pages deployment results. Never infer one from another.
- Report what changed, exactly which checks passed/failed, what remains unverified, and any commit/push/deployment identifiers. Do not overstate certainty.
