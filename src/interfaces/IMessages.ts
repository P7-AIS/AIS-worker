import { Geometry, LineString } from 'wkx'
import { AISJobData, AisMessage } from '../../AIS-models/models'

export interface IMessageConverter {
  convertBuffer(path: Buffer): LineString
  convertToJob(): AISJobData
}

export type VesselMessage = {
  mmsi: number
  aisMessages: AisMessage[]
  vesselTrajectory: Geometry
}
