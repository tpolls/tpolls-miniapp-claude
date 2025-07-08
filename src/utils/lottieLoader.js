/**
 * Utility for loading Lottie animations
 * Handles both .json and .lottie file formats
 */

/**
 * Load a Lottie animation from a file
 * @param {string} filePath - Path to the animation file
 * @returns {Promise<Object>} - The animation data
 */
export const loadLottieAnimation = async (filePath) => {
  try {
    // If it's a .json file, import it directly
    if (filePath.endsWith('.json')) {
      const animationData = await import(filePath);
      return animationData.default || animationData;
    }
    
    // If it's a .lottie file, it needs to be handled as an asset
    if (filePath.endsWith('.lottie')) {
      // For .lottie files, they should be extracted to .json first
      console.warn('Please extract .lottie files to .json format for better performance');
      const response = await fetch(filePath);
      const arrayBuffer = await response.arrayBuffer();
      
      // For now, assume it's been extracted to .json
      const jsonPath = filePath.replace('.lottie', '.json');
      const animationData = await import(jsonPath);
      return animationData.default || animationData;
    }
    
    throw new Error('Unsupported animation file format');
  } catch (error) {
    console.error('Failed to load Lottie animation:', error);
    throw error;
  }
};

/**
 * Default Lottie configuration for the app
 */
export const defaultLottieConfig = {
  loop: true,
  autoplay: true,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid meet',
    clearCanvas: true,
    progressiveLoad: true,
    hideOnTransparent: true
  }
};

/**
 * Create responsive Lottie style based on container size
 * @param {number} maxWidth - Maximum width
 * @param {number} maxHeight - Maximum height
 * @returns {Object} - Style object
 */
export const createResponsiveLottieStyle = (maxWidth = 120, maxHeight = 120) => ({
  width: '100%',
  height: '100%',
  maxWidth: `${maxWidth}px`,
  maxHeight: `${maxHeight}px`,
  objectFit: 'contain'
});