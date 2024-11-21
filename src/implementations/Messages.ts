import { Geometry, LineString, MultiLineString } from 'wkx'
import { IMessageConverter, VesselMessage } from '../interfaces/IMessages'
import { AISJobData, AisMessage } from '../../AIS-models/models'
import { AisData } from '../interfaces/IScorer'

export class Messages implements IMessageConverter, VesselMessage {
  /**
   * Note: this throws if input trajectory is not of type `LineString`
   */
  constructor(data: AisData) {
    this.mmsi = data.mmsi
    this.aisMessages = data.messages

    let geom = Geometry.parse(Buffer.from(data.trajectory.binPath))
    if (!(geom instanceof LineString)) {
      throw new Error('input geometry not of type LineString')
    }
    this.vesselTrajectory = geom
  }

  mmsi: number
  aisMessages: AisMessage[]
  vesselTrajectory: LineString

  convertToJob(): AISJobData {
    throw new Error('Method not implemented.')
  }
  vesselMessages(data: AISJobData): VesselMessage[] {
    throw new Error('Method not implemented.')
  }
  convertBuffer(path: Buffer): LineString {
    let geom = Geometry.parse(path)
    return geom as LineString // assertion by typecast :))
  }
}
