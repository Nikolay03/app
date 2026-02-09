"use client";

import { useMemo } from "react";
import {
  useDeleteMutation,
  useInsertMutation,
  useQuery as usePostgrestQuery,
  useUpdateMutation,
} from "@supabase-cache-helpers/postgrest-react-query";
import type { PostgrestResponse } from "@supabase/postgrest-js";
import { createClient } from "@/shared/lib/supabase/browser";
import type { ViewRecord } from "@/entities/view/model/types";

function toPostgrestResponse<T>(
  data: T[]
): PostgrestResponse<T> {
  return {
    data,
    error: null,
    count: null,
    status: 200,
    statusText: "OK",
  };
}

export function useViewsData(gridKey: string, initialViews?: ViewRecord[]) {
  const supabase = useMemo(() => createClient(), []);

  const viewsQb = useMemo(() => {
    return supabase
      .from("views")
      .select("*")
      .eq("grid_key", gridKey)
      .order("created_at", { ascending: true });
  }, [gridKey, supabase]);

  const initialViewsResponse = useMemo(() => {
    return initialViews ? toPostgrestResponse(initialViews) : undefined;
  }, [initialViews]);

  const viewsQuery = usePostgrestQuery(
    viewsQb as unknown as PromiseLike<PostgrestResponse<ViewRecord>>,
    { initialData: initialViewsResponse }
  );

  const insertMutation = useInsertMutation(
    supabase.from("views"),
    ["id"],
    "*"
  );
  const updateMutation = useUpdateMutation(
    supabase.from("views"),
    ["id"],
    "*"
  );
  const deleteMutation = useDeleteMutation(
    supabase.from("views"),
    ["id"],
    "*"
  );

  return {
    viewsQuery,
    insertMutation,
    updateMutation,
    deleteMutation,
  };
}

