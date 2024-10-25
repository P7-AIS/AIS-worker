import VesselScore, {
  curveFit3D,
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

test("Curve fitting 3D points with 2 points", () => {
  let point1: Point = new Point(0, 0, undefined, 1, 4326);
  let point2: Point = new Point(1, 0.1, undefined, 2, 4326);
  // let point3: Point = new Point(2, 0.5, undefined, 1, 4326);
  let points: [number, number, number][] = [point1, point2].map((p: Point) => [p.x, p.y, p.m])

  expect(() => curveFit3D(points)).toThrow('At least 3 points are required for fitting a second-degree polynomial.');
});

test("Curve fit 3D points", () => {
  let point1: Point = new Point(10.442767, 55.8961, undefined, 1725878359, 4326);
  let point2: Point = new Point(10.444283, 55.89575, undefined, 1725878375, 4326);
  let point3: Point = new Point(10.444467, 55.8957, undefined, 1725878378, 4326);
  let point4: Point = new Point(10.446633, 55.8952, undefined, 1725878400, 4326)
  let point5: Point = new Point(10.446633, 55.8952, undefined, 1725878402, 4326)
  let point6: Point = new Point(10.448067, 55.894867, undefined, 1725878416, 4326)
  let point7: Point = new Point(10.448533, 55.89475, undefined, 1725878422, 4326)
  let point8: Point = new Point(10.449967, 55.894417, undefined, 1725878436, 4326)

  let points: [number, number, number][] = [point1, point2, point3, point4, point5, point6, point7, point8].map((p: Point) => [p.x, p.y, p.m])

  let res = curveFit3D(points);
});
