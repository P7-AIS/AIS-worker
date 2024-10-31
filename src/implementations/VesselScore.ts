import { Point } from 'wkx'
import { IVesselScore, IVesselAnalysis, TrustScore } from '../interfaces/IVesselMath'
import { Messages } from './Messages'
import { isFunctionTypeNode } from 'typescript'
import { DELAY_TIME_1 } from 'bullmq'
import regression from 'regression'
import { SQRT1_2 } from 'mathjs'

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
    throw new Error('Method not implemented.')
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

export function calculate_distance(point_test: Point, point_real: Point): number {
  let point_1 = new Point(
    (point_test.x * Math.PI) / 180,
    (point_test.y * Math.PI) / 180,
    point_test.z,
    point_test.m,
    point_test.srid
  )

  let point_2 = new Point(
    (point_real.x * Math.PI) / 180,
    (point_real.y * Math.PI) / 180,
    point_real.z,
    point_real.m,
    point_real.srid
  )

  const R = 6371000 // Radius of earth in m.
  return (
    2 *
    R *
    Math.asin(
      Math.sqrt(
        Math.pow(Math.sin((point_1.y - point_2.y) / 2), 2) +
          Math.cos(point_1.y) * Math.cos(point_2.y) * Math.pow(Math.sin((point_1.x - point_2.x) / 2), 2)
      )
    )
  )
}
