// Helper function to get the best quality image from an array of images
const getBestImage = (images: Array<{ url: string; width?: number; height?: number }>) => {
  // Sort images by resolution (width * height) in descending order, if available
  const sortedImages = images.sort((a, b) => ((b.width || 0) * (b.height || 0)) - ((a.width || 0) * (a.height || 0)));
  return sortedImages[0]?.url || '';
};

export default getBestImage; 