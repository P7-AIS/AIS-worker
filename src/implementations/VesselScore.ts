import { LineString, Point } from 'wkx'
import { IVesselAnalysis } from '../interfaces/IVesselMath'
import { Messages } from './Messages'
import regression from 'regression'
import { AISJobData, AISJobResult, AisMessage, AISWorkerAlgorithm } from '../../AIS-models/models'
import IScorer from '../interfaces/IScorer'
import { SQRT1_2 } from 'mathjs'
import { DELAY_TIME_1 } from 'bullmq'

export default class VesselScore implements IScorer, IVesselAnalysis {
  orig_traj_score: number | undefined
  orig_cog_score: number | undefined
  orig_sog_score: number | undefined

  score(jobData: AISJobData): Promise<AISJobResult> {
    let mes = new Messages(jobData)
    const trustworthiness = this.calculateVesselScore(mes)

    let reason = trust_reason(this.orig_traj_score!, this.orig_cog_score!, this.orig_sog_score!)

    let res: AISJobResult = {
      mmsi: jobData.mmsi,
      trustworthiness: trustworthiness,
      reason: reason,
      algorithm: AISWorkerAlgorithm.SIMPLE,
    }

    return new Promise((resolve) => resolve(res))
  }
  calculateVesselScore(messages: Messages): number {
    //? should weights sum to 1?
    let TRAJ_W = 0.5
    let COG_W = 0.25
    let SOG_W = 0.25

    let traj_score = this.trajectory_analysis(structuredClone(messages))
    let cog_score = this.cog_analysis(structuredClone(messages))
    let sog_score = this.speed_analysis(structuredClone(messages))

    if (isNaN(traj_score)) {
      traj_score = 1
      TRAJ_W = 0
    }

    if (isNaN(cog_score)) {
      cog_score = 1
      COG_W = 0
    }

    if (isNaN(sog_score)) {
      sog_score = 1
      SOG_W = 0
    }
    this.orig_traj_score = traj_score
    this.orig_cog_score = cog_score
    this.orig_sog_score = sog_score

    let score = (traj_score * TRAJ_W + cog_score * COG_W + sog_score * SOG_W) / (TRAJ_W + COG_W + SOG_W)

    score = isNaN(score) || !isFinite(score) ? 1 : score // We can't say much about a ship that does not provide data enough for analysis.
    return score
  }
  // The idea is to utilize curve fitting
  trajectory_analysis(message: Messages): number {
    let points = message.vessel_trajectory.points

    let points_len = points.length - 2

    let scores: number[] = []

    for (let i = 2; i < points_len; i++) {
      scores.push(trajectory_single_score([points[i - 2], points[i - 1], points[i + 1], points[i + 2], points[i]]))
    }

    return score_calculator(scores)
  }
  cog_analysis(data: Messages): number {
    return score_calculator(heading_scorer(data.vessel_trajectory, data.ais_messages))
  }

  speed_analysis(data: Messages): number {
    const scores = score_calculator(sog_pairings(data))
    return scores
  }
}

function trust_reason(traj_score: number, cog_score: number, sog_score: number): string {
  let reason: string[] = []
  //TODO: completely arbitrary
  const TRAJ_THRES = 0.5
  const COG_THRES = 0.5
  const SOG_THRES = 0.5
  const TRAJ_REASON = 'bad trajectory'
  const COG_REASON = 'bad COG'
  const SOG_REASON = 'bad SOG'
  const SEPARATOR = ' | '

  if (traj_score < TRAJ_THRES) {
    reason.push(TRAJ_REASON)
  }

  if (cog_score < COG_THRES) {
    reason.push(COG_REASON)
  }

  if (sog_score < SOG_THRES) {
    reason.push(SOG_REASON)
  }

  return reason.join(' | ')
}

function score_calculator(scores: number[]): number {
  const DECAY_FACTOR = 0.99

  let numerator = scores.map((s, i) => s * Math.pow(DECAY_FACTOR, i + 1)).reduce((acc, val) => acc + val, 0)

  let denominator = scores.map((_, i) => Math.pow(DECAY_FACTOR, i + 1)).reduce((acc, val) => acc + val, 0)

  return numerator / denominator
}

