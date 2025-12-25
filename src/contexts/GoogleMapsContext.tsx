import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { supabase } from '@/integrations/supabase/client';

interface GoogleMapsContextType {
  isLoaded: boolean;
  loadError: Error | undefined;
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isLoaded: false,
  loadError: undefined,
});

export const useGoogleMaps = () => useContext(GoogleMapsContext);

interface GoogleMapsProviderProps {
  children: ReactNode;
}

const libraries: ("places" | "geometry" | "drawing")[] = ["places"];

// Inner component that only mounts when we have an API key
const GoogleMapsLoaderProvider = ({ 
  apiKey, 
  children 
}: { 
  apiKey: string; 
  children: ReactNode;
}) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries,
    preventGoogleFontsLoading: true,
  });

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
      {children}
    </GoogleMapsContext.Provider>
  );
};

export const GoogleMapsProvider = ({ children }: GoogleMapsProviderProps) => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<Error | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-maps-config');
        if (error) throw error;
        if (data?.apiKey) {
          setApiKey(data.apiKey);
        } else {
          setFetchError(new Error('Google Maps API key not found'));
        }
      } catch (err) {
        console.error('Failed to fetch Google Maps API key:', err);
        setFetchError(err instanceof Error ? err : new Error('Failed to load API key'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchApiKey();
  }, []);

  // If we have an API key, use the loader provider
  if (apiKey) {
    return (
      <GoogleMapsLoaderProvider apiKey={apiKey}>
        {children}
      </GoogleMapsLoaderProvider>
    );
  }

  // If still loading or error, provide context with appropriate state
  return (
    <GoogleMapsContext.Provider value={{ 
      isLoaded: false, 
      loadError: fetchError 
    }}>
      {children}
    </GoogleMapsContext.Provider>
  );
};
