import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  // eslint-disable-next-line no-undef
  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData();

  return (
    <AppProvider embedded apiKey={apiKey}>
      <s-app-nav>
        <s-link href="/app">Home</s-link>
        <s-link href="/app/profiles">Profiles</s-link>
        <s-link href="/app/shapes">Shapes</s-link>
        <s-link href="/app/fill-types">Fill Types</s-link>
        <s-link href="/app/fabrics">Fabrics</s-link>
        <s-link href="/app/design">Design</s-link>
        <s-link href="/app/piping">Piping</s-link>
        <s-link href="/app/button-style">Button Style</s-link>
        <s-link href="/app/anti-skid">Anti-Skid Bottom</s-link>
        <s-link href="/app/rod-pocket">Bottom Rod Pocket</s-link>
        <s-link href="/app/ties">Ties</s-link>
        <s-link href="/app/fabric-ties">Fabric Ties</s-link>
        <s-link href="/app/settings">Settings</s-link>
      </s-app-nav>
      <Outlet />
    </AppProvider>
  );
}

// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
