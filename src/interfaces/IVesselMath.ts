import { Messages } from '../implementations/Messages'

export interface IVesselScore {
  calculateVesselScore(messages: Messages): number
}

export interface IVesselAnalysis {
  trajectoryAnalysis(data: Messages): number
  cogAnalysis(data: Messages): number
  sogAnalysis(data: Messages): number
}
