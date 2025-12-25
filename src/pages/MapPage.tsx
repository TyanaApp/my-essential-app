import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Users, Navigation, Layers, Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SafePlace {
  id: string;
  name: string;
  type: 'gym' | 'studio' | 'clinic' | 'safe_zone';
  rating: number;
  verified: boolean;
}

const MapPage = () => {
  const { t } = useLanguage();
  const [selectedTab, setSelectedTab] = useState<'places' | 'users'>('places');
  const [searchQuery, setSearchQuery] = useState('');

  const safePlaces: SafePlace[] = [
    { id: '1', name: 'Wellness Gym', type: 'gym', rating: 4.8, verified: true },
    { id: '2', name: 'Yoga Studio', type: 'studio', rating: 4.9, verified: true },
    { id: '3', name: 'Health Clinic', type: 'clinic', rating: 4.7, verified: true },
    { id: '4', name: 'Meditation Center', type: 'safe_zone', rating: 4.6, verified: false },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'gym': return '🏋️';
      case 'studio': return '🧘';
      case 'clinic': return '🏥';
      case 'safe_zone': return '🛡️';
      default: return '📍';
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

      {/* Map placeholder */}
      <div className="mx-6 mb-4 rounded-xl overflow-hidden bg-secondary h-48 relative">
        <div className="absolute inset-0 flex items-center justify-center flex-col gap-2 text-muted-foreground">
          <Navigation className="w-12 h-12" />
          <p className="font-exo text-sm">Map coming soon</p>
          <p className="font-exo text-xs">Configure Google Maps API key</p>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-3 h-3 rounded-full bg-primary animate-pulse" />
          <div className="absolute top-1/2 left-1/2 w-4 h-4 rounded-full bg-bio-cyan animate-pulse" style={{ animationDelay: '0.5s' }} />
          <div className="absolute top-1/3 right-1/4 w-3 h-3 rounded-full bg-bio-magenta animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
      </div>

      {/* Places list */}
      <div className="px-6 pb-24 space-y-3">
        <AnimatedList>
          {safePlaces
            .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((place, index) => (
              <motion.div
                key={place.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer">
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
        </AnimatedList>
      </div>
    </div>
  );
};

const AnimatedList = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="space-y-3"
  >
    {children}
  </motion.div>
);

export default MapPage;
