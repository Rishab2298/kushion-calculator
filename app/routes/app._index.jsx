import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { Badge } from "../components/admin-ui";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  try {
    // Get counts for all configuration items
    const [shapesCount, fillTypesCount, fabricsCount, pipingCount, buttonStyleCount, antiSkidCount, tiesCount, priceTiersCount, profilesCount] = await Promise.all([
      prisma.shape?.count({ where: { shop, isActive: true } }) ?? 0,
      prisma.fillType?.count({ where: { shop, isActive: true } }) ?? 0,
      prisma.fabric?.count({ where: { shop, isActive: true } }) ?? 0,
      prisma.pipingOption?.count({ where: { shop, isActive: true } }) ?? 0,
      prisma.buttonStyleOption?.count({ where: { shop, isActive: true } }) ?? 0,
      prisma.antiSkidOption?.count({ where: { shop, isActive: true } }) ?? 0,
      prisma.tiesOption?.count({ where: { shop, isActive: true } }) ?? 0,
      prisma.priceTier?.count({ where: { shop } }) ?? 0,
      prisma.calculatorProfile?.count({ where: { shop, isActive: true } }) ?? 0,
    ]);

    return {
      shop,
      counts: {
        shapes: shapesCount || 0,
        fillTypes: fillTypesCount || 0,
        fabrics: fabricsCount || 0,
        piping: pipingCount || 0,
        buttonStyle: buttonStyleCount || 0,
        antiSkid: antiSkidCount || 0,
        ties: tiesCount || 0,
        priceTiers: priceTiersCount || 0,
        profiles: profilesCount || 0,
      },
    };
  } catch (error) {
    console.error("Error loading dashboard data:", error);
    return {
      shop,
      counts: {
        shapes: 0,
        fillTypes: 0,
        fabrics: 0,
        piping: 0,
        buttonStyle: 0,
        antiSkid: 0,
        ties: 0,
        priceTiers: 0,
        profiles: 0,
      },
    };
  }
};

