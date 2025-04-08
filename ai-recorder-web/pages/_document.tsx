import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Google Material Icons 사용 */}
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
      </Head>
      {/* 모바일 환경 사이즈로 프로젝트 구성할거기 때문에 document에서 모바일 환경 사이즈 설정 */}
      <body className="max-w-screen-sm mx-auto">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
