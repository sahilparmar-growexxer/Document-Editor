export const metadata = {
  title: 'BlockNote',
  description: 'Minimal block editor app'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
