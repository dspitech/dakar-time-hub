import { useEffect, useState } from "react";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";

const TIMEZONE = "Africa/Dakar";

const REGIONS = [
  "Dakar",
  "Diourbel",
  "Fatick",
  "Kaffrine",
  "Kaolack",
  "Kédougou",
  "Kolda",
  "Louga",
  "Matam",
  "Saint-Louis",
  "Sédhiou",
  "Tambacounda",
  "Thiès",
  "Ziguinchor",
];

export const RegionClocks = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const zonedTime = toZonedTime(time, TIMEZONE);
  const formattedTime = format(zonedTime, "HH:mm:ss");

  return (
    <div className="w-full">
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-primary">
        Les 14 Régions du Sénégal
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {REGIONS.map((region) => (
          <RegionCard
            key={region}
            region={region}
            time={formattedTime}
          />
        ))}
      </div>
    </div>
  );
};

const RegionCard = ({ region, time }: { region: string; time: string }) => {
  return (
    <Card className="relative overflow-hidden border-border bg-card p-4 transition-smooth hover:scale-105 hover:border-primary/50 hover:shadow-glow group">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-smooth">
          <Clock className="w-5 h-5 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground mb-1 truncate">
            {region}
          </h3>
          <p className="text-2xl font-bold tabular-nums bg-gradient-time bg-clip-text text-transparent">
            {time}
          </p>
        </div>
      </div>

      {/* Decorative corner accent */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-smooth" />
    </Card>
  );
};
