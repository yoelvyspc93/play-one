import Link from 'next/link';
import { Card } from '../components/Card';
import { CardKind, CardColor } from '../engine';
import { TEXTS } from '../engine/texts';


export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black overflow-hidden flex flex-col">
      <header className="p-6 flex justify-between items-center z-10">
          <div className="font-black text-2xl italic text-white tracking-widest">PLAY<span className="text-yellow-400">ONE</span></div>
          <a href="https://github.com/yoelvys/play-one" className="text-white/50 hover:text-white transition-colors">GitHub</a>
      </header>
      
      <main className="flex-1 flex flex-col md:flex-row items-center justify-center p-8 gap-12 relative">
          
          {/* Decorative Background Cards */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 transform -rotate-12"><Card card={{ id: '1', kind: CardKind.NUMBER, color: CardColor.RED, number: 1 }} className="scale-150" /></div>
                <div className="absolute bottom-1/4 right-1/4 transform rotate-12"><Card card={{ id: '2', kind: CardKind.NUMBER, color: CardColor.BLUE, number: 9 }} className="scale-150" /></div>
          </div>
          
          <div className="flex flex-col gap-6 relative z-10 max-w-lg text-center md:text-left">
               <h1 className="text-7xl font-black text-white italic leading-tight drop-shadow-2xl">
                   {TEXTS.home.titleIntro} <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-600">{TEXTS.home.titleHighlight}</span>
               </h1>
               <p className="text-gray-300 text-lg">
                   {TEXTS.home.description}
               </p>
               
               <div className="flex gap-4 justify-center md:justify-start">
                   <Link href="/lobby?mode=online" className="px-8 py-4 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xl rounded-2xl shadow-xl transform transition hover:-translate-y-1 hover:shadow-2xl">
                       {TEXTS.home.playOnline}
                   </Link>
                   <Link href="/lobby?mode=solo" className="px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xl rounded-2xl shadow-lg transform transition hover:scale-105">
                        {TEXTS.home.playSolo}
                   </Link>
                </div>
          </div>

          
          {/* Hero Image / Stack */}
          <div className="relative z-10 hidden md:block w-96 h-96">
               <div className="absolute top-0 left-0 transform -rotate-6 transition hover:rotate-0 z-10">
                   <Card card={{ id: 'h1', kind: CardKind.WILD_DRAW_FOUR, color: CardColor.WILD }} className="scale-[2] shadow-2xl" />
               </div>
               <div className="absolute top-10 left-20 transform rotate-12 transition hover:rotate-6">
                   <Card card={{ id: 'h2', kind: CardKind.DRAW_TWO, color: CardColor.GREEN }} className="scale-[2] shadow-2xl" />
               </div>
          </div>
          
      </main>
    </div>
  );
}
