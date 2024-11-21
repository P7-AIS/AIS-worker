import { AISJobData, AISJobResult } from '../../AIS-models/models'
import IScorer, { AisData } from '../interfaces/IScorer'

export default class HashScorer implements IScorer {
  score(aisData: AisData): Promise<AISJobResult> {
    return new Promise<AISJobResult>((resolve) => {
      const rng = this.getRng(aisData.mmsi)

      resolve({
        mmsi: aisData.mmsi,
        trustworthiness: rng(),
        reason: 'Hashed',
        algorithm: aisData.algorithm,
      })
    })
  }

  private getRng(seed: number) {
    var m = 2 ** 35 - 31
    var a = 185852
    var s = seed % m
    return function () {
      return (s = (s * a) % m) / m
    }
  }
}
