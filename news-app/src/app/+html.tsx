import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
        <style>{`
          html, body, #root {
            margin: 0;
            padding: 0;
            background-color: #c62828;
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
