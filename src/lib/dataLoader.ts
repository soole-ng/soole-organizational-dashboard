let cachedData: any = null;

export async function loadMockData() {
  if (cachedData) return cachedData;

  try {
    const response = await fetch('/mock-data.json');
    if (!response.ok) throw new Error(`Failed to load mock data: ${response.status}`);
    cachedData = await response.json();
    return cachedData;
  } catch (error) {
    console.error('Error loading mock data:', error);
    throw error;
  }
}

export function getMockDataSync() {
  if (!cachedData) {
    console.warn('Mock data not yet loaded. Call loadMockData() first.');
    return null;
  }
  return cachedData;
}
