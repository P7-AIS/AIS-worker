import { Geometry, LineString } from 'wkx'
import { AISJobData, AisMessage } from '../../AIS-models/models'

export interface IMessageConverter {
  convert_buffer(path: Buffer): LineString
  convert_to_job(): AISJobData
}

export type VesselMessage = {
  mmsi: number
  aisMessages: AisMessage[]
  vesselTrajectory: Geometry
}

//export interface IVesselTrajectory {
//
//}
