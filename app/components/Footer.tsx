export default function Footer() {
  return (
    <footer className="mt-auto py-6 px-4 sm:px-8 border-t border-[#2D3436]/10 bg-[#F9FAFC]">
      <div className="max-w-7xl mx-auto">
        <p className="text-sm text-[#2D3436]/60 font-inter text-center leading-relaxed">
          Dieses Projekt wurde von{' '}
          <span className="font-medium text-[#2D3436]/70">Philipp Brügger</span> aus Spass gemacht.
          Es ist "vibe coded" und hat keine Garantien. Deine Daten sind möglicherweise nicht sicher.
          Du nutzt es auf eigene Verantwortung. Bei Fragen, Ideen, Fehlern oder Sicherheitslücken:{' '}
          <a
            href="mailto:info@lbo.ch"
            className="text-[#5844AC] hover:text-[#5844AC]/80 underline transition-colors font-medium"
          >
            info@lbo.ch
          </a>
          . Den{' '}
          <a
            href="https://github.com/pbuw/vio"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#5844AC] hover:text-[#5844AC]/80 underline transition-colors font-medium"
          >
            Quellcode
          </a>{' '}
          findest du auf GitHub.
        </p>
      </div>
    </footer>
  );
}

