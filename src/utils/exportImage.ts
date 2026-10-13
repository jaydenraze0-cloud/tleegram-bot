import { toBlob, toPng } from 'html-to-image';

const TRANSPARENT_1X1_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAAElFTkSuQmCC';

// Preload and ensure all fonts and images are ready before snapshotting
async function prepareCanvasForExport(element: HTMLElement): Promise<void> {
  try {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
  } catch {
    // Non-fatal
  }

  // Ensure all <img> tags inside element are loaded
  const imgs = Array.from(element.querySelectorAll('img'));
  await Promise.all(
    imgs.map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const done = () => resolve();
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
        setTimeout(resolve, 600);
      });
    })
  );
}

export async function exportCanvasToBlob(element: HTMLElement): Promise<Blob> {
  if (!element) {
    throw new Error('Target canvas element not found');
  }

  await prepareCanvasForExport(element);

  const baseOptions = {
    skipFonts: false, // Embed Plus Jakarta Sans so Telegram gets the exact layout
    imagePlaceholder: TRANSPARENT_1X1_PNG,
    onImageErrorHandler: () => TRANSPARENT_1X1_PNG,
    cacheBust: false,
    width: 1080,
    height: 1080,
    pixelRatio: 1,
    style: {
      transform: 'none',
      transformOrigin: '0 0',
    },
  };

  try {
    const blob = await toBlob(element, baseOptions);
    if (!blob) throw new Error('toBlob returned empty result');
    return blob;
  } catch (err: any) {
    console.warn('[Stark-News Export] toBlob with fonts failed, attempting fallback:', err);
    try {
      const fallbackBlob = await toBlob(element, { ...baseOptions, skipFonts: true });
      if (fallbackBlob) return fallbackBlob;
    } catch {
      // Continue to toPng
    }
    const dataUrl = await toPng(element, { ...baseOptions, skipFonts: true });
    const res = await fetch(dataUrl);
    const fallbackBlob = await res.blob();
    if (!fallbackBlob) throw new Error('toPng fallback failed');
    return fallbackBlob;
  }
}

export async function exportCanvasToPng(element: HTMLElement): Promise<string> {
  if (!element) {
    throw new Error('Target canvas element not found');
  }

  await prepareCanvasForExport(element);

  const baseOptions = {
    skipFonts: false, // Embed Plus Jakarta Sans so Telegram gets the exact layout
    imagePlaceholder: TRANSPARENT_1X1_PNG,
    onImageErrorHandler: () => TRANSPARENT_1X1_PNG,
    cacheBust: false,
    width: 1080,
    height: 1080,
    pixelRatio: 1,
    style: {
      transform: 'none',
      transformOrigin: '0 0',
    },
  };

  try {
    return await toPng(element, baseOptions);
  } catch (err: any) {
    console.warn('[Stark-News Export] toPng with fonts failed, falling back to skipFonts:', err);
    return await toPng(element, { ...baseOptions, skipFonts: true });
  }
}
