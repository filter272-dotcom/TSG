import React, { useCallback, useEffect, useRef, useState } from 'react';
import './index.css';

type GameStatus = 'ready' | 'playing' | 'gameover';
type Obstacle = { id: number; lane: number; y: number };
const LANES = [22, 50, 78];

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>('ready');
  const [lane, setLane] = useState(1);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem('neon-run-best') || 0));
  const [charge, setCharge] = useState(100);
  const game = useRef({ lane: 1, score: 0, nextId: 0, lastSpawn: 0, lastTime: 0 });
  const touchStart = useRef<number | null>(null);

  const move = useCallback((direction: -1 | 1) => {
    if (status !== 'playing') return;
    setLane(current => {
      const next = Math.max(0, Math.min(2, current + direction));
      game.current.lane = next;
      return next;
    });
  }, [status]);

  const startGame = useCallback(() => {
    game.current = { lane: 1, score: 0, nextId: 0, lastSpawn: 0, lastTime: 0 };
    setLane(1); setScore(0); setCharge(100); setObstacles([]); setStatus('playing');
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' || event.key === 'a') move(-1);
      if (event.key === 'ArrowRight' || event.key === 'd') move(1);
      if ((event.key === ' ' || event.key === 'Enter') && status !== 'playing') startGame();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [move, startGame, status]);

  useEffect(() => {
    if (status !== 'playing') return;
    let frame = 0;
    const tick = (now: number) => {
      const state = game.current;
      if (!state.lastTime) state.lastTime = now;
      const elapsed = Math.min(now - state.lastTime, 45);
      state.lastTime = now;
      const speed = 0.028 + Math.min(state.score / 80000, 0.014);
      if (now - state.lastSpawn > Math.max(520, 1050 - state.score / 55)) {
        state.lastSpawn = now;
        setObstacles(items => [...items, { id: ++state.nextId, lane: Math.floor(Math.random() * 3), y: -12 }]);
      }
      let hit = false;
      setObstacles(items => items.map(item => ({ ...item, y: item.y + elapsed * speed })).filter(item => {
        if (item.lane === state.lane && item.y > 76 && item.y < 91) hit = true;
        return item.y < 112;
      }));
      if (hit) {
        setStatus('gameover');
        setBest(current => { const next = Math.max(current, state.score); localStorage.setItem('neon-run-best', String(next)); return next; });
        return;
      }
      state.score += Math.round(elapsed * 0.12);
      setScore(state.score); setCharge(Math.max(12, 100 - (state.score % 880) / 11));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [status]);

  return <main className="game-shell"><section className="game-card" aria-label="Neon Rush arcade game">
    <header className="topbar"><div className="brand"><span className="brand-mark">N</span><span>NEON RUSH</span></div><button className="sound-button" aria-label="Sound enabled">◖<i /></button></header>
    <section className="hud"><div><span>SCORE</span><strong>{String(score).padStart(5, '0')}</strong></div><div className="energy"><span>CHARGE</span><em><i style={{ width: `${charge}%` }} /></em></div><div className="best"><span>BEST</span><strong>{String(best).padStart(5, '0')}</strong></div></section>
    <div className="game-world" onTouchStart={event => { touchStart.current = event.touches[0]?.clientX ?? null; }} onTouchEnd={event => {
      const start = touchStart.current;
      const end = event.changedTouches[0]?.clientX;
      if (start !== null && end !== undefined && Math.abs(end - start) > 24) move(end > start ? 1 : -1);
      touchStart.current = null;
    }}><div className="city"><i /><i /><i /><i /><i /><i /><i /></div><div className="horizon" /><div className="road" />
      {obstacles.map(item => <div className="enemy" key={item.id} style={{ left: `${LANES[item.lane]}%`, top: `${item.y}%` }}><i /><b /></div>)}
      <div className="player" style={{ left: `${LANES[lane]}%` }}><i /><b /><em /></div>
      {status !== 'playing' && <div className="start-overlay">{status === 'gameover' && <small>SYSTEM CRASH</small>}<h1>{status === 'ready' ? 'READY TO RUSH?' : 'RUN ENDED'}</h1><p>{status === 'ready' ? 'Dodge the blockers. Chase the neon.' : `Your score: ${String(score).padStart(5, '0')}`}</p><button onClick={startGame}>{status === 'ready' ? 'START GAME' : 'PLAY AGAIN'} <b>›</b></button></div>}
    </div>
    <footer className="controls"><button onClick={() => move(-1)} aria-label="Move left">←</button><p>SWIPE TO MOVE<br /><span>AVOID THE BLOCKERS</span></p><button onClick={() => move(1)} aria-label="Move right">→</button></footer>
  </section></main>;
};
export default App;
