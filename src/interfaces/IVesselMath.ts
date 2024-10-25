import { AISJobData } from "../../AIS-models/models";
import { Messages } from "../implementations/Messages";

export interface TrustScore {
  average_weighted_score: number;
  trajectory_score: number;
  cog_score: number;
  head_score: number;
  speed_score: number;
  position_score: number;
}

export interface IVesselScore {
  calculateVesselScore(anal: IVesselAnalysis): TrustScore;
}

export interface IVesselAnalysis {
  trajectory_analysis(data: Messages): number;
  cog_analysis(data: Messages): number;
  head_analysis(data: Messages): number;
  speed_analysis(data: Messages): number;
  position_analysis(data: Messages): number;
}
