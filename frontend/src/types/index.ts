export interface Log {
  id: string;
  start_time: string;
  end_time: string;
  source: string;
  type: 'error' | 'success' | 'warning' | 'info' | 'danger';
  identifier: string;
  data: string;
  location?: string;
  environment: 'dev' | 'hom' | 'prod';
  status_code?: string;
  identifier_2?: string;
  identifier_3?: string;
  created_at: string;
}

export interface AggregationResult {
  [key: string]: any;
}

export interface QueryAggregateRequest {
  source: string;
  aggregation: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'distinct';
  filters?: Record<string, any>;
  field?: string;
  groupBy?: string[];
  from_?: string;
  to?: string;
}

export interface QueryDetailsRequest {
  source: string;
  filters?: Record<string, any>;
  from_?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export interface QueryDetailsResponse {
  total: number;
  limit: number;
  offset: number;
  data: Log[];
}

export interface CardConfig {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'pie' | 'gauge' | 'table';
  query: {
    source: string;
    aggregation: string;
    filters?: Record<string, any>;
    field?: string;
    groupBy?: string[];
    timeWindow?: string;
  };
  axes?: {
    x?: { label: string };
    y?: { label: string };
  };
  detailsEnabled?: boolean;
  detailsQuery?: Record<string, any>;
  min?: number;
  max?: number;
  thresholds?: Array<{ value: number; color: string }>;
}

export interface DashboardConfig {
  id: string;
  name: string;
  refreshInterval?: number;
  cards: CardConfig[];
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  config: DashboardConfig;
  created_at: string;
  updated_at: string;
}

export interface TimeRange {
  label: string;
  from: Date;
  to: Date;
}
