import { text } from '../../content/texts';

export function HomeHeader() {
  return (
    <header className="p-6 flex justify-between items-center z-10">
      <div className="font-black text-2xl italic text-white tracking-widest">
        {text.app.name.slice(0, 4)}
        <span className="text-yellow-400">{text.app.name.slice(4)}</span>
      </div>
      <a
        href="https://github.com/yoelvys/play-one"
        className="text-white/50 hover:text-white transition-colors"
      >
        {text.home.github}
      </a>
    </header>
  );
}
