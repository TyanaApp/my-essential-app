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
    { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a2e' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#8b8b8b' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2d2d44' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e0e1a' }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#252540' }] },
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
    <div className="min-h-screen bg-background">
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

        {/* Tabs */}
        <div className="flex gap-2">
          <Button
            variant={selectedTab === 'places' ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setSelectedTab('places')}
            className="font-exo"
          >
            <MapPin className="w-4 h-4 mr-2" />
            {t('safePlaces')}
          </Button>
          <Button
            variant={selectedTab === 'users' ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setSelectedTab('users')}
            className="font-exo"
          >
            <Users className="w-4 h-4 mr-2" />
            {t('nearbyUsers')}
          </Button>
        </div>
      </div>

      {/* Map */}
      <div className="mx-6 mb-4 rounded-xl overflow-hidden h-48 relative">
        {loadError ? (
          <div className="absolute inset-0 flex items-center justify-center flex-col gap-2 text-muted-foreground bg-secondary">
            <Navigation className="w-12 h-12" />
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

      {/* Places list */}
      <div className="px-6 pb-24 space-y-3">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          {safePlaces
            .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((place, index) => (
              <motion.div
                key={place.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className={`bg-card border-border hover:border-primary/50 transition-colors cursor-pointer ${
                    selectedPlace === place.id ? 'border-primary' : ''
                  }`}
                  onClick={() => handlePlaceClick(place)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl">
                      {getTypeIcon(place.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-orbitron font-medium text-foreground">{place.name}</h3>
                        {place.verified && (
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">✓</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-yellow-500">★</span>
                        <span className="text-sm text-muted-foreground font-exo">{place.rating}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <Navigation className="w-5 h-5 text-primary" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
        </motion.div>
      </div>
    </div>
  );
};

export default MapPage;
