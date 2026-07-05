import { Image } from "expo-image";

export function ThumbnailImage({
  uri,
  style,
  blurhash,
}: {
  uri: string;
  style?: any;
  blurhash?: string;
}) {
  return (
    <Image
      source={{ uri }}
      style={style}
      cachePolicy={"disk"}
      placeholder={blurhash ? { blurhash } : undefined}
      contentFit="cover"
      transition={200}
      recyclingKey={uri}
    />
  );
}
