import { ComponentCard } from '../types';

export interface GitHubConfig {
  owner: string;
  repo: string;
  branch: string;
  token: string;
}

const GITHUB_CONFIG_KEY = 'greendocs_github_config_v1';

export function getGitHubConfig(): GitHubConfig | null {
  try {
    const raw = localStorage.getItem(GITHUB_CONFIG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveGitHubConfig(config: GitHubConfig): void {
  localStorage.setItem(GITHUB_CONFIG_KEY, JSON.stringify(config));
}

/**
 * Commits a markdown file directly to GitHub repository via REST API.
 */
export async function commitMarkdownToGitHub(
  filePath: string,
  content: string,
  commitMessage: string
): Promise<{ success: boolean; error?: string }> {
  const config = getGitHubConfig();
  if (!config || !config.token || !config.owner || !config.repo) {
    return { success: false, error: 'GitHub configuration or token missing. Please configure repository settings.' };
  }

  const cleanPath = filePath.replace(/^\/+/, '');
  const apiUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${cleanPath}`;

  try {
    // 1. Check if file already exists to get its SHA (required for updates)
    let sha: string | undefined = undefined;
    const getRes = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/vnd.github+json',
      },
    });

    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
    }

    // 2. Encode content to base64 (UTF-8 safe)
    const base64Content = btoa(unescape(encodeURIComponent(content)));

    // 3. Put commit request
    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: commitMessage,
        content: base64Content,
        branch: config.branch || 'main',
        ...(sha ? { sha } : {}),
      }),
    });

    if (!putRes.ok) {
      const errJson = await putRes.json().catch(() => ({}));
      return { success: false, error: errJson.message || `GitHub API error: ${putRes.statusText}` };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error connecting to GitHub API.' };
  }
}

/**
 * Serializes a ComponentCard into a standard Markdown markdown format.
 */
export function serializeCardToMarkdown(card: ComponentCard): string {
  return `---
title: ${card.title}
tag: ${card.tag || 'Architecture'}
order: ${card.order || 1}
definition: ${card.definition || ''}
---

${card.definition || 'Component definition and architectural concept.'}

### Key Rule
${card.keyRule || 'Ensure strict invariant safety.'}

\`\`\`typescript
${card.deepDive?.typescriptInterface || 'interface Config {\n  id: string;\n}'}
\`\`\`
`;
}
