import { Dimensions, Platform } from "react-native";

const { width: W, height: H } = Dimensions.get("window");

export const SCREEN_WIDTH = W;
export const SCREEN_HEIGHT = H;
export const IS_IPAD = Platform.isPad;
export const IS_TABLET = IS_IPAD || (Math.min(W, H) >= 768);

export const COLUMN_COUNT = IS_TABLET ? 4 : 2;
export const CARD_WIDTH = (SCREEN_WIDTH - 16 * (COLUMN_COUNT + 1)) / COLUMN_COUNT;
export const CARD_HEIGHT = CARD_WIDTH * 1.4;
export const HERO_HEIGHT = SCREEN_WIDTH * 0.55;
export const LIST_ITEM_HEIGHT = 72;

export const SHEET_SNAP_POINTS = ["25%", "50%", "75%"] as const;
