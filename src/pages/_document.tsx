import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <meta charSet="utf-8" />
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#000000" />
          <link rel="icon" href="/icons/icon-192x192.png" sizes="192x192" type="image/png" />
          <link rel="icon" href="/icons/icon-512x512.png" sizes="512x512" type="image/png" />
          <link rel="apple-touch-icon" href="/icons/icon-192x192.png" sizes="192x192" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;