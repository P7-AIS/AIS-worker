import regression from 'regression'
import { LineString, Point } from 'wkx'
import { AISJobData, AISJobResult, AisMessage, AISWorkerAlgorithm } from '../../AIS-models/models'
import IScorer from '../interfaces/IScorer'
import { IVesselAnalysis, IVesselScore } from '../interfaces/IVesselMath'
import { Messages } from './Messages'

export default class SimpleScorer implements IScorer, IVesselScore, IVesselAnalysis {
  origTrajScore: number | undefined
  origCogScore: number | undefined
  origSogScore: number | undefined

  score(jobData: AISJobData): Promise<AISJobResult> {
    let mes = new Messages(jobData)
    const trustworthiness = this.calculateVesselScore(mes)

    let reason = trustReason(this.origTrajScore!, this.origCogScore!, this.origSogScore!)

    let res: AISJobResult = {
      mmsi: jobData.mmsi,
      trustworthiness: trustworthiness,
      reason: reason,
      algorithm: AISWorkerAlgorithm.SIMPLE,
    }

    return new Promise((resolve) => resolve(res))
  }

  calculateVesselScore(messages: Messages): number {
    let TRAJ_W = 0.5
    let COG_W = 0.25
    let SOG_W = 0.25

    let trajScore = this.trajectoryAnalysis(structuredClone(messages))
    let cogScore = this.cogAnalysis(structuredClone(messages))
    let sogScore = this.speedAnalysis(structuredClone(messages))

    if (Number.isNaN(trajScore)) {
      trajScore = 1
      TRAJ_W = 0
    }

    if (Number.isNaN(cogScore)) {
      cogScore = 1
      COG_W = 0
    }

    if (Number.isNaN(sogScore)) {
      sogScore = 1
      SOG_W = 0
    }
    this.origTrajScore = trajScore
    this.origCogScore = cogScore
    this.origSogScore = sogScore

    let score = (trajScore * TRAJ_W + cogScore * COG_W + sogScore * SOG_W) / (TRAJ_W + COG_W + SOG_W)

    score = isNaN(score) || !isFinite(score) ? 1 : score // We can't say much about a ship that does not provide data enough for analysis.
    return score
  }

  // The idea is to utilize curve fitting
  trajectoryAnalysis(message: Messages): number {
    let points = message.vesselTrajectory.points

    let pointsLen = points.length - 2

    let scores: number[] = []

    for (let i = 2; i < pointsLen; i++) {
      scores.push(trajectorySingleScore([points[i - 2], points[i - 1], points[i + 1], points[i + 2], points[i]]))
    }

    return scoreCalculator(scores)
  }
  cogAnalysis(data: Messages): number {
    return scoreCalculator(headingScorer(data.vesselTrajectory, data.aisMessages))
  }

  speedAnalysis(data: Messages): number {
    const scores = scoreCalculator(sogPairings(data))
    return scores
  }
}

function trustReason(trajScore: number, cogScore: number, sogScore: number): string {
  let reason: string[] = []
  //TODO: completely arbitrary
  const TRAJ_THRES = 0.5
  const COG_THRES = 0.5
  const SOG_THRES = 0.5
  const TRAJ_REASON = 'bad trajectory'
  const COG_REASON = 'bad COG'
  const SOG_REASON = 'bad SOG'
  const SEPARATOR = ' | '

  if (trajScore < TRAJ_THRES) {
    reason.push(TRAJ_REASON)
  }

  if (cogScore < COG_THRES) {
    reason.push(COG_REASON)
  }

  if (sogScore < SOG_THRES) {
    reason.push(SOG_REASON)
  }

  return reason.join(SEPARATOR)
}

function scoreCalculator(scores: number[]): number {
  const DECAY_FACTOR = 0.99

  let numerator = scores.map((s, i) => s * Math.pow(DECAY_FACTOR, i + 1)).reduce((acc, val) => acc + val, 0)

  let denominator = scores.map((_, i) => Math.pow(DECAY_FACTOR, i + 1)).reduce((acc, val) => acc + val, 0)

  return numerator / denominator
}

export function normalizePoints(heading: number, points: Point[]): Point[] {
  // Normalize first from first point.
  let firstPoint = points[0]
  let headRad = ((heading - 90) * Math.PI) / 180

  // Move the first point to center and others respectively.
  points = points.map(
    (p: Point) => new Point(p.x - firstPoint.x, p.y - firstPoint.y, undefined, p.m - firstPoint.m, p.srid)
  )

  // Now rotate the points such that they are centered by the heading of the ship.
  points = points.map(
    (p: Point) =>
      new Point(
        p.x * Math.cos(headRad) - p.y * Math.sin(headRad),
        p.x * Math.sin(headRad) + p.y * Math.cos(headRad),
        undefined,
        p.m,
        p.srid
      )
  )

  return points
}

// This should use a simpler type for solving. Instead of Point, then simply an array of tuples.
// It should allow time to be used as x.
export function solveQuadraticCoeeficients(points: [number, number][]): number[] {
  const result = regression.polynomial(points, { order: 2, precision: 10 })

  return result.equation
}

