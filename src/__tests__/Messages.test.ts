import * as fs from 'fs'
import { Messages } from '../implementations/Messages'
import { AISJobData, AisMessage, AISWorkerAlgorithm } from '../../AIS-models/models'
import { Geometry, LineString, Point } from 'wkx'

const fromHexString = (hexString: any) =>
  Uint8Array.from(hexString.match(/.{1,2}/g).map((byte: any) => parseInt(byte, 16)))

function aisjobdata(path: string): AISJobData {
  let trajectoryBuffer: Buffer

  if (path != '') {
    let trajectoryString: string = fs.readFileSync(path, 'utf-8')
    trajectoryBuffer = Buffer.from(fromHexString(trajectoryString))
  } else {
    let point1 = new Point(1, 2, undefined, 1, 4326)
    let point2 = new Point(2, 2, undefined, 2, 4326)
    let lineString = new LineString([point1, point2], 4326)
    trajectoryBuffer = lineString.toEwkb()
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
    trajectory: { mmsi: 0, binPath: trajectoryBuffer },
    algorithm: AISWorkerAlgorithm.SIMPLE,
  }

  return jobdata
}

test('Convert to message', () => {
  let aisMessage = aisjobdata('')

  let messages = new Messages(aisMessage)

  expect(messages.mmsi).toBe(0)
  expect(messages.vesselTrajectory.points[0].x).toBe(1)
  expect(messages.vesselTrajectory.points[1].x).toBe(2)
})

test('Throw error when malformed data is provided', () => {
  let aisMessage: AISJobData = {
    mmsi: 0,
    aisMessages: [],
    trajectory: { mmsi: 0, binPath: Buffer.from('Not a buffer') },
    algorithm: AISWorkerAlgorithm.SIMPLE,
  }

  expect(() => new Messages(aisMessage)).toThrow()
})
