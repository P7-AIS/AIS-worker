import { Geometry, LineString } from "wkx"
import { AISJobData, AisMessage } from "../../AIS-models/models"

export interface IMessageConverter {
    convert_buffer(path: Buffer): LineString
    convert_to_job(): AISJobData
}

export type VesselMessage = {
    mmsi: number
    ais_messages: AisMessage[]
    vessel_trajector: Geometry
}

//export interface IVesselTrajectory {
//    
//}