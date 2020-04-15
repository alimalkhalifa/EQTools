export default interface DatabaseListeners {
  loadFromDatabase(): void;
  disconnectedFromDatabase(): void;
}