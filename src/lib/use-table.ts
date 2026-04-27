import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useTable<T = any>(table: string, select = "*", orderBy?: string) {
  return useQuery({
    queryKey: [table, select, orderBy],
    queryFn: async () => {
      let q = supabase.from(table as any).select(select);
      if (orderBy) q = q.order(orderBy, { ascending: true });
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as T[];
    },
  });
}
