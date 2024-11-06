import * as fs from 'fs'
import { Messages } from '../implementations/Messages'
import { AISJobData, AisMessage, AISWorkerAlgorithm } from '../../AIS-models/models'
import { Geometry, LineString, Point } from 'wkx'

const fromHexString = (hexString: any) =>
  Uint8Array.from(hexString.match(/.{1,2}/g).map((byte: any) => parseInt(byte, 16)))

function aisjobdata(path: string): AISJobData {
  let trajectory_buffer: Buffer

  if (path != '') {
    let trajectory_string: string = fs.readFileSync(path, 'utf-8')
    trajectory_buffer = Buffer.from(fromHexString(trajectory_string))
  } else {
    let point1 = new Point(1, 2, undefined, 1, 4326)
    let point2 = new Point(2, 2, undefined, 2, 4326)
    let line_string = new LineString([point1, point2], 4326)
    trajectory_buffer = line_string.toEwkb()
  }

  let messages: AisMessage[] = [
    {
      id: 0,
      mmsi: 0,
      timestamp: new Date(),
    },
    {
      id: 1,
      mmsi: 1,
      timestamp: new Date(),
    },
    {
      id: 2,
      mmsi: 2,
      timestamp: new Date(),
    },
  ]

  const jobdata: AISJobData = {
    mmsi: 0,
    aisMessages: messages,
    trajectory: { mmsi: 0, binPath: trajectory_buffer },
    algorithm: AISWorkerAlgorithm.SIMPLE,
  }

  return jobdata
}

//test('Convert to message', () => {
//  let ais_message = aisjobdata('')
//
//  let message2: Point[] = message.vessel_trajectory.points
//
//  expect(message.mmsi).toBe(0)
//  expect(message2[0].x).toBe(1)
//  expect(message2[1].x).toBe(2)
//})

test(`delete when creating tes`, () => {
  expect(1 + 1).toBeGreaterThan(1)
})
