/**
 * Shared camera capture for the scanners (fridge + meal).
 *
 * The whole photo is taken the instant `takePictureAsync` returns — there is no
 * need for the user to hold still while the AI runs afterward. Callers should
 * therefore freeze `previewUri` on screen during analysis (a static image),
 * NOT keep showing the live camera, so it doesn't feel like an ongoing capture.
 *
 * Returns the full-res `previewUri` (for the freeze frame) and a downscaled
 * base64 (~1024px, JPEG) for upload — smaller payload, faster, cheaper tokens.
 */
import type { CameraView } from 'expo-camera';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export type Capture = { previewUri: string; base64: string };

export async function capturePhoto(camera: CameraView): Promise<Capture> {
  const photo = await camera.takePictureAsync({ quality: 0.7 });
  if (!photo?.uri) throw new Error('Could not capture photo.');

  const rendered = await ImageManipulator.manipulate(photo.uri).resize({ width: 1024 }).renderAsync();
  const out = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.6, base64: true });
  if (!out.base64) throw new Error('Could not process photo.');

  return { previewUri: photo.uri, base64: out.base64 };
}
