import { Geometry, LineString, MultiLineString } from 'wkx'
import { IMessageConverter, VesselMessage } from '../interfaces/IMessages'
import { AISJobData, AisMessage } from '../../AIS-models/models'

// export type Trajectory = {
//     trajectory:
// }

export class Messages implements IMessageConverter, VesselMessage {
  /**
   * Note: this throws if input trajectory is not of type `LineString`
   */
  constructor(data: AISJobData) {
    this.mmsi = data.mmsi
    this.aisMessages = data.aisMessages

    let geom = Geometry.parse(Buffer.from(data.trajectory.binPath))
    if (!(geom instanceof LineString)) {
      throw new Error('input geometry not of type LineString')
    }
    // if (!geom.hasM) {
    //   throw new Error('Input trajectory has no M (Measure)')
    // }
    this.vesselTrajectory = geom
  }

  mmsi: number
  aisMessages: AisMessage[]
  vesselTrajectory: LineString

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
