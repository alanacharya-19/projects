import { useState, useEffect } from "react";
import { Dimensions } from "react-native";

type Orientation = "portrait" | "landscape";

export function useOrientation(): Orientation {
  const [orientation, setOrientation] = useState<Orientation>(() => {
    const { width, height } = Dimensions.get("screen");
    return width > height ? "landscape" : "portrait";
  });

  useEffect(() => {
    const sub = Dimensions.addEventListener("change", ({ screen }) => {
      setOrientation(screen.width > screen.height ? "landscape" : "portrait");
    });
    return () => sub.remove();
  }, []);

  return orientation;
}

export function useIsLandscape(): boolean {
  return useOrientation() === "landscape";
}

export function useScreenDimensions() {
  const [dims, setDims] = useState(() => Dimensions.get("screen"));

  useEffect(() => {
    const sub = Dimensions.addEventListener("change", ({ screen }) => setDims(screen));
    return () => sub.remove();
  }, []);

  return dims;
}
