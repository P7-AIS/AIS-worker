import { Point } from 'wkx'
import { AISJobData, OldScore } from '../../AIS-models/models'
import { Messages } from '../implementations/Messages'

export interface IVesselScore {
  calculateVesselScore(): number
}

export interface IVesselAnalysis {
  trajectory_analysis(data: Messages): number
  cog_analysis(data: Messages): number
  speed_analysis(data: Messages): number
}