function vessel_position(coefficients: number[], timestamp: number): number {
  return coefficients[0] * Math.pow(timestamp, 2) + coefficients[1] * timestamp + coefficients[2]
}

export function haversineDist(point_test: [number, number], point_real: [number, number]): number {
  let point1: [number, number] = [(point_test[0] * Math.PI) / 180, (point_test[1] * Math.PI) / 180]
  let point2: [number, number] = [(point_real[0] * Math.PI) / 180, (point_real[1] * Math.PI) / 180]

  const R = 6371000 // Radius of earth in m.
  return (
    2 *
    R *
    Math.asin(
      Math.sqrt(
        Math.pow(Math.sin((point1[1] - point2[1]) / 2), 2) +
          Math.cos(point1[1]) * Math.cos(point2[1]) * Math.pow(Math.sin((point1[0] - point2[0]) / 2), 2)
      )
    )
  )
}

/**
 * Computes the bearing between two points, in degrees
 */
export function bearing(lon1: number, lat1: number, lon2: number, lat2: number): number {
  // map lon/lat's to radians
  const rLon1 = lon1 * (Math.PI / 180)
  const rLat1 = lat1 * (Math.PI / 180)
  const rLon2 = lon2 * (Math.PI / 180)
  const rLat2 = lat2 * (Math.PI / 180)
  const deltaLon = rLon2 - rLon1

  const y = Math.sin(deltaLon) * Math.cos(rLat2)
  const x = Math.cos(rLat1) * Math.sin(rLat2) - Math.sin(rLat1) * Math.cos(rLat2) * Math.cos(deltaLon)

  const theta = Math.atan2(y, x)

  return ((theta * 180) / Math.PI + 360) % 360
}

export function headingScorer({ points }: LineString, messages: AisMessage[]): number[] {
  let shifted = structuredClone(points)
  shifted.shift()

  let computed_bearings = zip(points, shifted).map((pair) => bearing(pair[0].x, pair[0].y, pair[1].x, pair[1].y))

  const TOLERANCE = 15 //TODO: Completely arbitrary :D
  let niceCog = zip(computed_bearings, messages)
    .map((x) => [x[0], x[1].cog])
    .filter((x): x is [number, number] => x[1] !== undefined || x !== null || !Number.isNaN(x[1]))
    .map((x) => Math.abs(x[0] - x[1]))
    .map((x) => Math.max(x - TOLERANCE, 0))
    .map((x) => 1 - x / 360)
  return niceCog
}

//? why is this not a standard library function?
function zip<a, b>(left: a[], right: b[]): [a, b][] {
  if (right.length > left.length) {
    return left.map((k, i) => [k, right[i]])
  } else {
    let zipped: [b, a][] = right.map((k, i) => [k, left[i]])
    let swapped: [a, b][] = zipped.map((x) => [x[1], x[0]])
    return swapped
  }
}

// pairs computed SOG's with reported SOG's
export function sogPairings({ vesselTrajectory: vesselTrajectory, aisMessages: aisMessages }: Messages): number[] {
  let shifted = structuredClone(vesselTrajectory.points)
  shifted.shift()

  let computedSogs = zip(vesselTrajectory.points, shifted) // create a list of pairs [point__n,point__n+1]
    .map((pair) => {
      return {
        dist: haversineDist([pair[0].x, pair[0].y], [pair[1].x, pair[1].y]),
        deltaTime: pair[1].m - pair[0].m,
      }
    })
    .map((x) => x.dist / x.deltaTime)

  const KNOT_TO_MS = 0.5144444444 // 1.852/3.6
  const TOLERANCE_RATIO = 0.1
  let sogs = aisMessages.map((x) => x.sog)
  let soggy: number[] = zip(computedSogs, sogs)
    .filter((x): x is [number, number] => x[1] !== undefined) //? wth is this???
    .map((x: [number, number]) => [x[0], x[1] * KNOT_TO_MS])
    .filter((x): x is [number, number] => Number.isFinite(x[0]) && Number.isFinite(x[1]))
    .map((x) => Math.max(Math.abs(x[0] - x[1]) - x[1] * TOLERANCE_RATIO, 0))
    .map((x) => 1 / (1 + Math.pow(x, 2) / 10))

  return soggy
}

// The input should be the amount of linestrings to analyse.
export function trajectorySingleScore(points: Point[]): number {
  let diff: number = points[0].m

  let simplePointsX: [number, number][] = points.slice(0, -1).map((p: Point) => [p.m - diff, p.x])
  let simplePointsY: [number, number][] = points.slice(0, -1).map((p: Point) => [p.m - diff, p.y])

  let control_point: Point = points.slice(-1)[0]

  let coeefX = solveQuadraticCoeeficients(simplePointsX)
  let coeefY = solveQuadraticCoeeficients(simplePointsY)

  let xPos = vessel_position(coeefX, control_point.m - diff)
  let yPos = vessel_position(coeefY, control_point.m - diff)

  let distance = haversineDist([control_point.x, control_point.y], [xPos, yPos])

  const TOLERANCE = 10
  distance = Math.max(distance - TOLERANCE, 0)

  return 1 / (1 + Math.pow(distance, 2) / 1000)
}
