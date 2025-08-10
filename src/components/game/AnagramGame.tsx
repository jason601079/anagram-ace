import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { WORDS } from "@/data/words";

const ROUND_TIME = 30; // seconds per round

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickWord(min = 3, max = 8, used: Set<string>) {
  const pool = WORDS.filter((w) => w.length >= min && w.length <= max && !used.has(w.toLowerCase()));
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)].toLowerCase();
}

export default function AnagramGame() {
  const { toast } = useToast();

  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [gameOver, setGameOver] = useState(false);

  const usedWords = useRef<Set<string>>(new Set());

  const [solution, setSolution] = useState<string>("");
  const [scrambled, setScrambled] = useState<string[]>([]);
  const [guess, setGuess] = useState<string[]>([]);
  const [usedIndices, setUsedIndices] = useState<Set<number>>(new Set());

  // Load a new round
  const loadNewRound = useCallback(() => {
    const word = pickWord(3, 8, usedWords.current);
    if (!word) {
      // if we run out of words
      setGameOver(true);
      return;
    }
    usedWords.current.add(word);
    setSolution(word);

    let letters = word.split("");
    // ensure the scramble isn't identical
    let shuffled = shuffle(letters);
    let attempts = 0;
    while (shuffled.join("") === word && attempts < 5) {
      shuffled = shuffle(letters);
      attempts++;
    }
    setScrambled(shuffled);
    setGuess([]);
    setUsedIndices(new Set());
    setTimeLeft(ROUND_TIME);
  }, []);

  // Timer
  useEffect(() => {
    if (gameOver) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          setGameOver(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [round, gameOver]);

  // Initial round
  useEffect(() => {
    loadNewRound();
  }, [loadNewRound]);

  const progressValue = useMemo(() => (timeLeft / ROUND_TIME) * 100, [timeLeft]);

  const onTileClick = (letter: string, index: number) => {
    if (gameOver) return;
    if (usedIndices.has(index)) return;
    const nextUsed = new Set(usedIndices);
    nextUsed.add(index);
    setUsedIndices(nextUsed);
    setGuess((g) => [...g, letter]);
  };

  const onGuessLetterClick = (i: number) => {
    if (gameOver) return;
    setGuess((g) => {
      const copy = [...g];
      const [removed] = copy.splice(i, 1);
      // return the first matching used index for this letter back to pool
      const idxs = scrambled
        .map((l, idx) => ({ l, idx }))
        .filter(({ l, idx }) => l === removed && usedIndices.has(idx));
      if (idxs.length) {
        const nextUsed = new Set(usedIndices);
        nextUsed.delete(idxs[0].idx);
        setUsedIndices(nextUsed);
      }
      return copy;
    });
  };

  const clearGuess = () => {
    setGuess([]);
    setUsedIndices(new Set());
  };

  const checkGuess = () => {
    if (guess.length !== solution.length) return;
    const attempt = guess.join("");
    if (attempt.toLowerCase() === solution.toLowerCase()) {
      const gained = solution.length * 50 + timeLeft * 5;
      setScore((s) => s + gained);
      toast({
        title: "Correct!",
        description: `+${gained} points`,
      });
      setRound((r) => r + 1);
      loadNewRound();
    } else {
      toast({
        title: "Not quite",
        description: "Try again!",
      });
    }
  };

  const restart = () => {
    usedWords.current = new Set();
    setScore(0);
    setRound(1);
    setGameOver(false);
    loadNewRound();
  };

  return (
    <main className="relative min-h-[calc(100vh-4rem)] py-8">
      {/* Ambient signature */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="ambient-blob" />
      </div>

      <section className="container mx-auto max-w-3xl px-4">
        <header className="mb-6 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Anagram Hunt</h1>
          <p className="mt-2 text-muted-foreground">Unscramble the word before the timer runs out. Faster solves earn more points.</p>
        </header>

        <Card className="backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Round {round}</CardTitle>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Score</div>
                <div className="text-2xl font-semibold">{score}</div>
              </div>
            </div>
            <CardDescription>Form the correct word from the scrambled letters.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-3">
              <Progress value={progressValue} />
              <div className="mt-1 text-right text-xs text-muted-foreground">{timeLeft}s</div>
            </div>

            {!gameOver ? (
              <div className="space-y-6">
                {/* Scrambled tiles */}
                <div className="flex flex-wrap justify-center gap-2">
                  {scrambled.map((ch, idx) => {
                    const used = usedIndices.has(idx);
                    return (
                      <Button
                        key={`${ch}-${idx}`}
                        variant={used ? "outline" : "secondary"}
                        size="lg"
                        className={`w-12 h-12 text-xl font-semibold rounded-lg transition-transform will-change-transform hover:scale-105 ${used ? "opacity-50" : ""}`}
                        onClick={() => onTileClick(ch, idx)}
                        aria-pressed={used}
                        aria-label={`Letter ${ch}`}
                      >
                        {ch.toUpperCase()}
                      </Button>
                    );
                  })}
                </div>

                {/* Guess row */}
                <div className="flex flex-wrap justify-center gap-2">
                  {Array.from({ length: solution.length }).map((_, i) => (
                    <Button
                      key={`g-${i}`}
                      variant={guess[i] ? "secondary" : "outline"}
                      size="lg"
                      className="w-12 h-12 text-xl font-semibold rounded-lg"
                      onClick={() => (guess[i] ? onGuessLetterClick(i) : undefined)}
                      aria-label={guess[i] ? `Remove ${guess[i]}` : "Empty"}
                    >
                      {guess[i] ? guess[i].toUpperCase() : ""}
                    </Button>
                  ))}
                </div>

                <div className="flex justify-center gap-3">
                  <Button onClick={checkGuess} disabled={guess.length !== solution.length}>
                    Submit
                  </Button>
                  <Button variant="outline" onClick={clearGuess}>
                    Clear
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <h2 className="text-2xl font-semibold">Time's up!</h2>
                <p className="mt-2 text-muted-foreground">Final score: {score}</p>
                <div className="mt-6">
                  <Button size="lg" onClick={restart}>Play again</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <aside className="mt-6 text-center text-sm text-muted-foreground">
          Tip: Click a placed letter to return it to the pool.
        </aside>
      </section>
    </main>
  );
}
