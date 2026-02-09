export type ViewRecord = {
  id: string;
  name: string;
  grid_key: string;
  column_state: unknown[] | null;
  sort_model: unknown[] | null;
  filter_model: Record<string, unknown> | null;
  created_at: string;
};
