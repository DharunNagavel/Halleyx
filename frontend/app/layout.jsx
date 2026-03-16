import "./globals.css";

export const metadata = {
  title: "Workflow Engine",
  description: "Enterprise-grade automation and workflow management system.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans selection:bg-blue-100 selection:text-blue-900">
        {children}
      </body>
    </html>
  );
}
