// Shared type vocabulary for the AEGIS encryption layer visualization.
// Mirrors the C-layer state machine: aegis_encrypt_packet() and friends.

export type Department = 'ICU' | 'ER' | 'Ward' | 'OR';

export type SessionState =
  | 'ACTIVE'
  | 'REKEYING'
  | 'BLOCKED'
  | 'NOT_JOINED';

export type ThreatState = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AttackClass =
  | 'Benign'
  | 'DDoS'
  | 'DoS'
  | 'ICMP_Flood'
  | 'ARP_Spoofing'
  | 'MQTT_Attack'
  | 'Ransomware'
  | 'Reconnaissance'
  | 'Data_Exfiltration';

export type CryptoEventType =
  | 'encrypt_ok'
  | 'decrypt_ok'
  | 'tag_verify_fail'
  | 'rekey_triggered'
  | 'session_blocked'
  | 'join_handshake';

export type EventSeverity = 'info' | 'success' | 'warning' | 'error' | 'critical';

export interface CryptoDevice {
  id: string;
  deviceId: string;
  patientId: string;
  department: Department;
  sessionState: SessionState;
  threatState: ThreatState;
  packetCounter: number;
  lastRekey: Date | null;
  fastPathRatio: number;
}

export interface CryptoEvent {
  id: string;
  timestamp: Date;
  type: CryptoEventType;
  deviceId: string;
  threatClass?: AttackClass;
  severity: EventSeverity;
  message: string;
}

export interface MetricsSnapshot {
  t: number;
  packetsPerSecond: number;
  fastPathCount: number;
  generalPathCount: number;
  tagVerifyFailures: number;
  medianCyclesPerPacket: number;
}

export interface DemoScenario {
  label: string;
  deviceId: string;
  attackClass: AttackClass;
}

export interface AADLayout {
  priority: number;
  deviceId: string;
  patientId: string;
  department: Department;
  timestamp: number;
}
