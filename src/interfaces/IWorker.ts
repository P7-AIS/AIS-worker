export default interface IWorker {
  start(): void
  stop(): Promise<void>
}
