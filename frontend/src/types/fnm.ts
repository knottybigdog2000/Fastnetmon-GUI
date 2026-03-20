export interface HostCounter {
  host: string;
  ip?: string;
  incoming_bytes: number;
  incoming_packets: number;
  outgoing_bytes: number;
  outgoing_packets: number;
}

export interface BlackholeRule {
  uuid: string;
  ip: string;
  created_at?: string;
}

export interface FlowSpecRule {
  uuid: string;
  destination_prefix: string;
  source_prefix?: string;
  protocols: string[];
  source_ports?: number[];
  destination_ports?: number[];
  action_type: string;
}

export interface Hostgroup {
  name: string;
  calculation_method: 'per_host' | 'total';
  networks: string[];
  enable_ban?: boolean;
  ban_for_pps?: number;
  ban_for_bandwidth?: number;
  ban_for_flows?: number;
  threshold_pps?: number;
  threshold_mbps?: number;
  threshold_flows?: number;
  threshold_tcp_syn_pps?: number;
  threshold_udp_pps?: number;
  threshold_icmp_pps?: number;
}

export interface Server {
  id: number;
  name: string;
  host: string;
  api_port: number;
  api_login: string;
  is_active: number;
}
