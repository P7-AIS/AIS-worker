import SimpleScorer, {
  bearing,
  haversineDist,
  headingScorer,
  normalize_points,
  solveQuadraticCoeeficients,
  trajectorySingleScore,
} from '../implementations/SimpleScorer'
import { AISJobData, AisMessage, AISWorkerAlgorithm, Trajectory } from '../../AIS-models/models'
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

function testMes(): AISJobData {
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
    return { id: 0, mmsi: 219019887, timestamp: new Date(x.m), sog: 11.5, cog: 295 }
  })

  let mmsi = 219019887

  let buffer = new LineString(points, 4326).toWkb()
  let traj: Trajectory = {
    mmsi: mmsi,
    binPath: buffer,
  }

  let data: AISJobData = {
    mmsi: 219019887,
    aisMessages: ais_mess,
    algorithm: AISWorkerAlgorithm.SIMPLE,
    trajectory: traj,
  }

  return data
}

describe('test cases for helper functions', () => {
  test('Test distance calculator', () => {
    let point2: Point = new Point(8.489810899999998, 56.514157499999996, undefined, 1725863040, 4326) // Rom
    let point3: Point = new Point(9.2409831, 56.0996635, undefined, 1725863116, 4326) // Paris

    let res = haversineDist([point2.x, point2.y], [point3.x, point3.y])

    expect(res).toBeCloseTo(65354.2, 2) // Yes there is only 65 km between Rom and Paris
  })

  test('test angle between two ellipsoidal points', () => {
    let point1: Point = new Point(10.521091672283175, 55.87986060393064, undefined, 1725863029.3645544, 4326)
    let point11: Point = new Point(10.469878675102462, 55.89283935425969, undefined, 1725863341.3673398, 4326)

    let res = bearing(point1.x, point1.y, point11.x, point11.y)

    expect(res).not.toBeNaN
    expect(res).not.toBe(Infinity || Infinity - 1)
    expect(res).toBeGreaterThan(200) // west-ish
    expect(res).toBeLessThan(300)
  })
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
  test('illegal geometry (MultiLinestring)', async () => {
    const EMPTY_MULTILINESTRING = Uint8Array.from(
      '010500000000000000'.match(/.{1,2}/g)!.map((byte: any) => parseInt(byte, 16))
    )

    Buffer.from(EMPTY_MULTILINESTRING)
    let empty: AISJobData = {
      mmsi: 0,
      aisMessages: [],
      trajectory: {
        mmsi: 0,
        binPath: Buffer.from(EMPTY_MULTILINESTRING),
      },
      algorithm: AISWorkerAlgorithm.SIMPLE,
    }
    expect(() => new Messages(empty)).toThrow()
  })
})

describe('score/calculateVesselScore', () => {
  test('scorer function', () => {
    let jobdata = testMes()

    new SimpleScorer().score(jobdata).then((res) => {
      let score = res.trustworthiness
      expect(score).toBeDefined
      expect(score).not.toBeNaN
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(1)
    })
  })

  test('no reason', () => {
    let jobdata = testMes()

    new SimpleScorer().score(jobdata).then((res) => {
      let reason = res.reason!
      expect(reason).toBeDefined
      expect(reason).toBe('')
    })
  })
  test('empty job', async () => {
    const EMPTY_LINESTRING = Uint8Array.from(
      '010200000000000000'.match(/.{1,2}/g)!.map((byte: any) => parseInt(byte, 16))
    )
    let empty: AISJobData = {
      mmsi: 0,
      aisMessages: [],
      trajectory: {
        mmsi: 0,
        binPath: Buffer.from(EMPTY_LINESTRING),
      },
      algorithm: AISWorkerAlgorithm.SIMPLE,
    }
    const res = await new SimpleScorer().score(empty)
    expect(res.trustworthiness).toEqual(1)
  })

  test('linestring length not matching ais message length', () => {
    let mes = new Messages(testMes())
    const lastMes = mes.aisMessages[mes.aisMessages.length - 1]
    mes.aisMessages.push({
      id: lastMes.id,
      mmsi: lastMes.mmsi,
      timestamp: new Date(lastMes.timestamp.getMilliseconds() + 2000),
    })

    const call = () => new SimpleScorer().calculateVesselScore(mes)
    expect(call).not.toThrow()
  })
})
describe('trajectory analysis', () => {
  test('Test weighted score', () => {
    let message = new Messages(testMes())
    let rom: Point = new Point(8.489810899999998, 56.514157499999996, undefined, 1725863040, 4326) // Rom
    let message1 = structuredClone(message)

    message1.vesselTrajectory.points.splice(2, 0, rom)

    let res1 = new SimpleScorer().trajectory_analysis(message1)

    let message2 = structuredClone(message)

    message2.vesselTrajectory.points.splice(8, 0, rom)

    let res2 = new SimpleScorer().trajectory_analysis(message2)

    expect(res1).toBeLessThan(res2)
  })
  test('Test single score for Linestring', () => {
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

    let points: Point[] = [point3, point4, point6, point7, point5]

    let res = trajectorySingleScore(points)

    expect(res).toBe(1)
  })
  test('trajectory analysis without COG and SOG', () => {
    let mes = new Messages(testMes())

    let modifiedAisMessages: AisMessage[] = mes.aisMessages.map((ais) => {
      return {
        id: ais.id,
        mmsi: ais.mmsi,
        timestamp: ais.timestamp,
        sog: undefined,
        cog: undefined,
      }
    })
    mes.aisMessages = modifiedAisMessages

    const fstScore = new SimpleScorer().calculateVesselScore(mes)
    const sndScore = new SimpleScorer().trajectory_analysis(mes)

    expect(fstScore).toEqual(sndScore)
  })
})

describe('SOG analysis', () => {
  test("empty SOG's", () => {
    let mes = new Messages(testMes())

    let modifiedAisMessages: AisMessage[] = mes.aisMessages.map((ais) => {
      return {
        id: ais.id,
        mmsi: ais.mmsi,
        timestamp: ais.timestamp,
        sog: undefined,
      }
    })
    mes.aisMessages = modifiedAisMessages

    const score = new SimpleScorer().speed_analysis(mes)

    expect(score).toBeNaN()
  })

  test('SOG analysis', () => {
    let scorer = new SimpleScorer()
    let res = scorer.speed_analysis(new Messages(testMes()))

    expect(res).toBeGreaterThan(0)
    expect(res).toBeLessThanOrEqual(1)
    expect(res).not.toEqual(Infinity)
    expect(res).not.toEqual(Infinity - 1)
    expect(res).not.toBeNaN
    expect(res).toBeDefined
  })
})

describe('COG analysis', () => {
  test("empty cog's", () => {
    let mes = new Messages(testMes())

    let modifiedAisMessages: AisMessage[] = mes.aisMessages.map((ais) => {
      return {
        id: ais.id,
        mmsi: ais.mmsi,
        timestamp: ais.timestamp,
        cog: undefined,
      }
    })
    mes.aisMessages = modifiedAisMessages

    const score = new SimpleScorer().cog_analysis(mes)

    expect(score).toBeNaN()
  })
  test('cog inspection', () => {
    let mes = new Messages(testMes())
    let res = new SimpleScorer().cog_analysis(mes)
    expect(res).toBeDefined
    expect(res).not.toBeNaN
    expect(res).toBeGreaterThanOrEqual(0)
    expect(res).toBeLessThanOrEqual(1)
  })
})
