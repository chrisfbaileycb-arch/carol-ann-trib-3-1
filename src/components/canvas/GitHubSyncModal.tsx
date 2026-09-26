import React, { useState, useEffect } from 'react';
import {
  GitBranch, GitPullRequest, UploadCloud, DownloadCloud,
  Check, AlertCircle, X, Lock, ExternalLink, ShieldCheck,
  RefreshCw, FileCode, CheckCircle2, Eye, EyeOff
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface GitHubSyncModalProps {
  open: boolean;
  onClose: () => void;
  activeFile: string;
  currentCode: string;
  onApplyCode: (code: string) => void;
}

function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUtf8(base64: string): string {
  const clean = base64.replace(/\s/g, '');
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export const GithubIcon: React.FC<{ className?: string }> = ({ className = 'h-4 w-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

export const GitHubSyncModal: React.FC<GitHubSyncModalProps> = ({
  open,
  onClose,
  activeFile,
  currentCode,
  onApplyCode,
}) => {
  // Stored state
  const [token, setToken] = useState<string>(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('carol_github_pat')) || '';
  });
  const [repo, setRepo] = useState<string>(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('carol_github_repo')) || '';
  });
  const [branch, setBranch] = useState<string>(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('carol_github_branch')) || 'main';
  });
  const [filePath, setFilePath] = useState<string>(() => {
    const defaultMap: Record<string, string> = {
      'Component.tsx': 'src/components/Component.tsx',
      'endpoint.ts': 'src/server/endpoint.ts',
      'schema.sql': 'src/db/schema.sql',
    };
    return defaultMap[activeFile] || `src/${activeFile}`;
  });
  const [commitMessage, setCommitMessage] = useState('Update from Sovereign Workspace');
  const [currentFileSha, setCurrentFileSha] = useState<string | null>(null);

  // UI state
  const [showToken, setShowToken] = useState(false);
  const [loadingAction, setLoadingAction] = useState<'pull' | 'push' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successReceipt, setSuccessReceipt] = useState<{
    type: 'pull' | 'push';
    sha: string;
    message: string;
    timestamp: string;
  } | null>(null);

  // Sync default filePath when activeFile changes & restore tracked SHA
  useEffect(() => {
    const defaultMap: Record<string, string> = {
      'Component.tsx': 'src/components/Component.tsx',
      'endpoint.ts': 'src/server/endpoint.ts',
      'schema.sql': 'src/db/schema.sql',
    };
    const path = defaultMap[activeFile] || `src/${activeFile}`;
    setFilePath(path);

    if (typeof window !== 'undefined' && repo.trim()) {
      try {
        const parts = repo.trim().replace(/^https?:\/\/github\.com\//, '').split('/');
        if (parts[0] && parts[1]) {
          const owner = parts[0];
          const repoName = parts[1].replace(/\.git$/, '');
          const cleanPath = path.trim().replace(/^\/+/, '');
          const savedSha = localStorage.getItem(`carol_github_sha_${owner}_${repoName}_${cleanPath}`);
          setCurrentFileSha(savedSha || null);
        }
      } catch {
        // ignore
      }
    }
  }, [activeFile, repo]);

  // Persist configuration
  const handleSaveConfig = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('carol_github_pat', token.trim());
      localStorage.setItem('carol_github_repo', repo.trim());
      localStorage.setItem('carol_github_branch', branch.trim() || 'main');
    }
  };

  const parseRepo = () => {
    const parts = repo.trim().replace(/^https?:\/\/github\.com\//, '').split('/');
    if (parts.length < 2 || !parts[0] || !parts[1]) {
      throw new Error('Please enter a valid repository in the format "owner/repo" (e.g., "owner/repo-name").');
    }
    return { owner: parts[0], repoName: parts[1].replace(/\.git$/, '') };
  };

  // Pull from GitHub REST API
  const handlePullFromGitHub = async () => {
    setErrorMessage(null);
    setSuccessReceipt(null);

    if (!token.trim()) {
      setErrorMessage('401 Unauthorized: Missing GitHub Personal Access Token (PAT). Please provide a token with "repo" scope.');
      return;
    }

    let owner = '';
    let repoName = '';
    try {
      const parsed = parseRepo();
      owner = parsed.owner;
      repoName = parsed.repoName;
    } catch (err: unknown) {
      setErrorMessage((err as Error).message);
      return;
    }

    const cleanPath = filePath.trim().replace(/^\/+/, '');
    const cleanBranch = branch.trim() || 'main';

    handleSaveConfig();
    setLoadingAction('pull');

    try {
      const url = `https://api.github.com/repos/${owner}/${repoName}/contents/${cleanPath}?ref=${cleanBranch}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token.trim()}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (res.status === 401) {
        throw new Error('401 Unauthorized: Invalid GitHub Personal Access Token or credentials expired. Please ensure token has "repo" scope.');
      }

      if (res.status === 404) {
        throw new Error(`404 Not Found: Could not find "${cleanPath}" in branch "${cleanBranch}" on repository "${owner}/${repoName}".`);
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(`GitHub API Error (${res.status}): ${errJson.message || res.statusText}`);
      }

      const data = await res.json();
      if (!data.content) {
        throw new Error('File content is empty or the path represents a directory.');
      }

      const decodedCode = base64ToUtf8(data.content);
      const fileSha = data.sha;

      // Update state and storage so subsequent pushes know the parent commit
      setCurrentFileSha(fileSha);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`carol_github_sha_${owner}_${repoName}_${cleanPath}`, fileSha);
      }

      onApplyCode(decodedCode);

      const receipt = {
        type: 'pull' as const,
        sha: fileSha,
        message: `Successfully pulled ${cleanPath} (${cleanBranch})`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setSuccessReceipt(receipt);

      toast({
        title: 'Pulled from GitHub',
        description: `Successfully pulled ${cleanPath} (${cleanBranch})`,
      });
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || 'Failed to pull from GitHub.');
    } finally {
      setLoadingAction(null);
    }
  };

  // Push to GitHub REST API
  const handlePushToGitHub = async () => {
    setErrorMessage(null);
    setSuccessReceipt(null);

    if (!token.trim()) {
      setErrorMessage('401 Unauthorized: Missing GitHub Personal Access Token (PAT). Please provide a token with "repo" scope.');
      return;
    }

    let owner = '';
    let repoName = '';
    try {
      const parsed = parseRepo();
      owner = parsed.owner;
      repoName = parsed.repoName;
    } catch (err: unknown) {
      setErrorMessage((err as Error).message);
      return;
    }

    const cleanPath = filePath.trim().replace(/^\/+/, '');
    const cleanBranch = branch.trim() || 'main';

    handleSaveConfig();
    setLoadingAction('push');

    try {
      // Check stored SHA or fetch current file SHA first to ensure correct parent commit
      let parentSha = currentFileSha;
      if (!parentSha && typeof window !== 'undefined') {
        parentSha = localStorage.getItem(`carol_github_sha_${owner}_${repoName}_${cleanPath}`);
      }

      // If SHA is not yet stored, attempt to fetch existing remote SHA to prevent avoidable 409
      if (!parentSha) {
        const checkUrl = `https://api.github.com/repos/${owner}/${repoName}/contents/${cleanPath}?ref=${cleanBranch}`;
        const checkRes = await fetch(checkUrl, {
          headers: {
            Authorization: `Bearer ${token.trim()}`,
            Accept: 'application/vnd.github.v3+json',
          },
        });
        if (checkRes.ok) {
          const existing = await checkRes.json();
          parentSha = existing.sha || null;
        }
      }

      const url = `https://api.github.com/repos/${owner}/${repoName}/contents/${cleanPath}`;
      const payload: {
        message: string;
        content: string;
        branch: string;
        sha?: string;
      } = {
        message: commitMessage.trim() || 'Update from Sovereign Workspace',
        content: utf8ToBase64(currentCode),
        branch: cleanBranch,
      };

      if (parentSha) {
        payload.sha = parentSha;
      }

      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token.trim()}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        throw new Error('401 Unauthorized: Bad credentials or expired GitHub Personal Access Token. Please check token permissions and expiry.');
      }

      if (res.status === 409) {
        throw new Error('409 Conflict: Remote branch SHA mismatch or newer commit exists on GitHub. Someone else pushed first or the parent commit changed. Please pull latest changes before pushing.');
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(`GitHub Push Error (${res.status}): ${errJson.message || res.statusText}`);
      }

      const result = await res.json();
      const newSha = result.content?.sha || result.commit?.sha;

      if (newSha) {
        setCurrentFileSha(newSha);
        if (typeof window !== 'undefined') {
          localStorage.setItem(`carol_github_sha_${owner}_${repoName}_${cleanPath}`, newSha);
        }
      }

      const commitShaReceipt = result.commit?.sha || newSha || 'confirmed';
      const receipt = {
        type: 'push' as const,
        sha: commitShaReceipt,
        message: `Committed and pushed to ${cleanBranch}`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setSuccessReceipt(receipt);

      toast({
        title: 'Pushed to GitHub',
        description: `Successfully pushed ${cleanPath} (${cleanBranch}) · Commit SHA: ${commitShaReceipt.slice(0, 10)}`,
      });
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || 'Failed to push to GitHub.');
    } finally {
      setLoadingAction(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl rounded-2xl border border-white/12 bg-[#12131D] text-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 text-white">
              <GithubIcon className="h-4 w-4" />
            </span>
            <div>
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <span>GitHub Repository Sync</span>
                <span className={`text-[9.5px] font-mono px-2 py-0.2 rounded border ${
                  token ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' : 'border-amber-400/40 bg-amber-400/10 text-amber-300'
                }`}>
                  {token ? 'PAT Configured' : 'Setup Needed'}
                </span>
              </h3>
              <p className="text-[11px] text-white/50">
                Direct REST API synchronization with your remote Git repository
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/40 hover:text-white hover:bg-white/5 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="min-h-0 flex-1 overflow-y-auto m-scroll p-5 space-y-4">
          {/* Error Banner */}
          {errorMessage && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200 flex flex-col gap-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed flex-1">{errorMessage}</div>
              </div>
              {errorMessage.includes('409') && (
                <div className="pl-6.5">
                  <button
                    type="button"
                    onClick={handlePullFromGitHub}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-sky-400/40 bg-sky-500/20 px-3 py-1 text-[11px] font-medium text-sky-200 hover:bg-sky-500/30 transition"
                  >
                    <DownloadCloud className="h-3 w-3" />
                    <span>Pull latest remote changes to resolve conflict</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Success Receipt */}
          {successReceipt && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200 flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">{successReceipt.message}</span>
                <p className="text-[10.5px] font-mono text-emerald-300/80 mt-0.5">
                  Commit/Blob SHA: {successReceipt.sha} · {successReceipt.timestamp}
                </p>
              </div>
            </div>
          )}

          {/* Configuration Form */}
          <div className="space-y-3.5">
            {/* GitHub PAT */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-white/70 flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-rose-400" />
                  <span>GitHub Personal Access Token (PAT)</span>
                </label>
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10.5px] text-rose-400 hover:underline flex items-center gap-1"
                >
                  <span>Generate token</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx (requires 'repo' scope)"
                  className="w-full rounded-xl border border-white/12 bg-white/[0.03] py-2 pl-3 pr-9 font-mono text-xs text-white outline-none focus:border-rose-400 placeholder:text-white/25"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-2.5 top-2 text-white/40 hover:text-white"
                >
                  {showToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* Repository & Branch */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-white/70 mb-1">
                  Repository (owner/repo)
                </label>
                <input
                  type="text"
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  placeholder="e.g. acme-corp/executive-workspace"
                  className="w-full rounded-xl border border-white/12 bg-white/[0.03] px-3 py-2 font-mono text-xs text-white outline-none focus:border-rose-400 placeholder:text-white/25"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-white/70 mb-1">
                  Branch
                </label>
                <div className="relative">
                  <GitBranch className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-white/40" />
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="main"
                    className="w-full rounded-xl border border-white/12 bg-white/[0.03] py-2 pl-8.5 pr-3 font-mono text-xs text-white outline-none focus:border-rose-400"
                  />
                </div>
              </div>
            </div>

            {/* Target File Path */}
            <div>
              <label className="block text-[11px] font-medium text-white/70 mb-1 flex items-center justify-between">
                <span>Repository File Path</span>
                <span className="text-[10px] text-white/40 font-mono">Syncing {activeFile}</span>
              </label>
              <div className="relative">
                <FileCode className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-rose-400" />
                <input
                  type="text"
                  value={filePath}
                  onChange={(e) => setFilePath(e.target.value)}
                  placeholder="src/components/Component.tsx"
                  className="w-full rounded-xl border border-white/12 bg-white/[0.03] py-2 pl-8.5 pr-3 font-mono text-xs text-white outline-none focus:border-rose-400"
                />
              </div>
            </div>

            {/* Commit Message */}
            <div>
              <label className="block text-[11px] font-medium text-white/70 mb-1">
                Commit Message (for Push)
              </label>
              <input
                type="text"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Update from Sovereign Workspace"
                className="w-full rounded-xl border border-white/12 bg-white/[0.03] px-3 py-2 text-xs text-white outline-none focus:border-rose-400"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/8 px-5 py-3.5 bg-white/[0.02]">
          <span className="text-[10.5px] text-white/40">
            Local credentials stay in browser memory.
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePullFromGitHub}
              disabled={loadingAction !== null}
              className="flex items-center gap-1.5 rounded-xl border border-sky-400/30 bg-sky-400/10 px-3.5 py-2 text-xs font-semibold text-sky-200 transition hover:bg-sky-400/20 disabled:opacity-50"
            >
              <DownloadCloud className={`h-3.5 w-3.5 ${loadingAction === 'pull' ? 'animate-bounce' : ''}`} />
              <span>{loadingAction === 'pull' ? 'Pulling...' : 'Pull from GitHub'}</span>
            </button>

            <button
              type="button"
              onClick={handlePushToGitHub}
              disabled={loadingAction !== null}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:opacity-90 disabled:opacity-50"
            >
              <UploadCloud className={`h-3.5 w-3.5 ${loadingAction === 'push' ? 'animate-bounce' : ''}`} />
              <span>{loadingAction === 'push' ? 'Pushing...' : 'Push to GitHub'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GitHubSyncModal;
