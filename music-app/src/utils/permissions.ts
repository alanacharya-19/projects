import * as MediaLibrary from 'expo-media-library';

export async function requestAudioPermissions(): Promise<boolean> {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    return status === 'granted';
  } catch (err) {
    console.error('Permission error:', err);
    return false;
  }
}

export async function checkAudioPermissions(): Promise<boolean> {
  try {
    const { status } = await MediaLibrary.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}
