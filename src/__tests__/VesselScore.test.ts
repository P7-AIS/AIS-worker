import VesselScore, {
  normalize_points,
  solveQuadraticCoeeficients,
} from "../implementations/VesselScore";
import { AISJobData, AisMessage } from "../../AIS-models/models";
import { Point } from "wkx";

test("Normalize points", () => {
  let point1 = new Point(1, 2, undefined, 1, 4326);
  let point2 = new Point(1.5, 2.4, undefined, 1, 4326);
  let point3 = new Point(2, 2.6, undefined, 1, 4326);

  let points: Point[] = [point1, point2, point3];

  let heading: number = 50.88;

  let normalized_points = normalize_points(heading, points);

  console.log(normalized_points);

  expect(normalized_points[0].x).toBeCloseTo(0);
  expect(normalized_points[0].y).toBeCloseTo(0);
  expect(normalized_points[1].x).toBeCloseTo(0.64);
  expect(normalized_points[1].y).toBeCloseTo(-0.0054);
  expect(normalized_points[2].x).toBeCloseTo(1.15);
  expect(normalized_points[2].y).toBeCloseTo(-0.165);
});

test("Curve fit points", () => {
  // These are pre normalized.
  let point1: Point = new Point(0, 0, undefined, 1, 4326);
  let point2: Point = new Point(1, 0.1, undefined, 1, 4326);
  let point3: Point = new Point(2, 0.5, undefined, 1, 4326);

  let points: Point[] = [point1, point2, point3];

  let result = solveQuadraticCoeeficients(points);

  expect(result[0]).toBeCloseTo(0.15);
  expect(result[1]).toBeCloseTo(-0.05);
  expect(result[2]).toBeCloseTo(0);
});
