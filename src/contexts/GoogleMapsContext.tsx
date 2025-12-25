import React, { createContext, useContext, useState, ReactNode } from 'react';

interface GoogleMapsContextType {
  isLoaded: boolean;
  loadError: Error | undefined;
  apiKey: string | null;
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isLoaded: false,
  loadError: undefined,
  apiKey: null,
});

export const useGoogleMaps = () => useContext(GoogleMapsContext);

interface GoogleMapsProviderProps {
  children: ReactNode;
}

export const GoogleMapsProvider = ({ children }: GoogleMapsProviderProps) => {
  // For now, we'll provide a placeholder context
  // Google Maps API key will need to be configured via secrets
  const [isLoaded] = useState(false);
  const [loadError] = useState<Error | undefined>(undefined);
  const [apiKey] = useState<string | null>(null);

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError, apiKey }}>
      {children}
    </GoogleMapsContext.Provider>
  );
};
