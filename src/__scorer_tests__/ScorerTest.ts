import { groupBy } from 'lodash'
import { Pool, PoolClient } from 'pg'
import { AisMessage, AISWorkerAlgorithm, JobAisData, Trajectory } from '../../AIS-models/models'
import { Geometry, LineString } from 'wkx'
import SimpleScorer from '../implementations/SimpleScorer'
import { random, randomInt } from 'mathjs'

export interface VesselRandomiser {
  trajRandom(index: number, input: number, long: boolean): number
  cogRandom(index: number, input?: number): number | undefined
  sogRandom(index: number, input?: number): number | undefined
  repRandom(index: number): boolean
  reset(): void
}

export default class ScorerTest {
  private jobData: JobAisData[]
  private readonly pool: Pool

  constructor(dbConnString: string) {
    this.pool = new Pool({ connectionString: dbConnString })
    this.jobData = []
  }

  async initialize(mmsi: number[]): Promise<void> {
    this.jobData = await this.fetch_test_data(mmsi)
  }

  private async fetch_test_data(mmsis: number[]): Promise<JobAisData[]> {
    const client = await this.pool.connect()

    const mmsiStr = mmsis.join(', ')

    const result_traj = await this.query<{ mmsi: bigint; path: Buffer }>(
      client,
      `
        SELECT mmsi, ST_AsBinary(trajectory) AS path
        FROM vessel_trajectory
        WHERE mmsi IN (${mmsiStr})
      `
    )

    const trajectories: Trajectory[] = result_traj.map((traj) => ({
      mmsi: Number(traj.mmsi),
      binPath: traj.path,
    }))

    const result_message = await this.query<{
      id: number
      vessel_mmsi: bigint
      destination: string | null
      mobile_type_id: number | null
      nav_status_id: number | null
      data_source_type: string | null
      timestamp: Date
      cog: number | null
      rot: number | null
      sog: number | null
      heading: number | null
      draught: number | null
      cargo_type: string | null
      eta: Date | null
    }>(
      client,
      `
        SELECT id, vessel_mmsi, destination, mobile_type_id, nav_status_id, data_source_type, timestamp, cog, rot, sog, heading, draught, cargo_type, eta
        FROM ais_message
        WHERE vessel_mmsi IN (${mmsiStr})
      `
    )

    const messages: AisMessage[] = result_message.map((msg) => ({
      id: msg.id,
      mmsi: Number(msg.vessel_mmsi),
      timestamp: msg.timestamp,
      destination: msg.destination ? msg.destination : undefined,
      mobileTypeId: msg.mobile_type_id ? msg.mobile_type_id : undefined,
      navigationalStatusId: msg.nav_status_id ? msg.nav_status_id : undefined,
      dataSourceType: msg.data_source_type ? msg.data_source_type : undefined,
      rot: msg.rot ? msg.rot : undefined,
      sog: msg.sog ? msg.sog : undefined,
      cog: msg.cog ? msg.cog : undefined,
      heading: msg.heading ? msg.heading : undefined,
      draught: msg.draught ? msg.draught : undefined,
      cargoType: msg.cargo_type ? msg.cargo_type : undefined,
      eta: msg.eta ? msg.eta : undefined,
    }))

    const groupedMessages = groupBy(messages, 'mmsi')

    let jobdata: JobAisData[] = mmsis.map((mmsi) => ({
      mmsi: Number(mmsiStr),
      messages: groupedMessages[mmsi]!,
      trajectory: trajectories.find((trajectory) => trajectory.mmsi === mmsi)!,
      algorithm: AISWorkerAlgorithm.SIMPLE,
    }))

    return jobdata
  }

  async runTest(randomizer: VesselRandomiser): Promise<[number, number][]> {
    let jobData = structuredClone(this.jobData)

    jobData = jobData.map((vessel) => {
      let traj = Geometry.parse(Buffer.from(vessel.trajectory.binPath))
      if (!(traj instanceof LineString)) {
        throw new Error('Input geometry not of type LineString')
      }
      let seed = Math.random()
      vessel.messages.filter((_, i) => randomizer.repRandom(i))
      randomizer.reset()
      traj.points.filter((_, i) => randomizer.repRandom(i))
      return {
        ...vessel,
        messages: vessel.messages.map((msg, i) => {
          return { ...msg, cog: randomizer.cogRandom(i, msg.cog), sog: randomizer.sogRandom(i, msg.sog) }
        }),
        trajectory: { ...vessel.trajectory, binPath: traj.toWkb() },
      }
    })

    return Promise.all(jobData.map(async (vessel) => [vessel.mmsi, await this.calculateScoreForVessel(vessel)]))
  }

  async calculateScoreForVessel(vessel: JobAisData): Promise<number> {
    let simpleScorer = new SimpleScorer()

    const scorePromise = await simpleScorer.score(vessel)
    return scorePromise.trustworthiness
  }

  private async query<T>(client: PoolClient, sql: string, params?: any[]) {
    const result = await client.query(sql, params)
    return result.rows as T[]
  }
}
