import { Star } from '@phosphor-icons/react';

interface AboutDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function AboutDialog({ open, onClose }: AboutDialogProps) {
  if (!open) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.dialog} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <Star size={20} weight="fill" color="#8b6914" />
          <span style={styles.title}>LOADSTAR Explorer</span>
        </div>
        <div style={styles.body}>
          <div style={styles.version}>v0.0.1</div>
          <div style={styles.desc}>
            LOADSTAR 방법론 기반 프로젝트 탐색 도구
          </div>
          <div style={styles.stack}>
            Spring Boot 3 &middot; React 19 &middot; TypeScript &middot; Vite
          </div>
        </div>
        <div style={styles.footer}>
          <button style={styles.btn} onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed' as const, inset: 0,
    background: 'rgba(44, 36, 23, 0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1100,
  },
  dialog: {
    background: '#faf8f5',
    border: '1px solid #d4c9b8',
    borderRadius: 10,
    boxShadow: '0 8px 32px rgba(44, 36, 23, 0.2)',
    width: 360,
    overflow: 'hidden',
  },
  header: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '20px 24px 12px',
  },
  title: { fontSize: 18, fontWeight: 700, color: '#2c2417' },
  body: {
    padding: '0 24px 20px',
  },
  version: {
    fontSize: 14, color: '#8b6914', fontWeight: 600,
    marginBottom: 12,
  },
  desc: {
    fontSize: 13, color: '#2c2417', lineHeight: 1.5,
    marginBottom: 8,
  },
  stack: {
    fontSize: 11, color: '#9b8e7e',
  },
  footer: {
    padding: '12px 24px',
    borderTop: '1px solid #e5ddd0',
    display: 'flex', justifyContent: 'flex-end',
  },
  btn: {
    padding: '6px 20px', border: '1px solid #d4c9b8', borderRadius: 6,
    background: '#fff', color: '#6b5d4d',
    fontSize: 13, cursor: 'pointer',
  },
};
