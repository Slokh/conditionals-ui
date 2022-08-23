import { ChakraProvider } from "@chakra-ui/react";
import { AppProps } from "next/app";
import Head from "next/head";
import "@fontsource/aboreto";
import "@rainbow-me/rainbowkit/styles.css";

import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { chain, configureChains, createClient, WagmiConfig } from "wagmi";
import { publicProvider } from "wagmi/providers/public";
import theme from "../theme";
import { SeaportProvider } from "../context/seaport";

const { chains, provider } = configureChains(
  [chain.rinkeby],
  [publicProvider()]
);
const { connectors } = getDefaultWallets({
  appName: "Conditionals",
  chains,
});
const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
});

const App = ({ Component, pageProps }: AppProps) => {
  return (
    <ChakraProvider theme={theme}>
      <Head>
        <title>Conditionals</title>
      </Head>
      <WagmiConfig client={wagmiClient}>
        <RainbowKitProvider chains={chains}>
          <SeaportProvider>
            <Component {...pageProps} />
          </SeaportProvider>
        </RainbowKitProvider>
      </WagmiConfig>
    </ChakraProvider>
  );
};

export default App;
