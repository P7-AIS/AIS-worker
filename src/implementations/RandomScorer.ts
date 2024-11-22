import { AISJobResult, JobAisData } from '../../AIS-models/models'
import IScorer from '../interfaces/IScorer'

export default class RandomScore implements IScorer {
  score(aisData: JobAisData): Promise<AISJobResult> {
    return new Promise<AISJobResult>((resolve) => {
      resolve({ mmsi: aisData.mmsi, trustworthiness: Math.random(), reason: 'Random', algorithm: aisData.algorithm })
    })
  }
}
