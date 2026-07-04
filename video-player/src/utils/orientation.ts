import { Dimensions, Platform } from "react-native";

let ScreenOrientation: any = null;

try {
  ScreenOrientation = require("expo-screen-orientation");
} catch {}

export async function lockToLandscape() {
  if (!ScreenOrientation) return;
  if (Platform.OS === "web") {
    try {
      const orient = (screen as any)?.orientation;
      if (orient?.lock) {
        await orient.lock("landscape");
      }
    } catch {}
  } else {
    try {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.LANDSCAPE
      );
    } catch {}
  }
}

export async function lockToPortrait() {
  if (!ScreenOrientation) return;
  if (Platform.OS === "web") {
    try {
      const orient = (screen as any)?.orientation;
      if (orient?.lock) {
        await orient.lock("portrait");
      }
    } catch {}
  } else {
    try {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP
      );
    } catch {}
  }
}

export async function unlockOrientation() {
  if (!ScreenOrientation) return;
  if (Platform.OS === "web") {
    try {
      const orient = (screen as any)?.orientation;
      if (orient?.unlock) {
        orient.unlock();
      }
    } catch {}
  } else {
    try {
      await ScreenOrientation.unlockAsync();
    } catch {}
  }
}

export function addOrientationListener(
  callback: (isPortrait: boolean) => void
) {
  if (ScreenOrientation && Platform.OS !== "web") {
    const sub = ScreenOrientation.addOrientationChangeListener(
      (e: any) => {
        const isPortrait =
          e.orientationInfo.orientation ===
            ScreenOrientation.Orientation.PORTRAIT_UP ||
          e.orientationInfo.orientation ===
            ScreenOrientation.Orientation.PORTRAIT_DOWN;
        callback(isPortrait);
      }
    );
    callback(
      Dimensions.get("window").height > Dimensions.get("window").width
    );
    return () => ScreenOrientation.removeOrientationChangeListener(sub);
  }

  // Fallback: listen to dimension changes (web or missing native module)
  const handler = ({
    window,
  }: {
    window: { width: number; height: number };
  }) => {
    callback(window.height > window.width);
  };
  const sub = Dimensions.addEventListener("change", handler);
  handler({ window: Dimensions.get("window") });
  return () => sub.remove();
}
