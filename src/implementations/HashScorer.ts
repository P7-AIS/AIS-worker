import { AISJobData, AISJobResult } from '../../AIS-models/models'
import IScorer from '../interfaces/IScorer'

export default class HashScorer implements IScorer {
  score(jobData: AISJobData): Promise<AISJobResult> {
    return new Promise<AISJobResult>((resolve) => {
      const rng = this.getRng(jobData.mmsi)

      resolve({
        mmsi: jobData.mmsi,
        trustworthiness: rng(),
        reason: 'Hashed',
        algorithm: jobData.algorithm,
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
