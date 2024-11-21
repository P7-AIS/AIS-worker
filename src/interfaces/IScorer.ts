import { AISJobResult, AisMessage, AISWorkerAlgorithm, Trajectory } from '../../AIS-models/models'

export interface AisData {
  mmsi: number
  messages: AisMessage[]
  trajectory: Trajectory
  algorithm: AISWorkerAlgorithm
}

export default interface IScorer {
  score(aisData: AisData): Promise<AISJobResult>
}
