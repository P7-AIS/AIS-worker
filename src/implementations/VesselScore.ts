import { Point } from "wkx";
import {
  IVesselScore,
  IVesselAnalysis,
  TrustScore,
} from "../interfaces/IVesselMath";
import { Messages } from "./Messages";
import { isFunctionTypeNode } from "typescript";
import { DELAY_TIME_1 } from "bullmq";
import regression from "regression";
import { SQRT1_2 } from "mathjs";

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
    let sogs = predict_distances(data);
    return sog_error(sogs);
    // throw new Error("Method not implemented.");
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
  points: [number, number][]
): number[] {
  const result = regression.polynomial(points, { order: 2, precision: 10 });

  return result.equation;
}

function vessel_position(coefficients: number[], timestamp: number): number {
  return (
    coefficients[0] * Math.pow(timestamp, 2) +
    coefficients[1] * timestamp +
    coefficients[2]
  );
}

export function haversine_dist(point_test: Point, point_real: Point): number {
  const R = 6371; // Radius of earth in km.
  return (
    2 *
    R *
    Math.asin(
      Math.sqrt(
        Math.pow(Math.sin((point_test.y - point_real.y) / 2), 2) +
          Math.cos(point_test.y) *
            Math.cos(point_real.y) *
            Math.pow(Math.sin((point_test.x - point_real.x) / 2), 2)
      )
    ) *
    1000
  );
}
//? why is this not a standard library function?
function zip<a, b>(left: a[], right: b[]): [a, b][] {
  // const zip: Point[][] = (a: any[], b: any[]) => a.map((k, i) => [k, b[i]]);
  if (right.length > left.length) {
    return left.map((k, i) => [k, right[i]]);
  } else {
    let zipped: [b,a][] = right.map((k, i) => [k, left[i]])
    // .map((x) => [x[1], x[0]]);
    let swapped: [a,b][] = zipped.map(x=> [x[1],x[0]])
    return swapped 
  }
  // return zipped
}

function sog_error(sogs: [number, number][]): number {
  let sse = sogs
    .map((x) => Math.pow(x[0] - x[1], 2))
    .reduce((acc, val) => acc + val, 0);
  return 0;
}

export function predict_distances(mes: Messages): [number, number][] {
  let points: Point[] = structuredClone<Point[]>(
    mes.vessel_trajector.points
  ).map((x) => x as unknown as Point); //TODO: lidt verbose
  points.shift();

  let computed_sog = zip(mes.vessel_trajector.points, points)
    .map((pair, i) => {
      return {
        dist: haversine_dist(pair[0], pair[1]),
        delta_time: pair[1].m - pair[0].m,
      };
    })
    .map((x) => x.dist / x.delta_time);

  let sogs = mes.ais_messages.map((x) => x.sog);
  let soggy: [number, number][] = zip(computed_sog, sogs)
    .filter((x): x is [number, number] => x[1] !== undefined) //? wth is this???
    .map((x) => [x[0], (x[1] * 1.852) / 3.6]); // knots to m/s;
  return soggy;
}
