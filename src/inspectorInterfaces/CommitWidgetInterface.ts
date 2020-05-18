export default interface CommitWidgetInterface {
  CreateCommitWidget(): HTMLDivElement;
  UpdateCommitButton(): void;
  onCommit(): void;
}