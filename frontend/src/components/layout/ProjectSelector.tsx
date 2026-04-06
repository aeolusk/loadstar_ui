interface ProjectSelectorProps {
  projectRoot: string;
  onProjectChange: (root: string) => void;
  onOpenDialog: () => void;
}

export default function ProjectSelector({ projectRoot, onOpenDialog }: ProjectSelectorProps) {
  return (
    <div className="project-selector">
      <div className="project-selector-row">
        <div
          className="project-selector-input"
          style={{ cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}
          onClick={onOpenDialog}
          title={projectRoot || 'Click to open a project'}
        >
          {projectRoot ? (
            <span>{projectRoot}</span>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>프로젝트를 선택하세요...</span>
          )}
        </div>
        <button className="project-selector-btn" onClick={onOpenDialog}>Open</button>
      </div>
    </div>
  );
}
