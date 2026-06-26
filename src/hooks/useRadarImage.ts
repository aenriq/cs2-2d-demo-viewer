import { useEffect, useState } from "react";

export interface UseRadarImageResult {
  image: HTMLImageElement | null;
  loading: boolean;
  error: Error | null;
}

export function useRadarImage(url: string | undefined): UseRadarImageResult {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!url) {
      setImage(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;

    img.onload = () => {
      if (!cancelled) {
        setImage(img);
        setLoading(false);
      }
    };

    img.onerror = () => {
      if (!cancelled) {
        setError(new Error(`Failed to load radar image: ${url}`));
        setImage(null);
        setLoading(false);
      }
    };

    return () => {
      cancelled = true;
    };
  }, [url]);

  return { image, loading, error };
}
