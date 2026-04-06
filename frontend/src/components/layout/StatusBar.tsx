interface StatusBarProps {
  projectRoot: string;
}

const StatusBar = ({ projectRoot }: StatusBarProps) => {
  return (
    <div className="status-bar">
      <div className="status-bar-item">{projectRoot}</div>
      <div className="status-bar-separator" />
      <div className="status-bar-item">checkpoint: --</div>
      <div className="status-bar-separator" />
      <div className="status-bar-item">drift: 0</div>
      <div className="status-bar-spacer" />
      <div className="status-bar-item">v0.1.0</div>
    </div>
  );
};

export default StatusBar;
