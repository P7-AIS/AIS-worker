import { AISJobResult } from '../../AIS-models/models'
import IScorer, { AisData } from '../interfaces/IScorer'

export default class RandomScore implements IScorer {
  score(aisData: AisData): Promise<AISJobResult> {
    return new Promise<AISJobResult>((resolve) => {
      resolve({ mmsi: aisData.mmsi, trustworthiness: Math.random(), reason: 'Random', algorithm: aisData.algorithm })
    })
  }
}
