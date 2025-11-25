import { useEffect, useState } from "react";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Card } from "@/components/ui/card";

const TIMEZONE = "Africa/Dakar";

export const MainClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const zonedTime = toZonedTime(time, TIMEZONE);
  const hours = format(zonedTime, "HH");
  const minutes = format(zonedTime, "mm");
  const seconds = format(zonedTime, "ss");
  const date = format(zonedTime, "EEEE, d MMMM yyyy", { locale: undefined });

  return (
    <Card className="relative overflow-hidden border-primary/30 bg-gradient-senegal p-8 md:p-12 shadow-glow">
      <div className="relative z-10">
        <div className="mb-4 text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2 tracking-wide">
            HEURE DU SÉNÉGAL
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">{date}</p>
        </div>
        
        <div className="flex items-center justify-center gap-2 md:gap-4 mb-4">
          <TimeDigit value={hours} />
          <Separator />
          <TimeDigit value={minutes} />
          <Separator />
          <TimeDigit value={seconds} isSeconds />
        </div>

        <div className="text-center">
          <p className="text-muted-foreground text-sm md:text-base">
            Fuseau horaire: {TIMEZONE}
          </p>
        </div>
      </div>

      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
    </Card>
  );
};

const TimeDigit = ({ value, isSeconds = false }: { value: string; isSeconds?: boolean }) => {
  return (
    <div className={`flex flex-col items-center transition-smooth ${isSeconds ? 'opacity-70' : ''}`}>
      <div className="relative">
        <div className="text-6xl md:text-8xl lg:text-9xl font-bold tabular-nums bg-gradient-time bg-clip-text text-transparent animate-in fade-in duration-300">
          {value}
        </div>
        {!isSeconds && (
          <div className="absolute -bottom-1 left-0 right-0 h-1 bg-primary/20 rounded-full" />
        )}
      </div>
    </div>
  );
};

const Separator = () => {
  return (
    <div className="text-5xl md:text-7xl lg:text-8xl font-bold text-primary/50 animate-pulse">
      :
    </div>
  );
};
