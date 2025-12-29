import Link from 'next/link';
import { text } from '../../content/texts';

export function HomeHeroContent() {
  return (
    <div className="flex flex-col gap-6 relative z-10 max-w-lg text-center md:text-left">
      <h1 className="text-7xl font-black text-white italic leading-tight drop-shadow-2xl">
        {text.home.titleIntro}{' '}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-600">
          {text.home.titleHighlight}
        </span>
      </h1>
      <p className="text-gray-300 text-lg">{text.home.description}</p>

      <div className="flex gap-4 justify-center md:justify-start flex-wrap">
        <Link
          href="/lobby"
          className="px-8 py-4 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xl rounded-2xl shadow-xl transform transition hover:-translate-y-1 hover:shadow-2xl"
        >
          {text.home.playOnline}
        </Link>
        <Link
          href="/lobby?action=solo"
          className="px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xl rounded-2xl shadow-lg transform transition hover:scale-105"
        >
          {text.home.playSolo}
        </Link>
        <Link
          href="/debug"
          className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold text-xl rounded-2xl border border-white/20 backdrop-blur-md"
        >
          {text.home.debugSolo}
        </Link>
      </div>
    </div>
  );
}
