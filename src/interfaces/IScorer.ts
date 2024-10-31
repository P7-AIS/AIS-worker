import { AISJobData, AISJobResult } from '../../AIS-models/models'

export default interface IScorer {
  score(jobData: AISJobData): Promise<AISJobResult>
}
