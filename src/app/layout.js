import './globals.css';

export const metadata = {
  title: 'Gitify — Master Git & GitHub Through Practice',
  description: 'An interactive, gamified terminal simulator that teaches you Git and GitHub from zero to expert. Practice real commands in a safe environment.',
  keywords: ['git', 'github', 'terminal', 'learn', 'interactive', 'tutorial'],
  openGraph: {
    title: 'Gitify — Master Git & GitHub Through Practice',
    description: 'Stop reading tutorials. Start typing commands.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="bg-orbs">
          <div className="bg-orb bg-orb-1"></div>
          <div className="bg-orb bg-orb-2"></div>
          <div className="bg-orb bg-orb-3"></div>
        </div>
        {children}
      </body>
    </html>
  );
}
