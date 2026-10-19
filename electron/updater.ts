import { UpdateInfo } from './types.js';

const CURRENT_VERSION = '1.4.0';
const GITHUB_REPO = 'ryka-parikh/clipboard-shield-pbl2';

export class UpdateChecker {
  public static async checkForUpdates(): Promise<UpdateInfo> {
    try {
      const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
        headers: {
          'User-Agent': 'ClipboardShield-Desktop-Updater',
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return {
            hasUpdate: false,
            currentVersion: CURRENT_VERSION,
            releaseNotes: 'You are running the latest production build (v1.4.0). No newer releases published.',
          };
        }
        return {
          hasUpdate: false,
          currentVersion: CURRENT_VERSION,
          error: `GitHub API returned status ${response.status}`,
        };
      }

      const data = await response.json() as any;
      const latestTag = data.tag_name ? data.tag_name.replace(/^v/, '') : '';

      const hasUpdate = this.compareSemver(latestTag, CURRENT_VERSION) > 0;
      let downloadUrl: string | undefined;
      let sha256: string | undefined;

      if (Array.isArray(data.assets)) {
        const exeAsset = data.assets.find((a: any) => a.name.endsWith('.exe'));
        if (exeAsset) {
          downloadUrl = exeAsset.browser_download_url;
        }
        const shaAsset = data.assets.find((a: any) => a.name.includes('sha256') || a.name.includes('checksum'));
        if (shaAsset) {
          sha256 = shaAsset.browser_download_url;
        }
      }

      return {
        hasUpdate,
        currentVersion: CURRENT_VERSION,
        latestVersion: latestTag || CURRENT_VERSION,
        releaseName: data.name || `Release v${latestTag}`,
        releaseNotes: data.body || 'Performance improvements and security updates.',
        publishedAt: data.published_at,
        downloadUrl,
        sha256,
      };
    } catch (err: any) {
      return {
        hasUpdate: false,
        currentVersion: CURRENT_VERSION,
        error: err?.message || 'Network unavailable or offline',
      };
    }
  }

  private static compareSemver(v1: string, v2: string): number {
    const parts1 = v1.split('.').map((p) => parseInt(p, 10) || 0);
    const parts2 = v2.split('.').map((p) => parseInt(p, 10) || 0);
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const a = parts1[i] || 0;
      const b = parts2[i] || 0;
      if (a > b) return 1;
      if (a < b) return -1;
    }
    return 0;
  }
}
