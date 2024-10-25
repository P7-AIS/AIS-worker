import { Geometry, LineString } from "wkx";
import { IMessageConverter, VesselMessage } from "../interfaces/IMessages";
import { AISJobData, AisMessage } from "../../AIS-models/models";

// export type Trajectory = {
//     trajectory:
// }

export function ais_job_to_message(data: AISJobData): Messages {
    let trajectory = Geometry.parse(data.trajectories) as unknown as LineString

    return new Messages(data.mmsi, data.aisMessages, trajectory)
}


export class Messages implements IMessageConverter, VesselMessage {
    constructor(mmsi: number, ais_messages: AisMessage[], vessel_trajectory: LineString) {
        this.mmsi = mmsi
        this.ais_messages = ais_messages
        this.vessel_trajector = vessel_trajectory
    }

    mmsi: number;
    ais_messages: AisMessage[];
    vessel_trajector: LineString;

    convert_to_job(): AISJobData {
        throw new Error("Method not implemented.");
    }
    vessel_messages(data: AISJobData): VesselMessage[] {

        throw new Error("Method not implemented.");
    }
    convert_buffer(path: Buffer): LineString {
        let geom = Geometry.parse(path);
        return geom as LineString; // assertion by typecast :))
    }
}