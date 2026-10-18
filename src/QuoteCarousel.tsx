import { useEffect, useState } from 'react';
import { inspirationQuotes } from './quotes';
import { contemporaryQuotes } from './contemporaryQuotes';

function shuffled<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function QuoteCarousel() {
  const [allQuotes] = useState(() => [...shuffled(contemporaryQuotes), ...inspirationQuotes]);
  const [index, setIndex] = useState(0);
  const quote = allQuotes[index];

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % allQuotes.length), 9000);
    return () => window.clearInterval(timer);
  }, []);

  function moveBy(amount: number) {
    setIndex((current) => (current + amount + allQuotes.length) % allQuotes.length);
  }

  return (
    <section className="quote-carousel" aria-label="Fitness and health inspiration">
      <div className="quote-content quote-transition" key={index} aria-live="polite">
        <span className="quote-mark" aria-hidden="true">“</span>
        <blockquote>{quote.text}</blockquote>
        <cite>— {quote.author}</cite>
      </div>
      <div className="quote-controls">
        <button type="button" onClick={() => moveBy(-1)} aria-label="Previous quote">←</button>
        <button type="button" onClick={() => moveBy(1)} aria-label="Next quote">→</button>
      </div>
    </section>
  );
}
