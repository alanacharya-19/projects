import * as ScreenOrientation from "expo-screen-orientation";
import { Dimensions, Platform } from "react-native";

export async function lockToLandscape() {
  if (Platform.OS === "web") {
    try {
      const orient = (screen as any)?.orientation;
      if (orient?.lock) {
        await orient.lock("landscape");
      }
    } catch {}
    return;
  }
  await ScreenOrientation.lockAsync(
    ScreenOrientation.OrientationLock.LANDSCAPE
  );
}

export async function lockToPortrait() {
  if (Platform.OS === "web") {
    try {
      const orient = (screen as any)?.orientation;
      if (orient?.lock) {
        await orient.lock("portrait");
      }
    } catch {}
    return;
  }
  await ScreenOrientation.lockAsync(
    ScreenOrientation.OrientationLock.PORTRAIT_UP
  );
}

export async function unlockOrientation() {
  if (Platform.OS === "web") {
    try {
      const orient = (screen as any)?.orientation;
      if (orient?.unlock) {
        orient.unlock();
      }
    } catch {}
    return;
  }
  await ScreenOrientation.unlockAsync();
}

export function addOrientationListener(callback: (isPortrait: boolean) => void) {
  if (Platform.OS !== "web") {
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
