import "./globals.css";

export const metadata = {
  title: "Skill Forge - Innovators & Visionaries Club",
  description: "Quiz platform for the Innovators & Visionaries Club",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="antialiased h-full">
      <head>
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800;900&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-page-bg text-black">
        {children}
      </body>
    </html>
  );
}
