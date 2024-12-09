import { pb } from '../pocketbase';

interface WeatherData {
  temperature: number;
  conditions: string;
  icon: 'sun' | 'cloud' | 'rain';
  location: string;
}

interface WeatherResponse {
  coord: { lat: number; lon: number };
  weather: Array<{ id: number; main: string; description: string }>;
  main: { temp: number };
  name: string;
}

export const weatherService = {
  async getCurrentWeather(): Promise<WeatherData> {
    try {
      // Get user's location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        });
      });

      const { latitude, longitude } = position.coords;

      // Fetch weather data
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${
          import.meta.env.VITE_OPENWEATHER_API_KEY
        }&units=imperial`
      );

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.statusText}`);
      }

      const data: WeatherResponse = await response.json();

      // Map weather conditions to icons
      const getIcon = (condition: string): WeatherData['icon'] => {
        const lowerCondition = condition.toLowerCase();
        if (lowerCondition.includes('clear') || lowerCondition.includes('sun')) return 'sun';
        if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) return 'rain';
        return 'cloud';
      };

      // Format the weather data
      const weatherData: WeatherData = {
        temperature: Math.round(data.main.temp),
        conditions: data.weather[0].description
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
        icon: getIcon(data.weather[0].main),
        location: data.name,
      };

      // Save weather data to catch if creating one
      if (pb.authStore.isValid) {
        await pb.collection('weather_data').create({
          user: pb.authStore.model?.id,
          data: weatherData,
          timestamp: new Date().toISOString(),
        });
      }

      return weatherData;
    } catch (error) {
      if (error instanceof GeolocationPositionError) {
        throw new Error('Location access denied. Please enable location services.');
      }
      throw error;
    }
  },
};