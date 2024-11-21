import { Job, Queue, Worker } from 'bullmq'
import IWorker from '../interfaces/IWorker'
import { AISJobData, AISJobResult, AISWorkerAlgorithm } from '../../AIS-models/models'
import IScorer from '../interfaces/IScorer'
import DatabaseHandler from './DatabaseHandler'

export default class AISWorker implements IWorker {
  private readonly worker: Worker

  constructor(
    private readonly jobQueue: Queue<AISJobData, AISJobResult>,
    private readonly databaseHandler: DatabaseHandler,
    private readonly connection: { host: string; port: number },
    private readonly randomScorer: IScorer,
    private readonly simpleScorer: IScorer,
    private readonly hashScorer: IScorer
  ) {
    this.worker = new Worker(this.jobQueue.name, this.computeJob.bind(this), {
      connection: this.connection,
      autorun: false,
    })

    this.worker.on('completed', (job: Job) => {
      console.log(`Job ${job.id} has been completed!`)
    })

    this.worker.on('ready', () => {
      console.log(`Worker is ready`)
    })

    this.worker.on('failed', (job: Job | undefined, err: Error, prev: string) => {
      console.error(`Job ${job?.id} has failed with error: ${err.message}`)
    })

    this.worker.on('error', (err: Error) => {
      console.error(`Worker has failed with error: ${err.message}`)
    })

    this.worker.on('stalled', (jobId: string, prev: string) => {
      console.error(`Job ${jobId} has stalled`)
    })

    this.worker.on('drained', () => {
      console.log(`Worker has drained`)
    })
  }

  public start() {
    this.worker.run()
  }

  public async stop() {
    await this.worker.close()
  }

  private async computeJob(job: Job<AISJobData, AISJobResult>): Promise<AISJobResult> {
    console.log(`Processing job ${job.id}`)

    const { mmsi, timestamp, algorithm } = job.data

    const messages = await this.databaseHandler.getAisMessages(mmsi, timestamp, 1)
    const trajectory = await this.databaseHandler.getTrajectory(mmsi, timestamp, 1)

    const data = {
      mmsi,
      messages,
      trajectory,
      algorithm,
    }

    switch (job.data.algorithm) {
      case AISWorkerAlgorithm.RANDOM:
        return this.randomScorer.score(data)
      case AISWorkerAlgorithm.SIMPLE:
        return this.simpleScorer.score(data)
      case AISWorkerAlgorithm.HASHED:
        return this.hashScorer.score(data)
      default:
        throw new Error('Invalid algorithm')
    }
  }
}
