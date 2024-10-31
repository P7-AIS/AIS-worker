import VesselScore, {
  haversine_dist,
  normalize_points,
  solveQuadraticCoeeficients,
} from '../implementations/VesselScore'
import { AISJobData, AisMessage } from '../../AIS-models/models'
import { LineString, Point } from 'wkx'
import { Messages } from '../implementations/Messages'

//test("Normalize points", () => {
//  let point1 = new Point(1, 2, undefined, 1, 4326);
//  let point2 = new Point(1.5, 2.4, undefined, 1, 4326);
//  let point3 = new Point(2, 2.6, undefined, 1, 4326);
//
//  let points: Point[] = [point1, point2, point3];
//
//  let heading: number = 50.88;
//
//  let normalized_points = normalize_points(heading, points);
//
//  expect(normalized_points[0].x).toBeCloseTo(0);
//  expect(normalized_points[0].y).toBeCloseTo(0);
//  expect(normalized_points[1].x).toBeCloseTo(0.64);
//  expect(normalized_points[1].y).toBeCloseTo(-0.0054);
//  expect(normalized_points[2].x).toBeCloseTo(1.15);
//  expect(normalized_points[2].y).toBeCloseTo(-0.165);
//});

//test("Curve fit points", () => {
//  // These are pre normalized.
//  let point1: Point = new Point(0, 0, undefined, 1, 4326);
//  let point2: Point = new Point(1, 0.1, undefined, 1, 4326);
//  let point3: Point = new Point(2, 0.5, undefined, 1, 4326);
//
//  let points: Point[] = [point1, point2, point3];
//
//  let result = solveQuadraticCoeeficients(points);
//
//  expect(result[0]).toBeCloseTo(0.15);
//  expect(result[1]).toBeCloseTo(-0.05);
//  expect(result[2]).toBeCloseTo(0);
//});

//test("Curve fitting 3D points with 2 points", () => {
//  let point1: Point = new Point(0, 0, undefined, 1, 4326);
//  let point2: Point = new Point(1, 0.1, undefined, 2, 4326);
//  // let point3: Point = new Point(2, 0.5, undefined, 1, 4326);
//  let points: [number, number, number][] = [point1, point2].map((p: Point) => [
//    p.x,
//    p.y,
//    p.m,
//  ]);
//
//  expect(() => curveFit3D(points)).toThrow(
//    "At least 3 points are required for fitting a second-degree polynomial.",
//  );
//});

function test_points(): Point[] {
  let point1: Point = new Point(10.521091672283175, 55.87986060393064, undefined, 1725863029.3645544, 4326)
  let point2: Point = new Point(10.520233, 55.88015, undefined, 1725863040, 4326)
  let point3: Point = new Point(10.51415, 55.8823, undefined, 1725863116, 4326)
  let point4: Point = new Point(10.510617, 55.883583, undefined, 1725863161, 4326)
  let point5: Point = new Point(10.5046, 55.885733, undefined, 1725863236, 4326)
  let point6: Point = new Point(10.5037, 55.886017, undefined, 1725863246, 4326)
  let point7: Point = new Point(10.502933, 55.886217, undefined, 1725863255, 4326)
  let point8: Point = new Point(10.5002, 55.886817, undefined, 1725863286, 4326)
  let point9: Point = new Point(10.495417, 55.887917, undefined, 1725863340, 4326)
  let point10: Point = new Point(10.4955, 55.8879, undefined, 1725863340, 4326)
  let point11: Point = new Point(10.469878675102462, 55.89283935425969, undefined, 1725863341.3673398, 4326)

  return [point1, point2, point3, point4, point5, point6, point7, point8, point9, point10, point11]
}

function test_mes(): Messages {
  // start time:    1725863029.3645544
  // end time:      1725863341.3673398
  // sog: ~11.5

  let points = test_points()
  // let ais_mess: AisMessage = {
  //   id: 0,
  //   mmsi: 219019887,
  //   timestamp: new Date(points[0].m),
  //   sog: 11.5,
  // };
  let ais_mess: AisMessage[] = structuredClone(points).map((x, i) => {
    return { id: 0, mmsi: 219019887, timestamp: new Date(x.m), sog: 11.5 }
  })

  return new Messages(219019887, ais_mess, new LineString(points, 4326))
}

test('Curve fit 3D points', () => {
  let point1: Point = new Point(10.521091672283175, 55.87986060393064, undefined, 1725863029.3645544, 4326)
  let point2: Point = new Point(10.520233, 55.88015, undefined, 1725863040, 4326)
  let point3: Point = new Point(10.51415, 55.8823, undefined, 1725863116, 4326)
  let point4: Point = new Point(10.510617, 55.883583, undefined, 1725863161, 4326)
  let point5: Point = new Point(10.5046, 55.885733, undefined, 1725863236, 4326)
  let point6: Point = new Point(10.5037, 55.886017, undefined, 1725863246, 4326)
  let point7: Point = new Point(10.502933, 55.886217, undefined, 1725863255, 4326)
  let point8: Point = new Point(10.5002, 55.886817, undefined, 1725863286, 4326)
  let point9: Point = new Point(10.495417, 55.887917, undefined, 1725863340, 4326)
  let point10: Point = new Point(10.4955, 55.8879, undefined, 1725863340, 4326)
  let point11: Point = new Point(10.469878675102462, 55.89283935425969, undefined, 1725863341.3673398, 4326)

  let diff = point1.m

  let points_x: [number, number][] = [point2, point3, point4, point5, point6, point7, point8, point9, point10].map(
    (p: Point) => [p.m - diff, p.x]
  )

  let points_y: [number, number][] = [point2, point3, point4, point5, point6, point7, point8, point9, point10].map(
    (p: Point) => [p.m - diff, p.y]
  )

  let res_x = solveQuadraticCoeeficients(points_x)
  let res_y = solveQuadraticCoeeficients(points_y)

  // Find test cases
})

// test("Test distance", () => {
//   let point2: Point = new Point(
//     8.489810899999998,
//     56.514157499999996,
//     undefined,
//     1725863040,
//     4326
//   );
//   let point3: Point = new Point(
//     9.2409831,
//     56.0996635,
//     undefined,
//     1725863116,
//     4326,
//   );

//   let res = haversine_dist(point2, point3);

//   console.log(res);
// });

test('point analysis', () => {
  let scorer = new VesselScore()
  let res = scorer.position_analysis(test_mes())

  expect(res).toBeGreaterThan(0)
  expect(res).not.toEqual(Infinity)
  expect(res).not.toEqual(Infinity - 1)
  expect(res).not.toBeNaN
  expect(res).toBeDefined
})
test('Test distance calculator', () => {
  let point2: Point = new Point(8.489810899999998, 56.514157499999996, undefined, 1725863040, 4326) // Rom
  let point3: Point = new Point(9.2409831, 56.0996635, undefined, 1725863116, 4326) // Paris

  let res = haversine_dist([point2.x, point2.y], [point3.x, point3.y])

  expect(res).toBeCloseTo(65354.2, 2) // Yes there is only 65 km between Rom and Paris
})
