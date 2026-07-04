import { Dimensions, Platform } from "react-native";

export async function lockToLandscape() {
  if (Platform.OS === "web") {
    try {
      const orient = (screen as any)?.orientation;
      if (orient?.lock) {
        await orient.lock("landscape");
      }
    } catch {}
  }
}

export async function unlockOrientation() {
  if (Platform.OS === "web") {
    try {
      const orient = (screen as any)?.orientation;
      if (orient?.unlock) {
        orient.unlock();
      }
    } catch {}
  }
}

export function addOrientationListener(
  callback: (isPortrait: boolean) => void
) {
  const handler = ({
    window,
  }: {
    window: { width: number; height: number };
  }) => {
    callback(window.height > window.width);
  };

  if (Platform.OS === "web") {
    try {
      const orient = (screen as any)?.orientation;
      if (orient?.addEventListener) {
        orient.addEventListener("change", () =>
          callback(Dimensions.get("window").height > Dimensions.get("window").width)
        );
      }
    } catch {}
  }

  const sub = Dimensions.addEventListener("change", handler);
  handler({ window: Dimensions.get("window") });
  return () => sub.remove();
}
