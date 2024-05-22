import "@/styles/globals.css";
import NavBar from "./components/navbar";

export default function App({ Component, pageProps }) {
  return (
    <div>
      <NavBar />
      <div>
        <Component {...pageProps} />
      </div>
    </div>
  );
}
