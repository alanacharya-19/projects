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
            width: 100%;
            height: 100%;
          }
          body {
            background-color: #c62828;
          }
          @media (prefers-color-scheme: dark) {
            body {
              background-color: #b71c1c;
            }
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
