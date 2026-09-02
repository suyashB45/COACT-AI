import { useQuery } from "@tanstack/react-query"
import { getAiUsage, AiUsage } from "@/lib/api"

export const AI_USAGE_QUERY_KEY = ["aiUsage"]

/**
 * Fetches the authenticated user's current AI usage (requests/min, hourly
 * input/output tokens, daily total). `poll` enables an interval refetch (used on
 * pages where a user is actively interacting with the AI). Guests get no data.
 */
export const useAiUsage = ({ poll = false, enabled = true }: { poll?: boolean; enabled?: boolean } = {}) => {
    return useQuery<AiUsage>({
        queryKey: AI_USAGE_QUERY_KEY,
        queryFn: () => getAiUsage(),
        enabled,
        retry: 1,
        refetchInterval: poll ? 60_000 : false,
        refetchOnWindowFocus: false,
    })
}