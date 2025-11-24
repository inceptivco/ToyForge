/// <reference types="@figma/plugin-typings" />

// Show the plugin UI
figma.showUI(__html__, {
  width: 340,
  height: 640,
  themeColors: true,
});

// Message types from UI
interface PlaceImageMessage {
  type: 'place-image';
  imageData: Uint8Array;
  name: string;
  width?: number;
  height?: number;
}

interface ResizeMessage {
  type: 'resize';
  width: number;
  height: number;
}

interface NotifyMessage {
  type: 'notify';
  message: string;
  error?: boolean;
}

type PluginMessage = PlaceImageMessage | ResizeMessage | NotifyMessage;

// Handle messages from UI
figma.ui.onmessage = async (msg: PluginMessage) => {
  switch (msg.type) {
    case 'place-image':
      await placeImageOnCanvas(msg);
      break;
    case 'resize':
      figma.ui.resize(msg.width, msg.height);
      break;
    case 'notify':
      figma.notify(msg.message, { error: msg.error });
      break;
  }
};

async function placeImageOnCanvas(msg: PlaceImageMessage) {
  try {
    // Create image from bytes
    const image = figma.createImage(msg.imageData);
    const { width, height } = await image.getSizeAsync();

    // Create rectangle with image fill
    const rect = figma.createRectangle();
    rect.name = msg.name || 'ToyForge Character';
    rect.resize(msg.width || width, msg.height || height);

    // Apply image as fill
    rect.fills = [
      {
        type: 'IMAGE',
        scaleMode: 'FILL',
        imageHash: image.hash,
      },
    ];

    // Position in viewport center or near selection
    const viewport = figma.viewport.center;
    const selection = figma.currentPage.selection;

    if (selection.length > 0) {
      // Place next to selection
      const lastSelected = selection[selection.length - 1];
      const bounds = lastSelected.absoluteBoundingBox;
      if (bounds) {
        rect.x = bounds.x + bounds.width + 20;
        rect.y = bounds.y;
      }
    } else {
      // Center in viewport
      rect.x = viewport.x - (msg.width || width) / 2;
      rect.y = viewport.y - (msg.height || height) / 2;
    }

    // Add to page and select
    figma.currentPage.appendChild(rect);
    figma.currentPage.selection = [rect];
    figma.viewport.scrollAndZoomIntoView([rect]);

    // Notify success
    figma.notify('Character placed on canvas!');

    // Send success back to UI
    figma.ui.postMessage({ type: 'image-placed', success: true });
  } catch (error) {
    console.error('Error placing image:', error);
    figma.notify('Failed to place image on canvas', { error: true });
    figma.ui.postMessage({
      type: 'image-placed',
      success: false,
      error: String(error),
    });
  }
}
