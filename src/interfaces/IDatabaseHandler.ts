import { AisMessage, Trajectory } from '../../AIS-models/models'

export default interface IDatabaseHandler {
  getAisData(
    mmsi: number,
    timestamp: number,
    duration_h: number
  ): Promise<{ messages: AisMessage[]; trajectory: Trajectory }>
}
