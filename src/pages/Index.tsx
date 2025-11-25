import { MainClock } from "@/components/MainClock";
import { RegionClocks } from "@/components/RegionClocks";

const Index = () => {
  return (
    <div className="min-h-screen bg-background py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <header className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-time bg-clip-text text-transparent">
            Horloge du Sénégal
          </h1>
          <p className="text-muted-foreground text-lg">
            Temps réel - Africa/Dakar
          </p>
        </header>

        {/* Main Clock */}
        <div className="flex justify-center">
          <div className="w-full max-w-4xl">
            <MainClock />
          </div>
        </div>

        {/* Regional Clocks */}
        <RegionClocks />

        {/* Footer */}
        <footer className="text-center pt-8 pb-4 border-t border-border">
          <p className="text-muted-foreground text-sm">
            Mise à jour automatique chaque seconde
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
