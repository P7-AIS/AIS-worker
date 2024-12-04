import { Job, Queue, Worker } from 'bullmq'
import IWorker from '../interfaces/IWorker'
import { AISJobData, AISJobResult, AISJobTestResult, AISWorkerAlgorithm, JobAisData } from '../../AIS-models/models'
import IScorer from '../interfaces/IScorer'
import PostgresDatabaseHandler from './PostgresDatabaseHandler'
import jobAisData from './jobAisData.json'
import TestingScorer from './TestingScorer'

export default class AISWorker implements IWorker {
  private readonly worker: Worker
  private readonly testData: JobAisData

  constructor(
    private readonly jobQueue: Queue<AISJobData, AISJobResult>,
    private readonly databaseHandler: PostgresDatabaseHandler,
    private readonly connection: { host: string; port: number },
    private readonly randomScorer: IScorer,
    private readonly simpleScorer: IScorer,
    private readonly hashScorer: IScorer,
    private readonly testingScorer: TestingScorer
  ) {
    this.testData = {
      mmsi: jobAisData.mmsi,
      messages: jobAisData.messages.map((msg) => ({ ...msg, timestamp: new Date(msg.timestamp) })),
      trajectory: {
        mmsi: jobAisData.trajectory.mmsi,
        binPath: Buffer.from(jobAisData.trajectory.binPath.data),
      },
      algorithm: AISWorkerAlgorithm.PROFILING_JSON,
    }

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

    job.progress

    let data: JobAisData

    const dbQueryStart = new Date().getTime()

    if (job.data.algorithm === AISWorkerAlgorithm.PROFILING_JSON) {
      data = this.testData
    } else {
      const aisData = await this.databaseHandler.getAisData(mmsi, timestamp, 1)
      data = {
        mmsi,
        messages: aisData.messages,
        trajectory: aisData.trajectory,
        algorithm,
      }
    }

    const dbQueryEnd = new Date().getTime()

    switch (job.data.algorithm) {
      case AISWorkerAlgorithm.RANDOM:
        return this.randomScorer.score(data)
      case AISWorkerAlgorithm.SIMPLE:
        return this.simpleScorer.score(data)
      case AISWorkerAlgorithm.HASHED:
        return this.hashScorer.score(data)
      case AISWorkerAlgorithm.PROFILING_FETCH:
      case AISWorkerAlgorithm.PROFILING_JSON:
        return this.testingScorer.score(data, dbQueryStart, dbQueryEnd)
      default:
        throw new Error('Invalid algorithm')
    }
  }
}
