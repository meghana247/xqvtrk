import { useEffect, useState } from "react";

/** Fetches JSON from `url`, refetching when it changes. Pass null to skip. */
export function useFetch<T>(url: string | null) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    setError(undefined);
    fetch(url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Request failed (${response.status})`);
        return response.json();
      })
      .then(setData)
      .catch((err: Error) => {
        if (err.name !== "AbortError") setError(err.message);
      });
    return () => controller.abort();
  }, [url]);

  return { data, error };
}
