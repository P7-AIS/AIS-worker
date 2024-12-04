import { Pool, PoolClient } from 'pg'
import { AisMessage, Trajectory } from '../../AIS-models/models'
import IDatabaseHandler from '../interfaces/IDatabaseHandler'

export default class PostgresDatabaseHandler implements IDatabaseHandler {
  private readonly pool: Pool

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString })
  }

  async getAisData(
    mmsi: number,
    timestamp: number,
    duration_h: number
  ): Promise<{ messages: AisMessage[]; trajectory: Trajectory }> {
    const client = await this.pool.connect()

    const messages = await this.getAisMessages(client, mmsi, timestamp, duration_h)
    const trajectory = await this.getTrajectory(client, mmsi, timestamp, duration_h)

    client.release()

    return { messages, trajectory }
  }

  private async getAisMessages(
    client: PoolClient,
    mmsi: number,
    timestamp: number,
    duration_h: number
  ): Promise<AisMessage[]> {
    const startimeStr = new Date(timestamp * 1000 - duration_h * 3_600).toISOString().slice(0, 19).replace('T', ' ')
    const endtimeStr = new Date(timestamp * 1000).toISOString().slice(0, 19).replace('T', ' ')
    const sql = `
      SELECT id, vessel_mmsi, destination, mobile_type_id, nav_status_id, data_source_type, timestamp, cog, rot, sog, heading, draught, cargo_type, eta
      FROM ais_message
      WHERE vessel_mmsi = $1
      AND timestamp BETWEEN $2 AND $3;
    `
    const params = [mmsi, startimeStr, endtimeStr]

    const rows = await this.query<{
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
    }>(client, sql, params)

    const messages: AisMessage[] = rows.map((msg) => ({
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
    return messages
  }

  private async getTrajectory(
    client: PoolClient,
    mmsi: number,
    timestamp: number,
    duration_h: number
  ): Promise<Trajectory> {
    const startime = timestamp * 1000 - duration_h * 3600
    const endtime = timestamp * 1000

    const sql = `
      SELECT mmsi, st_asbinary(st_filterbym(trajectory, $1, $2, true)) AS path
      FROM vessel_trajectory
      WHERE mmsi = $3
    `

    const params = [startime, endtime, mmsi]

    const result = await this.query<{ mmsi: bigint; path: Buffer }>(client, sql, params)

    const trajectory: Trajectory = {
      mmsi: Number(result[0].mmsi),
      binPath: result[0].path,
    }

    return trajectory
  }

  private async query<T>(client: PoolClient, sql: string, params?: any[]) {
    const result = await client.query(sql, params)
    return result.rows as T[]
  }
}
