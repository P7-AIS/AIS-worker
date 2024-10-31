import { AISJobData, AISJobResult } from '../../AIS-models/models'
import IScorer from '../interfaces/IScorer'

export default class RandomScore implements IScorer {
  score(jobData: AISJobData): Promise<AISJobResult> {
    return new Promise<AISJobResult>((resolve) => {
      resolve({ mmsi: jobData.mmsi, trustworthiness: Math.random(), reason: 'Random', algorithm: jobData.algorithm })
    })
  }
}
