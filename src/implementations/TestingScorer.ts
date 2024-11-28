import { re } from 'mathjs'
import { AISJobTestResult, JobAisData } from '../../AIS-models/models'
import IScorer from '../interfaces/IScorer'

export default class TestingScorer {
  constructor(private readonly scorerAlgo: IScorer) {}

  async score(aisData: JobAisData, dbQueryStart: number, dbQueryEnd: number): Promise<AISJobTestResult> {
    return new Promise<AISJobTestResult>(async (resolve) => {
      const algoStart = new Date().getTime()
      const simpleRes = await this.scorerAlgo.score(aisData)
      const algoEnd = new Date().getTime()

      const result: AISJobTestResult = {
        ...simpleRes,
        endQueuedTo: dbQueryStart,
        startDbQuery: dbQueryStart,
        endDbQuery: dbQueryEnd,
        startAlgo: algoStart,
        endAlgo: algoEnd,
        startQueuedFrom: algoEnd,
      }
      resolve(result)
    })
  }
}
