import { Point } from 'wkx'
import { IVesselScore, IVesselAnalysis, TrustScore } from '../interfaces/IVesselMath'
import { Messages } from './Messages'
import { isFunctionTypeNode } from 'typescript'
import { create, all } from 'mathjs'
import IScorer from '../interfaces/IScorer'
import { AISJobData, AISJobResult } from '../../AIS-models/models'

export default class SimpleScorer implements IScorer, IVesselScore, IVesselAnalysis, TrustScore {
  score(jobData: AISJobData): Promise<AISJobResult> {
    throw new Error('Method not implemented.')
  }
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
export function solveQuadraticCoeeficients(points: Point[]): number[] {
  // create a mathjs instance with configuration
  const config = {
    relTol: 1e-12,
    absTol: 1e-15,
    matrix: 'Matrix',
    number: 'number',
    precision: 64,
    predictable: false,
    randomSeed: null,
  }
  const math = create(all)

  const [x1, y1] = [points[0].x, points[0].y]
  const [x2, y2] = [points[1].x, points[1].y]
  const [x3, y3] = [points[2].x, points[2].y]

  const A = math.matrix([
    [x1 * x1, x1, 1],
    [x2 * x2, x2, 1],
    [x3 * x3, x3, 1],
  ])

  const B = math.matrix([y1, y2, y3])

  const A_inv = math.inv(A)
  const coefficients = math.multiply(A_inv, B)

  return coefficients.toArray().map((c) => c as number) // Typescript skal dø i et hul.
}
