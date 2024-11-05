import { Geometry, LineString } from 'wkx'
import { IMessageConverter, VesselMessage } from '../interfaces/IMessages'
import { AISJobData, AisMessage } from '../../AIS-models/models'

// export type Trajectory = {
//     trajectory:
// }

export class Messages implements IMessageConverter, VesselMessage {
  constructor(data: AISJobData) {
    this.mmsi = data.mmsi
    this.ais_messages = data.aisMessages
    this.vessel_trajectory = Geometry.parse(data.trajectory.binPath) as unknown as LineString
  }

  mmsi: number
  ais_messages: AisMessage[]
  vessel_trajectory: LineString

  convert_to_job(): AISJobData {
    throw new Error('Method not implemented.')
  }
  vessel_messages(data: AISJobData): VesselMessage[] {
    throw new Error('Method not implemented.')
  }
  convert_buffer(path: Buffer): LineString {
    let geom = Geometry.parse(path)
    return geom as LineString // assertion by typecast :))
  }
}
