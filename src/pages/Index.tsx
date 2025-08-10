import AnagramGame from "@/components/game/AnagramGame";
import ScoreHistory from "@/components/game/ScoreHistory";

const Index = () => {
  return (
    <div className="min-h-screen relative">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[url('/lovable-uploads/f43a4e36-dca4-4749-9259-f4950c43237c.png')] bg-cover bg-center bg-fixed opacity-40" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-background/80 via-background/80 to-background" />
      <div className="min-h-screen">
        <AnagramGame />
        <ScoreHistory />
      </div>
    </div>
  );
};

export default Index;
