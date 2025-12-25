import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLoadScript } from '@react-google-maps/api';
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

export const GoogleMapsProvider = ({ children }: GoogleMapsProviderProps) => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-maps-config');
        if (error) throw error;
        if (data?.apiKey) {
          setApiKey(data.apiKey);
        }
      } catch (err) {
        console.error('Failed to fetch Google Maps API key:', err);
        setFetchError(err instanceof Error ? err : new Error('Failed to load API key'));
      }
    };

    fetchApiKey();
  }, []);

  // Only load the script if we have an API key
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey || '',
    libraries,
    preventGoogleFontsLoading: true,
  });

  const contextValue = {
    isLoaded: apiKey ? isLoaded : false,
    loadError: fetchError || loadError,
  };

  return (
    <GoogleMapsContext.Provider value={contextValue}>
      {children}
    </GoogleMapsContext.Provider>
  );
};
