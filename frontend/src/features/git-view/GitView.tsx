import type { CSSProperties } from 'react';
import { sampleGitLog } from '../../data/sampleData';

const styles: Record<string, CSSProperties> = {
  container: {
    padding: 24,
    overflowY: 'auto',
    height: '100%',
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: 20,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  card: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-light)',
    borderRadius: 'var(--radius-md)',
    padding: '14px 18px',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
  },
  hash: {
    fontFamily: 'monospace',
    fontSize: 'var(--font-sm)',
    color: 'var(--accent-primary)',
    background: 'var(--accent-bg)',
    padding: '2px 8px',
    borderRadius: 'var(--radius-sm)',
    fontWeight: 600,
    flexShrink: 0,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  message: {
    fontSize: 'var(--font-base)',
    color: 'var(--text-primary)',
    fontWeight: 500,
    marginBottom: 4,
  },
  meta: {
    display: 'flex',
    gap: 12,
    fontSize: 'var(--font-sm)',
    color: 'var(--text-muted)',
  },
  author: {
    fontWeight: 500,
    color: 'var(--text-secondary)',
  },
};

export default function GitView() {
  return (
    <div style={styles.container}>
      <div style={styles.title}>Git History</div>
      <div style={styles.list}>
        {sampleGitLog.map((commit) => (
          <div key={commit.hash} style={styles.card}>
            <span style={styles.hash}>{commit.hash.slice(0, 7)}</span>
            <div style={styles.body}>
              <div style={styles.message}>{commit.message}</div>
              <div style={styles.meta}>
                <span style={styles.author}>{commit.author}</span>
                <span>{commit.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
