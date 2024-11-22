import { AISJobResult, JobAisData } from '../../AIS-models/models'

export default interface IScorer {
  score(aisData: JobAisData): Promise<AISJobResult>
}
