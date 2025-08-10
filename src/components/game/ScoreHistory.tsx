import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const HISTORY_KEY = "anagram_history_v1";

type HistoryItem = {
  id: string;
  timestamp: number;
  score: number;
  rounds: number;
  lastWord: string;
};

export default function ScoreHistory() {
  const [items, setItems] = useState<HistoryItem[]>([]);

  const load = () => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (!raw) return setItems([]);
      const parsed = JSON.parse(raw) as HistoryItem[];
      setItems(parsed);
    } catch {
      setItems([]);
    }
  };

  useEffect(() => {
    load();
    const onStorage = (e: StorageEvent) => {
      if (e.key === HISTORY_KEY) load();
    };
    const onInternal = () => load();
    window.addEventListener("storage", onStorage);
    window.addEventListener("anagram-history-updated", onInternal as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("anagram-history-updated", onInternal as EventListener);
    };
  }, []);

  const clear = () => {
    localStorage.removeItem(HISTORY_KEY);
    setItems([]);
  };

  if (items.length === 0) return null;

  return (
    <section className="container mx-auto max-w-3xl px-4 mt-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Score History</CardTitle>
          <Button variant="outline" size="sm" onClick={clear} aria-label="Clear history">
            Clear
          </Button>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {items.slice(0, 10).map((it) => (
              <li key={it.id} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{new Date(it.timestamp).toLocaleString()}</span>
                <span>
                  Score: <strong>{it.score}</strong> · Rounds: {it.rounds} · Last: {it.lastWord}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}
