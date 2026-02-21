import { useState } from "react";

export default function Documentation() {
  const [activeSection, setActiveSection] = useState("getting-started");

  const sections = [
    { id: "getting-started", label: "Getting Started" },
    { id: "profiles", label: "Profiles" },
    { id: "shapes", label: "Shapes" },
    { id: "fill-types", label: "Fill Types" },
    { id: "fabrics", label: "Fabrics" },
    { id: "additional-options", label: "Additional Options" },
    { id: "pricing", label: "Pricing Calculation" },
    { id: "product-linking", label: "Product Linking" },
    { id: "settings", label: "Settings" },
  ];

  const sidebarStyle = {
    width: 220,
    borderRight: "1px solid #e1e3e5",
    padding: "16px 0",
    position: "sticky",
    top: 0,
    height: "fit-content",
  };

  const navItemStyle = (isActive) => ({
    display: "block",
    padding: "10px 20px",
    cursor: "pointer",
    backgroundColor: isActive ? "#f6f6f7" : "transparent",
    borderLeft: isActive ? "3px solid #008060" : "3px solid transparent",
    color: isActive ? "#008060" : "#202223",
    fontWeight: isActive ? 600 : 400,
    fontSize: "0.9rem",
    textDecoration: "none",
  });

  const contentStyle = {
    flex: 1,
    padding: "24px 32px",
    maxWidth: 800,
  };

  const headingStyle = {
    fontSize: "1.5rem",
    fontWeight: 600,
    marginBottom: 16,
    color: "#202223",
  };

  const subheadingStyle = {
    fontSize: "1.1rem",
    fontWeight: 600,
    marginTop: 24,
    marginBottom: 12,
    color: "#202223",
  };

  const paragraphStyle = {
    fontSize: "0.95rem",
    lineHeight: 1.7,
    color: "#6d7175",
    marginBottom: 16,
  };

  const listStyle = {
    paddingLeft: 24,
    marginBottom: 16,
  };

  const listItemStyle = {
    fontSize: "0.95rem",
    lineHeight: 1.8,
    color: "#6d7175",
    marginBottom: 8,
  };

  const tipBoxStyle = {
    backgroundColor: "#e3f1df",
    border: "1px solid #95c9a1",
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  };

  const warningBoxStyle = {
    backgroundColor: "#fff3e0",
    border: "1px solid #ffb74d",
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  };

  const codeStyle = {
    backgroundColor: "#f6f6f7",
    padding: "2px 6px",
    borderRadius: 4,
    fontFamily: "monospace",
    fontSize: "0.85rem",
  };

  const stepBoxStyle = {
    backgroundColor: "#f6f6f7",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  };

  return (
    <s-page heading="Documentation" fullWidth>
      <div style={{ display: "flex", minHeight: "calc(100vh - 120px)" }}>
        {/* Sidebar Navigation */}
        <nav style={sidebarStyle}>
          {sections.map((section) => (
            <div
              key={section.id}
              style={navItemStyle(activeSection === section.id)}
              onClick={() => setActiveSection(section.id)}
            >
              {section.label}
            </div>
          ))}
        </nav>

        {/* Content Area */}
        <div style={contentStyle}>
          {/* Getting Started */}
          {activeSection === "getting-started" && (
            <div>
              <h1 style={headingStyle}>Getting Started</h1>
              <p style={paragraphStyle}>
                Welcome to the Cushion Calculator app! This powerful tool allows your customers to configure custom cushions, pillows, mattresses, and similar products with real-time pricing based on their exact specifications.
              </p>

              <h2 style={subheadingStyle}>Understanding the App Structure</h2>
              <p style={paragraphStyle}>
                The Cushion Calculator is built around a hierarchical system where <strong>Profiles</strong> serve as the central configuration point. Think of it as a layered architecture:
              </p>

              <div style={{ ...stepBoxStyle, backgroundColor: "#e8f4fd", border: "1px solid #b3d4fc" }}>
                <div style={{ textAlign: "center", padding: "12px 0" }}>
                  <div style={{ fontSize: "1rem", fontWeight: 600, color: "#0066cc", marginBottom: 8 }}>App Architecture</div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <div style={{ backgroundColor: "#008060", color: "white", padding: "10px 24px", borderRadius: 6, fontWeight: 600 }}>PROFILE</div>
                    <div style={{ color: "#6d7175", fontSize: "0.8rem" }}>controls &amp; combines</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                      <div style={{ backgroundColor: "#f6f6f7", padding: "8px 12px", borderRadius: 4, fontSize: "0.85rem" }}>Shapes</div>
                      <div style={{ backgroundColor: "#f6f6f7", padding: "8px 12px", borderRadius: 4, fontSize: "0.85rem" }}>Fill Types</div>
                      <div style={{ backgroundColor: "#f6f6f7", padding: "8px 12px", borderRadius: 4, fontSize: "0.85rem" }}>Fabrics</div>
                      <div style={{ backgroundColor: "#f6f6f7", padding: "8px 12px", borderRadius: 4, fontSize: "0.85rem" }}>Add-ons</div>
                    </div>
                    <div style={{ color: "#6d7175", fontSize: "0.8rem" }}>linked to</div>
                    <div style={{ backgroundColor: "#5c6ac4", color: "white", padding: "8px 20px", borderRadius: 6, fontSize: "0.9rem" }}>Shopify Product</div>
                  </div>
                </div>
              </div>

              <h2 style={subheadingStyle}>What is a Profile?</h2>
              <p style={paragraphStyle}>
                A <strong>Profile</strong> is the master configuration for a specific type of product. It determines:
              </p>
              <ul style={listStyle}>
                <li style={listItemStyle}><strong>Which sections are visible</strong> — Show or hide shape selection, fabric picker, fill options, add-ons, etc.</li>
                <li style={listItemStyle}><strong>Which options are available</strong> — Restrict to specific shapes, fabrics, or fills for this product type</li>
                <li style={listItemStyle}><strong>Hidden defaults</strong> — Pre-select options without showing them to customers (e.g., always use a specific fill)</li>
                <li style={listItemStyle}><strong>Pricing adjustments</strong> — Apply additional percentage markup for this product category</li>
                <li style={listItemStyle}><strong>Multi-piece support</strong> — Enable for products with multiple cushion pieces (like sofas)</li>
              </ul>

              <div style={tipBoxStyle}>
                <strong style={{ color: "#108043" }}>Example Use Cases:</strong>
                <ul style={{ ...listStyle, marginTop: 8, marginBottom: 0 }}>
                  <li style={listItemStyle}><strong>"Outdoor Seat Cushions"</strong> — Shows weatherproof fabrics only, includes ties option</li>
                  <li style={listItemStyle}><strong>"Bench Pads"</strong> — Rectangle shape only, no piping, specific fill types</li>
                  <li style={listItemStyle}><strong>"Sofa Cushion Set"</strong> — Multi-piece mode with seat + back pieces</li>
                  <li style={listItemStyle}><strong>"Custom Curtains"</strong> — 2D shapes with panel count, no fill section</li>
                </ul>
              </div>

              <h2 style={subheadingStyle}>The Building Blocks</h2>
              <p style={paragraphStyle}>
                Before creating profiles, you need to set up the individual components that profiles will use:
              </p>

              <div style={stepBoxStyle}>
                <strong>1. Shapes</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Define the geometric forms customers can choose (Rectangle, Circle, L-Shape, etc.). Each shape has custom input fields (length, width, radius) and mathematical formulas that calculate surface area (for fabric cost) and volume (for fill cost).
                </p>
              </div>

              <div style={stepBoxStyle}>
                <strong>2. Fill Types</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  The stuffing materials inside cushions — Foam, Polyester, Memory Foam, Feather, etc. Each fill type has a price per cubic inch. The calculator multiplies this by the cushion's volume to get fill cost.
                </p>
              </div>

              <div style={stepBoxStyle}>
                <strong>3. Fabrics</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  The covering materials — organized into categories (Outdoor, Indoor, Premium) with attributes like brand, pattern, and color. Each fabric has a price per square inch. The calculator multiplies this by the cushion's surface area to get fabric cost.
                </p>
              </div>

              <div style={stepBoxStyle}>
                <strong>4. Add-on Options</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Extra customizations with fixed prices — Piping styles, Button/Tufting patterns, Ties, Anti-skid backing, Drawstrings, Rod pockets, and Design options. These add flat fees to the total regardless of cushion size.
                </p>
              </div>

              <h2 style={subheadingStyle}>How Pricing Works</h2>
              <p style={paragraphStyle}>
                The calculator computes prices dynamically based on customer inputs:
              </p>
              <div style={{ ...stepBoxStyle, backgroundColor: "#fff8e1", border: "1px solid #ffe082" }}>
                <code style={{ fontSize: "0.9rem", color: "#5d4037" }}>
                  Final Price = (Fabric Cost + Fill Cost + Add-ons) × (1 + Additional %) − Discounts
                </code>
                <div style={{ marginTop: 12, fontSize: "0.85rem", color: "#6d7175" }}>
                  <div>• <strong>Fabric Cost</strong> = Surface Area × Price per sq inch</div>
                  <div>• <strong>Fill Cost</strong> = Volume × Price per cubic inch</div>
                  <div>• <strong>Add-ons</strong> = Sum of selected option prices</div>
                  <div>• <strong>Additional %</strong> = Profile markup percentage</div>
                </div>
              </div>

              <h2 style={subheadingStyle}>Setup Workflow</h2>
              <p style={paragraphStyle}>
                Follow this order to set up your calculator:
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "#008060", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: "0.85rem" }}>1</div>
                  <div><strong>Shapes</strong> — Create at least one shape with formulas</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "#008060", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: "0.85rem" }}>2</div>
                  <div><strong>Fill Types</strong> — Add fill materials with pricing</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "#008060", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: "0.85rem" }}>3</div>
                  <div><strong>Fabrics</strong> — Set up fabric categories and individual fabrics</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "#6d7175", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: "0.85rem" }}>4</div>
                  <div><strong>Add-ons</strong> <span style={{ color: "#6d7175" }}>(optional)</span> — Configure piping, ties, buttons, etc.</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "#008060", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: "0.85rem" }}>5</div>
                  <div><strong>Profiles</strong> — Create profiles that combine the above components</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "#008060", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: "0.85rem" }}>6</div>
                  <div><strong>Link to Products</strong> — Connect profiles to Shopify products</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "#5c6ac4", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: "0.85rem" }}>7</div>
                  <div><strong>Enable App Embed</strong> — Turn on the calculator in your theme</div>
                </div>
              </div>

              <div style={{ ...warningBoxStyle, marginTop: 20 }}>
                <strong style={{ color: "#e65100" }}>Important:</strong>
                <p style={{ margin: "8px 0 0", color: "#e65100" }}>
                  Components (shapes, fills, fabrics) must be created <strong>before</strong> you can use them in profiles. A profile with no available shapes or fabrics won't display anything to customers.
                </p>
              </div>

              <h2 style={subheadingStyle}>Customer Experience</h2>
              <p style={paragraphStyle}>
                When a customer visits a product page with a linked profile, they see an interactive calculator that guides them through:
              </p>
              <ol style={listStyle}>
                <li style={listItemStyle}>Selecting a shape (if multiple are available)</li>
                <li style={listItemStyle}>Entering dimensions (length, width, thickness, etc.)</li>
                <li style={listItemStyle}>Choosing fabric from visual swatches</li>
                <li style={listItemStyle}>Selecting fill type</li>
                <li style={listItemStyle}>Adding optional extras (piping, ties, etc.)</li>
                <li style={listItemStyle}>Viewing real-time price updates</li>
                <li style={listItemStyle}>Adding the customized item to cart</li>
              </ol>
              <p style={paragraphStyle}>
                All selections are saved as line item properties in the cart, so you'll see the complete specifications when processing orders.
              </p>
            </div>
          )}

          {/* Profiles */}
          {activeSection === "profiles" && (
            <div>
              <h1 style={headingStyle}>Profiles</h1>

              <h2 style={subheadingStyle}>What is a Profile?</h2>
              <p style={paragraphStyle}>
                A <strong>Profile</strong> is the central configuration point for a specific type of product in your store. Think of it as a "template" that defines how the cushion calculator behaves for a particular product category.
              </p>

              <div style={{ ...stepBoxStyle, backgroundColor: "#e8f4fd", border: "1px solid #b3d4fc" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ fontWeight: 600, color: "#0066cc" }}>A Profile Controls:</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#008060", fontWeight: 600 }}>1.</span> Which calculator sections are visible
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#008060", fontWeight: 600 }}>2.</span> Which options appear in each section
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#008060", fontWeight: 600 }}>3.</span> Pre-selected default values
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#008060", fontWeight: 600 }}>4.</span> Pricing adjustments (markup %)
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#008060", fontWeight: 600 }}>5.</span> Multi-piece configurations
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#008060", fontWeight: 600 }}>6.</span> Weatherproof calculations
                    </div>
                  </div>
                </div>
              </div>

              <p style={paragraphStyle}>
                Each Shopify product can be linked to a profile using the <code style={codeStyle}>cushion_calculator.profile_id</code> metafield. One profile can be used for multiple products, making it easy to manage similar product types consistently.
              </p>

              <div style={tipBoxStyle}>
                <strong style={{ color: "#108043" }}>Example:</strong>
                <p style={{ margin: "8px 0 0", color: "#108043" }}>
                  Create an "Outdoor Cushions" profile that only shows weatherproof fabrics, includes ties option, and adds a 10% outdoor premium. Then assign this profile to all your outdoor cushion products.
                </p>
              </div>

              {/* Basic Information */}
              <h2 style={subheadingStyle}>Basic Information</h2>

              <div style={stepBoxStyle}>
                <strong>Profile Name</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  A descriptive name to identify this profile (e.g., "Standard Indoor Cushions", "Premium Outdoor Set", "Simple Bench Pad"). This name appears in the admin area and helps you organize different product configurations.
                </p>
              </div>

              <div style={stepBoxStyle}>
                <strong>Description</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Optional internal notes about this profile. Use this to document what products use this profile or any special configuration details. Customers do not see this description.
                </p>
              </div>

              {/* Additional Percentage */}
              <h2 style={subheadingStyle}>Additional Percentage (%)</h2>
              <p style={paragraphStyle}>
                This is a <strong>markup percentage</strong> that gets added to the calculated subtotal for all products using this profile. The markup is applied after all base costs (fabric, fill, add-ons) are calculated.
              </p>

              <div style={{ ...stepBoxStyle, backgroundColor: "#fff8e1", border: "1px solid #ffe082" }}>
                <strong style={{ color: "#5d4037" }}>How It Works:</strong>
                <div style={{ marginTop: 12, fontSize: "0.9rem" }}>
                  <code style={{ ...codeStyle, display: "block", padding: "12px", marginBottom: 12 }}>
                    Final Price = Subtotal × (1 + Additional % / 100)
                  </code>
                  <div style={{ color: "#6d7175" }}>
                    <strong>Example:</strong> If the subtotal is $100 and Additional Percentage is set to 15%:
                    <br />$100 × 1.15 = <strong>$115</strong> final price
                  </div>
                </div>
              </div>

              <p style={paragraphStyle}>
                <strong>Common Use Cases:</strong>
              </p>
              <ul style={listStyle}>
                <li style={listItemStyle}><strong>Premium Product Lines:</strong> Add 20% markup for luxury/premium product categories</li>
                <li style={listItemStyle}><strong>Seasonal Pricing:</strong> Temporarily increase margins during high-demand seasons</li>
                <li style={listItemStyle}><strong>Category-Specific Margins:</strong> Different product types may have different profit margin requirements</li>
                <li style={listItemStyle}><strong>Complexity Premium:</strong> Add extra for products requiring more labor (e.g., custom shapes)</li>
              </ul>

              {/* Multi-Piece Mode */}
              <h2 style={subheadingStyle}>Multi-Piece Mode</h2>
              <p style={paragraphStyle}>
                Multi-piece mode allows customers to configure <strong>multiple cushion pieces in a single order</strong>. This is essential for products that consist of multiple related cushions, like sofa sets or sectional furniture.
              </p>

              <div style={{ ...stepBoxStyle, backgroundColor: "#e8f4fd", border: "1px solid #b3d4fc" }}>
                <strong style={{ color: "#0066cc" }}>When to Use Multi-Piece Mode:</strong>
                <ul style={{ ...listStyle, marginTop: 8, marginBottom: 0 }}>
                  <li style={listItemStyle}>Sofa cushion sets (seat cushion + back cushion)</li>
                  <li style={listItemStyle}>Sectional furniture (multiple seats, corner pieces)</li>
                  <li style={listItemStyle}>Lounge chairs with separate head rest and body cushions</li>
                  <li style={listItemStyle}>Bench seating with multiple pad sections</li>
                  <li style={listItemStyle}>Patio furniture sets (chair + ottoman)</li>
                </ul>
              </div>

              <h3 style={{ ...subheadingStyle, fontSize: "1rem" }}>Enabling Multi-Piece Mode</h3>
              <ol style={listStyle}>
                <li style={listItemStyle}>Check the <strong>"Enable Multi-Piece Mode"</strong> checkbox</li>
                <li style={listItemStyle}>Set the <strong>Pieces Label</strong> (e.g., "Cushion Components", "Set Pieces")</li>
                <li style={listItemStyle}>Add individual pieces using the <strong>"+ Add Piece"</strong> button</li>
                <li style={listItemStyle}>Configure each piece with its own settings</li>
              </ol>

              <h3 style={{ ...subheadingStyle, fontSize: "1rem" }}>Per-Piece Configuration</h3>
              <p style={paragraphStyle}>
                Each piece (up to 5 maximum) can have its own independent configuration:
              </p>
              <ul style={listStyle}>
                <li style={listItemStyle}><strong>Piece Name:</strong> Internal identifier (e.g., "Seat Base", "Backrest", "Armrest")</li>
                <li style={listItemStyle}><strong>Display Label:</strong> Optional custom label shown to customers (overrides piece name)</li>
                <li style={listItemStyle}><strong>Section Visibility:</strong> Toggle which sections appear for this specific piece</li>
                <li style={listItemStyle}><strong>Allowed Options:</strong> Restrict which shapes, fills, or add-ons are available for this piece</li>
                <li style={listItemStyle}><strong>Default Values:</strong> Pre-select default shape and fill for this piece</li>
                <li style={listItemStyle}><strong>Hidden Values:</strong> Use specific options without showing them (for hidden sections)</li>
              </ul>

              <div style={tipBoxStyle}>
                <strong style={{ color: "#108043" }}>Example - 3-Piece Sofa Set:</strong>
                <div style={{ marginTop: 8, fontSize: "0.9rem", color: "#108043" }}>
                  <div><strong>Piece 1 - "Seat Cushion":</strong> Rectangle shape, shows fill, fabric, and ties options</div>
                  <div><strong>Piece 2 - "Back Cushion":</strong> Rectangle shape, shows fill and fabric, no ties needed</div>
                  <div><strong>Piece 3 - "Throw Pillows":</strong> Circle shape only, different fill options, fixed size</div>
                </div>
              </div>

              {/* Weatherproof Configuration */}
              <h2 style={subheadingStyle}>Weatherproof Configuration</h2>
              <p style={paragraphStyle}>
                The weatherproof option changes how <strong>fabric surface area is calculated</strong> for the cushion. When enabled, the calculator uses the "Surface Area Without Base" formula instead of the full surface area formula inside the shapes section of the respective shape.
              </p>

              <div style={{ ...stepBoxStyle, backgroundColor: "#e3f1df", border: "1px solid #95c9a1" }}>
                <strong style={{ color: "#108043" }}>What This Means:</strong>
                <div style={{ marginTop: 8, fontSize: "0.9rem", color: "#6d7175" }}>
                  <div style={{ marginBottom: 8 }}><strong>Standard Mode:</strong> Fabric covers all sides of the cushion (top + bottom + all edges)</div>
                  <div><strong>Weatherproof Mode:</strong> Fabric covers only top and edges (no bottom coverage)</div>
                </div>
              </div>

              <p style={paragraphStyle}>
                <strong>Why Use Weatherproof Mode?</strong>
              </p>
              <ul style={listStyle}>
                <li style={listItemStyle}>Outdoor cushions often don't need fabric on the bottom</li>
                <li style={listItemStyle}>The bottom may have anti-slip material instead</li>
                <li style={listItemStyle}>Reduces fabric cost for outdoor/weatherproof products</li>
                <li style={listItemStyle}>Allows water drainage through bottom</li>
              </ul>

              <div style={warningBoxStyle}>
                <strong style={{ color: "#e65100" }}>Important:</strong>
                <p style={{ margin: "8px 0 0", color: "#e65100" }}>
                  For weatherproof mode to work correctly, your shapes must have the "Surface Area Without Base" formula defined. If a shape doesn't have this formula, the regular surface area formula will be used as fallback.
                </p>
              </div>

              {/* Section Visibility */}
              <h2 style={subheadingStyle}>Section Visibility Toggles</h2>
              <p style={paragraphStyle}>
                Control which calculator sections are displayed to customers. Hiding a section means customers won't see it or interact with it, but you can still apply values using "Hidden Options" (explained below).
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
                <div style={stepBoxStyle}>
                  <strong>Shape Section</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Allows customers to select cushion shape (Rectangle, Circle, etc.)
                  </p>
                </div>
                <div style={stepBoxStyle}>
                  <strong>Dimensions Section</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Shows input fields for measurements (length, width, thickness)
                  </p>
                </div>
                <div style={stepBoxStyle}>
                  <strong>Fill Section</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Displays fill type options (Foam, Polyester, etc.)
                  </p>
                </div>
                <div style={stepBoxStyle}>
                  <strong>Fabric Section</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Shows fabric selection with swatches and categories
                  </p>
                </div>
                <div style={stepBoxStyle}>
                  <strong>Design Section</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Design pattern options (adds % of fabric cost)
                  </p>
                </div>
                <div style={stepBoxStyle}>
                  <strong>Piping Section</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Edge piping/welting style options
                  </p>
                </div>
                <div style={stepBoxStyle}>
                  <strong>Button Style Section</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Tufting and button pattern options
                  </p>
                </div>
                <div style={stepBoxStyle}>
                  <strong>Ties Section</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Attachment ties options (fixed price)
                  </p>
                </div>
                <div style={stepBoxStyle}>
                  <strong>Fabric Ties Section</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Matching fabric ties options (fixed price)
                  </p>
                </div>
                <div style={stepBoxStyle}>
                  <strong>Anti-Skid Bottom Section</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Non-slip backing options
                  </p>
                </div>
                <div style={stepBoxStyle}>
                  <strong>Bottom Rod Pocket Section</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Rod pocket for curtains/drapes
                  </p>
                </div>
                <div style={stepBoxStyle}>
                  <strong>Drawstring Section</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Drawstring closure options
                  </p>
                </div>
              </div>

              <div style={{ ...stepBoxStyle, marginTop: 16 }}>
                <strong>Instructions Toggle</strong>
                <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                  Show or hide the "How to Measure" instructions section in the calculator
                </p>
              </div>

              {/* Allowed Options */}
              <h2 style={subheadingStyle}>Allowed Options (Restricting Choices)</h2>
              <p style={paragraphStyle}>
                For each section, you can restrict which options customers see. This is useful when certain products should only work with specific shapes, fabrics, or add-ons.
              </p>

              <div style={tipBoxStyle}>
                <strong style={{ color: "#108043" }}>How It Works:</strong>
                <ul style={{ ...listStyle, marginTop: 8, marginBottom: 0 }}>
                  <li style={listItemStyle}><strong>Empty selection</strong> = Show ALL active options from that category</li>
                  <li style={listItemStyle}><strong>Specific items selected</strong> = Show ONLY those selected items</li>
                </ul>
              </div>

              <p style={paragraphStyle}>
                You can set allowed options for:
              </p>
              <ul style={listStyle}>
                <li style={listItemStyle}><strong>Shapes:</strong> Limit to specific shapes (e.g., only Rectangle and Square)</li>
                <li style={listItemStyle}><strong>Fill Types:</strong> Restrict fill options (e.g., only Foam and Memory Foam)</li>
                <li style={listItemStyle}><strong>Fabric Categories:</strong> Show only certain fabric categories (e.g., only Outdoor fabrics)</li>
                <li style={listItemStyle}><strong>All Add-on Sections:</strong> Piping, Buttons, Ties, Design, Anti-Skid, Fabric Ties, Rod Pocket, Drawstring</li>
              </ul>

              <div style={{ ...stepBoxStyle, backgroundColor: "#fff8e1", border: "1px solid #ffe082" }}>
                <strong style={{ color: "#5d4037" }}>Example - Outdoor Cushion Profile:</strong>
                <div style={{ marginTop: 8, fontSize: "0.9rem", color: "#6d7175" }}>
                  <div>Allowed Shapes: Rectangle, Square (no complex shapes)</div>
                  <div>Allowed Fabric Categories: "Outdoor" and "Weatherproof" only</div>
                  <div>Allowed Fills: "Outdoor Foam" and "Quick-Dry Poly"</div>
                  <div>Result: Customers only see weather-appropriate options</div>
                </div>
              </div>

              {/* Hidden Options */}
              <h2 style={subheadingStyle}>Hidden Options (Pre-selected Defaults)</h2>
              <p style={paragraphStyle}>
                When you hide a section (toggle it OFF), you can still include a value from that section in the price calculation by setting a "Hidden Option". This option will be automatically applied without showing it to the customer.
              </p>

              <div style={warningBoxStyle}>
                <strong style={{ color: "#e65100" }}>Important:</strong>
                <p style={{ margin: "8px 0 0", color: "#e65100" }}>
                  Hidden Options <strong>only work when the section is hidden</strong>. If a section is visible, the hidden option is ignored and the customer's selection is used instead.
                </p>
              </div>

              <p style={paragraphStyle}>
                <strong>Common Use Cases:</strong>
              </p>
              <ul style={listStyle}>
                <li style={listItemStyle}>
                  <strong>Standard Fill:</strong> Hide the fill section but always use "Standard Foam" in calculations
                </li>
                <li style={listItemStyle}>
                  <strong>Fixed Shape:</strong> Product is always rectangular, so hide shape section and set hidden shape to "Rectangle"
                </li>
                <li style={listItemStyle}>
                  <strong>Included Feature:</strong> All cushions include standard piping, hide piping section but set hidden value to "Standard Piping"
                </li>
                <li style={listItemStyle}>
                  <strong>Simplified Experience:</strong> Reduce customer choices while still calculating accurate prices
                </li>
              </ul>

              <div style={tipBoxStyle}>
                <strong style={{ color: "#108043" }}>Example - Simple Bench Pad:</strong>
                <div style={{ marginTop: 8, fontSize: "0.9rem", color: "#108043" }}>
                  <div>Shape Section: Hidden, Hidden Shape = "Rectangle"</div>
                  <div>Fill Section: Hidden, Hidden Fill = "Standard Foam"</div>
                  <div>Piping Section: Hidden, Hidden Piping = "No Piping"</div>
                  <div>Customer only sees: Dimensions + Fabric selection</div>
                </div>
              </div>

              {/* Profile Status */}
              <h2 style={subheadingStyle}>Profile Status Settings</h2>

              <div style={stepBoxStyle}>
                <strong>Is Default</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Mark one profile as the "Default" profile. This profile will be used when a product doesn't have a specific profile assigned to it. Only one profile can be the default at a time.
                </p>
              </div>

              <div style={stepBoxStyle}>
                <strong>Is Active</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Toggle this OFF to disable a profile without deleting it. Inactive profiles won't appear in the profile selection and can't be assigned to products. Useful for seasonal profiles or profiles under development.
                </p>
              </div>

              <div style={stepBoxStyle}>
                <strong>Sort Order</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Controls the display order of profiles in the admin list. Lower numbers appear first. Use this to organize your most-used profiles at the top.
                </p>
              </div>

              {/* Creating a Profile */}
              <h2 style={subheadingStyle}>Creating a Profile - Step by Step</h2>
              <ol style={listStyle}>
                <li style={listItemStyle}>Go to <strong>Profiles</strong> in the sidebar menu</li>
                <li style={listItemStyle}>Click the <strong>"Add Profile"</strong> button</li>
                <li style={listItemStyle}>Enter a descriptive <strong>Profile Name</strong></li>
                <li style={listItemStyle}>Set the <strong>Additional Percentage</strong> if you need a markup</li>
                <li style={listItemStyle}>Enable <strong>Multi-Piece Mode</strong> if needed and configure pieces</li>
                <li style={listItemStyle}>Enable <strong>Weatherproof</strong> if this is for outdoor products</li>
                <li style={listItemStyle}>Toggle <strong>Section Visibility</strong> for each section</li>
                <li style={listItemStyle}>Set <strong>Allowed Options</strong> to restrict choices (or leave empty for all)</li>
                <li style={listItemStyle}>Set <strong>Hidden Options</strong> for any hidden sections that need values</li>
                <li style={listItemStyle}>Click <strong>Save</strong> to create the profile</li>
              </ol>

              <div style={{ ...warningBoxStyle, marginTop: 20 }}>
                <strong style={{ color: "#e65100" }}>After Creating a Profile:</strong>
                <p style={{ margin: "8px 0 0", color: "#e65100" }}>
                  Don't forget to assign the profile to your Shopify products! Go to each product in Shopify Admin, find the <code style={codeStyle}>cushion_calculator.profile_id</code> metafield, and enter the profile ID.
                </p>
              </div>
            </div>
          )}

          {/* Shapes */}
          {activeSection === "shapes" && (
            <div>
              <h1 style={headingStyle}>Shapes</h1>

              <h2 style={subheadingStyle}>What is a Shape?</h2>
              <p style={paragraphStyle}>
                A <strong>Shape</strong> defines the geometry of a cushion and provides the mathematical formulas needed to calculate pricing. Shapes are the foundation of the calculator - they determine how fabric cost (based on surface area) and fill cost (based on volume) are computed.
              </p>

              <div style={{ ...stepBoxStyle, backgroundColor: "#e8f4fd", border: "1px solid #b3d4fc" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ fontWeight: 600, color: "#0066cc" }}>A Shape Provides:</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#008060", fontWeight: 600 }}>1.</span> Input fields for customer measurements
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#008060", fontWeight: 600 }}>2.</span> Surface area formula (for fabric cost)
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#008060", fontWeight: 600 }}>3.</span> Volume formula (for fill cost)
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#008060", fontWeight: 600 }}>4.</span> Visual representation for customers
                    </div>
                  </div>
                </div>
              </div>

              <div style={warningBoxStyle}>
                <strong style={{ color: "#e65100" }}>Important:</strong>
                <p style={{ margin: "8px 0 0", color: "#e65100" }}>
                  You must create at least one shape before the calculator can work. Shapes are required by profiles, and without shapes, customers cannot configure their cushions.
                </p>
              </div>

              {/* Basic Information */}
              <h2 style={subheadingStyle}>Basic Information</h2>

              <div style={stepBoxStyle}>
                <strong>Shape Name</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  A descriptive name that customers will see when selecting a shape. Choose clear, recognizable names like "Rectangle", "Circle", "L-Shape", "Hexagon", "Wedge", etc.
                </p>
              </div>

              <div style={stepBoxStyle}>
                <strong>Image URL</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  A URL to an image showing the shape. This helps customers visualize what they're selecting. The image appears in the shape selection dropdown in the calculator.
                </p>
              </div>

              {/* Input Fields */}
              <h2 style={subheadingStyle}>Input Fields (Dimensions)</h2>
              <p style={paragraphStyle}>
                Input fields define what measurements customers need to enter. Each field becomes a variable you can use in your formulas. You can add as many fields as needed for your shape.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
                <div style={stepBoxStyle}>
                  <strong>Label</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    What customers see (e.g., "Length", "Width", "Thickness", "Diameter")
                  </p>
                </div>
                <div style={stepBoxStyle}>
                  <strong>Key</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Variable name used in formulas. Use lowercase with no spaces (e.g., <code style={codeStyle}>length</code>, <code style={codeStyle}>width</code>, <code style={codeStyle}>thickness</code>)
                  </p>
                </div>
                <div style={stepBoxStyle}>
                  <strong>Min Value</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Minimum allowed value. Prevents customers from entering unrealistic small dimensions.
                  </p>
                </div>
                <div style={stepBoxStyle}>
                  <strong>Max Value</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Maximum allowed value. Prevents orders that exceed your manufacturing capabilities.
                  </p>
                </div>
                <div style={stepBoxStyle}>
                  <strong>Default Value</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Pre-filled value when the calculator loads. Optional, but helps guide customers.
                  </p>
                </div>
                <div style={stepBoxStyle}>
                  <strong>Required</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Whether this field must be filled. Most dimension fields should be required.
                  </p>
                </div>
              </div>

              <div style={tipBoxStyle}>
                <strong style={{ color: "#108043" }}>Common Input Field Sets:</strong>
                <div style={{ marginTop: 8, fontSize: "0.9rem", color: "#108043" }}>
                  <div><strong>Rectangle:</strong> length, width, thickness</div>
                  <div><strong>Circle:</strong> diameter (or radius), thickness</div>
                  <div><strong>L-Shape:</strong> length1, length2, width1, width2, thickness</div>
                  <div><strong>Wedge:</strong> length, width, front_thickness, back_thickness</div>
                </div>
              </div>

              {/* Formulas */}
              <h2 style={subheadingStyle}>Formulas</h2>
              <p style={paragraphStyle}>
                Formulas calculate the surface area and volume of the cushion based on customer-entered dimensions. These values are then multiplied by fabric and fill prices to determine costs.
              </p>

              <div style={{ ...stepBoxStyle, backgroundColor: "#fff8e1", border: "1px solid #ffe082" }}>
                <strong style={{ color: "#5d4037" }}>Supported Operators:</strong>
                <div style={{ marginTop: 8, display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <code style={codeStyle}>+</code> addition
                  <code style={codeStyle}>-</code> subtraction
                  <code style={codeStyle}>*</code> multiplication
                  <code style={codeStyle}>/</code> division
                  <code style={codeStyle}>( )</code> parentheses for grouping
                </div>
              </div>

              <h3 style={{ ...subheadingStyle, fontSize: "1rem" }}>Surface Area Formula</h3>
              <p style={paragraphStyle}>
                Calculates the total fabric needed to cover the cushion (in square inches). This is multiplied by the fabric's price per square inch to get fabric cost.
              </p>
              <div style={stepBoxStyle}>
                <strong>How to Calculate:</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Add up the area of all faces of the cushion. For a rectangular cushion, this includes:
                </p>
                <ul style={{ ...listStyle, marginTop: 8 }}>
                  <li style={{ ...listItemStyle, fontSize: "0.9rem" }}>Top face: length × width</li>
                  <li style={{ ...listItemStyle, fontSize: "0.9rem" }}>Bottom face: length × width</li>
                  <li style={{ ...listItemStyle, fontSize: "0.9rem" }}>Front &amp; back edges: 2 × (length × thickness)</li>
                  <li style={{ ...listItemStyle, fontSize: "0.9rem" }}>Left &amp; right edges: 2 × (width × thickness)</li>
                </ul>
              </div>

              <h3 style={{ ...subheadingStyle, fontSize: "1rem" }}>Surface Area Without Base Formula</h3>
              <p style={paragraphStyle}>
                Used when <strong>Weatherproof mode</strong> is enabled in a profile. This formula calculates surface area <em>excluding the bottom face</em>, since weatherproof cushions often don't have fabric on the bottom.
              </p>
              <div style={tipBoxStyle}>
                <strong style={{ color: "#108043" }}>Tip:</strong>
                <p style={{ margin: "8px 0 0", color: "#108043" }}>
                  This is the same as your regular Surface Area formula, minus one "top/bottom" calculation. For rectangles: remove one <code style={codeStyle}>length*width</code> from the formula.
                </p>
              </div>

              <h3 style={{ ...subheadingStyle, fontSize: "1rem" }}>Volume Formula</h3>
              <p style={paragraphStyle}>
                Calculates the interior space of the cushion (in cubic inches). This is multiplied by the fill's price per cubic inch to get fill cost.
              </p>
              <div style={stepBoxStyle}>
                <strong>How to Calculate:</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  For most shapes, volume = base area × thickness. For rectangles: length × width × thickness
                </p>
              </div>

              {/* Formula Examples */}
              <h2 style={subheadingStyle}>Formula Examples</h2>

              <div style={{ ...stepBoxStyle, marginBottom: 16 }}>
                <strong style={{ color: "#008060" }}>Rectangle / Square Cushion</strong>
                <div style={{ marginTop: 12 }}>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Input Fields:</strong> <code style={codeStyle}>length</code>, <code style={codeStyle}>width</code>, <code style={codeStyle}>thickness</code>
                  </div>
                  <div style={{ backgroundColor: "#f6f6f7", padding: 12, borderRadius: 4, fontFamily: "monospace", fontSize: "0.85rem" }}>
                    <div><strong>Surface Area:</strong></div>
                    <div style={{ color: "#5c6ac4", marginLeft: 12 }}>length*width*2 + length*thickness*2 + width*thickness*2</div>
                    <div style={{ marginTop: 8 }}><strong>Surface Area Without Base:</strong></div>
                    <div style={{ color: "#5c6ac4", marginLeft: 12 }}>length*width + length*thickness*2 + width*thickness*2</div>
                    <div style={{ marginTop: 8 }}><strong>Volume:</strong></div>
                    <div style={{ color: "#5c6ac4", marginLeft: 12 }}>length*width*thickness</div>
                  </div>
                </div>
              </div>

              <div style={{ ...stepBoxStyle, marginBottom: 16 }}>
                <strong style={{ color: "#008060" }}>Circle / Round Cushion</strong>
                <div style={{ marginTop: 12 }}>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Input Fields:</strong> <code style={codeStyle}>diameter</code>, <code style={codeStyle}>thickness</code>
                  </div>
                  <div style={{ backgroundColor: "#f6f6f7", padding: 12, borderRadius: 4, fontFamily: "monospace", fontSize: "0.85rem" }}>
                    <div><strong>Surface Area:</strong> (using radius = diameter/2)</div>
                    <div style={{ color: "#5c6ac4", marginLeft: 12 }}>3.14159*(diameter/2)*(diameter/2)*2 + 3.14159*diameter*thickness</div>
                    <div style={{ marginTop: 8 }}><strong>Surface Area Without Base:</strong></div>
                    <div style={{ color: "#5c6ac4", marginLeft: 12 }}>3.14159*(diameter/2)*(diameter/2) + 3.14159*diameter*thickness</div>
                    <div style={{ marginTop: 8 }}><strong>Volume:</strong></div>
                    <div style={{ color: "#5c6ac4", marginLeft: 12 }}>3.14159*(diameter/2)*(diameter/2)*thickness</div>
                  </div>
                </div>
              </div>

              <div style={{ ...stepBoxStyle, marginBottom: 16 }}>
                <strong style={{ color: "#008060" }}>Wedge / Tapered Cushion</strong>
                <div style={{ marginTop: 12 }}>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Input Fields:</strong> <code style={codeStyle}>length</code>, <code style={codeStyle}>width</code>, <code style={codeStyle}>front_thickness</code>, <code style={codeStyle}>back_thickness</code>
                  </div>
                  <div style={{ backgroundColor: "#f6f6f7", padding: 12, borderRadius: 4, fontFamily: "monospace", fontSize: "0.85rem" }}>
                    <div><strong>Volume:</strong> (uses average thickness)</div>
                    <div style={{ color: "#5c6ac4", marginLeft: 12 }}>length*width*((front_thickness+back_thickness)/2)</div>
                  </div>
                </div>
              </div>

              {/* 2D Shapes */}
              <h2 style={subheadingStyle}>2D Shapes &amp; Panels Configuration</h2>
              <p style={paragraphStyle}>
                For flat items like curtains or fabric panels that don't have thickness/volume, you can enable 2D mode. This changes how the calculator behaves.
              </p>

              <div style={stepBoxStyle}>
                <strong>Is 2D Shape</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  When enabled, the shape is treated as flat (no volume calculation). The fill section is typically hidden for 2D shapes since there's no interior to fill. Only surface area (one side) is calculated for fabric cost.
                </p>
              </div>

              <div style={stepBoxStyle}>
                <strong>Enable Panels</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  When enabled, customers can specify how many panels they want. The total price is multiplied by the panel count. Perfect for curtains where customers might order 2, 4, or more matching panels.
                </p>
              </div>

              <div style={stepBoxStyle}>
                <strong>Max Panels</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  The maximum number of panels a customer can order (1-20). This prevents unreasonably large orders and helps with inventory planning.
                </p>
              </div>

              <div style={tipBoxStyle}>
                <strong style={{ color: "#108043" }}>Use Cases for 2D Mode:</strong>
                <ul style={{ ...listStyle, marginTop: 8, marginBottom: 0 }}>
                  <li style={listItemStyle}>Curtain panels</li>
                  <li style={listItemStyle}>Drapes and valances</li>
                  <li style={listItemStyle}>Flat fabric pieces</li>
                  <li style={listItemStyle}>Table runners or placemats</li>
                </ul>
              </div>

              {/* Shape Status */}
              <h2 style={subheadingStyle}>Shape Status Settings</h2>

              <div style={stepBoxStyle}>
                <strong>Is Active</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Toggle this OFF to hide a shape from the calculator without deleting it. Inactive shapes won't appear in the shape dropdown. Useful for seasonal shapes or shapes under development.
                </p>
              </div>

              <div style={stepBoxStyle}>
                <strong>Is Default</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  The default shape is pre-selected when the calculator loads. Only one shape can be the default. This is usually your most common shape (e.g., Rectangle for most cushion businesses).
                </p>
              </div>

              <div style={stepBoxStyle}>
                <strong>Sort Order</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Controls the display order of shapes in the dropdown. Lower numbers appear first. Put your most popular shapes at the top for easier customer selection.
                </p>
              </div>

              {/* Step by Step */}
              <h2 style={subheadingStyle}>Creating a Shape - Step by Step</h2>
              <ol style={listStyle}>
                <li style={listItemStyle}>Go to <strong>Shapes</strong> in the sidebar menu</li>
                <li style={listItemStyle}>Click the <strong>"Add Shape"</strong> button</li>
                <li style={listItemStyle}>Enter a <strong>Shape Name</strong> (e.g., "Rectangle")</li>
                <li style={listItemStyle}>Optionally add an <strong>Image URL</strong> for visual reference</li>
                <li style={listItemStyle}>Add <strong>Input Fields</strong> for each dimension customers need to enter:
                  <ul style={{ ...listStyle, marginTop: 8 }}>
                    <li style={listItemStyle}>Set the Label (what customers see)</li>
                    <li style={listItemStyle}>Set the Key (variable name for formulas)</li>
                    <li style={listItemStyle}>Set Min/Max values for validation</li>
                    <li style={listItemStyle}>Optionally set a default value</li>
                  </ul>
                </li>
                <li style={listItemStyle}>Write the <strong>Surface Area Formula</strong> using your input field keys</li>
                <li style={listItemStyle}>Write the <strong>Surface Area Without Base Formula</strong> (for weatherproof mode)</li>
                <li style={listItemStyle}>Write the <strong>Volume Formula</strong> using your input field keys</li>
                <li style={listItemStyle}>Enable <strong>2D mode</strong> if this is a flat shape (optional)</li>
                <li style={listItemStyle}>Set the <strong>Sort Order</strong> for display positioning</li>
                <li style={listItemStyle}>Click <strong>Save</strong> to create the shape</li>
              </ol>

              <div style={{ ...warningBoxStyle, marginTop: 20 }}>
                <strong style={{ color: "#e65100" }}>Testing Your Formulas:</strong>
                <p style={{ margin: "8px 0 0", color: "#e65100" }}>
                  After creating a shape, test it by going to a product page with the calculator. Enter dimensions and verify that the calculated prices make sense. If prices seem wrong, double-check your formula syntax and variable names.
                </p>
              </div>
            </div>
          )}

          {/* Fill Types */}
          {activeSection === "fill-types" && (
            <div>
              <h1 style={headingStyle}>Fill Types</h1>

              <h2 style={subheadingStyle}>What is a Fill Type?</h2>
              <p style={paragraphStyle}>
                A <strong>Fill Type</strong> represents the stuffing or interior material used inside cushions. Fill types determine the comfort, durability, and feel of the finished cushion. The fill cost is calculated based on the cushion's volume.
              </p>

              <div style={{ ...stepBoxStyle, backgroundColor: "#e8f4fd", border: "1px solid #b3d4fc" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ fontWeight: 600, color: "#0066cc" }}>Fill Cost Formula:</div>
                  <div style={{ backgroundColor: "#f6f6f7", padding: 12, borderRadius: 4, fontFamily: "monospace", fontSize: "0.95rem" }}>
                    <span style={{ color: "#5c6ac4" }}>Fill Cost = Volume (cubic inches) × Price per Cubic Inch</span>
                  </div>
                </div>
              </div>

              {/* Basic Information */}
              <h2 style={subheadingStyle}>Basic Information</h2>

              <div style={stepBoxStyle}>
                <strong>Fill Name</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  A descriptive name customers will see when selecting a fill type. Common examples: "High Density Foam", "Memory Foam", "Polyfill", "Microfiber", "Down Alternative", "Economy Foam".
                </p>
              </div>

              <div style={stepBoxStyle}>
                <strong>Image URL</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  A URL to an image showing the fill material. This helps customers visualize the material they're selecting. The image appears in the fill selection area of the calculator.
                </p>
              </div>

              <div style={stepBoxStyle}>
                <strong>Description</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Additional details about the fill material such as comfort level, durability, intended use (indoor/outdoor), care instructions, or any other relevant information.
                </p>
              </div>

              {/* Pricing Configuration */}
              <h2 style={subheadingStyle}>Pricing Configuration</h2>

              <div style={stepBoxStyle}>
                <strong>Price per Cubic Inch</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  The cost rate used to calculate fill pricing. This value is multiplied by the cushion's volume (calculated from the shape's volume formula) to determine the fill cost.
                </p>
              </div>

              <div style={{ ...stepBoxStyle, backgroundColor: "#f6f6f7" }}>
                <strong>Pricing Example:</strong>
                <div style={{ marginTop: 12, fontSize: "0.9rem" }}>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Cushion dimensions:</strong> 20" × 18" × 4"
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Volume:</strong> 20 × 18 × 4 = <span style={{ color: "#008060", fontWeight: 600 }}>1,440 cubic inches</span>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Price per cubic inch:</strong> $0.05
                  </div>
                  <div style={{ backgroundColor: "#e8f4fd", padding: 8, borderRadius: 4 }}>
                    <strong>Fill Cost:</strong> 1,440 × $0.05 = <span style={{ color: "#008060", fontWeight: 600 }}>$72.00</span>
                  </div>
                </div>
              </div>

              <div style={tipBoxStyle}>
                <strong style={{ color: "#108043" }}>Pricing Tips:</strong>
                <ul style={{ ...listStyle, marginTop: 8, marginBottom: 0 }}>
                  <li style={listItemStyle}>Start with small decimal values (e.g., $0.02 - $0.10 per cubic inch)</li>
                  <li style={listItemStyle}>Premium materials like memory foam should cost more than basic polyfill</li>
                  <li style={listItemStyle}>Test with sample dimensions to ensure prices are reasonable</li>
                </ul>
              </div>

              {/* Enable Discount from Total - KEY FEATURE */}
              <h2 style={subheadingStyle}>Enable Discount from Total</h2>

              <div style={{ ...warningBoxStyle, backgroundColor: "#e8f4fd", borderColor: "#b3d4fc" }}>
                <strong style={{ color: "#0066cc" }}>Key Feature:</strong>
                <p style={{ margin: "8px 0 0", color: "#0066cc" }}>
                  This feature allows you to offer promotional pricing by automatically applying a percentage discount to the <strong>entire order total</strong> when a customer selects this fill type.
                </p>
              </div>

              <div style={stepBoxStyle}>
                <strong>Enable Discount from Total</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  When this checkbox is enabled, you can specify a discount percentage that will be automatically deducted from the <strong>final total price</strong> (not just the fill cost, but the entire order including fabric, fill, and all additional options).
                </p>
              </div>

              <div style={stepBoxStyle}>
                <strong>Discount Percentage</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  The percentage to deduct from the total price (0-100%). This discount is applied after all other costs are calculated.
                </p>
              </div>

              <div style={{ ...stepBoxStyle, backgroundColor: "#fff8e1", border: "1px solid #ffe082" }}>
                <strong style={{ color: "#5d4037" }}>How It Works:</strong>
                <ol style={{ ...listStyle, marginTop: 12, marginBottom: 0 }}>
                  <li style={listItemStyle}>Customer selects this fill type in the calculator</li>
                  <li style={listItemStyle}>Calculator computes normal total (fabric + fill + all options)</li>
                  <li style={listItemStyle}>Discount percentage is applied to the final total</li>
                  <li style={listItemStyle}>Customer sees the discounted price</li>
                </ol>
              </div>

              <div style={{ ...stepBoxStyle, backgroundColor: "#e6f9f0", border: "1px solid #9fdfbf" }}>
                <strong style={{ color: "#008060" }}>Discount Calculation Example:</strong>
                <div style={{ marginTop: 12, fontSize: "0.9rem" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: "6px 0", borderBottom: "1px solid #9fdfbf" }}>Fabric Cost:</td>
                        <td style={{ padding: "6px 0", borderBottom: "1px solid #9fdfbf", textAlign: "right" }}>$80.00</td>
                      </tr>
                      <tr>
                        <td style={{ padding: "6px 0", borderBottom: "1px solid #9fdfbf" }}>Fill Cost (Economy Foam):</td>
                        <td style={{ padding: "6px 0", borderBottom: "1px solid #9fdfbf", textAlign: "right" }}>$50.00</td>
                      </tr>
                      <tr>
                        <td style={{ padding: "6px 0", borderBottom: "1px solid #9fdfbf" }}>Additional Options:</td>
                        <td style={{ padding: "6px 0", borderBottom: "1px solid #9fdfbf", textAlign: "right" }}>$20.00</td>
                      </tr>
                      <tr>
                        <td style={{ padding: "6px 0", borderBottom: "1px solid #9fdfbf", fontWeight: 600 }}>Subtotal:</td>
                        <td style={{ padding: "6px 0", borderBottom: "1px solid #9fdfbf", textAlign: "right", fontWeight: 600 }}>$150.00</td>
                      </tr>
                      <tr style={{ color: "#d32f2f" }}>
                        <td style={{ padding: "6px 0", borderBottom: "1px solid #9fdfbf" }}>Discount (15% off total):</td>
                        <td style={{ padding: "6px 0", borderBottom: "1px solid #9fdfbf", textAlign: "right" }}>-$22.50</td>
                      </tr>
                      <tr style={{ backgroundColor: "#c8f7dc" }}>
                        <td style={{ padding: "8px 0", fontWeight: 700, fontSize: "1rem" }}>Final Total:</td>
                        <td style={{ padding: "8px 0", textAlign: "right", fontWeight: 700, fontSize: "1rem", color: "#008060" }}>$127.50</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={tipBoxStyle}>
                <strong style={{ color: "#108043" }}>Use Cases for Discount from Total:</strong>
                <ul style={{ ...listStyle, marginTop: 8, marginBottom: 0 }}>
                  <li style={listItemStyle}><strong>Promotional fill types:</strong> "Economy Foam - Save 10% on your order!"</li>
                  <li style={listItemStyle}><strong>Clearance materials:</strong> Discount older inventory to move stock faster</li>
                  <li style={listItemStyle}><strong>Seasonal sales:</strong> Enable discounts during holiday promotions</li>
                  <li style={listItemStyle}><strong>Customer incentives:</strong> Encourage customers to choose certain materials</li>
                </ul>
              </div>

              <div style={warningBoxStyle}>
                <strong style={{ color: "#e65100" }}>Important Note:</strong>
                <p style={{ margin: "8px 0 0", color: "#e65100" }}>
                  The discount applies to the <strong>entire order total</strong>, not just the fill cost. Be mindful when setting high percentages, as this will significantly reduce your profit margins on all components of the order.
                </p>
              </div>

              {/* Fill Type Status */}
              <h2 style={subheadingStyle}>Fill Type Status Settings</h2>

              <div style={stepBoxStyle}>
                <strong>Is Active</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Toggle this OFF to hide a fill type from the calculator without deleting it. Inactive fill types won't appear in the fill selection dropdown. Useful for seasonal materials or fills that are temporarily out of stock.
                </p>
              </div>

              <div style={stepBoxStyle}>
                <strong>Is Default</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  The default fill type is pre-selected when the calculator loads. Only one fill type can be the default. This is usually your most popular or recommended fill material.
                </p>
              </div>

              <div style={stepBoxStyle}>
                <strong>Sort Order</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Controls the display order of fill types in the dropdown. Lower numbers appear first. Put your most popular or recommended fills at the top.
                </p>
              </div>

              {/* Step by Step */}
              <h2 style={subheadingStyle}>Creating a Fill Type - Step by Step</h2>
              <ol style={listStyle}>
                <li style={listItemStyle}>Go to <strong>Fill Types</strong> in the sidebar menu</li>
                <li style={listItemStyle}>Click the <strong>"Add Fill Type"</strong> button</li>
                <li style={listItemStyle}>Enter a <strong>Fill Name</strong> (e.g., "High Density Foam")</li>
                <li style={listItemStyle}>Optionally add an <strong>Image URL</strong> for visual reference</li>
                <li style={listItemStyle}>Set the <strong>Price per Cubic Inch</strong> (e.g., 0.05 for $0.05)</li>
                <li style={listItemStyle}>Add a <strong>Description</strong> explaining the material's benefits</li>
                <li style={listItemStyle}>Set the <strong>Sort Order</strong> for display positioning</li>
                <li style={listItemStyle}><strong>Optional:</strong> Enable "Discount from Total" and set a percentage if running a promotion</li>
                <li style={listItemStyle}>Check <strong>"Active"</strong> to make it visible in the calculator</li>
                <li style={listItemStyle}>Check <strong>"Set as Default"</strong> if this should be pre-selected</li>
                <li style={listItemStyle}>Click <strong>Create</strong> to save the fill type</li>
              </ol>

              {/* Common Fill Types */}
              <h2 style={subheadingStyle}>Common Fill Type Examples</h2>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
                <div style={stepBoxStyle}>
                  <strong style={{ color: "#008060" }}>High Density Foam</strong>
                  <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Price: ~$0.06-0.10/cu in<br />
                    Firm support, long-lasting, ideal for seat cushions
                  </p>
                </div>
                <div style={stepBoxStyle}>
                  <strong style={{ color: "#008060" }}>Memory Foam</strong>
                  <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Price: ~$0.08-0.15/cu in<br />
                    Conforms to body, pressure relief, premium option
                  </p>
                </div>
                <div style={stepBoxStyle}>
                  <strong style={{ color: "#008060" }}>Polyfill / Polyester</strong>
                  <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Price: ~$0.02-0.04/cu in<br />
                    Soft, fluffy, budget-friendly, good for back cushions
                  </p>
                </div>
                <div style={stepBoxStyle}>
                  <strong style={{ color: "#008060" }}>Economy Foam</strong>
                  <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Price: ~$0.03-0.05/cu in<br />
                    Basic support, lower cost, good for occasional use
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Fabrics */}
          {activeSection === "fabrics" && (
            <div>
              <h1 style={headingStyle}>Fabrics</h1>

              <h2 style={subheadingStyle}>What are Fabrics?</h2>
              <p style={paragraphStyle}>
                <strong>Fabrics</strong> are the covering materials used on cushions. The Fabrics section is the most comprehensive part of the calculator, allowing you to manage fabrics along with their categories, brands, patterns, colors, and materials.
              </p>

              <div style={{ ...stepBoxStyle, backgroundColor: "#e8f4fd", border: "1px solid #b3d4fc" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ fontWeight: 600, color: "#0066cc" }}>Fabric Cost Formula:</div>
                  <div style={{ backgroundColor: "#f6f6f7", padding: 12, borderRadius: 4, fontFamily: "monospace", fontSize: "0.95rem" }}>
                    <span style={{ color: "#5c6ac4" }}>Fabric Cost = Surface Area (sq inches) × Price per Square Inch</span>
                  </div>
                </div>
              </div>

              {/* Tabs Overview */}
              <h2 style={subheadingStyle}>Fabric Management Tabs</h2>
              <p style={paragraphStyle}>
                The Fabrics page has <strong>6 tabs</strong> for organizing fabric data. You should set up the supporting tabs first (Categories, Brands, etc.) before adding fabrics.
              </p>

              <div style={{ ...stepBoxStyle, backgroundColor: "#fff8e1", border: "1px solid #ffe082" }}>
                <strong style={{ color: "#5d4037" }}>6 Tabs in Fabrics Page:</strong>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8, marginTop: 12 }}>
                  <div style={{ padding: 8, backgroundColor: "#fff", borderRadius: 4, border: "1px solid #e1e3e5", textAlign: "center" }}>
                    <strong>1. Fabrics</strong>
                    <div style={{ fontSize: "0.8rem", color: "#6d7175" }}>Main fabric list</div>
                  </div>
                  <div style={{ padding: 8, backgroundColor: "#fff", borderRadius: 4, border: "1px solid #e1e3e5", textAlign: "center" }}>
                    <strong>2. Categories</strong>
                    <div style={{ fontSize: "0.8rem", color: "#6d7175" }}>Group fabrics</div>
                  </div>
                  <div style={{ padding: 8, backgroundColor: "#fff", borderRadius: 4, border: "1px solid #e1e3e5", textAlign: "center" }}>
                    <strong>3. Brands</strong>
                    <div style={{ fontSize: "0.8rem", color: "#6d7175" }}>Manufacturer info</div>
                  </div>
                  <div style={{ padding: 8, backgroundColor: "#fff", borderRadius: 4, border: "1px solid #e1e3e5", textAlign: "center" }}>
                    <strong>4. Patterns</strong>
                    <div style={{ fontSize: "0.8rem", color: "#6d7175" }}>Design styles</div>
                  </div>
                  <div style={{ padding: 8, backgroundColor: "#fff", borderRadius: 4, border: "1px solid #e1e3e5", textAlign: "center" }}>
                    <strong>5. Colors</strong>
                    <div style={{ fontSize: "0.8rem", color: "#6d7175" }}>Color swatches</div>
                  </div>
                  <div style={{ padding: 8, backgroundColor: "#fff", borderRadius: 4, border: "1px solid #e1e3e5", textAlign: "center" }}>
                    <strong>6. Materials</strong>
                    <div style={{ fontSize: "0.8rem", color: "#6d7175" }}>Fabric types</div>
                  </div>
                </div>
              </div>

              {/* Categories Tab */}
              <h2 style={subheadingStyle}>Categories Tab</h2>
              <p style={paragraphStyle}>
                Categories help organize your fabrics into logical groups. Customers can filter fabrics by category in the calculator.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 12 }}>
                <div style={stepBoxStyle}>
                  <strong>Category Name</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Display name for the category. Examples: "Outdoor Fabrics", "Indoor Fabrics", "Premium Collection", "Budget-Friendly"
                  </p>
                </div>
                <div style={stepBoxStyle}>
                  <strong>Description</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Optional details about what fabrics belong in this category
                  </p>
                </div>
                <div style={stepBoxStyle}>
                  <strong>Image URL</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Representative image for the category (shown in category selection)
                  </p>
                </div>
                <div style={stepBoxStyle}>
                  <strong>Is Active</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Toggle to show/hide this category and its fabrics
                  </p>
                </div>
                <div style={stepBoxStyle}>
                  <strong>Sort Order</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Display order in the category list (lower = first)
                  </p>
                </div>
              </div>

              <div style={tipBoxStyle}>
                <strong style={{ color: "#108043" }}>Common Category Examples:</strong>
                <div style={{ marginTop: 8, fontSize: "0.9rem", color: "#108043" }}>
                  Outdoor, Indoor, Sunbrella Collection, Velvet & Plush, Performance Fabrics, Clearance
                </div>
              </div>

              {/* Brands Tab */}
              <h2 style={subheadingStyle}>Brands Tab</h2>
              <p style={paragraphStyle}>
                Brands allow you to track fabric manufacturers. Each fabric can be assigned to one brand.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 12 }}>
                <div style={stepBoxStyle}>
                  <strong>Brand Name</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Manufacturer name. Examples: "Sunbrella", "Outdura", "Tempotest", "Bella-Dura"
                  </p>
                </div>
                <div style={stepBoxStyle}>
                  <strong>Logo URL</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    URL to the brand's logo image
                  </p>
                </div>
                <div style={stepBoxStyle}>
                  <strong>Description</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Optional brand information (warranty, features, etc.)
                  </p>
                </div>
                <div style={stepBoxStyle}>
                  <strong>Sort Order</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Display order in the brand dropdown
                  </p>
                </div>
              </div>

              {/* Patterns Tab */}
              <h2 style={subheadingStyle}>Patterns Tab</h2>
              <p style={paragraphStyle}>
                Patterns describe the visual design of fabrics. A fabric can have <strong>multiple patterns</strong> (e.g., a fabric that is both "Striped" and "Geometric").
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 12 }}>
                <div style={stepBoxStyle}>
                  <strong>Pattern Name</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Design style. Examples: "Solid", "Striped", "Floral", "Geometric", "Plaid", "Textured", "Abstract"
                  </p>
                </div>
                <div style={stepBoxStyle}>
                  <strong>Sort Order</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Display order when selecting patterns
                  </p>
                </div>
              </div>

              <div style={{ ...stepBoxStyle, backgroundColor: "#e6f9f0", border: "1px solid #9fdfbf" }}>
                <strong style={{ color: "#008060" }}>Multi-Select:</strong>
                <p style={{ margin: "8px 0 0", color: "#008060" }}>
                  When adding/editing a fabric, you can select multiple patterns. This allows filtering by any of the assigned patterns.
                </p>
              </div>

              {/* Colors Tab */}
              <h2 style={subheadingStyle}>Colors Tab</h2>
              <p style={paragraphStyle}>
                Colors define the color options available. Each color has a hex code for displaying a visual swatch. A fabric can have <strong>multiple colors</strong>.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 12 }}>
                <div style={stepBoxStyle}>
                  <strong>Color Name</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Display name. Examples: "Navy Blue", "Crimson Red", "Beige", "Forest Green", "Charcoal"
                  </p>
                </div>
                <div style={stepBoxStyle}>
                  <strong>Hex Code</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Color code for the visual swatch (e.g., #FF0000 for red, #000080 for navy). Use the color picker or enter manually.
                  </p>
                </div>
                <div style={stepBoxStyle}>
                  <strong>Sort Order</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Display order when selecting colors
                  </p>
                </div>
              </div>

              {/* Materials Tab */}
              <h2 style={subheadingStyle}>Materials Tab</h2>
              <p style={paragraphStyle}>
                Materials describe what the fabric is made of. A fabric can have <strong>multiple materials</strong> (e.g., "Cotton/Polyester Blend").
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 12 }}>
                <div style={stepBoxStyle}>
                  <strong>Material Name</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Fabric type. Examples: "Cotton", "Polyester", "Velvet", "Acrylic", "Olefin", "Linen", "Microfiber"
                  </p>
                </div>
                <div style={stepBoxStyle}>
                  <strong>Sort Order</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Display order when selecting materials
                  </p>
                </div>
              </div>

              {/* Fabrics Tab - Main */}
              <h2 style={subheadingStyle}>Fabrics Tab - Basic Information</h2>
              <p style={paragraphStyle}>
                The main Fabrics tab is where you create and manage individual fabric entries.
              </p>

              <div style={stepBoxStyle}>
                <strong>Fabric Name</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  The display name customers see. Be descriptive: "Blue Velvet Premium" is better than "Fabric 1".
                </p>
              </div>

              <div style={stepBoxStyle}>
                <strong>Image URL</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  URL to a fabric swatch image. This helps customers visualize the fabric before selecting it.
                </p>
              </div>

              <div style={stepBoxStyle}>
                <strong>Price per Square Inch</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  The cost rate for this fabric. This is multiplied by the cushion's surface area (from the shape formula) to calculate fabric cost.
                </p>
              </div>

              <div style={stepBoxStyle}>
                <strong>Description</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Optional details about the fabric (care instructions, durability, recommended use cases).
                </p>
              </div>

              {/* Assignments */}
              <h2 style={subheadingStyle}>Fabrics Tab - Assignments</h2>
              <p style={paragraphStyle}>
                Assign fabrics to categories, brands, and multiple attributes for organization and filtering.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
                <div style={stepBoxStyle}>
                  <strong>Category</strong> <span style={{ fontSize: "0.8rem", color: "#6d7175" }}>(Single select)</span>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Assign to ONE category. Choose "No Category" if uncategorized.
                  </p>
                </div>
                <div style={stepBoxStyle}>
                  <strong>Brand</strong> <span style={{ fontSize: "0.8rem", color: "#6d7175" }}>(Single select)</span>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Assign to ONE brand. Choose "No Brand" if unknown.
                  </p>
                </div>
                <div style={{ ...stepBoxStyle, backgroundColor: "#e6f9f0", border: "1px solid #9fdfbf" }}>
                  <strong>Patterns</strong> <span style={{ fontSize: "0.8rem", color: "#008060" }}>(Multi-select)</span>
                  <p style={{ margin: "4px 0 0", color: "#008060", fontSize: "0.85rem" }}>
                    Select ALL patterns that apply. Click to toggle each one.
                  </p>
                </div>
                <div style={{ ...stepBoxStyle, backgroundColor: "#e6f9f0", border: "1px solid #9fdfbf" }}>
                  <strong>Colors</strong> <span style={{ fontSize: "0.8rem", color: "#008060" }}>(Multi-select)</span>
                  <p style={{ margin: "4px 0 0", color: "#008060", fontSize: "0.85rem" }}>
                    Select ALL colors present in the fabric.
                  </p>
                </div>
                <div style={{ ...stepBoxStyle, backgroundColor: "#e6f9f0", border: "1px solid #9fdfbf" }}>
                  <strong>Materials</strong> <span style={{ fontSize: "0.8rem", color: "#008060" }}>(Multi-select)</span>
                  <p style={{ margin: "4px 0 0", color: "#008060", fontSize: "0.85rem" }}>
                    Select ALL materials the fabric is made of.
                  </p>
                </div>
              </div>

              {/* Price Tiers */}
              <h2 style={subheadingStyle}>Price Tiers</h2>
              <p style={paragraphStyle}>
                Price tiers are <strong>visual indicators</strong> to help customers quickly identify budget-friendly vs premium fabrics. They do NOT affect pricing calculations.
              </p>

              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
                <div style={{ padding: "8px 16px", backgroundColor: "#f0f0f0", borderRadius: 4, textAlign: "center" }}>
                  <strong>None</strong>
                  <div style={{ fontSize: "0.8rem", color: "#666" }}>No tier displayed</div>
                </div>
                <div style={{ padding: "8px 16px", backgroundColor: "#d4edda", borderRadius: 4, textAlign: "center" }}>
                  <strong style={{ color: "#155724" }}>$ Low</strong>
                  <div style={{ fontSize: "0.8rem", color: "#155724" }}>Budget-friendly</div>
                </div>
                <div style={{ padding: "8px 16px", backgroundColor: "#fff3cd", borderRadius: 4, textAlign: "center" }}>
                  <strong style={{ color: "#856404" }}>$$ Medium</strong>
                  <div style={{ fontSize: "0.8rem", color: "#856404" }}>Mid-range</div>
                </div>
                <div style={{ padding: "8px 16px", backgroundColor: "#ffd6a5", borderRadius: 4, textAlign: "center" }}>
                  <strong style={{ color: "#8a4500" }}>$$$ High</strong>
                  <div style={{ fontSize: "0.8rem", color: "#8a4500" }}>Premium</div>
                </div>
              </div>

              {/* Discount from Total */}
              <h2 style={subheadingStyle}>Enable Discount from Total</h2>
              <p style={paragraphStyle}>
                Just like Fill Types, fabrics can have a discount that applies to the <strong>entire order total</strong> when selected.
              </p>

              <div style={stepBoxStyle}>
                <strong>Enable Discount from Total</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Toggle ON to enable, then enter a discount percentage (0-100%). This discount is applied to the final total price.
                </p>
              </div>

              <div style={{ ...stepBoxStyle, backgroundColor: "#e6f9f0", border: "1px solid #9fdfbf" }}>
                <strong style={{ color: "#008060" }}>Fabric Discount Example:</strong>
                <div style={{ marginTop: 12, fontSize: "0.9rem" }}>
                  <div>Subtotal (fabric + fill + options): <strong>$200.00</strong></div>
                  <div style={{ color: "#d32f2f" }}>Fabric Discount (10%): <strong>-$20.00</strong></div>
                  <div style={{ backgroundColor: "#c8f7dc", padding: "4px 8px", marginTop: 4, borderRadius: 4 }}>
                    Final Total: <strong style={{ color: "#008060" }}>$180.00</strong>
                  </div>
                </div>
              </div>

              {/* Status Settings */}
              <h2 style={subheadingStyle}>Fabric Status Settings</h2>

              <div style={stepBoxStyle}>
                <strong>Is Active</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Toggle OFF to hide a fabric from the calculator without deleting it. Inactive fabrics appear grayed out in the admin list.
                </p>
              </div>

              <div style={stepBoxStyle}>
                <strong>Is Default</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  The default fabric is pre-selected when the calculator loads. Default is set <strong>per category</strong> - each category can have its own default fabric.
                </p>
              </div>

              <div style={stepBoxStyle}>
                <strong>Sort Order</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Controls display order in the fabric list. Lower numbers appear first.
                </p>
              </div>

              {/* Fabric Cost Calculation */}
              <h2 style={subheadingStyle}>Fabric Cost Calculation Example</h2>

              <div style={{ ...stepBoxStyle, backgroundColor: "#f6f6f7" }}>
                <strong>Example Calculation:</strong>
                <div style={{ marginTop: 12, fontSize: "0.9rem" }}>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Cushion dimensions:</strong> 20" × 18" × 4" (rectangle)
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Surface Area Formula:</strong> 2(L×W) + 2(L×T) + 2(W×T)
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Surface Area:</strong> 2(20×18) + 2(20×4) + 2(18×4) = 720 + 160 + 144 = <span style={{ color: "#008060", fontWeight: 600 }}>1,024 sq inches</span>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Price per sq inch:</strong> $0.08
                  </div>
                  <div style={{ backgroundColor: "#e8f4fd", padding: 8, borderRadius: 4 }}>
                    <strong>Fabric Cost:</strong> 1,024 × $0.08 = <span style={{ color: "#008060", fontWeight: 600 }}>$81.92</span>
                  </div>
                </div>
              </div>

              {/* CSV Import/Export */}
              <h2 style={subheadingStyle}>CSV Import/Export</h2>
              <p style={paragraphStyle}>
                For managing large numbers of fabrics, use the CSV export/import feature.
              </p>

              <div style={stepBoxStyle}>
                <strong>Export CSV</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Click "Export CSV" to download all fabrics in CSV format. Use this as a template for importing.
                </p>
              </div>

              <div style={stepBoxStyle}>
                <strong>Import CSV</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Click "Import CSV" and select a CSV file. Tips:
                </p>
                <ul style={{ ...listStyle, marginTop: 8, marginBottom: 0 }}>
                  <li style={listItemStyle}>Leave <code style={codeStyle}>id</code> empty to create new fabrics</li>
                  <li style={listItemStyle}>Include <code style={codeStyle}>id</code> to update existing fabrics</li>
                  <li style={listItemStyle}>Use pipe (|) to separate multiple patterns, colors, or materials</li>
                  <li style={listItemStyle}>Category/brand/pattern/color names must match existing entries</li>
                </ul>
              </div>

              {/* Bulk Actions */}
              <h2 style={subheadingStyle}>Bulk Actions</h2>
              <p style={paragraphStyle}>
                Select multiple fabrics using checkboxes, then use bulk actions to modify them all at once.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 12 }}>
                <div style={stepBoxStyle}>
                  <strong>Bulk Delete</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Delete all selected fabrics at once. Use with caution.
                  </p>
                </div>
                <div style={stepBoxStyle}>
                  <strong>Set Price Tier</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Set the same price tier ($, $$, $$$) for all selected fabrics.
                  </p>
                </div>
              </div>

              {/* Filtering & Search */}
              <h2 style={subheadingStyle}>Filtering &amp; Search</h2>
              <p style={paragraphStyle}>
                The Fabrics tab includes powerful filtering to find fabrics quickly:
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                <div style={stepBoxStyle}>
                  <strong>Search</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Type to search by fabric name
                  </p>
                </div>
                <div style={stepBoxStyle}>
                  <strong>Category</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Filter by category (or "Uncategorized")
                  </p>
                </div>
                <div style={stepBoxStyle}>
                  <strong>Brand</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Filter by brand
                  </p>
                </div>
                <div style={stepBoxStyle}>
                  <strong>Pattern</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Filter by pattern
                  </p>
                </div>
                <div style={stepBoxStyle}>
                  <strong>Color</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Filter by color
                  </p>
                </div>
                <div style={stepBoxStyle}>
                  <strong>Status</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Show Active, Inactive, or All
                  </p>
                </div>
              </div>

              {/* Step by Step Setup */}
              <h2 style={subheadingStyle}>Recommended Setup Order</h2>
              <p style={paragraphStyle}>
                For best results, set up fabrics in this order:
              </p>

              <ol style={listStyle}>
                <li style={listItemStyle}><strong>Categories</strong> - Create categories like "Outdoor", "Indoor", "Premium"</li>
                <li style={listItemStyle}><strong>Brands</strong> - Add fabric manufacturers (Sunbrella, etc.)</li>
                <li style={listItemStyle}><strong>Patterns</strong> - Create pattern types (Solid, Striped, Floral, etc.)</li>
                <li style={listItemStyle}><strong>Colors</strong> - Add colors with hex codes for swatches</li>
                <li style={listItemStyle}><strong>Materials</strong> - Add material types (Cotton, Polyester, etc.)</li>
                <li style={listItemStyle}><strong>Fabrics</strong> - Finally, add fabrics and assign them to categories, brands, patterns, colors, and materials</li>
              </ol>

              <div style={warningBoxStyle}>
                <strong style={{ color: "#e65100" }}>Important:</strong>
                <p style={{ margin: "8px 0 0", color: "#e65100" }}>
                  If you delete a category, brand, pattern, color, or material that has fabrics assigned, those fabrics will be unlinked (not deleted). For categories, fabrics become "Uncategorized".
                </p>
              </div>
            </div>
          )}

          {/* Additional Options */}
          {activeSection === "additional-options" && (
            <div>
              <h1 style={headingStyle}>Additional Options</h1>
              <p style={paragraphStyle}>
                Beyond shapes, fills, and fabrics, the calculator supports 8 add-on option types that enhance cushion customization. These options allow customers to personalize their cushions with decorative elements, functional features, and finishing touches.
              </p>

              {/* Overview of All Option Types */}
              <h2 style={subheadingStyle}>Overview: The 8 Option Types</h2>
              <p style={paragraphStyle}>
                Each option type has its own dedicated page in the sidebar. Here's a quick overview:
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "24px" }}>
                <div style={{ ...stepBoxStyle, margin: 0 }}>
                  <strong>Design</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Quilting patterns, edge styles, visual designs
                  </p>
                </div>
                <div style={{ ...stepBoxStyle, margin: 0 }}>
                  <strong>Piping</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Decorative cord sewn into seams
                  </p>
                </div>
                <div style={{ ...stepBoxStyle, margin: 0 }}>
                  <strong>Button Style</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Tufted or button details
                  </p>
                </div>
                <div style={{ ...stepBoxStyle, margin: 0 }}>
                  <strong>Anti-Skid Bottom</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Non-slip backing material
                  </p>
                </div>
                <div style={{ ...stepBoxStyle, margin: 0 }}>
                  <strong>Bottom Rod Pocket</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Rod pocket for curtain-style items
                  </p>
                </div>
                <div style={{ ...stepBoxStyle, margin: 0 }}>
                  <strong>Drawstring</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Drawstring closure option
                  </p>
                </div>
                <div style={{ ...stepBoxStyle, margin: 0 }}>
                  <strong>Ties</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Attachment ties (fixed price)
                  </p>
                </div>
                <div style={{ ...stepBoxStyle, margin: 0 }}>
                  <strong>Fabric Ties</strong>
                  <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.85rem" }}>
                    Matching fabric ties (fixed price)
                  </p>
                </div>
              </div>

              {/* Understanding Pricing Models */}
              <h2 style={subheadingStyle}>Understanding Pricing Models</h2>
              <p style={paragraphStyle}>
                Additional options use two different pricing models. Understanding this difference is crucial for accurate pricing:
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", marginBottom: "24px" }}>
                <div style={{ ...stepBoxStyle, margin: 0, backgroundColor: "#e3f2fd", borderLeft: "4px solid #2196f3" }}>
                  <strong style={{ color: "#1976d2" }}>Percentage-Based Options</strong>
                  <p style={{ margin: "8px 0 4px", color: "#1976d2", fontSize: "0.9rem" }}>
                    Add a % of subtotal (or fabric cost)
                  </p>
                  <ul style={{ margin: "8px 0 0", paddingLeft: "20px", color: "#555", fontSize: "0.85rem" }}>
                    <li>Design (% of fabric cost)</li>
                    <li>Piping (% of subtotal)</li>
                    <li>Button Style (% of subtotal)</li>
                    <li>Anti-Skid (% of subtotal)</li>
                    <li>Rod Pocket (% of subtotal)</li>
                    <li>Drawstring (% of subtotal)</li>
                  </ul>
                </div>
                <div style={{ ...stepBoxStyle, margin: 0, backgroundColor: "#e8f5e9", borderLeft: "4px solid #4caf50" }}>
                  <strong style={{ color: "#388e3c" }}>Fixed Dollar Amount Options</strong>
                  <p style={{ margin: "8px 0 4px", color: "#388e3c", fontSize: "0.9rem" }}>
                    Add a flat fee regardless of size
                  </p>
                  <ul style={{ margin: "8px 0 0", paddingLeft: "20px", color: "#555", fontSize: "0.85rem" }}>
                    <li>Ties ($X per option)</li>
                    <li>Fabric Ties ($X per option)</li>
                  </ul>
                </div>
              </div>

              {/* Percentage Calculation */}
              <div style={{ ...stepBoxStyle, backgroundColor: "#f5f5f5" }}>
                <strong>Percentage Calculation Example</strong>
                <p style={{ margin: "8px 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  If subtotal is $100 and Piping is set to 10%:
                </p>
                <div style={{ backgroundColor: "#fff", padding: "12px", borderRadius: "6px", fontFamily: "monospace" }}>
                  Piping Cost = $100 × 10% = <strong>$10.00</strong>
                </div>
              </div>

              {/* Fixed Amount Calculation */}
              <div style={{ ...stepBoxStyle, backgroundColor: "#f5f5f5" }}>
                <strong>Fixed Dollar Amount Example</strong>
                <p style={{ margin: "8px 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  If "4 Ties" is priced at $12:
                </p>
                <div style={{ backgroundColor: "#fff", padding: "12px", borderRadius: "6px", fontFamily: "monospace" }}>
                  Ties Cost = <strong>$12.00</strong> (regardless of cushion size)
                </div>
              </div>

              {/* Design Options */}
              <h2 style={subheadingStyle}>1. Design Options</h2>
              <p style={paragraphStyle}>
                Design options control visual styling like quilting patterns, edge treatments, or custom designs. Access via <strong>Design</strong> in the sidebar.
              </p>

              <div style={warningBoxStyle}>
                <strong style={{ color: "#e65100" }}>Important - Unique Pricing:</strong>
                <p style={{ margin: "8px 0 0", color: "#e65100" }}>
                  Design is the only option that calculates percentage of <strong>fabric cost</strong> specifically, not the full subtotal. This makes sense because design complexity often relates to fabric coverage.
                </p>
              </div>

              <h3 style={{ fontSize: "1rem", fontWeight: "600", marginTop: "16px", marginBottom: "12px" }}>Design Option Fields</h3>
              <div style={stepBoxStyle}>
                <strong>Name</strong>
                <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Display name shown to customers (e.g., "Custom Pattern", "Quilted Diamond", "Box Stitch")
                </p>
              </div>
              <div style={stepBoxStyle}>
                <strong>Image URL</strong>
                <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Optional image showing the design style. Highly recommended for visual options.
                </p>
              </div>
              <div style={stepBoxStyle}>
                <strong>Percentage of Fabric Cost (%)</strong>
                <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  The percentage of fabric cost to add. Example: If fabric = $50 and design = 20%, adds $10.
                </p>
              </div>
              <div style={stepBoxStyle}>
                <strong>Description</strong>
                <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Optional details about the design (shown as help text to customers).
                </p>
              </div>

              <div style={{ ...stepBoxStyle, backgroundColor: "#e8f4fd" }}>
                <strong>Design Cost Calculation</strong>
                <div style={{ marginTop: "8px", fontFamily: "monospace", fontSize: "0.95rem" }}>
                  Design Cost = Fabric Cost × Design Percentage
                </div>
                <p style={{ margin: "12px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  <strong>Example:</strong> Fabric costs $64.00, "Quilted Diamond" design at 25%<br />
                  Design Cost = $64.00 × 25% = <strong>$16.00</strong>
                </p>
              </div>

              {/* Piping Options */}
              <h2 style={subheadingStyle}>2. Piping Options</h2>
              <p style={paragraphStyle}>
                Piping is decorative cord sewn into cushion seams, adding a finished look and durability to edges. Access via <strong>Piping</strong> in the sidebar.
              </p>

              <h3 style={{ fontSize: "1rem", fontWeight: "600", marginTop: "16px", marginBottom: "12px" }}>Piping Option Fields</h3>
              <div style={stepBoxStyle}>
                <strong>Name</strong>
                <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Display name (e.g., "Standard Piping", "Premium Piping", "Double Piping", "No Piping")
                </p>
              </div>
              <div style={stepBoxStyle}>
                <strong>Percentage of Subtotal (%)</strong>
                <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  The percentage of subtotal to add. Set to 0 for "No Piping" option.
                </p>
              </div>
              <div style={stepBoxStyle}>
                <strong>Image URL / Description</strong>
                <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Optional visual and description to help customers choose.
                </p>
              </div>

              <div style={{ ...stepBoxStyle, backgroundColor: "#e8f4fd" }}>
                <strong>Piping Cost Calculation</strong>
                <div style={{ marginTop: "8px", fontFamily: "monospace", fontSize: "0.95rem" }}>
                  Piping Cost = Subtotal × Piping Percentage
                </div>
                <p style={{ margin: "12px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  <strong>Example:</strong> Subtotal is $136.00, "Premium Piping" at 8%<br />
                  Piping Cost = $136.00 × 8% = <strong>$10.88</strong>
                </p>
              </div>

              {/* Button Style Options */}
              <h2 style={subheadingStyle}>3. Button Style Options</h2>
              <p style={paragraphStyle}>
                Button style options add tufted or button details to cushions, creating visual interest and a classic look. Access via <strong>Button Style</strong> in the sidebar.
              </p>

              <h3 style={{ fontSize: "1rem", fontWeight: "600", marginTop: "16px", marginBottom: "12px" }}>Button Style Option Fields</h3>
              <div style={stepBoxStyle}>
                <strong>Name</strong>
                <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Display name (e.g., "Tufted", "Diamond Tufted", "Single Button", "No Buttons")
                </p>
              </div>
              <div style={stepBoxStyle}>
                <strong>Percentage of Subtotal (%)</strong>
                <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  The percentage of subtotal to add. Tufting typically ranges 5-15%.
                </p>
              </div>
              <div style={stepBoxStyle}>
                <strong>Image URL / Description</strong>
                <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Optional visual showing button pattern.
                </p>
              </div>

              <div style={{ ...stepBoxStyle, backgroundColor: "#e8f4fd" }}>
                <strong>Button Style Cost Calculation</strong>
                <div style={{ marginTop: "8px", fontFamily: "monospace", fontSize: "0.95rem" }}>
                  Button Style Cost = Subtotal × Button Style Percentage
                </div>
                <p style={{ margin: "12px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  <strong>Example:</strong> Subtotal is $136.00, "Diamond Tufted" at 12%<br />
                  Button Style Cost = $136.00 × 12% = <strong>$16.32</strong>
                </p>
              </div>

              {/* Anti-Skid Bottom Options */}
              <h2 style={subheadingStyle}>4. Anti-Skid Bottom Options</h2>
              <p style={paragraphStyle}>
                Anti-skid options add non-slip backing to the cushion bottom, preventing sliding on chairs or benches. Access via <strong>Anti-Skid Bottom</strong> in the sidebar.
              </p>

              <h3 style={{ fontSize: "1rem", fontWeight: "600", marginTop: "16px", marginBottom: "12px" }}>Anti-Skid Option Fields</h3>
              <div style={stepBoxStyle}>
                <strong>Name</strong>
                <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Display name (e.g., "Standard Anti-Skid", "Premium Grip", "No Anti-Skid")
                </p>
              </div>
              <div style={stepBoxStyle}>
                <strong>Percentage of Subtotal (%)</strong>
                <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  The percentage of subtotal to add. Typically 3-8%.
                </p>
              </div>
              <div style={stepBoxStyle}>
                <strong>Image URL / Description</strong>
                <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Optional visual showing the anti-skid material.
                </p>
              </div>

              <div style={{ ...stepBoxStyle, backgroundColor: "#e8f4fd" }}>
                <strong>Anti-Skid Cost Calculation</strong>
                <div style={{ marginTop: "8px", fontFamily: "monospace", fontSize: "0.95rem" }}>
                  Anti-Skid Cost = Subtotal × Anti-Skid Percentage
                </div>
                <p style={{ margin: "12px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  <strong>Example:</strong> Subtotal is $136.00, "Premium Grip" at 5%<br />
                  Anti-Skid Cost = $136.00 × 5% = <strong>$6.80</strong>
                </p>
              </div>

              {/* Bottom Rod Pocket Options */}
              <h2 style={subheadingStyle}>5. Bottom Rod Pocket Options</h2>
              <p style={paragraphStyle}>
                Rod pocket options add a sleeve at the bottom for inserting a rod, commonly used for curtain-style applications or weighted bottoms. Access via <strong>Bottom Rod Pocket</strong> in the sidebar.
              </p>

              <h3 style={{ fontSize: "1rem", fontWeight: "600", marginTop: "16px", marginBottom: "12px" }}>Rod Pocket Option Fields</h3>
              <div style={stepBoxStyle}>
                <strong>Name</strong>
                <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Display name (e.g., "Standard Rod Pocket", "Wide Rod Pocket", "No Rod Pocket")
                </p>
              </div>
              <div style={stepBoxStyle}>
                <strong>Percentage of Subtotal (%)</strong>
                <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  The percentage of subtotal to add. Typically 4-10%.
                </p>
              </div>
              <div style={stepBoxStyle}>
                <strong>Image URL / Description</strong>
                <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Optional visual showing rod pocket style.
                </p>
              </div>

              <div style={{ ...stepBoxStyle, backgroundColor: "#e8f4fd" }}>
                <strong>Rod Pocket Cost Calculation</strong>
                <div style={{ marginTop: "8px", fontFamily: "monospace", fontSize: "0.95rem" }}>
                  Rod Pocket Cost = Subtotal × Rod Pocket Percentage
                </div>
                <p style={{ margin: "12px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  <strong>Example:</strong> Subtotal is $136.00, "Standard Rod Pocket" at 6%<br />
                  Rod Pocket Cost = $136.00 × 6% = <strong>$8.16</strong>
                </p>
              </div>

              {/* Drawstring Options */}
              <h2 style={subheadingStyle}>6. Drawstring Options</h2>
              <p style={paragraphStyle}>
                Drawstring options add a drawstring closure to cushion covers, making them easy to remove for washing. Access via <strong>Drawstring</strong> in the sidebar.
              </p>

              <h3 style={{ fontSize: "1rem", fontWeight: "600", marginTop: "16px", marginBottom: "12px" }}>Drawstring Option Fields</h3>
              <div style={stepBoxStyle}>
                <strong>Name</strong>
                <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Display name (e.g., "Standard Drawstring", "Heavy-Duty Drawstring", "No Drawstring")
                </p>
              </div>
              <div style={stepBoxStyle}>
                <strong>Percentage of Subtotal (%)</strong>
                <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  The percentage of subtotal to add. Typically 3-7%.
                </p>
              </div>
              <div style={stepBoxStyle}>
                <strong>Image URL / Description</strong>
                <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Optional visual showing drawstring style.
                </p>
              </div>

              <div style={{ ...stepBoxStyle, backgroundColor: "#e8f4fd" }}>
                <strong>Drawstring Cost Calculation</strong>
                <div style={{ marginTop: "8px", fontFamily: "monospace", fontSize: "0.95rem" }}>
                  Drawstring Cost = Subtotal × Drawstring Percentage
                </div>
                <p style={{ margin: "12px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  <strong>Example:</strong> Subtotal is $136.00, "Standard Drawstring" at 4%<br />
                  Drawstring Cost = $136.00 × 4% = <strong>$5.44</strong>
                </p>
              </div>

              {/* Ties Options */}
              <h2 style={subheadingStyle}>7. Ties Options</h2>
              <p style={paragraphStyle}>
                Ties are attachment straps for securing cushions to furniture, preventing them from sliding off. Access via <strong>Ties</strong> in the sidebar.
              </p>

              <div style={warningBoxStyle}>
                <strong style={{ color: "#e65100" }}>Different Pricing Model:</strong>
                <p style={{ margin: "8px 0 0", color: "#e65100" }}>
                  Ties use a <strong>fixed dollar amount</strong> instead of a percentage. The price you set is added directly to the total regardless of cushion size.
                </p>
              </div>

              <h3 style={{ fontSize: "1rem", fontWeight: "600", marginTop: "16px", marginBottom: "12px" }}>Ties Option Fields</h3>
              <div style={stepBoxStyle}>
                <strong>Name</strong>
                <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Display name (e.g., "2 Ties", "4 Ties", "6 Ties", "No Ties")
                </p>
              </div>
              <div style={stepBoxStyle}>
                <strong>Price ($)</strong>
                <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Fixed dollar amount added to the total (e.g., $6.00 for 2 ties, $12.00 for 4 ties).
                </p>
              </div>
              <div style={stepBoxStyle}>
                <strong>Image URL / Description</strong>
                <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Optional visual showing tie placement.
                </p>
              </div>

              <h3 style={{ fontSize: "1rem", fontWeight: "600", marginTop: "16px", marginBottom: "12px" }}>Special Setting: Include in Shipping & Labour</h3>
              <div style={{ ...stepBoxStyle, backgroundColor: "#fff3e0", borderLeft: "4px solid #ff9800" }}>
                <strong style={{ color: "#e65100" }}>Include ties in shipping & labour calculation</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  This toggle (found in the Ties Settings section) controls whether ties cost is included in the base amount used to calculate shipping and labour percentages.
                </p>
                <div style={{ marginTop: "12px", padding: "12px", backgroundColor: "#fff", borderRadius: "6px" }}>
                  <p style={{ margin: "0 0 8px", fontSize: "0.85rem" }}>
                    <strong>When ENABLED:</strong> Ties cost IS included in the base for shipping/labour % calculations.
                  </p>
                  <p style={{ margin: "0", fontSize: "0.85rem" }}>
                    <strong>When DISABLED:</strong> Ties cost is NOT included in the base, but still added to final price.
                  </p>
                </div>
              </div>

              <div style={{ ...stepBoxStyle, backgroundColor: "#e8f4fd" }}>
                <strong>Ties Cost Example</strong>
                <p style={{ margin: "12px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Customer selects "4 Ties" priced at $12.00<br />
                  Ties Cost = <strong>$12.00</strong> (same whether cushion is small or large)
                </p>
              </div>

              {/* Fabric Ties Options */}
              <h2 style={subheadingStyle}>8. Fabric Ties Options</h2>
              <p style={paragraphStyle}>
                Fabric ties are matching ties made from the same fabric as the cushion or curtain, providing a coordinated look. Access via <strong>Fabric Ties</strong> in the sidebar.
              </p>

              <div style={tipBoxStyle}>
                <strong style={{ color: "#108043" }}>Fabric Ties vs Regular Ties:</strong>
                <p style={{ margin: "8px 0 0", color: "#108043" }}>
                  Fabric ties are typically more expensive than regular ties because they're custom-made from the customer's selected fabric. Regular ties use standard materials.
                </p>
              </div>

              <h3 style={{ fontSize: "1rem", fontWeight: "600", marginTop: "16px", marginBottom: "12px" }}>Fabric Ties Option Fields</h3>
              <div style={stepBoxStyle}>
                <strong>Name</strong>
                <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Display name (e.g., "2 Fabric Ties", "4 Fabric Ties", "No Fabric Ties")
                </p>
              </div>
              <div style={stepBoxStyle}>
                <strong>Price ($)</strong>
                <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Fixed dollar amount (typically higher than regular ties due to custom fabric).
                </p>
              </div>
              <div style={stepBoxStyle}>
                <strong>Image URL / Description</strong>
                <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Optional visual showing fabric tie style.
                </p>
              </div>

              <div style={{ ...stepBoxStyle, backgroundColor: "#e8f4fd" }}>
                <strong>Fabric Ties Cost Example</strong>
                <p style={{ margin: "12px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Customer selects "4 Fabric Ties" priced at $18.00<br />
                  Fabric Ties Cost = <strong>$18.00</strong> (fixed amount)
                </p>
              </div>

              {/* Pricing Model Comparison Table */}
              <h2 style={subheadingStyle}>Pricing Model Comparison</h2>
              <p style={paragraphStyle}>
                Quick reference for how each option type is priced:
              </p>

              <div style={{ overflowX: "auto", marginBottom: "24px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f5f5f5" }}>
                      <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #ddd" }}>Option Type</th>
                      <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #ddd" }}>Pricing Model</th>
                      <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #ddd" }}>Typical Range</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #eee" }}>Design</td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #eee" }}>% of <strong>Fabric Cost</strong></td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #eee" }}>10% - 30%</td>
                    </tr>
                    <tr style={{ backgroundColor: "#fafafa" }}>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #eee" }}>Piping</td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #eee" }}>% of Subtotal</td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #eee" }}>5% - 15%</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #eee" }}>Button Style</td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #eee" }}>% of Subtotal</td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #eee" }}>5% - 15%</td>
                    </tr>
                    <tr style={{ backgroundColor: "#fafafa" }}>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #eee" }}>Anti-Skid Bottom</td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #eee" }}>% of Subtotal</td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #eee" }}>3% - 8%</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #eee" }}>Bottom Rod Pocket</td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #eee" }}>% of Subtotal</td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #eee" }}>4% - 10%</td>
                    </tr>
                    <tr style={{ backgroundColor: "#fafafa" }}>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #eee" }}>Drawstring</td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #eee" }}>% of Subtotal</td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #eee" }}>3% - 7%</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #eee" }}>Ties</td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #eee" }}><strong>Fixed $</strong></td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #eee" }}>$4 - $15</td>
                    </tr>
                    <tr style={{ backgroundColor: "#fafafa" }}>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #eee" }}>Fabric Ties</td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #eee" }}><strong>Fixed $</strong></td>
                      <td style={{ padding: "10px 12px", borderBottom: "1px solid #eee" }}>$8 - $25</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Common Fields */}
              <h2 style={subheadingStyle}>Common Fields (All Option Types)</h2>
              <p style={paragraphStyle}>
                All 8 option types share these configuration fields:
              </p>

              <div style={stepBoxStyle}>
                <strong>Sort Order</strong>
                <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Numeric value controlling display order (lower numbers appear first). Options are sorted ascending.
                </p>
              </div>
              <div style={stepBoxStyle}>
                <strong>Is Active</strong>
                <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Toggle to enable/disable the option. Inactive options appear grayed out in admin and are hidden from customers.
                </p>
              </div>
              <div style={stepBoxStyle}>
                <strong>Is Default</strong>
                <p style={{ margin: "4px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Pre-select this option for customers. Only ONE option per type can be default. Setting a new default automatically clears the previous one.
                </p>
              </div>

              {/* Step-by-Step Creation */}
              <h2 style={subheadingStyle}>Step-by-Step: Creating an Option</h2>
              <p style={paragraphStyle}>
                The process is similar for all 8 option types:
              </p>

              <ol style={listStyle}>
                <li style={listItemStyle}>
                  <strong>Navigate to the option page</strong> (e.g., Piping, Button Style, Ties)
                </li>
                <li style={listItemStyle}>
                  <strong>Click "Add [Option Type]"</strong> button in the top right
                </li>
                <li style={listItemStyle}>
                  <strong>Enter the name</strong> - Make it descriptive (e.g., "Premium Double Piping" not just "Option 1")
                </li>
                <li style={listItemStyle}>
                  <strong>Set the price/percentage</strong> - Either percentage (for % options) or fixed dollar amount (for Ties/Fabric Ties)
                </li>
                <li style={listItemStyle}>
                  <strong>Add image URL</strong> (optional but recommended for visual options)
                </li>
                <li style={listItemStyle}>
                  <strong>Add description</strong> (optional help text for customers)
                </li>
                <li style={listItemStyle}>
                  <strong>Set sort order</strong> (determines display position)
                </li>
                <li style={listItemStyle}>
                  <strong>Configure status</strong> - Check "Active" to enable, "Default" to pre-select
                </li>
                <li style={listItemStyle}>
                  <strong>Click Create/Update</strong> to save
                </li>
              </ol>

              {/* Tips */}
              <h2 style={subheadingStyle}>Tips & Best Practices</h2>

              <div style={tipBoxStyle}>
                <strong style={{ color: "#108043" }}>Include a "None" Option:</strong>
                <p style={{ margin: "8px 0 0", color: "#108043" }}>
                  For optional add-ons, create a "No [Option]" entry with 0% or $0. Set this as the default so customers aren't forced to choose an upgrade. Example: "No Piping" at 0%, "No Ties" at $0.
                </p>
              </div>

              <div style={tipBoxStyle}>
                <strong style={{ color: "#108043" }}>Use Descriptive Names:</strong>
                <p style={{ margin: "8px 0 0", color: "#108043" }}>
                  Instead of "Standard" and "Premium", use specific descriptions like "Single Welt Piping" and "Double Welt Piping with Contrast Color". This helps customers understand what they're choosing.
                </p>
              </div>

              <div style={tipBoxStyle}>
                <strong style={{ color: "#108043" }}>Add Images for Visual Options:</strong>
                <p style={{ margin: "8px 0 0", color: "#108043" }}>
                  Design, Piping, Button Style, and Ties benefit greatly from images. Customers can see exactly what they're selecting, reducing confusion and returns.
                </p>
              </div>

              <div style={warningBoxStyle}>
                <strong style={{ color: "#e65100" }}>Test Your Calculations:</strong>
                <p style={{ margin: "8px 0 0", color: "#e65100" }}>
                  Before going live, test the calculator with various combinations to ensure prices are accurate. Check that percentage-based options scale correctly with different cushion sizes.
                </p>
              </div>
            </div>
          )}

          {/* Pricing Calculation */}
          {activeSection === "pricing" && (
            <div>
              <h1 style={headingStyle}>Pricing Calculation</h1>
              <p style={paragraphStyle}>
                This comprehensive guide explains how the Cushion Calculator computes the final price for each order. Understanding the complete pricing flow helps you set competitive prices while maintaining healthy margins.
              </p>

              {/* Pricing Architecture Overview */}
              <h2 style={subheadingStyle}>Pricing Architecture Overview</h2>
              <p style={paragraphStyle}>
                The pricing system operates in three layers, each adding costs and adjustments to produce the final price:
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
                <div style={{ ...stepBoxStyle, backgroundColor: "#e3f2fd", borderLeft: "4px solid #1976d2" }}>
                  <strong style={{ color: "#1565c0" }}>Layer 1: Component Costs</strong>
                  <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                    Core material costs (Fabric + Fill) plus all selected add-ons (Design, Piping, Ties, etc.)
                  </p>
                </div>
                <div style={{ ...stepBoxStyle, backgroundColor: "#e8f5e9", borderLeft: "4px solid #388e3c" }}>
                  <strong style={{ color: "#2e7d32" }}>Layer 2: Profile Adjustments</strong>
                  <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                    Profile-specific markup (Additional %), multi-piece pricing, and weatherproof mode calculations
                  </p>
                </div>
                <div style={{ ...stepBoxStyle, backgroundColor: "#fff3e0", borderLeft: "4px solid #f57c00" }}>
                  <strong style={{ color: "#e65100" }}>Layer 3: Settings Adjustments</strong>
                  <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                    Global markups: Conversion %, Shipping %, Labour %, and Margin (tier or formula-based)
                  </p>
                </div>
              </div>

              {/* Complete Pricing Formula */}
              <h2 style={subheadingStyle}>The Complete Pricing Formula</h2>
              <div style={{ ...stepBoxStyle, backgroundColor: "#f5f5f5", padding: "20px" }}>
                <p style={{ margin: "0 0 16px", fontSize: "0.9rem", color: "#6d7175" }}>
                  The full calculation follows this order of operations:
                </p>
                <div style={{ fontFamily: "monospace", fontSize: "0.85rem", lineHeight: "1.8", backgroundColor: "#fff", padding: "16px", borderRadius: "6px", border: "1px solid #ddd" }}>
                  <div><code style={codeStyle}>1. Raw Materials</code> = Fabric Cost + Fill Cost + Fixed Add-ons (Ties)</div>
                  <div><code style={codeStyle}>2. After Conversion</code> = Raw Materials × (1 + Conversion %)</div>
                  <div><code style={codeStyle}>3. Design Cost</code> = Fabric Cost × Design %</div>
                  <div><code style={codeStyle}>4. Base Subtotal</code> = After Conversion + Design Cost</div>
                  <div><code style={codeStyle}>5. After % Add-ons</code> = Subtotal × (1 + Piping % + Button % + Anti-Skid % + Rod Pocket % + Drawstring %)</div>
                  <div><code style={codeStyle}>6. After Profile Markup</code> = After % Add-ons × (1 + Additional %)</div>
                  <div><code style={codeStyle}>7. After Discounts</code> = After Profile Markup × (1 - Fabric Discount %) × (1 - Fill Discount %)</div>
                  <div><code style={codeStyle}>8. After Shipping</code> = After Discounts × (1 + Shipping %)</div>
                  <div><code style={codeStyle}>9. After Labour</code> = After Shipping × (1 + Labour %)</div>
                  <div><code style={codeStyle}>10. Final Price</code> = After Labour × (1 + Margin %)</div>
                </div>
              </div>

              <div style={tipBoxStyle}>
                <strong style={{ color: "#108043" }}>Note on Ties Calculation:</strong>
                <p style={{ margin: "8px 0 0", color: "#108043" }}>
                  The <code style={codeStyle}>tiesIncludeInShippingLabour</code> setting controls whether Ties cost is included in the Shipping and Labour calculation base. When disabled, Ties are added after those calculations.
                </p>
              </div>

              {/* ============================================ */}
              {/* SECTION: Core Cost Calculations */}
              {/* ============================================ */}
              <h2 style={subheadingStyle}>Core Cost Calculations</h2>
              <p style={paragraphStyle}>
                The foundation of every price calculation starts with the two core material costs: fabric and fill.
              </p>

              {/* Fabric Cost */}
              <h3 style={{ fontSize: "1rem", fontWeight: "600", marginTop: "20px", marginBottom: "12px" }}>Fabric Cost</h3>
              <div style={stepBoxStyle}>
                <strong>Standard Formula:</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  <code style={codeStyle}>Fabric Cost = Surface Area × Price per Square Inch</code>
                </p>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Surface area is calculated based on the selected shape (rectangle, circle, etc.) and includes all sides that need fabric coverage.
                </p>
              </div>

              <div style={{ ...stepBoxStyle, backgroundColor: "#e8f5e9", borderLeft: "4px solid #4caf50" }}>
                <strong style={{ color: "#2e7d32" }}>Weatherproof Formula (When Enabled):</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  <code style={codeStyle}>Fabric Cost = Surface Area Without Base × Price per Square Inch</code>
                </p>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Weatherproof mode excludes the bottom surface from fabric calculations since outdoor cushions often don't need fabric on the bottom. This results in <strong>lower fabric costs</strong>.
                </p>
              </div>

              {/* Fabric Example */}
              <div style={{ backgroundColor: "#f8f9fa", padding: "16px", borderRadius: "8px", marginTop: "12px", marginBottom: "20px" }}>
                <strong style={{ fontSize: "0.9rem" }}>Example: Rectangle 20" × 18" × 4" with fabric at $0.08/sq in</strong>
                <table style={{ width: "100%", fontSize: "0.85rem", marginTop: "12px" }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: "4px 0", color: "#6d7175" }}>Top surface:</td>
                      <td style={{ textAlign: "right" }}>20 × 18 = 360 sq in</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "4px 0", color: "#6d7175" }}>Bottom surface:</td>
                      <td style={{ textAlign: "right" }}>20 × 18 = 360 sq in</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "4px 0", color: "#6d7175" }}>Side surfaces:</td>
                      <td style={{ textAlign: "right" }}>2 × (20+18) × 4 = 304 sq in</td>
                    </tr>
                    <tr style={{ borderTop: "1px solid #ddd" }}>
                      <td style={{ padding: "8px 0 4px" }}><strong>Standard Total:</strong></td>
                      <td style={{ textAlign: "right" }}>1,024 sq in × $0.08 = <strong>$81.92</strong></td>
                    </tr>
                    <tr style={{ backgroundColor: "#e8f5e9" }}>
                      <td style={{ padding: "8px 0 4px" }}><strong style={{ color: "#2e7d32" }}>Weatherproof Total:</strong></td>
                      <td style={{ textAlign: "right" }}>664 sq in × $0.08 = <strong style={{ color: "#2e7d32" }}>$53.12</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Fill Cost */}
              <h3 style={{ fontSize: "1rem", fontWeight: "600", marginTop: "20px", marginBottom: "12px" }}>Fill Cost</h3>
              <div style={stepBoxStyle}>
                <strong>Formula:</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  <code style={codeStyle}>Fill Cost = Volume × Price per Cubic Inch</code>
                </p>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Volume is calculated based on the selected shape dimensions. Different fill types have different prices per cubic inch.
                </p>
              </div>

              {/* Fill Example */}
              <div style={{ backgroundColor: "#f8f9fa", padding: "16px", borderRadius: "8px", marginTop: "12px", marginBottom: "20px" }}>
                <strong style={{ fontSize: "0.9rem" }}>Example: Rectangle 20" × 18" × 4" with fill at $0.05/cu in</strong>
                <table style={{ width: "100%", fontSize: "0.85rem", marginTop: "12px" }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: "4px 0", color: "#6d7175" }}>Volume:</td>
                      <td style={{ textAlign: "right" }}>20 × 18 × 4 = 1,440 cu in</td>
                    </tr>
                    <tr style={{ borderTop: "1px solid #ddd" }}>
                      <td style={{ padding: "8px 0 4px" }}><strong>Fill Cost:</strong></td>
                      <td style={{ textAlign: "right" }}>1,440 cu in × $0.05 = <strong>$72.00</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* ============================================ */}
              {/* SECTION: Percentage-Based Add-ons */}
              {/* ============================================ */}
              <h2 style={subheadingStyle}>Percentage-Based Add-ons</h2>
              <p style={paragraphStyle}>
                Six add-on types use percentage-based pricing. However, they differ in <strong>what they calculate the percentage from</strong>:
              </p>

              {/* Design - Special Case */}
              <div style={{ ...stepBoxStyle, backgroundColor: "#fff3e0", borderLeft: "4px solid #ff9800" }}>
                <strong style={{ color: "#e65100" }}>Design (% of Fabric Cost) - Unique Calculation</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  <code style={codeStyle}>Design Cost = Fabric Cost × Design Percentage</code>
                </p>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Design is the <strong>only</strong> add-on that calculates from fabric cost rather than subtotal. This makes sense because design complexity scales with fabric usage.
                </p>
                <div style={{ marginTop: "12px", padding: "10px", backgroundColor: "#fff", borderRadius: "4px" }}>
                  <strong style={{ fontSize: "0.85rem" }}>Example:</strong> Fabric Cost $81.92 × Design 15% = <strong>$12.29</strong> design cost
                </div>
              </div>

              {/* Other Percentage Add-ons */}
              <div style={{ ...stepBoxStyle, marginTop: "16px" }}>
                <strong>All Other Percentage Add-ons (% of Subtotal)</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  These five add-ons calculate their cost as a percentage of the current subtotal:
                </p>
                <ul style={{ margin: "12px 0 0", paddingLeft: "20px", color: "#6d7175", fontSize: "0.9rem" }}>
                  <li><strong>Piping:</strong> <code style={codeStyle}>Subtotal × Piping %</code></li>
                  <li><strong>Button Style:</strong> <code style={codeStyle}>Subtotal × Button %</code></li>
                  <li><strong>Anti-Skid Bottom:</strong> <code style={codeStyle}>Subtotal × Anti-Skid %</code></li>
                  <li><strong>Bottom Rod Pocket:</strong> <code style={codeStyle}>Subtotal × Rod Pocket %</code></li>
                  <li><strong>Drawstring:</strong> <code style={codeStyle}>Subtotal × Drawstring %</code></li>
                </ul>
              </div>

              {/* Percentage Add-ons Example */}
              <div style={{ backgroundColor: "#f8f9fa", padding: "16px", borderRadius: "8px", marginTop: "12px", marginBottom: "20px" }}>
                <strong style={{ fontSize: "0.9rem" }}>Example: Subtotal of $160.00 with multiple add-ons</strong>
                <table style={{ width: "100%", fontSize: "0.85rem", marginTop: "12px" }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: "4px 0", color: "#6d7175" }}>Piping (8%):</td>
                      <td style={{ textAlign: "right" }}>$160.00 × 8% = $12.80</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "4px 0", color: "#6d7175" }}>Button Style (5%):</td>
                      <td style={{ textAlign: "right" }}>$160.00 × 5% = $8.00</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "4px 0", color: "#6d7175" }}>Anti-Skid (3%):</td>
                      <td style={{ textAlign: "right" }}>$160.00 × 3% = $4.80</td>
                    </tr>
                    <tr style={{ borderTop: "1px solid #ddd" }}>
                      <td style={{ padding: "8px 0 4px" }}><strong>Total Add-on Cost:</strong></td>
                      <td style={{ textAlign: "right" }}><strong>$25.60</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* ============================================ */}
              {/* SECTION: Fixed Dollar Add-ons */}
              {/* ============================================ */}
              <h2 style={subheadingStyle}>Fixed Dollar Add-ons</h2>
              <p style={paragraphStyle}>
                Two add-on types use fixed dollar amounts instead of percentages:
              </p>

              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "20px" }}>
                <div style={{ ...stepBoxStyle, flex: "1", minWidth: "250px" }}>
                  <strong>Ties</strong>
                  <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                    Fixed dollar amount per tie option selected.
                  </p>
                  <p style={{ margin: "8px 0 0", fontSize: "0.85rem" }}>
                    <em>Example: Corner ties = $12.00</em>
                  </p>
                </div>
                <div style={{ ...stepBoxStyle, flex: "1", minWidth: "250px" }}>
                  <strong>Fabric Ties</strong>
                  <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                    Fixed dollar amount for matching fabric ties.
                  </p>
                  <p style={{ margin: "8px 0 0", fontSize: "0.85rem" }}>
                    <em>Example: Fabric ties = $18.00</em>
                  </p>
                </div>
              </div>

              <div style={warningBoxStyle}>
                <strong style={{ color: "#e65100" }}>Important: Ties Setting</strong>
                <p style={{ margin: "8px 0 0", color: "#e65100" }}>
                  The <code style={codeStyle}>tiesIncludeInShippingLabour</code> setting in your Settings page controls whether Ties costs are included in the base for Shipping and Labour percentage calculations. When <strong>enabled</strong>, Ties are included in the calculation base. When <strong>disabled</strong>, Ties are added after Shipping and Labour calculations.
                </p>
              </div>

              {/* ============================================ */}
              {/* SECTION: Profile-Level Markup */}
              {/* ============================================ */}
              <h2 style={subheadingStyle}>Profile-Level Markup (Additional Percentage)</h2>
              <p style={paragraphStyle}>
                Each profile can have an <strong>Additional Percentage</strong> that acts as a profile-specific markup. This is applied after all component costs are calculated.
              </p>

              <div style={stepBoxStyle}>
                <strong>Formula:</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  <code style={codeStyle}>After Profile Markup = Subtotal × (1 + Additional %)</code>
                </p>
              </div>

              <h3 style={{ fontSize: "1rem", fontWeight: "600", marginTop: "20px", marginBottom: "12px" }}>Use Cases for Additional Percentage</h3>
              <p style={paragraphStyle}>
                As defined in the Profiles section, here are the key use cases for Additional Percentage:
              </p>

              <div style={{ ...stepBoxStyle, backgroundColor: "#e8f5e9", borderLeft: "4px solid #4caf50" }}>
                <strong style={{ color: "#2e7d32" }}>1. Premium Product Lines</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Higher markup for luxury or premium products that command better margins.
                </p>
                <div style={{ marginTop: "12px", padding: "10px", backgroundColor: "#fff", borderRadius: "4px" }}>
                  <strong style={{ fontSize: "0.85rem" }}>Example:</strong> "Premium Collection" profile with 25% Additional Percentage<br />
                  Subtotal $200.00 × 1.25 = <strong>$250.00</strong>
                </div>
              </div>

              <div style={{ ...stepBoxStyle, backgroundColor: "#e3f2fd", borderLeft: "4px solid #1976d2", marginTop: "12px" }}>
                <strong style={{ color: "#1565c0" }}>2. Seasonal Pricing</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Temporary pricing adjustments for peak seasons or promotional periods.
                </p>
                <div style={{ marginTop: "12px", padding: "10px", backgroundColor: "#fff", borderRadius: "4px" }}>
                  <strong style={{ fontSize: "0.85rem" }}>Example:</strong> "Summer Sale" profile with 0% Additional Percentage (no markup)<br />
                  "Holiday Premium" profile with 15% Additional Percentage
                </div>
              </div>

              <div style={{ ...stepBoxStyle, backgroundColor: "#fff3e0", borderLeft: "4px solid #ff9800", marginTop: "12px" }}>
                <strong style={{ color: "#e65100" }}>3. Category-Specific Margins</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Different markup levels for different product categories based on market conditions.
                </p>
                <div style={{ marginTop: "12px", padding: "10px", backgroundColor: "#fff", borderRadius: "4px" }}>
                  <strong style={{ fontSize: "0.85rem" }}>Example:</strong><br />
                  "Indoor Cushions" profile: 10% Additional Percentage<br />
                  "Outdoor Cushions" profile: 20% Additional Percentage (higher due to specialty materials)
                </div>
              </div>

              <div style={{ ...stepBoxStyle, backgroundColor: "#fce4ec", borderLeft: "4px solid #e91e63", marginTop: "12px" }}>
                <strong style={{ color: "#c2185b" }}>4. Complexity Premium</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Higher margins for complex shapes or special construction requirements.
                </p>
                <div style={{ marginTop: "12px", padding: "10px", backgroundColor: "#fff", borderRadius: "4px" }}>
                  <strong style={{ fontSize: "0.85rem" }}>Example:</strong> "Custom Shapes" profile with 30% Additional Percentage<br />
                  Compensates for extra labour in non-standard cushion manufacturing
                </div>
              </div>

              {/* ============================================ */}
              {/* SECTION: Discounts */}
              {/* ============================================ */}
              <h2 style={subheadingStyle}>Discounts</h2>
              <p style={paragraphStyle}>
                Two types of discounts can be applied to reduce the final price:
              </p>

              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "20px" }}>
                <div style={{ ...stepBoxStyle, flex: "1", minWidth: "280px", backgroundColor: "#e8f5e9", borderLeft: "4px solid #4caf50" }}>
                  <strong style={{ color: "#2e7d32" }}>Fabric Discount</strong>
                  <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                    Set on individual Fabric options. When a fabric has a discount enabled, the percentage is applied to the total.
                  </p>
                  <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                    <code style={codeStyle}>After Discount = Total × (1 - Fabric Discount %)</code>
                  </p>
                  <div style={{ marginTop: "12px", padding: "10px", backgroundColor: "#fff", borderRadius: "4px" }}>
                    <strong style={{ fontSize: "0.85rem" }}>Example:</strong> Fabric with 15% discount enabled<br />
                    $200.00 × (1 - 0.15) = <strong>$170.00</strong>
                  </div>
                </div>

                <div style={{ ...stepBoxStyle, flex: "1", minWidth: "280px", backgroundColor: "#e3f2fd", borderLeft: "4px solid #1976d2" }}>
                  <strong style={{ color: "#1565c0" }}>Fill Type Discount</strong>
                  <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                    Set on individual Fill Type options. Works identically to fabric discount.
                  </p>
                  <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                    <code style={codeStyle}>After Discount = Total × (1 - Fill Discount %)</code>
                  </p>
                  <div style={{ marginTop: "12px", padding: "10px", backgroundColor: "#fff", borderRadius: "4px" }}>
                    <strong style={{ fontSize: "0.85rem" }}>Example:</strong> Fill type with 10% discount enabled<br />
                    $200.00 × (1 - 0.10) = <strong>$180.00</strong>
                  </div>
                </div>
              </div>

              <div style={tipBoxStyle}>
                <strong style={{ color: "#108043" }}>Stacking Discounts:</strong>
                <p style={{ margin: "8px 0 0", color: "#108043" }}>
                  Both discounts can be active simultaneously. They are applied multiplicatively:<br />
                  <code style={codeStyle}>$200 × (1 - 0.15) × (1 - 0.10) = $200 × 0.85 × 0.90 = $153.00</code>
                </p>
              </div>

              {/* ============================================ */}
              {/* SECTION: Multi-Piece Pricing */}
              {/* ============================================ */}
              <h2 style={subheadingStyle}>Multi-Piece Pricing</h2>
              <p style={paragraphStyle}>
                When a profile has <strong>Multi-Piece Mode</strong> enabled, customers can configure multiple cushion pieces in a single order. This is ideal for sofa sets, sectionals, or coordinated collections.
              </p>

              <div style={stepBoxStyle}>
                <strong>How Multi-Piece Pricing Works:</strong>
                <ol style={{ margin: "12px 0 0", paddingLeft: "20px", color: "#6d7175", fontSize: "0.9rem" }}>
                  <li style={{ marginBottom: "8px" }}>Each piece is calculated independently using its own dimensions and options</li>
                  <li style={{ marginBottom: "8px" }}>Individual piece prices are summed to create the combined subtotal</li>
                  <li style={{ marginBottom: "8px" }}>Profile markup (Additional %) is applied <strong>once</strong> to the combined total</li>
                  <li>Discounts and Settings-level markups apply to the final combined total</li>
                </ol>
              </div>

              {/* Multi-Piece Example */}
              <h3 style={{ fontSize: "1rem", fontWeight: "600", marginTop: "20px", marginBottom: "12px" }}>Multi-Piece Example: 2-Piece Sofa Set</h3>
              <div style={{ backgroundColor: "#f0f9ff", padding: "20px", borderRadius: "8px", marginBottom: "20px" }}>
                <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "16px" }}>
                  <div style={{ flex: "1", minWidth: "200px", padding: "12px", backgroundColor: "#fff", borderRadius: "6px", border: "1px solid #e0e0e0" }}>
                    <strong style={{ color: "#1565c0" }}>Piece 1: Seat Cushion</strong>
                    <table style={{ width: "100%", fontSize: "0.8rem", marginTop: "8px" }}>
                      <tbody>
                        <tr><td style={{ color: "#6d7175" }}>Dimensions:</td><td style={{ textAlign: "right" }}>22" × 20" × 4"</td></tr>
                        <tr><td style={{ color: "#6d7175" }}>Fabric:</td><td style={{ textAlign: "right" }}>$70.40</td></tr>
                        <tr><td style={{ color: "#6d7175" }}>Fill:</td><td style={{ textAlign: "right" }}>$88.00</td></tr>
                        <tr><td style={{ color: "#6d7175" }}>Piping (8%):</td><td style={{ textAlign: "right" }}>$12.67</td></tr>
                        <tr style={{ borderTop: "1px solid #ddd" }}><td><strong>Piece 1 Total:</strong></td><td style={{ textAlign: "right" }}><strong>$171.07</strong></td></tr>
                      </tbody>
                    </table>
                  </div>
                  <div style={{ flex: "1", minWidth: "200px", padding: "12px", backgroundColor: "#fff", borderRadius: "6px", border: "1px solid #e0e0e0" }}>
                    <strong style={{ color: "#1565c0" }}>Piece 2: Back Cushion</strong>
                    <table style={{ width: "100%", fontSize: "0.8rem", marginTop: "8px" }}>
                      <tbody>
                        <tr><td style={{ color: "#6d7175" }}>Dimensions:</td><td style={{ textAlign: "right" }}>22" × 18" × 5"</td></tr>
                        <tr><td style={{ color: "#6d7175" }}>Fabric:</td><td style={{ textAlign: "right" }}>$79.20</td></tr>
                        <tr><td style={{ color: "#6d7175" }}>Fill:</td><td style={{ textAlign: "right" }}>$99.00</td></tr>
                        <tr><td style={{ color: "#6d7175" }}>Piping (8%):</td><td style={{ textAlign: "right" }}>$14.26</td></tr>
                        <tr style={{ borderTop: "1px solid #ddd" }}><td><strong>Piece 2 Total:</strong></td><td style={{ textAlign: "right" }}><strong>$192.46</strong></td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <table style={{ width: "100%", fontSize: "0.9rem" }}>
                  <tbody>
                    <tr style={{ borderTop: "2px solid #1976d2" }}>
                      <td style={{ padding: "8px 0" }}><strong>Combined Subtotal:</strong></td>
                      <td style={{ textAlign: "right" }}>$171.07 + $192.46 = <strong>$363.53</strong></td>
                    </tr>
                    <tr>
                      <td style={{ padding: "4px 0", color: "#6d7175" }}>Profile Markup (15%):</td>
                      <td style={{ textAlign: "right" }}>$363.53 × 1.15 = $418.06</td>
                    </tr>
                    <tr style={{ borderTop: "2px solid #008060" }}>
                      <td style={{ padding: "8px 0" }}><strong style={{ color: "#008060" }}>Final Set Price:</strong></td>
                      <td style={{ textAlign: "right" }}><strong style={{ color: "#008060" }}>$418.06</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* ============================================ */}
              {/* SECTION: Weatherproof Mode */}
              {/* ============================================ */}
              <h2 style={subheadingStyle}>Weatherproof Mode Impact</h2>
              <p style={paragraphStyle}>
                When a profile has <strong>Weatherproof Mode</strong> enabled, the surface area calculation excludes the bottom surface. This reflects the reality that outdoor cushions often don't need fabric on the bottom (which sits on furniture).
              </p>

              <div style={stepBoxStyle}>
                <strong>Impact on Pricing:</strong>
                <ul style={{ margin: "12px 0 0", paddingLeft: "20px", color: "#6d7175", fontSize: "0.9rem" }}>
                  <li style={{ marginBottom: "8px" }}><strong>Reduced Fabric Cost:</strong> Less surface area = less fabric needed</li>
                  <li style={{ marginBottom: "8px" }}><strong>Lower Design Cost:</strong> Since design is % of fabric cost, this also decreases</li>
                  <li><strong>Fill Cost Unchanged:</strong> Volume calculation remains the same</li>
                </ul>
              </div>

              {/* Weatherproof Comparison */}
              <h3 style={{ fontSize: "1rem", fontWeight: "600", marginTop: "20px", marginBottom: "12px" }}>Comparison: Standard vs Weatherproof</h3>
              <div style={{ overflowX: "auto", marginBottom: "24px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f5f5f5" }}>
                      <th style={{ padding: "10px", textAlign: "left", borderBottom: "2px solid #ddd" }}>Component</th>
                      <th style={{ padding: "10px", textAlign: "right", borderBottom: "2px solid #ddd" }}>Standard Mode</th>
                      <th style={{ padding: "10px", textAlign: "right", borderBottom: "2px solid #ddd", backgroundColor: "#e8f5e9" }}>Weatherproof Mode</th>
                      <th style={{ padding: "10px", textAlign: "right", borderBottom: "2px solid #ddd" }}>Savings</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #eee", color: "#6d7175" }}>Surface Area (20" × 18" × 4")</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #eee", textAlign: "right" }}>1,024 sq in</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #eee", textAlign: "right", backgroundColor: "#e8f5e9" }}>664 sq in</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #eee", textAlign: "right", color: "#2e7d32" }}>35% less</td>
                    </tr>
                    <tr style={{ backgroundColor: "#fafafa" }}>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #eee" }}>Fabric Cost ($0.08/sq in)</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #eee", textAlign: "right" }}>$81.92</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #eee", textAlign: "right", backgroundColor: "#e8f5e9" }}>$53.12</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #eee", textAlign: "right", color: "#2e7d32" }}>$28.80</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #eee" }}>Design Cost (15%)</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #eee", textAlign: "right" }}>$12.29</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #eee", textAlign: "right", backgroundColor: "#e8f5e9" }}>$7.97</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #eee", textAlign: "right", color: "#2e7d32" }}>$4.32</td>
                    </tr>
                    <tr style={{ backgroundColor: "#fafafa" }}>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #eee" }}>Fill Cost ($0.05/cu in)</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #eee", textAlign: "right" }}>$72.00</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #eee", textAlign: "right", backgroundColor: "#e8f5e9" }}>$72.00</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #eee", textAlign: "right", color: "#6d7175" }}>-</td>
                    </tr>
                    <tr style={{ fontWeight: "bold" }}>
                      <td style={{ padding: "10px", borderTop: "2px solid #ddd" }}>Subtotal</td>
                      <td style={{ padding: "10px", borderTop: "2px solid #ddd", textAlign: "right" }}>$166.21</td>
                      <td style={{ padding: "10px", borderTop: "2px solid #ddd", textAlign: "right", backgroundColor: "#e8f5e9" }}>$133.09</td>
                      <td style={{ padding: "10px", borderTop: "2px solid #ddd", textAlign: "right", color: "#2e7d32" }}>$33.12 (20%)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* ============================================ */}
              {/* SECTION: Settings-Level Calculations */}
              {/* ============================================ */}
              <h2 style={subheadingStyle}>Settings-Level Calculations</h2>
              <p style={paragraphStyle}>
                After component costs and profile adjustments, the global Settings markups are applied. These are configured in the <strong>Settings</strong> page and apply to all calculations across your store.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                <div style={stepBoxStyle}>
                  <strong>1. Conversion Markup</strong>
                  <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                    Applied to raw materials (Fabric + Fill + Ties) to account for manufacturing overhead.
                  </p>
                  <p style={{ margin: "8px 0 0", fontSize: "0.85rem" }}>
                    <code style={codeStyle}>After Conversion = Raw Materials × (1 + Conversion %)</code>
                  </p>
                </div>
                <div style={stepBoxStyle}>
                  <strong>2. Shipping Percentage</strong>
                  <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                    Adds estimated shipping cost as a percentage of the subtotal.
                  </p>
                  <p style={{ margin: "8px 0 0", fontSize: "0.85rem" }}>
                    <code style={codeStyle}>After Shipping = Subtotal × (1 + Shipping %)</code>
                  </p>
                </div>
                <div style={stepBoxStyle}>
                  <strong>3. Labour Percentage</strong>
                  <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                    Adds labour costs as a percentage of the subtotal.
                  </p>
                  <p style={{ margin: "8px 0 0", fontSize: "0.85rem" }}>
                    <code style={codeStyle}>After Labour = Subtotal × (1 + Labour %)</code>
                  </p>
                </div>
                <div style={stepBoxStyle}>
                  <strong>4. Margin</strong>
                  <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                    Final markup using either tier-based or formula-based calculation. See the Settings section for detailed margin calculation methods.
                  </p>
                  <p style={{ margin: "8px 0 0", fontSize: "0.85rem" }}>
                    <code style={codeStyle}>Final Price = Subtotal × (1 + Margin %)</code>
                  </p>
                </div>
              </div>

              <div style={tipBoxStyle}>
                <strong style={{ color: "#108043" }}>For Complete Settings Details:</strong>
                <p style={{ margin: "8px 0 0", color: "#108043" }}>
                  Refer to the <strong>Settings</strong> section of this documentation for comprehensive coverage of Conversion, Shipping, Labour, and Margin calculation methods.
                </p>
              </div>

              {/* ============================================ */}
              {/* SECTION: Complete Calculation Examples */}
              {/* ============================================ */}
              <h2 style={subheadingStyle}>Complete Calculation Examples</h2>
              <p style={paragraphStyle}>
                These step-by-step examples show how all pricing components work together:
              </p>

              {/* Example 1: Simple Single Cushion */}
              <h3 style={{ fontSize: "1rem", fontWeight: "600", marginTop: "24px", marginBottom: "12px", color: "#1565c0" }}>Example 1: Simple Single Cushion</h3>
              <div style={{ backgroundColor: "#e3f2fd", padding: "20px", borderRadius: "8px", marginBottom: "24px" }}>
                <div style={{ marginBottom: "16px", padding: "12px", backgroundColor: "#fff", borderRadius: "6px" }}>
                  <strong>Configuration:</strong>
                  <ul style={{ margin: "8px 0 0", paddingLeft: "20px", color: "#6d7175", fontSize: "0.9rem" }}>
                    <li>Rectangle: 20" × 18" × 4"</li>
                    <li>Fabric: $0.08/sq in (no discount)</li>
                    <li>Fill: $0.05/cu in (no discount)</li>
                    <li>Piping: 8% of subtotal</li>
                    <li>Ties: $12.00 fixed</li>
                    <li>Profile Additional %: 10%</li>
                    <li>Settings: Conversion 15%, Shipping 5%, Labour 8%, Margin 20%</li>
                  </ul>
                </div>
                <table style={{ width: "100%", fontSize: "0.9rem", backgroundColor: "#fff", borderRadius: "6px" }}>
                  <tbody>
                    <tr><td colSpan="2" style={{ padding: "10px", fontWeight: "bold", backgroundColor: "#f5f5f5", borderRadius: "6px 6px 0 0" }}>Step 1: Core Costs</td></tr>
                    <tr><td style={{ padding: "6px 10px", color: "#6d7175" }}>Surface Area:</td><td style={{ textAlign: "right" }}>1,024 sq in</td></tr>
                    <tr><td style={{ padding: "6px 10px", color: "#6d7175" }}>Fabric Cost:</td><td style={{ textAlign: "right" }}>1,024 × $0.08 = $81.92</td></tr>
                    <tr><td style={{ padding: "6px 10px", color: "#6d7175" }}>Volume:</td><td style={{ textAlign: "right" }}>1,440 cu in</td></tr>
                    <tr><td style={{ padding: "6px 10px", color: "#6d7175" }}>Fill Cost:</td><td style={{ textAlign: "right" }}>1,440 × $0.05 = $72.00</td></tr>
                    <tr><td style={{ padding: "6px 10px", color: "#6d7175" }}>Ties:</td><td style={{ textAlign: "right" }}>$12.00</td></tr>
                    <tr style={{ borderTop: "1px solid #ddd" }}><td style={{ padding: "8px 10px" }}><strong>Raw Materials:</strong></td><td style={{ textAlign: "right" }}><strong>$165.92</strong></td></tr>

                    <tr><td colSpan="2" style={{ padding: "10px", fontWeight: "bold", backgroundColor: "#f5f5f5" }}>Step 2: Conversion Markup</td></tr>
                    <tr><td style={{ padding: "6px 10px", color: "#6d7175" }}>After Conversion (15%):</td><td style={{ textAlign: "right" }}>$165.92 × 1.15 = $190.81</td></tr>

                    <tr><td colSpan="2" style={{ padding: "10px", fontWeight: "bold", backgroundColor: "#f5f5f5" }}>Step 3: Percentage Add-ons</td></tr>
                    <tr><td style={{ padding: "6px 10px", color: "#6d7175" }}>Piping (8%):</td><td style={{ textAlign: "right" }}>$190.81 × 0.08 = $15.26</td></tr>
                    <tr style={{ borderTop: "1px solid #ddd" }}><td style={{ padding: "8px 10px" }}><strong>Subtotal:</strong></td><td style={{ textAlign: "right" }}><strong>$206.07</strong></td></tr>

                    <tr><td colSpan="2" style={{ padding: "10px", fontWeight: "bold", backgroundColor: "#f5f5f5" }}>Step 4: Profile Markup</td></tr>
                    <tr><td style={{ padding: "6px 10px", color: "#6d7175" }}>Additional (10%):</td><td style={{ textAlign: "right" }}>$206.07 × 1.10 = $226.68</td></tr>

                    <tr><td colSpan="2" style={{ padding: "10px", fontWeight: "bold", backgroundColor: "#f5f5f5" }}>Step 5: Settings Markups</td></tr>
                    <tr><td style={{ padding: "6px 10px", color: "#6d7175" }}>Shipping (5%):</td><td style={{ textAlign: "right" }}>$226.68 × 1.05 = $238.01</td></tr>
                    <tr><td style={{ padding: "6px 10px", color: "#6d7175" }}>Labour (8%):</td><td style={{ textAlign: "right" }}>$238.01 × 1.08 = $257.05</td></tr>
                    <tr><td style={{ padding: "6px 10px", color: "#6d7175" }}>Margin (20%):</td><td style={{ textAlign: "right" }}>$257.05 × 1.20 = $308.46</td></tr>

                    <tr style={{ borderTop: "3px solid #008060", backgroundColor: "#e8f5e9" }}><td style={{ padding: "12px 10px" }}><strong style={{ color: "#008060", fontSize: "1.1rem" }}>Final Price:</strong></td><td style={{ textAlign: "right" }}><strong style={{ color: "#008060", fontSize: "1.1rem" }}>$308.46</strong></td></tr>
                  </tbody>
                </table>
              </div>

              {/* Example 2: Premium Outdoor Cushion */}
              <h3 style={{ fontSize: "1rem", fontWeight: "600", marginTop: "24px", marginBottom: "12px", color: "#2e7d32" }}>Example 2: Premium Outdoor Cushion with Discounts</h3>
              <div style={{ backgroundColor: "#e8f5e9", padding: "20px", borderRadius: "8px", marginBottom: "24px" }}>
                <div style={{ marginBottom: "16px", padding: "12px", backgroundColor: "#fff", borderRadius: "6px" }}>
                  <strong>Configuration:</strong>
                  <ul style={{ margin: "8px 0 0", paddingLeft: "20px", color: "#6d7175", fontSize: "0.9rem" }}>
                    <li>Rectangle: 24" × 22" × 5" (<strong>Weatherproof Mode</strong>)</li>
                    <li>Premium Sunbrella Fabric: $0.12/sq in with <strong>10% discount</strong></li>
                    <li>High-Density Fill: $0.07/cu in with <strong>5% discount</strong></li>
                    <li>Design: 20% of fabric cost</li>
                    <li>Piping: 10% of subtotal</li>
                    <li>Anti-Skid: 5% of subtotal</li>
                    <li>Profile Additional %: 25% (Premium Collection)</li>
                    <li>Settings: Conversion 15%, Shipping 5%, Labour 8%, Margin 15%</li>
                  </ul>
                </div>
                <table style={{ width: "100%", fontSize: "0.9rem", backgroundColor: "#fff", borderRadius: "6px" }}>
                  <tbody>
                    <tr><td colSpan="2" style={{ padding: "10px", fontWeight: "bold", backgroundColor: "#f5f5f5", borderRadius: "6px 6px 0 0" }}>Step 1: Core Costs (Weatherproof)</td></tr>
                    <tr><td style={{ padding: "6px 10px", color: "#6d7175" }}>Standard Surface Area:</td><td style={{ textAlign: "right" }}>1,976 sq in</td></tr>
                    <tr><td style={{ padding: "6px 10px", color: "#2e7d32" }}>Weatherproof Surface Area:</td><td style={{ textAlign: "right" }}>1,976 - 528 = 1,448 sq in</td></tr>
                    <tr><td style={{ padding: "6px 10px", color: "#6d7175" }}>Fabric Cost:</td><td style={{ textAlign: "right" }}>1,448 × $0.12 = $173.76</td></tr>
                    <tr><td style={{ padding: "6px 10px", color: "#6d7175" }}>Volume:</td><td style={{ textAlign: "right" }}>2,640 cu in</td></tr>
                    <tr><td style={{ padding: "6px 10px", color: "#6d7175" }}>Fill Cost:</td><td style={{ textAlign: "right" }}>2,640 × $0.07 = $184.80</td></tr>
                    <tr style={{ borderTop: "1px solid #ddd" }}><td style={{ padding: "8px 10px" }}><strong>Raw Materials:</strong></td><td style={{ textAlign: "right" }}><strong>$358.56</strong></td></tr>

                    <tr><td colSpan="2" style={{ padding: "10px", fontWeight: "bold", backgroundColor: "#f5f5f5" }}>Step 2: Conversion + Design</td></tr>
                    <tr><td style={{ padding: "6px 10px", color: "#6d7175" }}>After Conversion (15%):</td><td style={{ textAlign: "right" }}>$358.56 × 1.15 = $412.34</td></tr>
                    <tr><td style={{ padding: "6px 10px", color: "#6d7175" }}>Design (20% of fabric):</td><td style={{ textAlign: "right" }}>$173.76 × 0.20 = $34.75</td></tr>
                    <tr style={{ borderTop: "1px solid #ddd" }}><td style={{ padding: "8px 10px" }}><strong>After Design:</strong></td><td style={{ textAlign: "right" }}><strong>$447.09</strong></td></tr>

                    <tr><td colSpan="2" style={{ padding: "10px", fontWeight: "bold", backgroundColor: "#f5f5f5" }}>Step 3: Percentage Add-ons</td></tr>
                    <tr><td style={{ padding: "6px 10px", color: "#6d7175" }}>Piping (10%):</td><td style={{ textAlign: "right" }}>$447.09 × 0.10 = $44.71</td></tr>
                    <tr><td style={{ padding: "6px 10px", color: "#6d7175" }}>Anti-Skid (5%):</td><td style={{ textAlign: "right" }}>$447.09 × 0.05 = $22.35</td></tr>
                    <tr style={{ borderTop: "1px solid #ddd" }}><td style={{ padding: "8px 10px" }}><strong>Subtotal:</strong></td><td style={{ textAlign: "right" }}><strong>$514.15</strong></td></tr>

                    <tr><td colSpan="2" style={{ padding: "10px", fontWeight: "bold", backgroundColor: "#f5f5f5" }}>Step 4: Profile Markup</td></tr>
                    <tr><td style={{ padding: "6px 10px", color: "#6d7175" }}>Additional (25%):</td><td style={{ textAlign: "right" }}>$514.15 × 1.25 = $642.69</td></tr>

                    <tr><td colSpan="2" style={{ padding: "10px", fontWeight: "bold", backgroundColor: "#fff3e0" }}>Step 5: Discounts</td></tr>
                    <tr><td style={{ padding: "6px 10px", color: "#e65100" }}>Fabric Discount (10%):</td><td style={{ textAlign: "right" }}>$642.69 × 0.90 = $578.42</td></tr>
                    <tr><td style={{ padding: "6px 10px", color: "#e65100" }}>Fill Discount (5%):</td><td style={{ textAlign: "right" }}>$578.42 × 0.95 = $549.50</td></tr>

                    <tr><td colSpan="2" style={{ padding: "10px", fontWeight: "bold", backgroundColor: "#f5f5f5" }}>Step 6: Settings Markups</td></tr>
                    <tr><td style={{ padding: "6px 10px", color: "#6d7175" }}>Shipping (5%):</td><td style={{ textAlign: "right" }}>$549.50 × 1.05 = $576.98</td></tr>
                    <tr><td style={{ padding: "6px 10px", color: "#6d7175" }}>Labour (8%):</td><td style={{ textAlign: "right" }}>$576.98 × 1.08 = $623.14</td></tr>
                    <tr><td style={{ padding: "6px 10px", color: "#6d7175" }}>Margin (15%):</td><td style={{ textAlign: "right" }}>$623.14 × 1.15 = $716.61</td></tr>

                    <tr style={{ borderTop: "3px solid #008060", backgroundColor: "#c8e6c9" }}><td style={{ padding: "12px 10px" }}><strong style={{ color: "#008060", fontSize: "1.1rem" }}>Final Price:</strong></td><td style={{ textAlign: "right" }}><strong style={{ color: "#008060", fontSize: "1.1rem" }}>$716.61</strong></td></tr>
                  </tbody>
                </table>
              </div>

              {/* Example 3: Multi-Piece Set */}
              <h3 style={{ fontSize: "1rem", fontWeight: "600", marginTop: "24px", marginBottom: "12px", color: "#7b1fa2" }}>Example 3: Multi-Piece Loveseat Set</h3>
              <div style={{ backgroundColor: "#f3e5f5", padding: "20px", borderRadius: "8px", marginBottom: "24px" }}>
                <div style={{ marginBottom: "16px", padding: "12px", backgroundColor: "#fff", borderRadius: "6px" }}>
                  <strong>Configuration:</strong>
                  <ul style={{ margin: "8px 0 0", paddingLeft: "20px", color: "#6d7175", fontSize: "0.9rem" }}>
                    <li><strong>Multi-Piece Mode</strong> enabled</li>
                    <li>Piece 1 (Seat): 48" × 22" × 4"</li>
                    <li>Piece 2 (Back): 48" × 20" × 6"</li>
                    <li>Fabric: $0.09/sq in</li>
                    <li>Fill: $0.05/cu in</li>
                    <li>Profile Additional %: 15%</li>
                    <li>Settings: Conversion 10%, no other markups for simplicity</li>
                  </ul>
                </div>

                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "16px" }}>
                  <div style={{ flex: "1", minWidth: "280px", padding: "12px", backgroundColor: "#fff", borderRadius: "6px" }}>
                    <strong style={{ color: "#7b1fa2" }}>Piece 1: Seat Cushion (48" × 22" × 4")</strong>
                    <table style={{ width: "100%", fontSize: "0.8rem", marginTop: "8px" }}>
                      <tbody>
                        <tr><td style={{ color: "#6d7175" }}>Surface Area:</td><td style={{ textAlign: "right" }}>2,672 sq in</td></tr>
                        <tr><td style={{ color: "#6d7175" }}>Fabric Cost:</td><td style={{ textAlign: "right" }}>$240.48</td></tr>
                        <tr><td style={{ color: "#6d7175" }}>Volume:</td><td style={{ textAlign: "right" }}>4,224 cu in</td></tr>
                        <tr><td style={{ color: "#6d7175" }}>Fill Cost:</td><td style={{ textAlign: "right" }}>$211.20</td></tr>
                        <tr><td style={{ color: "#6d7175" }}>Raw Materials:</td><td style={{ textAlign: "right" }}>$451.68</td></tr>
                        <tr><td style={{ color: "#6d7175" }}>After Conversion (10%):</td><td style={{ textAlign: "right" }}>$496.85</td></tr>
                        <tr style={{ borderTop: "1px solid #ddd" }}><td><strong>Piece 1 Total:</strong></td><td style={{ textAlign: "right" }}><strong>$496.85</strong></td></tr>
                      </tbody>
                    </table>
                  </div>
                  <div style={{ flex: "1", minWidth: "280px", padding: "12px", backgroundColor: "#fff", borderRadius: "6px" }}>
                    <strong style={{ color: "#7b1fa2" }}>Piece 2: Back Cushion (48" × 20" × 6")</strong>
                    <table style={{ width: "100%", fontSize: "0.8rem", marginTop: "8px" }}>
                      <tbody>
                        <tr><td style={{ color: "#6d7175" }}>Surface Area:</td><td style={{ textAlign: "right" }}>2,736 sq in</td></tr>
                        <tr><td style={{ color: "#6d7175" }}>Fabric Cost:</td><td style={{ textAlign: "right" }}>$246.24</td></tr>
                        <tr><td style={{ color: "#6d7175" }}>Volume:</td><td style={{ textAlign: "right" }}>5,760 cu in</td></tr>
                        <tr><td style={{ color: "#6d7175" }}>Fill Cost:</td><td style={{ textAlign: "right" }}>$288.00</td></tr>
                        <tr><td style={{ color: "#6d7175" }}>Raw Materials:</td><td style={{ textAlign: "right" }}>$534.24</td></tr>
                        <tr><td style={{ color: "#6d7175" }}>After Conversion (10%):</td><td style={{ textAlign: "right" }}>$587.66</td></tr>
                        <tr style={{ borderTop: "1px solid #ddd" }}><td><strong>Piece 2 Total:</strong></td><td style={{ textAlign: "right" }}><strong>$587.66</strong></td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <table style={{ width: "100%", fontSize: "0.9rem", backgroundColor: "#fff", borderRadius: "6px" }}>
                  <tbody>
                    <tr><td colSpan="2" style={{ padding: "10px", fontWeight: "bold", backgroundColor: "#e1bee7" }}>Combined Calculation</td></tr>
                    <tr><td style={{ padding: "8px 10px" }}>Piece 1 + Piece 2:</td><td style={{ textAlign: "right" }}>$496.85 + $587.66 = $1,084.51</td></tr>
                    <tr><td style={{ padding: "8px 10px", color: "#6d7175" }}>Profile Additional (15%):</td><td style={{ textAlign: "right" }}>$1,084.51 × 1.15 = $1,247.19</td></tr>
                    <tr style={{ borderTop: "3px solid #7b1fa2", backgroundColor: "#e1bee7" }}><td style={{ padding: "12px 10px" }}><strong style={{ color: "#7b1fa2", fontSize: "1.1rem" }}>Set Price:</strong></td><td style={{ textAlign: "right" }}><strong style={{ color: "#7b1fa2", fontSize: "1.1rem" }}>$1,247.19</strong></td></tr>
                  </tbody>
                </table>
              </div>

              {/* ============================================ */}
              {/* SECTION: Pricing Order Summary */}
              {/* ============================================ */}
              <h2 style={subheadingStyle}>Pricing Order Summary</h2>
              <p style={paragraphStyle}>
                Here's a visual flowchart showing the complete order of pricing operations:
              </p>

              <div style={{ backgroundColor: "#f5f5f5", padding: "24px", borderRadius: "12px", marginBottom: "24px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {/* Row 1: Core Costs */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ backgroundColor: "#e3f2fd", padding: "12px 16px", borderRadius: "8px", border: "2px solid #1976d2", minWidth: "200px" }}>
                      <strong style={{ color: "#1565c0" }}>1. Core Costs</strong>
                      <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#6d7175" }}>Fabric + Fill + Fixed Add-ons</p>
                    </div>
                    <span style={{ fontSize: "1.5rem", color: "#999" }}>→</span>
                    <div style={{ backgroundColor: "#fff3e0", padding: "12px 16px", borderRadius: "8px", border: "2px solid #ff9800", minWidth: "200px" }}>
                      <strong style={{ color: "#e65100" }}>2. Conversion %</strong>
                      <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#6d7175" }}>Manufacturing overhead</p>
                    </div>
                  </div>

                  {/* Arrow Down */}
                  <div style={{ textAlign: "center", fontSize: "1.5rem", color: "#999" }}>↓</div>

                  {/* Row 2: Design + % Add-ons */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ backgroundColor: "#fce4ec", padding: "12px 16px", borderRadius: "8px", border: "2px solid #e91e63", minWidth: "200px" }}>
                      <strong style={{ color: "#c2185b" }}>3. Design %</strong>
                      <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#6d7175" }}>% of fabric cost</p>
                    </div>
                    <span style={{ fontSize: "1.5rem", color: "#999" }}>→</span>
                    <div style={{ backgroundColor: "#f3e5f5", padding: "12px 16px", borderRadius: "8px", border: "2px solid #9c27b0", minWidth: "200px" }}>
                      <strong style={{ color: "#7b1fa2" }}>4. % Add-ons</strong>
                      <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#6d7175" }}>Piping, Button, Anti-Skid, etc.</p>
                    </div>
                  </div>

                  {/* Arrow Down */}
                  <div style={{ textAlign: "center", fontSize: "1.5rem", color: "#999" }}>↓</div>

                  {/* Row 3: Profile + Discounts */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ backgroundColor: "#e8f5e9", padding: "12px 16px", borderRadius: "8px", border: "2px solid #4caf50", minWidth: "200px" }}>
                      <strong style={{ color: "#2e7d32" }}>5. Profile Markup</strong>
                      <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#6d7175" }}>Additional %</p>
                    </div>
                    <span style={{ fontSize: "1.5rem", color: "#999" }}>→</span>
                    <div style={{ backgroundColor: "#ffebee", padding: "12px 16px", borderRadius: "8px", border: "2px solid #f44336", minWidth: "200px" }}>
                      <strong style={{ color: "#c62828" }}>6. Discounts</strong>
                      <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#6d7175" }}>Fabric + Fill discounts</p>
                    </div>
                  </div>

                  {/* Arrow Down */}
                  <div style={{ textAlign: "center", fontSize: "1.5rem", color: "#999" }}>↓</div>

                  {/* Row 4: Settings markups */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    <div style={{ backgroundColor: "#e0f7fa", padding: "12px 16px", borderRadius: "8px", border: "2px solid #00bcd4", minWidth: "140px" }}>
                      <strong style={{ color: "#00838f" }}>7. Shipping %</strong>
                    </div>
                    <span style={{ fontSize: "1.5rem", color: "#999" }}>→</span>
                    <div style={{ backgroundColor: "#fff8e1", padding: "12px 16px", borderRadius: "8px", border: "2px solid #ffc107", minWidth: "140px" }}>
                      <strong style={{ color: "#ff8f00" }}>8. Labour %</strong>
                    </div>
                    <span style={{ fontSize: "1.5rem", color: "#999" }}>→</span>
                    <div style={{ backgroundColor: "#e8eaf6", padding: "12px 16px", borderRadius: "8px", border: "2px solid #3f51b5", minWidth: "140px" }}>
                      <strong style={{ color: "#303f9f" }}>9. Margin</strong>
                    </div>
                  </div>

                  {/* Arrow Down */}
                  <div style={{ textAlign: "center", fontSize: "1.5rem", color: "#999" }}>↓</div>

                  {/* Final Price */}
                  <div style={{ textAlign: "center" }}>
                    <div style={{ display: "inline-block", backgroundColor: "#008060", padding: "16px 32px", borderRadius: "8px" }}>
                      <strong style={{ color: "#fff", fontSize: "1.2rem" }}>FINAL PRICE</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* ============================================ */}
              {/* SECTION: Tips */}
              {/* ============================================ */}
              <h2 style={subheadingStyle}>Tips for Setting Prices</h2>

              <div style={tipBoxStyle}>
                <strong style={{ color: "#108043" }}>Start with Material Costs:</strong>
                <p style={{ margin: "8px 0 0", color: "#108043" }}>
                  Get accurate pricing from your fabric and fill suppliers. These are the foundation of your pricing—if these are wrong, everything else will be off.
                </p>
              </div>

              <div style={tipBoxStyle}>
                <strong style={{ color: "#108043" }}>Test at Different Sizes:</strong>
                <p style={{ margin: "8px 0 0", color: "#108043" }}>
                  Create test orders for small (dining chair), medium (lounge chair), and large (sofa) cushions. Verify that margins are acceptable at each size point.
                </p>
              </div>

              <div style={tipBoxStyle}>
                <strong style={{ color: "#108043" }}>Compare to Competitors:</strong>
                <p style={{ margin: "8px 0 0", color: "#108043" }}>
                  Check competitor pricing for similar products. Use the Additional Percentage to adjust margins to stay competitive while maintaining profitability.
                </p>
              </div>

              <div style={tipBoxStyle}>
                <strong style={{ color: "#108043" }}>Monitor Your Margins:</strong>
                <p style={{ margin: "8px 0 0", color: "#108043" }}>
                  Enable Debug Pricing during setup to see the full breakdown. Track which products have healthy margins and which might need adjustment.
                </p>
              </div>

              <div style={warningBoxStyle}>
                <strong style={{ color: "#e65100" }}>Watch for Compounding Effects:</strong>
                <p style={{ margin: "8px 0 0", color: "#e65100" }}>
                  Multiple percentage markups compound multiplicatively. A 10% conversion + 5% shipping + 8% labour + 20% margin = 49.7% total markup, not 43%. Test complete calculations to avoid surprises.
                </p>
              </div>
            </div>
          )}

          {/* Product Linking */}
          {activeSection === "product-linking" && (
            <div>
              <h1 style={headingStyle}>Product Linking</h1>
              <p style={paragraphStyle}>
                To display the calculator on your Shopify product pages, you need to link a profile to each product.
              </p>

              <h2 style={subheadingStyle}>How Linking Works</h2>
              <p style={paragraphStyle}>
                The calculator reads profile information from product metafields. When a customer views a product with a linked profile, the calculator appears with the configured options.
              </p>

              <h2 style={subheadingStyle}>Linking a Profile to a Product</h2>
              <ol style={listStyle}>
                <li style={listItemStyle}>Go to <strong>Settings</strong> in the sidebar</li>
                <li style={listItemStyle}>Find the Product Linking section</li>
                <li style={listItemStyle}>Select the product you want to configure</li>
                <li style={listItemStyle}>Choose which profile to assign</li>
                <li style={listItemStyle}>Save the configuration</li>
              </ol>

              <div style={warningBoxStyle}>
                <strong style={{ color: "#e65100" }}>Important:</strong>
                <p style={{ margin: "8px 0 0", color: "#e65100" }}>
                  Products without an assigned profile will use the Default Profile (if one is set). Products with neither will not show the calculator.
                </p>
              </div>

              <h2 style={subheadingStyle}>Theme Integration</h2>
              <p style={paragraphStyle}>
                The calculator widget is added to your theme automatically through the Shopify app embed. Make sure the app embed is enabled in your theme settings:
              </p>
              <ol style={listStyle}>
                <li style={listItemStyle}>Go to Online Store &gt; Themes &gt; Customize</li>
                <li style={listItemStyle}>Click Theme Settings (gear icon)</li>
                <li style={listItemStyle}>Navigate to App Embeds</li>
                <li style={listItemStyle}>Enable the Cushion Calculator embed</li>
                <li style={listItemStyle}>Save changes</li>
              </ol>

              <h2 style={subheadingStyle}>Testing the Calculator</h2>
              <p style={paragraphStyle}>
                After linking a profile:
              </p>
              <ol style={listStyle}>
                <li style={listItemStyle}>View the product on your storefront</li>
                <li style={listItemStyle}>The calculator should appear on the product page</li>
                <li style={listItemStyle}>Test different options to verify pricing</li>
                <li style={listItemStyle}>Complete a test order to verify cart behavior</li>
              </ol>

              <div style={tipBoxStyle}>
                <strong style={{ color: "#108043" }}>Troubleshooting:</strong>
                <p style={{ margin: "8px 0 0", color: "#108043" }}>
                  If the calculator doesn't appear, check:<br />
                  - App embed is enabled in theme settings<br />
                  - Profile is linked to the product<br />
                  - Profile has at least one visible section<br />
                  - Shapes, fabrics, and fills exist and are active
                </p>
              </div>
            </div>
          )}

          {/* Settings */}
          {activeSection === "settings" && (
            <div>
              <h1 style={headingStyle}>Settings</h1>
              <p style={paragraphStyle}>
                The Settings page contains global configuration options that affect how the calculator performs calculations across your entire store. These settings control debug visibility, cost markups, and margin calculation methods.
              </p>

              <div style={{ ...stepBoxStyle, backgroundColor: "#e8f4fd", border: "1px solid #b3d4fc" }}>
                <strong style={{ color: "#0066cc" }}>Settings Location</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Access settings via <strong>Settings</strong> in the sidebar navigation. Changes affect all calculations immediately after saving.
                </p>
              </div>

              {/* Debug Settings */}
              <h2 style={subheadingStyle}>Debug Settings</h2>
              <p style={paragraphStyle}>
                Debug settings control whether pricing information is visible throughout the calculator interface.
              </p>

              <div style={stepBoxStyle}>
                <strong>Enable Debug Pricing</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  A toggle that controls price visibility across the calculator.
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", marginBottom: "24px" }}>
                <div style={{ ...stepBoxStyle, margin: 0, backgroundColor: "#e8f5e9", borderLeft: "4px solid #4caf50" }}>
                  <strong style={{ color: "#388e3c" }}>When Enabled (Debug Mode)</strong>
                  <ul style={{ margin: "8px 0 0", paddingLeft: "20px", color: "#555", fontSize: "0.85rem" }}>
                    <li>Prices shown on option cards</li>
                    <li>Fabric prices visible in browser</li>
                    <li>Prices shown in modals</li>
                    <li>Full price breakdown displayed</li>
                  </ul>
                </div>
                <div style={{ ...stepBoxStyle, margin: 0, backgroundColor: "#ffebee", borderLeft: "4px solid #f44336" }}>
                  <strong style={{ color: "#c62828" }}>When Disabled (Production Mode)</strong>
                  <ul style={{ margin: "8px 0 0", paddingLeft: "20px", color: "#555", fontSize: "0.85rem" }}>
                    <li>Prices hidden from option cards</li>
                    <li>Fabric prices hidden</li>
                    <li>Modal prices hidden</li>
                    <li>Only final "Add to Cart" price shown</li>
                  </ul>
                </div>
              </div>

              <div style={tipBoxStyle}>
                <strong style={{ color: "#108043" }}>Tip:</strong>
                <p style={{ margin: "8px 0 0", color: "#108043" }}>
                  Enable debug pricing during setup and testing to verify calculations. Disable it for production if you don't want customers to see individual component prices.
                </p>
              </div>

              {/* Cost Markup Settings */}
              <h2 style={subheadingStyle}>Cost Markup Settings</h2>
              <p style={paragraphStyle}>
                These settings add percentage-based markups to your base costs. Understanding the calculation order is crucial for accurate pricing.
              </p>

              <h3 style={{ fontSize: "1rem", fontWeight: "600", marginTop: "16px", marginBottom: "12px" }}>The Three Markup Types</h3>

              <div style={stepBoxStyle}>
                <strong>Conversion Markup (%)</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Applied FIRST to raw material costs (Fabric + Fill + Ties) before any other calculations. This accounts for manufacturing conversion costs.
                </p>
                <p style={{ margin: "8px 0 0", color: "#555", fontSize: "0.85rem" }}>
                  <strong>Example:</strong> Raw materials = $100, Conversion = 20% → $100 × 1.20 = $120
                </p>
              </div>

              <div style={stepBoxStyle}>
                <strong>Shipping Cost (%)</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Percentage of the subtotal (after conversion) to add for shipping. Default is 100%.
                </p>
                <p style={{ margin: "8px 0 0", color: "#555", fontSize: "0.85rem" }}>
                  <strong>Example:</strong> Subtotal = $150, Shipping = 100% → $150 × 1.00 = $150 shipping cost
                </p>
              </div>

              <div style={stepBoxStyle}>
                <strong>Labour Cost (%)</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Percentage of the subtotal (after conversion) to add for labour. Default is 100%.
                </p>
                <p style={{ margin: "8px 0 0", color: "#555", fontSize: "0.85rem" }}>
                  <strong>Example:</strong> Subtotal = $150, Labour = 100% → $150 × 1.00 = $150 labour cost
                </p>
              </div>

              {/* Calculation Order */}
              <h3 style={{ fontSize: "1rem", fontWeight: "600", marginTop: "24px", marginBottom: "12px" }}>Calculation Order</h3>
              <p style={paragraphStyle}>
                Understanding the order of operations is essential. Here's how the pricing formula works:
              </p>

              <div style={{ ...stepBoxStyle, backgroundColor: "#f5f5f5" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ backgroundColor: "#1976d2", color: "white", padding: "4px 10px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: 600 }}>Step 1</span>
                    <span style={{ fontSize: "0.9rem" }}>Raw Materials = (Fabric + Fill + Ties)</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ backgroundColor: "#388e3c", color: "white", padding: "4px 10px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: 600 }}>Step 2</span>
                    <span style={{ fontSize: "0.9rem" }}>After Conversion = Raw Materials × (1 + Conversion %)</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ backgroundColor: "#f57c00", color: "white", padding: "4px 10px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: 600 }}>Step 3</span>
                    <span style={{ fontSize: "0.9rem" }}>Subtotal = After Conversion + Add-ons (Piping, Button, etc.)</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ backgroundColor: "#7b1fa2", color: "white", padding: "4px 10px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: 600 }}>Step 4</span>
                    <span style={{ fontSize: "0.9rem" }}>Shipping = Subtotal × Shipping %</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ backgroundColor: "#c62828", color: "white", padding: "4px 10px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: 600 }}>Step 5</span>
                    <span style={{ fontSize: "0.9rem" }}>Labour = Subtotal × Labour %</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", borderTop: "2px solid #008060", paddingTop: "8px", marginTop: "4px" }}>
                    <span style={{ backgroundColor: "#008060", color: "white", padding: "4px 10px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: 600 }}>Total</span>
                    <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>Total = Subtotal + Shipping + Labour</span>
                  </div>
                </div>
              </div>

              {/* Example Calculation */}
              <h3 style={{ fontSize: "1rem", fontWeight: "600", marginTop: "24px", marginBottom: "12px" }}>Example Calculation</h3>
              <div style={{ ...stepBoxStyle, backgroundColor: "#f0f9ff" }}>
                <p style={{ margin: "0 0 12px", fontWeight: 600, color: "#0066cc" }}>Settings: Conversion 20%, Shipping 100%, Labour 100%</p>
                <table style={{ width: "100%", fontSize: "0.9rem" }}>
                  <tbody>
                    <tr><td style={{ padding: "4px 0", color: "#6d7175" }}>Fabric + Fill + Ties (Raw Materials)</td><td style={{ textAlign: "right" }}>$100.00</td></tr>
                    <tr><td style={{ padding: "4px 0" }}>After Conversion (×1.20)</td><td style={{ textAlign: "right" }}>$120.00</td></tr>
                    <tr><td style={{ padding: "4px 0" }}>Add-ons (Piping 10% = $12)</td><td style={{ textAlign: "right" }}>$12.00</td></tr>
                    <tr style={{ borderTop: "1px solid #ddd" }}><td style={{ padding: "8px 0 4px" }}><strong>Subtotal</strong></td><td style={{ textAlign: "right" }}><strong>$132.00</strong></td></tr>
                    <tr><td style={{ padding: "4px 0" }}>Shipping (100% of $132)</td><td style={{ textAlign: "right" }}>$132.00</td></tr>
                    <tr><td style={{ padding: "4px 0" }}>Labour (100% of $132)</td><td style={{ textAlign: "right" }}>$132.00</td></tr>
                    <tr style={{ borderTop: "2px solid #008060" }}><td style={{ padding: "8px 0 4px" }}><strong style={{ color: "#008060" }}>Total</strong></td><td style={{ textAlign: "right" }}><strong style={{ color: "#008060" }}>$396.00</strong></td></tr>
                  </tbody>
                </table>
              </div>

              {/* Margin Calculation Method */}
              <h2 style={subheadingStyle}>Margin Calculation Method</h2>
              <p style={paragraphStyle}>
                Choose how margin adjustments are calculated. This determines how much markup is applied on top of the subtotal before shipping and labour.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", marginBottom: "24px" }}>
                <div style={{ ...stepBoxStyle, margin: 0, borderLeft: "4px solid #1976d2" }}>
                  <strong style={{ color: "#1976d2" }}>Tier-Based (Price Ranges)</strong>
                  <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                    Uses predefined price ranges with fixed margin percentages. Configure tiers in the <strong>Margins</strong> page.
                  </p>
                  <p style={{ margin: "8px 0 0", color: "#555", fontSize: "0.85rem" }}>
                    <strong>Best for:</strong> Simple pricing, clear percentage brackets
                  </p>
                </div>
                <div style={{ ...stepBoxStyle, margin: 0, borderLeft: "4px solid #7b1fa2" }}>
                  <strong style={{ color: "#7b1fa2" }}>Formula-Based (Logarithmic)</strong>
                  <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                    Uses natural logarithm (ln) formulas for smooth, dynamic margin curves.
                  </p>
                  <p style={{ margin: "8px 0 0", color: "#555", fontSize: "0.85rem" }}>
                    <strong>Best for:</strong> Precise control, smooth margin transitions
                  </p>
                </div>
              </div>

              {/* Tier-Based Method */}
              <h3 style={{ fontSize: "1rem", fontWeight: "600", marginTop: "24px", marginBottom: "12px" }}>Tier-Based Method</h3>
              <p style={paragraphStyle}>
                With tier-based margins, you define price ranges and the margin percentage for each:
              </p>
              <div style={stepBoxStyle}>
                <p style={{ margin: "0", fontSize: "0.9rem" }}>
                  <strong>Example Tiers:</strong><br />
                  $0 - $100 → 50% margin<br />
                  $101 - $300 → 35% margin<br />
                  $301 - $500 → 25% margin<br />
                  $501+ → 15% margin
                </p>
              </div>
              <p style={paragraphStyle}>
                Configure your tiers in the <strong>Margins</strong> page (separate from Settings).
              </p>

              {/* Formula-Based Method */}
              <h3 style={{ fontSize: "1rem", fontWeight: "600", marginTop: "24px", marginBottom: "12px" }}>Formula-Based Method</h3>
              <p style={paragraphStyle}>
                The formula-based method uses logarithmic calculations to create smooth margin curves. It has three zones:
              </p>

              {/* Zone 1: Flat Margin */}
              <div style={{ ...stepBoxStyle, backgroundColor: "#fff3cd", borderLeft: "4px solid #ffc107" }}>
                <strong style={{ color: "#856404" }}>Zone 1: Flat Margin (Subtotal ≤ Threshold)</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  For very small orders, a flat margin percentage is applied instead of the formula. This prevents unreasonably high margins on low-value items.
                </p>
                <div style={{ marginTop: "12px", padding: "10px", backgroundColor: "#fff", borderRadius: "4px" }}>
                  <p style={{ margin: "0", fontSize: "0.85rem" }}>
                    <strong>Fields:</strong><br />
                    • <code style={codeStyle}>Flat Margin Threshold</code> - Dollar amount (default: $50)<br />
                    • <code style={codeStyle}>Flat Margin Percent</code> - Fixed margin % (default: 100%)
                  </p>
                  <p style={{ margin: "8px 0 0", fontSize: "0.85rem" }}>
                    <strong>Example:</strong> If subtotal is $30 and threshold is $50, apply 100% flat margin → $30 × 2 = $60 final
                  </p>
                </div>
              </div>

              {/* Zone 2: Low Range Formula */}
              <div style={{ ...stepBoxStyle, backgroundColor: "#e8f4f0", borderLeft: "4px solid #4caf50" }}>
                <strong style={{ color: "#2e7d32" }}>Zone 2: Low Range Formula (Threshold &lt; Subtotal ≤ Formula Threshold)</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  For mid-range orders, uses the low range logarithmic formula.
                </p>
                <div style={{ marginTop: "12px", padding: "10px", backgroundColor: "#fff", borderRadius: "4px" }}>
                  <p style={{ margin: "0", fontFamily: "monospace", fontSize: "0.9rem" }}>
                    Margin % = <code style={codeStyle}>Low Constant</code> - <code style={codeStyle}>Low Coefficient</code> × ln(subtotal)
                  </p>
                  <p style={{ margin: "8px 0 0", fontSize: "0.85rem" }}>
                    <strong>Default:</strong> Margin % = 300 - 52 × ln(subtotal)
                  </p>
                  <p style={{ margin: "8px 0 0", fontSize: "0.85rem" }}>
                    <strong>Example:</strong> Subtotal $100 → 300 - 52 × ln(100) = 300 - 52 × 4.61 = 60.3% margin
                  </p>
                </div>
              </div>

              {/* Zone 3: High Range Formula */}
              <div style={{ ...stepBoxStyle, backgroundColor: "#f3e5f5", borderLeft: "4px solid #9c27b0" }}>
                <strong style={{ color: "#7b1fa2" }}>Zone 3: High Range Formula (Subtotal &gt; Formula Threshold)</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  For high-value orders, uses the high range logarithmic formula with gentler decay.
                </p>
                <div style={{ marginTop: "12px", padding: "10px", backgroundColor: "#fff", borderRadius: "4px" }}>
                  <p style={{ margin: "0", fontFamily: "monospace", fontSize: "0.9rem" }}>
                    Margin % = <code style={codeStyle}>High Constant</code> - <code style={codeStyle}>High Coefficient</code> × ln(subtotal)
                  </p>
                  <p style={{ margin: "8px 0 0", fontSize: "0.85rem" }}>
                    <strong>Default:</strong> Margin % = 120 - 20 × ln(subtotal)
                  </p>
                  <p style={{ margin: "8px 0 0", fontSize: "0.85rem" }}>
                    <strong>Example:</strong> Subtotal $500 → 120 - 20 × ln(500) = 120 - 20 × 6.21 = -4.2% → 0% (minimum)
                  </p>
                </div>
              </div>

              {/* Formula Example Table */}
              <h3 style={{ fontSize: "1rem", fontWeight: "600", marginTop: "24px", marginBottom: "12px" }}>Sample Formula Calculations</h3>
              <div style={{ overflowX: "auto", marginBottom: "24px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f5f5f5" }}>
                      <th style={{ padding: "10px", textAlign: "left", borderBottom: "2px solid #ddd" }}>Subtotal</th>
                      <th style={{ padding: "10px", textAlign: "left", borderBottom: "2px solid #ddd" }}>Zone</th>
                      <th style={{ padding: "10px", textAlign: "left", borderBottom: "2px solid #ddd" }}>Margin %</th>
                      <th style={{ padding: "10px", textAlign: "left", borderBottom: "2px solid #ddd" }}>Final Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #eee" }}>$30</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #eee", color: "#856404" }}>Flat (≤$50)</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #eee" }}>100%</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #eee" }}>$60.00</td>
                    </tr>
                    <tr style={{ backgroundColor: "#fafafa" }}>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #eee" }}>$100</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #eee", color: "#2e7d32" }}>Low Range</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #eee" }}>60.3%</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #eee" }}>$160.30</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #eee" }}>$200</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #eee", color: "#2e7d32" }}>Low Range</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #eee" }}>24.4%</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #eee" }}>$248.80</td>
                    </tr>
                    <tr style={{ backgroundColor: "#fafafa" }}>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #eee" }}>$400</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #eee", color: "#2e7d32" }}>Low Range</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #eee" }}>-11.5% → 0%</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #eee" }}>$400.00</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #eee" }}>$500</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #eee", color: "#7b1fa2" }}>High Range</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #eee" }}>-4.2% → 0%</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #eee" }}>$500.00</td>
                    </tr>
                    <tr style={{ backgroundColor: "#fafafa" }}>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #eee" }}>$1000</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #eee", color: "#7b1fa2" }}>High Range</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #eee" }}>-18.2% → 0%</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #eee" }}>$1000.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={warningBoxStyle}>
                <strong style={{ color: "#e65100" }}>Note on Negative Margins:</strong>
                <p style={{ margin: "8px 0 0", color: "#e65100" }}>
                  When the formula produces a negative margin, it's treated as 0% (no additional markup). The default formula constants are designed to reduce margins for higher-value orders, eventually reaching 0% for very large orders.
                </p>
              </div>

              {/* Setup Guide */}
              <h2 style={subheadingStyle}>Step-by-Step Setup Guide</h2>
              <ol style={listStyle}>
                <li style={listItemStyle}>
                  <strong>Enable Debug Pricing</strong> - Start with debug mode on to see all prices during setup
                </li>
                <li style={listItemStyle}>
                  <strong>Set Conversion Markup</strong> - Determine your manufacturing overhead (typically 10-30%)
                </li>
                <li style={listItemStyle}>
                  <strong>Configure Shipping %</strong> - Set based on your average shipping costs relative to product value
                </li>
                <li style={listItemStyle}>
                  <strong>Configure Labour %</strong> - Set based on your manufacturing labour costs
                </li>
                <li style={listItemStyle}>
                  <strong>Choose Margin Method</strong> - Tier-based for simplicity, formula-based for precision
                </li>
                <li style={listItemStyle}>
                  <strong>Test Calculations</strong> - Use the example calculator in Settings to verify pricing
                </li>
                <li style={listItemStyle}>
                  <strong>Disable Debug Pricing</strong> - Turn off for production when satisfied with calculations
                </li>
              </ol>

              {/* Tips */}
              <h2 style={subheadingStyle}>Tips & Best Practices</h2>

              <div style={tipBoxStyle}>
                <strong style={{ color: "#108043" }}>Test with Real Scenarios:</strong>
                <p style={{ margin: "8px 0 0", color: "#108043" }}>
                  Create test orders with small, medium, and large cushion sizes to verify your pricing works across the range. Check that margins are acceptable at each price point.
                </p>
              </div>

              <div style={tipBoxStyle}>
                <strong style={{ color: "#108043" }}>Monitor Margin Consistency:</strong>
                <p style={{ margin: "8px 0 0", color: "#108043" }}>
                  If using formula-based margins, watch for unexpected results at the boundaries between zones. Adjust constants if margins jump too abruptly.
                </p>
              </div>

              <div style={tipBoxStyle}>
                <strong style={{ color: "#108043" }}>Consider Your Business Model:</strong>
                <p style={{ margin: "8px 0 0", color: "#108043" }}>
                  Higher shipping/labour percentages work well for custom manufacturing. Lower percentages suit businesses with streamlined operations. Adjust to match your actual cost structure.
                </p>
              </div>

              <div style={warningBoxStyle}>
                <strong style={{ color: "#e65100" }}>Remember to Save:</strong>
                <p style={{ margin: "8px 0 0", color: "#e65100" }}>
                  Settings changes only take effect after clicking "Save Settings". The example calculation in the Settings page updates in real-time, but actual calculator pricing uses saved values.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </s-page>
  );
}
