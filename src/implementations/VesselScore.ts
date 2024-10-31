import { LineString, Point } from 'wkx'
import { IVesselScore, IVesselAnalysis, TrustScore } from '../interfaces/IVesselMath'
import { Messages } from './Messages'
import { isFunctionTypeNode } from 'typescript'
import { DELAY_TIME_1 } from 'bullmq'
import regression from 'regression'
import { SQRT1_2 } from 'mathjs'
import { Trajectory } from '../../AIS-models/models'

export default class VesselScore implements IVesselScore, IVesselAnalysis, TrustScore {
  calculateVesselScore(anal: IVesselAnalysis): TrustScore {
    throw new Error('Method not implemented.')
  }

  // The idea is to utilize curve fitting
  trajectory_analysis(data: Messages): number {
    throw new Error('Method not implemented.')
  }
  cog_analysis(data: Messages): number {
    throw new Error('Method not implemented.')
  }
  head_analysis(data: Messages): number {
    throw new Error('Method not implemented.')
  }
  speed_analysis(data: Messages): number {
    throw new Error('Method not implemented.')
  }
  position_analysis(data: Messages): number {
    let sogs = sog_pairings(data)
    return sog_error(sogs)
  }

  average_weighted_score!: number
  trajectory_score!: number
  cog_score!: number
  head_score!: number
  speed_score!: number
  position_score!: number
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
export function sog_pairings(mes: Messages): [number, number][] {
  let points = structuredClone(mes.vessel_trajectory.points)
  points.shift()

  let computed_sogs = zip(mes.vessel_trajectory.points, points) // create a list of pairs [point__n,point__n+1]
    .map((pair) => {
      return {
        dist: haversine_dist([pair[0].x, pair[0].y], [pair[1].x, pair[1].y]),
        delta_time: pair[1].m - pair[0].m,
      }
    })
    .map((x) => x.dist / x.delta_time)

  const KNOT_TO_MS = 1.852 / 3.6 //0.5144444444
  let sogs = mes.ais_messages.map((x) => x.sog)
  let soggy: [number, number][] = zip(computed_sogs, sogs)
    .filter((x): x is [number, number] => x[1] !== undefined) //? wth is this???
    .map((x) => [x[0], x[1] * KNOT_TO_MS])
    .filter((x) => !x.includes(NaN))
    .filter((x) => !x.includes(Infinity)) as [number, number][]
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

  distance = distance - 10

  distance = distance < 0 ? 0 : distance

  return 1 / (1 + Math.pow(distance, 2))
}
