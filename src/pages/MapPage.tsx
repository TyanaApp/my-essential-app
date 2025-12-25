import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Users, Navigation, Search, Loader2 } from 'lucide-react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGoogleMaps } from '@/contexts/GoogleMapsContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SafePlace {
  id: string;
  name: string;
  type: 'gym' | 'studio' | 'clinic' | 'safe_zone';
  rating: number;
  verified: boolean;
  lat: number;
  lng: number;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 56.9496,
  lng: 24.1052,
};

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  styles: [
    { elementType: 'geometry', stylers: [{ color: '#0a0a15' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0a15' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#a855f7' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#7c3aed' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f0520' }] },
    { featureType: 'water', elementType: 'geometry.stroke', stylers: [{ color: '#8b5cf6' }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1a0a2e' }] },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#c084fc' }] },
    { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#0a0a15' }] },
    { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2a1a4e' }] },
  ],
};

const MapPage = () => {
  const { t } = useLanguage();
  const { isLoaded, loadError } = useGoogleMaps();
  const [selectedTab, setSelectedTab] = useState<'places' | 'users'>('places');
  const [searchQuery, setSearchQuery] = useState('');
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<string | null>(null);

  const safePlaces: SafePlace[] = [
    { id: '1', name: 'Wellness Gym', type: 'gym', rating: 4.8, verified: true, lat: 56.9516, lng: 24.1132 },
    { id: '2', name: 'Yoga Studio', type: 'studio', rating: 4.9, verified: true, lat: 56.9476, lng: 24.0982 },
    { id: '3', name: 'Health Clinic', type: 'clinic', rating: 4.7, verified: true, lat: 56.9446, lng: 24.1202 },
    { id: '4', name: 'Meditation Center', type: 'safe_zone', rating: 4.6, verified: false, lat: 56.9556, lng: 24.0902 },
  ];

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'gym': return '🏋️';
      case 'studio': return '🧘';
      case 'clinic': return '🏥';
      case 'safe_zone': return '🛡️';
      default: return '📍';
    }
  };

  const handlePlaceClick = (place: SafePlace) => {
    setSelectedPlace(place.id);
    if (map) {
      map.panTo({ lat: place.lat, lng: place.lng });
      map.setZoom(15);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="p-6 pb-4">
        <motion.h1 
          className="text-2xl font-orbitron font-bold text-foreground mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {t('map')}
        </motion.h1>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search places..."
            className="pl-10 bg-secondary border-border text-foreground font-exo"
          />
        </div>

        {/* Tab Icons */}
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedTab('places')}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              selectedTab === 'places' 
                ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(168,85,247,0.5)]' 
                : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
            }`}
          >
            <MapPin className="w-5 h-5" />
          </button>
          <button
            onClick={() => setSelectedTab('users')}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              selectedTab === 'users' 
                ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(168,85,247,0.5)]' 
                : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
            }`}
          >
            <Users className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="mx-4 mb-4 rounded-2xl overflow-hidden h-[55vh] relative border border-primary/30 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
        {/* Neon glow overlay */}
        <div className="absolute inset-0 pointer-events-none z-10 rounded-2xl" 
          style={{
            boxShadow: 'inset 0 0 60px rgba(139, 92, 246, 0.2)',
          }}
        />
        
        {loadError ? (
          <div className="absolute inset-0 flex items-center justify-center flex-col gap-2 text-muted-foreground bg-secondary">
            <Navigation className="w-12 h-12 text-primary" />
            <p className="font-exo text-sm">Map unavailable</p>
          </div>
        ) : !isLoaded ? (
          <div className="absolute inset-0 flex items-center justify-center bg-secondary">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={defaultCenter}
            zoom={13}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={mapOptions}
          >
            {safePlaces.map((place) => (
              <Marker
                key={place.id}
                position={{ lat: place.lat, lng: place.lng }}
                onClick={() => handlePlaceClick(place)}
              />
            ))}
          </GoogleMap>
        )}
      </div>

      {/* Places list - Compact */}
      <div className="px-4 pb-24">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {safePlaces
            .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((place, index) => (
              <motion.div
                key={place.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handlePlaceClick(place)}
                className={`flex-shrink-0 cursor-pointer px-3 py-2 rounded-xl border transition-all ${
                  selectedPlace === place.id 
                    ? 'bg-primary/20 border-primary shadow-[0_0_15px_rgba(168,85,247,0.4)]' 
                    : 'bg-card/50 border-primary/20 hover:border-primary/50 hover:shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getTypeIcon(place.type)}</span>
                  <div className="flex flex-col">
                    <span className="font-orbitron text-xs text-foreground whitespace-nowrap">{place.name}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500 text-[10px]">★</span>
                      <span className="text-[10px] text-muted-foreground">{place.rating}</span>
                      {place.verified && (
                        <span className="text-[8px] bg-primary/30 text-primary px-1 rounded-full">✓</span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default MapPage;
