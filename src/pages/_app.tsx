import type { AppProps } from 'next/app';
import '../styles/globals.css';
import '../ScenarioPage.css';
import '../HomePage.css';
import '../Simulation.css';

export default function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}