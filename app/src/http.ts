import axios from "axios";
import { Neato, type QuickRobotInfo } from "./types";
import type { NoGoLine, VacuulaMapData, Zone } from "./components/map/types";

const ha_ingress = window.location.pathname.match(/^\/api\/hassio_ingress\/[^/]+/)
export const BASE_PATH = ha_ingress ? ha_ingress[0] : ""

/** GET /api/server */
export interface ServerInfo {
  version: string
  min_installer_version: string
  gen3_port: number
  gen4_port: number

  timezone: string
  utc_offset_minutes: number
}

const instance = axios.create({
  baseURL: `${BASE_PATH}/api`, 
});

export class Http {
  static sendCmd<T>(robotSerial: string, cmd: object) {
    return instance.post<T>(`/robot/${robotSerial}/command`, JSON.stringify(cmd));
  }

  static getPersistentMaps(serial: string) {
    return instance.get<Neato.Gen3.PersistentMap[] | Neato.Gen4.Floorplan[]>(`/robot/${serial}/maps`)
  }

  static getPersistentMap(serial: string, mapId: string) {
    return instance.get<VacuulaMapData>(`/robot/${serial}/maps/${mapId}`)
  }

  static postUseMapAsFloorPlan(serial: string, mapId: string) {
    return instance.post(`/robot/${serial}/maps/${mapId}/use`)
  }

  static postUnuseMapAsFloorPlan(serial: string, mapId: string) {
    return instance.post(`/robot/${serial}/maps/${mapId}/unuse`)
  }

  static updatePersistentMap(serial: string, mapId: string, data: { name?: string, enabled?: boolean }) {
    return instance.post(`/robot/${serial}/maps/${mapId}`, data)
  }

  static postBoundaries(serial: string, mapId: string, data: (NoGoLine | Zone)[]) {
    return instance.post(`/robot/${serial}/maps/${mapId}/boundaries`, data)
  }

  static getBoundaries(serial: string, mapId: string) {
    return instance.get(`/robot/${serial}/maps/${mapId}/boundaries`)
  }

  static promoteFloorplan(serial: string, mapId: string) {
    return instance.post(`/robot/${serial}/maps/${mapId}/promote`)
  }

  static getCleanings(serial: string) {
    return instance.get(`/robot/${serial}/runs`)
  }

  static getCleaning(serial: string, runId: string) {
    return instance.get(`/robot/${serial}/run/${runId}`)
  }

  static demoteFloorplan(serial: string, mapId: string) {
    return instance.delete(`/robot/${serial}/maps/${mapId}`)
  }

  static getRobots() {
    return instance.get<QuickRobotInfo>('/robots');
  }

  /** Server facts the UI needs: the IANA timezone it runs in and its current UTC offset. */
  static getServerInfo() {
    return instance.get<ServerInfo>('/server');
  }

  static getVacuulaCert() {
    return instance.get('/cert');
  }

  static updateRobot(serial: string, data: { name: string }) {
    return instance.post(`/robot/${serial}`, data)
  }
}


