import { Point } from "wkx";
import {
  IVesselScore,
  IVesselAnalysis,
  TrustScore,
} from "../interfaces/IVesselMath";
import { Messages } from "./Messages";
import { isFunctionTypeNode } from "typescript";
import { create, all } from "mathjs";

export default class VesselScore
  implements IVesselScore, IVesselAnalysis, TrustScore
{
  calculateVesselScore(anal: IVesselAnalysis): TrustScore {
    throw new Error("Method not implemented.");
  }

  // The idea is to utilize curve fitting
  trajectory_analysis(data: Messages): number {
    throw new Error("Method not implemented.");
  }
  cog_analysis(data: Messages): number {
    throw new Error("Method not implemented.");
  }
  head_analysis(data: Messages): number {
    throw new Error("Method not implemented.");
  }
  speed_analysis(data: Messages): number {
    throw new Error("Method not implemented.");
  }
  position_analysis(data: Messages): number {
    throw new Error("Method not implemented.");
  }

  average_weighted_score!: number;
  trajectory_score!: number;
  cog_score!: number;
  head_score!: number;
  speed_score!: number;
  position_score!: number;
}

export function normalize_points(heading: number, points: Point[]): Point[] {
  // Normalize first from first point.
  let first_point = points[0];
  let head_rad = ((heading - 90) * Math.PI) / 180;

  // Move the first point to center and others respectively.
  points = points.map(
    (p: Point) =>
      new Point(
        p.x - first_point.x,
        p.y - first_point.y,
        undefined,
        p.m - first_point.m,
        p.srid
      )
  );

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
  );

  return points;
}

// This should use a simpler type for solving. Instead of Point, then simply an array of tuples.
// It should allow time to be used as x.
export function solveQuadraticCoeeficients(
  points: { x: number; y: number; z: number }[]
): number[] {
  // create a mathjs instance with configuration
  const config = {
    relTol: 1e-12,
    absTol: 1e-15,
    matrix: "Matrix",
    number: "number",
    precision: 64,
    predictable: false,
    randomSeed: null,
  };
  const math = create(all);

  const [x1, y1, z1] = [points[0].x, points[0].y, points[0].z];
  const [x2, y2] = [points[1].x, points[1].y, points[1].z];
  const [x3, y3] = [points[2].x, points[2].y, points[2].z];

  const A = math.matrix([
    [x1 * x1, x1, 1],
    [x2 * x2, x2, 1],
    [x3 * x3, x3, 1],
  ]);

  const B = math.matrix([y1, y2, y3]);

  const A_inv = math.inv(A);
  const coefficients = math.multiply(A_inv, B);

  return coefficients.toArray().map((c) => c as number); // Typescript skal dø i et hul.
}

export function curveFit3D(
  points: [number, number, number][]
): [number, number, number, number, number, number] {
  if (points.length < 3) {
    throw new Error(
      "At least 3 points are required for fitting a second-degree polynomial."
    );
  }

  const A: number[][] = [];
  const B: number[] = [];

  for (const point of points) {
    const { x, y, z } = {x: point[0], y: point[1], z: point[2]};
    A.push([x * x, y * y, x * y, x, y, 1]);
    B.push(z);
  }

  const coefficients = solveLinearSystem(A, B);

  return coefficients;
}

export function solveLinearSystem(
  A: number[][],
  B: number[]
): [number, number, number, number, number, number] {
  const n = B.length
  const augmentedMatrix = A.map((row, i) => [...row, B[i]])

  for (let i = 0; i < n; i++) {
    let maxRow = i
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(augmentedMatrix[k][i]) > Math.abs(augmentedMatrix[maxRow][i])) {
        maxRow = k
      }
    }

    // Swap rows
    [augmentedMatrix[i], augmentedMatrix[maxRow]] = [augmentedMatrix[maxRow], augmentedMatrix[i]]

    const pivot = augmentedMatrix[i][i]
    if (pivot === 0) {
      throw new Error("Matrix is singular and cannot be solved.")
    }

    for (let j = i; j <= n; j++) {
      augmentedMatrix[i][j] /= pivot
    }

    // Eliminate all other entries in the current column
    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = augmentedMatrix[k][i]
        for (let j = i; j <= n; j++) {
          augmentedMatrix[k][j] -= factor * augmentedMatrix[i][j]
        }
      }
    }
  }

  const solution = augmentedMatrix.map(row => row[n])

  console.log(solution)

  console.log(augmentedMatrix)

  return solution as [number,number,number,number,number,number]
}