export default function Index() {
  const { counts } = useLoaderData();

  const isConfigured = (count) => count > 0;

  // Required for the calculator to work; missing ones are flagged.
  const coreItems = [
    { key: "shapes", name: "Shapes", href: "/app/shapes", noun: "shapes", desc: "Cushion shapes with area and volume formulas" },
    { key: "fillTypes", name: "Fill types", href: "/app/fill-types", noun: "fill types", desc: "Fill options priced per cubic inch" },
    { key: "fabrics", name: "Fabrics", href: "/app/fabrics", noun: "fabrics", desc: "Fabric categories and swatches priced per square inch" },
  ];
  const pricingItems = [
    { key: "profiles", name: "Profiles", href: "/app/profiles", noun: "profiles", desc: "Choose which options each product shows" },
    { key: "priceTiers", name: "Price margins", href: "/app/margins", noun: "tiers", desc: "Margin adjustments by price range" },
  ];
  const addOnItems = [
    { key: "piping", name: "Piping", href: "/app/piping", noun: "options" },
    { key: "buttonStyle", name: "Button style", href: "/app/button-style", noun: "options" },
    { key: "antiSkid", name: "Anti-skid bottom", href: "/app/anti-skid", noun: "options" },
    { key: "ties", name: "Ties", href: "/app/ties", noun: "options" },
    { key: null, name: "Design", href: "/app/design" },
    { key: null, name: "Bottom rod pocket", href: "/app/rod-pocket" },
    { key: null, name: "Drawstring", href: "/app/drawstring" },
    { key: null, name: "Fabric ties", href: "/app/fabric-ties" },
  ];

  const coreDone = coreItems.filter((i) => isConfigured(counts[i.key])).length;
  const coreReady = coreDone === coreItems.length;

  const statusFor = (item, required) => {
    if (!item.key) return <span className="cc-muted">—</span>;
    if (isConfigured(counts[item.key])) return <Badge tone="success">Set up</Badge>;
    return required ? <Badge tone="critical">Not set up</Badge> : <Badge>None yet</Badge>;
  };

  const renderRows = (items, required) => (
    <div className="cc-table-wrap">
      <table className="cc-table" style={{ minWidth: 0 }}>
        <tbody>
          {items.map((item) => (
            <tr key={item.href}>
              <td>
                <div className="cc-name">{item.name}</div>
                {item.desc && <div className="cc-muted cc-small">{item.desc}</div>}
              </td>
              <td className="cc-num cc-muted" style={{ whiteSpace: "nowrap" }}>
                {item.key ? `${counts[item.key]} ${item.noun}` : ""}
              </td>
              <td style={{ width: 1, whiteSpace: "nowrap" }}>{statusFor(item, required)}</td>
              <td style={{ width: 1, whiteSpace: "nowrap", textAlign: "right" }}>
                <s-link href={item.href}>Manage</s-link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const steps = [
    {
      title: "Create shapes",
      body: "Define cushion shapes (rectangle, circle, etc.) with formulas for surface area and volume. Each shape can have its own input fields (length, width, radius, etc.).",
      href: "/app/shapes",
    },
    {
      title: "Add fill types",
      body: "Create fill options (polyfill, memory foam, etc.) priced per cubic inch. Customers pick their preferred fill.",
      href: "/app/fill-types",
    },
    {
      title: "Configure fabrics",
      body: "Add fabric categories and individual fabrics priced per square inch. Upload swatch images for visual selection.",
      href: "/app/fabrics",
    },
    {
      title: "Add optional features",
      body: "Set up piping and button/tufting styles with fixed prices. These are optional add-ons customers can select.",
      href: "/app/piping",
    },
  ];

  return (
    <s-page heading="Cushion Calculator" inlineSize="large">
      <s-button slot="primary-action" variant="primary" href="/app/shapes">
        Get started
      </s-button>

      <div className="cc-page">
        <div className="cc-card">
          <div className="cc-card__body" style={{ paddingTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <strong style={{ fontSize: 16 }}>Welcome</strong>
              {coreReady ? <Badge tone="success">Ready to use</Badge> : <Badge tone="warning">Setup incomplete</Badge>}
              <span className="cc-spacer" />
              <span className="cc-muted cc-small cc-num">{coreDone} of {coreItems.length} required steps done</span>
            </div>
            <p className="cc-p cc-muted">
              Create a fully customizable cushion price calculator for your store. Customers select shapes,
              dimensions, fabrics, fill types and more to get instant pricing.
            </p>
            <div
              aria-hidden="true"
              style={{ height: 6, borderRadius: 999, background: "var(--cc-surface-3)", overflow: "hidden" }}
            >
              <div
                style={{
                  width: `${(coreDone / coreItems.length) * 100}%`,
                  height: "100%",
                  background: "var(--cc-on)",
                  borderRadius: 999,
                }}
              />
            </div>
          </div>
        </div>

        <div className="cc-layout">
          <div className="cc-main">
            <div className="cc-card">
              <div className="cc-card__head">
                <h2>Required setup</h2>
                <span className="cc-card__meta">Needed for the calculator to price cushions</span>
              </div>
              <div className="cc-card__flush">{renderRows(coreItems, true)}</div>
            </div>

            <div className="cc-card">
              <div className="cc-card__head"><h2>Profiles and pricing</h2></div>
              <div className="cc-card__flush">{renderRows(pricingItems, false)}</div>
            </div>

            <div className="cc-card">
              <div className="cc-card__head">
                <h2>Optional add-ons</h2>
                <span className="cc-card__meta">Extras customers can choose</span>
              </div>
              <div className="cc-card__flush">{renderRows(addOnItems, false)}</div>
            </div>

            <div className="cc-card">
              <div className="cc-card__head"><h2>Quick setup guide</h2></div>
              <div className="cc-card__body">
                <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 14 }}>
                  {steps.map((step, i) => (
                    <li key={step.title} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <span
                        aria-hidden="true"
                        className="cc-num"
                        style={{
                          flex: "none", width: 24, height: 24, borderRadius: 999, display: "grid", placeItems: "center",
                          background: "var(--cc-surface-3)", fontWeight: 650, fontSize: 12,
                        }}
                      >
                        {i + 1}
                      </span>
                      <div style={{ display: "grid", gap: 2 }}>
                        <span>
                          <strong>{step.title}</strong>{" "}
                          <s-link href={step.href}>Open</s-link>
                        </span>
                        <span className="cc-muted">{step.body}</span>
                      </div>
                    </li>
                  ))}
                  <li style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <span
                      aria-hidden="true"
                      className="cc-num"
                      style={{
                        flex: "none", width: 24, height: 24, borderRadius: 999, display: "grid", placeItems: "center",
                        background: "var(--cc-surface-3)", fontWeight: 650, fontSize: 12,
                      }}
                    >
                      {steps.length + 1}
                    </span>
                    <div style={{ display: "grid", gap: 2 }}>
                      <strong>Add to your theme</strong>
                      <span className="cc-muted">
                        Go to <strong>Online Store → Themes → Customize</strong>. On a product page, click{" "}
                        <strong>Add block</strong> and select <strong>Cushion Calculator</strong>.
                      </span>
                    </div>
                  </li>
                </ol>
              </div>
            </div>
          </div>

          <div className="cc-side">
            <div className="cc-card">
              <div className="cc-card__head"><h2>Shortcuts</h2></div>
              <div className="cc-card__body" style={{ gap: 8 }}>
                <s-link href="/app/settings">Settings</s-link>
                <s-link href="/app/profiles">Profiles</s-link>
                <s-link href="/app/margins">Price margins</s-link>
                <s-link href="/app/documentation">Documentation</s-link>
              </div>
            </div>

            <div className="cc-card">
              <div className="cc-card__head"><h2>Pricing formula</h2></div>
              <div className="cc-card__body">
                <div className="cc-calc" style={{ gap: 6 }}>
                  <div style={{ display: "grid" }}><strong>Fabric cost</strong><span className="cc-muted">= surface area × $/sq inch</span></div>
                  <div style={{ display: "grid" }}><strong>Fill cost</strong><span className="cc-muted">= volume × $/cubic inch</span></div>
                  <div style={{ display: "grid" }}><strong>Add-ons</strong><span className="cc-muted">+ piping + button options</span></div>
                  <div className="cc-calc__total" style={{ display: "grid" }}><strong>Final price</strong><span className="cc-muted" style={{ fontWeight: 400 }}>= subtotal × tier adjustment</span></div>
                </div>
              </div>
            </div>

            <div className="cc-card">
              <div className="cc-card__head"><h2>Calculator features</h2></div>
              <div className="cc-card__body">
                <ul className="cc-small" style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 4 }}>
                  <li>7-step accordion interface</li>
                  <li>Custom shape builder with formulas</li>
                  <li>Dynamic dimension inputs</li>
                  <li>Fabric categories with swatches</li>
                  <li>Multiple fill type options</li>
                  <li>Piping and button add-ons</li>
                  <li>Live price calculations</li>
                  <li>Price tier adjustments</li>
                  <li>Add to cart with line item properties</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </s-page>
  );
}


export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
