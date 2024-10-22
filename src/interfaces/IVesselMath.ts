interface TrustScore {
    average_weighted_score: number
    trajectory_score: number
    cog_score: number
    head_score: number
    speed_score: number
    position_score: number
}

export default interface IVesselScore {
    calculateVesselScore(IVesselAnalysis): number
}

export default interface IVesselAnalysis {
    trajectory_anal(): number
    cog_anal(): number
    head_anal(): number
    speed_anal(): number
    anal_position(): number
}