export function normalize_points(heading: number, points: Point[]): Point[] {
  // Normalize first from first point.
  let first_point = points[0]
  let head_rad = ((heading - 90) * Math.PI) / 180

  // Move the first point to center and others respectively.
  points = points.map(
    (p: Point) => new Point(p.x - first_point.x, p.y - first_point.y, undefined, p.m - first_point.m, p.srid)
  )

  // Now rotate the points such that they are centered by the heading of the ship.
  points = points.map(
    (p: Point) =>
      new Point(
        p.x * Math.cos(head_rad) - p.y * Math.sin(head_rad),
        p.x * Math.sin(head_rad) + p.y * Math.cos(head_rad),
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

export function haversine_dist(point_test: [number, number], point_real: [number, number]): number {
  let point_1: [number, number] = [(point_test[0] * Math.PI) / 180, (point_test[1] * Math.PI) / 180]
  let point_2: [number, number] = [(point_real[0] * Math.PI) / 180, (point_real[1] * Math.PI) / 180]

  const R = 6371000 // Radius of earth in m.
  return (
    2 *
    R *
    Math.asin(
      Math.sqrt(
        Math.pow(Math.sin((point_1[1] - point_2[1]) / 2), 2) +
          Math.cos(point_1[1]) * Math.cos(point_2[1]) * Math.pow(Math.sin((point_1[0] - point_2[0]) / 2), 2)
      )
    )
  )
}

/**
 * Computes the bearing between two points, in degrees
 */
export function bearing(lon1: number, lat1: number, lon2: number, lat2: number): number {
  // map lon/lat's to radians
  const r_lon1 = lon1 * (Math.PI / 180)
  const r_lat1 = lat1 * (Math.PI / 180)
  const r_lon2 = lon2 * (Math.PI / 180)
  const r_lat2 = lat2 * (Math.PI / 180)
  const delta_lon = r_lon2 - r_lon1

  const y = Math.sin(delta_lon) * Math.cos(r_lat2)
  const x = Math.cos(r_lat1) * Math.sin(r_lat2) - Math.sin(r_lat1) * Math.cos(r_lat2) * Math.cos(delta_lon)

  const theta = Math.atan2(y, x)

  return ((theta * 180) / Math.PI + 360) % 360
}

export function heading_scorer({ points }: LineString, messages: AisMessage[]): number[] {
  let shifted = structuredClone(points)
  shifted.shift()

  let computed_bearings = zip(points, shifted).map((pair) => bearing(pair[0].x, pair[0].y, pair[1].x, pair[1].y))

  const TOLERANCE = 15 //TODO: Completely arbitrary :D
  let nice_cog = zip(computed_bearings, messages)
    .map((x) => [x[0], x[1].cog])
    .filter((x): x is [number, number] => x[1] !== undefined || x !== null || !Number.isNaN(x[1]))
    .map((x) => Math.abs(x[0] - x[1]))
    .map((x) => Math.max(x - TOLERANCE, 0))
    .map((x) => 1 - x / 360)

  return nice_cog
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

function sog_error(sogs: [number, number][]): number {
  let sse = sogs.map((x) => Math.pow(x[0] - x[1], 2)).reduce((acc, val) => acc + val, 0)
  return sse
}

// pairs computed SOG's with reported SOG's
export function sog_pairings({ vessel_trajectory, ais_messages }: Messages): number[] {
  let shifted = structuredClone(vessel_trajectory.points)
  shifted.shift()

  let computed_sogs = zip(vessel_trajectory.points, shifted) // create a list of pairs [point__n,point__n+1]
    .map((pair) => {
      return {
        dist: haversine_dist([pair[0].x, pair[0].y], [pair[1].x, pair[1].y]),
        delta_time: pair[1].m - pair[0].m,
      }
    })
    .map((x) => x.dist / x.delta_time)

  const KNOT_TO_MS = 1.852 / 3.6 //0.5144444444
  const TOLERANCE_RATIO = 0.1
  let sogs = ais_messages.map((x) => x.sog)
  let soggy: number[] = zip(computed_sogs, sogs)
    .filter((x): x is [number, number] => x[1] !== undefined) //? wth is this???
    .map((x: [number, number]) => [x[0], x[1] * KNOT_TO_MS])
    .filter((x): x is [number, number] => Number.isFinite(x[0]) && Number.isFinite(x[1]))
    .map((x) => Math.max(Math.abs(x[0] - x[1]) - x[1] * TOLERANCE_RATIO, 0))
    .map((x) => 1 / (1 + Math.pow(x, 2) / 10))
  return soggy
}

// The input should be the amount of linestrings to analyse.
export function trajectory_single_score(points: Point[]): number {
  let diff: number = points[0].m

  let simple_points_x: [number, number][] = points.slice(0, -1).map((p: Point) => [p.m - diff, p.x])
  let simple_points_y: [number, number][] = points.slice(0, -1).map((p: Point) => [p.m - diff, p.y])

  let control_point: Point = points.slice(-1)[0]

  let coeef_x = solveQuadraticCoeeficients(simple_points_x)
  let coeef_y = solveQuadraticCoeeficients(simple_points_y)

  let x_pos = vessel_position(coeef_x, control_point.m - diff)
  let y_pos = vessel_position(coeef_y, control_point.m - diff)

  let distance = haversine_dist([control_point.x, control_point.y], [x_pos, y_pos])

  const TOLERANCE = 10
  distance = Math.max(distance - TOLERANCE, 0)

  return 1 / (1 + Math.pow(distance, 2) / 1000)
}
