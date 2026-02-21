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
              <p style={paragraphStyle}>
                Fill types represent the stuffing materials for cushions. The fill cost is calculated by multiplying the cushion's volume by the price per cubic inch.
              </p>

              <h2 style={subheadingStyle}>Creating a Fill Type</h2>
              <ol style={listStyle}>
                <li style={listItemStyle}>Go to <strong>Fill Types</strong> in the sidebar</li>
                <li style={listItemStyle}>Click <strong>Add Fill Type</strong></li>
                <li style={listItemStyle}>Enter the fill name (e.g., "High Density Foam")</li>
                <li style={listItemStyle}>Set the price per cubic inch</li>
                <li style={listItemStyle}>Optionally add an image and description</li>
                <li style={listItemStyle}>Save the fill type</li>
              </ol>

              <h2 style={subheadingStyle}>Fill Type Settings</h2>
              <ul style={listStyle}>
                <li style={listItemStyle}><strong>Name:</strong> Display name shown to customers</li>
                <li style={listItemStyle}><strong>Price per Cubic Inch:</strong> Cost calculation rate (e.g., 0.05 = $0.05 per cubic inch)</li>
                <li style={listItemStyle}><strong>Image URL:</strong> Product image for the fill material</li>
                <li style={listItemStyle}><strong>Active/Inactive:</strong> Toggle availability</li>
                <li style={listItemStyle}><strong>Sort Order:</strong> Display order in the calculator</li>
              </ul>

              <div style={tipBoxStyle}>
                <strong style={{ color: "#108043" }}>Pricing Tip:</strong>
                <p style={{ margin: "8px 0 0", color: "#108043" }}>
                  Fill cost = Volume (cubic inches) x Price per cubic inch.<br />
                  Example: A 20x18x4 inch cushion = 1,440 cubic inches. At $0.05/cu in = $72 fill cost.
                </p>
              </div>
            </div>
          )}

          {/* Fabrics */}
          {activeSection === "fabrics" && (
            <div>
              <h1 style={headingStyle}>Fabrics</h1>
              <p style={paragraphStyle}>
                Fabrics are organized into categories and can have various attributes like brand, pattern, color, and material. The fabric cost is calculated by multiplying the surface area by the price per square inch.
              </p>

              <h2 style={subheadingStyle}>Setting Up Fabrics</h2>

              <h3 style={{ ...subheadingStyle, fontSize: "1rem" }}>Step 1: Create Categories (Optional)</h3>
              <p style={paragraphStyle}>
                Categories help organize fabrics (e.g., "Outdoor", "Indoor", "Premium"). Go to Fabrics &gt; Categories tab to create them.
              </p>

              <h3 style={{ ...subheadingStyle, fontSize: "1rem" }}>Step 2: Create Brands, Patterns, Colors, Materials (Optional)</h3>
              <p style={paragraphStyle}>
                These are optional attributes that can be assigned to fabrics for filtering and display purposes.
              </p>

              <h3 style={{ ...subheadingStyle, fontSize: "1rem" }}>Step 3: Add Fabrics</h3>
              <ol style={listStyle}>
                <li style={listItemStyle}>Go to <strong>Fabrics</strong> &gt; <strong>Fabrics</strong> tab</li>
                <li style={listItemStyle}>Click <strong>Add Fabric</strong></li>
                <li style={listItemStyle}>Enter fabric name and price per square inch</li>
                <li style={listItemStyle}>Optionally assign category, brand, patterns, colors, materials</li>
                <li style={listItemStyle}>Add an image URL for the fabric swatch</li>
                <li style={listItemStyle}>Save the fabric</li>
              </ol>

              <h2 style={subheadingStyle}>Fabric Pricing</h2>
              <div style={tipBoxStyle}>
                <strong style={{ color: "#108043" }}>Fabric Cost Calculation:</strong>
                <p style={{ margin: "8px 0 0", color: "#108043" }}>
                  Fabric cost = Surface Area (square inches) x Price per square inch<br />
                  Example: A rectangle with 800 sq in surface area at $0.08/sq in = $64 fabric cost.
                </p>
              </div>

              <h2 style={subheadingStyle}>Fabric Discounts</h2>
              <p style={paragraphStyle}>
                Each fabric can have a discount percentage that's applied to the final total when that fabric is selected. Enable "Discount from Total" and set the percentage in the fabric settings.
              </p>

              <h2 style={subheadingStyle}>Price Tiers</h2>
              <p style={paragraphStyle}>
                Assign price tiers ($, $$, $$$) to fabrics to help customers quickly identify budget-friendly vs premium options. These are visual indicators only.
              </p>

              <h2 style={subheadingStyle}>Bulk Import/Export</h2>
              <p style={paragraphStyle}>
                Use the CSV export/import feature to manage large numbers of fabrics. Export first to see the required format, then modify and import back.
              </p>
            </div>
          )}

          {/* Additional Options */}
          {activeSection === "additional-options" && (
            <div>
              <h1 style={headingStyle}>Additional Options</h1>
              <p style={paragraphStyle}>
                Beyond shapes, fills, and fabrics, the calculator supports various add-on options that enhance cushion customization.
              </p>

              <h2 style={subheadingStyle}>Available Add-on Types</h2>

              <div style={stepBoxStyle}>
                <strong>Piping</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Decorative cord sewn into cushion seams. Set fixed prices for different piping styles.
                </p>
              </div>

              <div style={stepBoxStyle}>
                <strong>Button Style</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Tufted or button details on cushions. Can have fixed prices.
                </p>
              </div>

              <div style={stepBoxStyle}>
                <strong>Design</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Visual design options like quilting patterns or edge styles.
                </p>
              </div>

              <div style={stepBoxStyle}>
                <strong>Anti-Skid Bottom</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Non-slip backing for the cushion bottom.
                </p>
              </div>

              <div style={stepBoxStyle}>
                <strong>Ties</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Attachment ties for securing cushions to furniture.
                </p>
              </div>

              <div style={stepBoxStyle}>
                <strong>Fabric Ties</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Matching fabric ties made from the selected cushion fabric.
                </p>
              </div>

              <div style={stepBoxStyle}>
                <strong>Bottom Rod Pocket</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Rod pocket at the bottom for curtain-style applications.
                </p>
              </div>

              <div style={stepBoxStyle}>
                <strong>Drawstring</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Drawstring closure option for cushion covers.
                </p>
              </div>

              <h2 style={subheadingStyle}>Setting Up Options</h2>
              <p style={paragraphStyle}>
                Each option type has its own page in the sidebar. The setup is similar:
              </p>
              <ol style={listStyle}>
                <li style={listItemStyle}>Navigate to the option type (e.g., Piping)</li>
                <li style={listItemStyle}>Click Add to create a new option</li>
                <li style={listItemStyle}>Enter name, price, and optional image</li>
                <li style={listItemStyle}>Set sort order and active status</li>
                <li style={listItemStyle}>Save the option</li>
              </ol>

              <div style={tipBoxStyle}>
                <strong style={{ color: "#108043" }}>Option Pricing:</strong>
                <p style={{ margin: "8px 0 0", color: "#108043" }}>
                  Most add-on options have a fixed price that's added to the total, regardless of cushion size.
                </p>
              </div>
            </div>
          )}

          {/* Pricing Calculation */}
          {activeSection === "pricing" && (
            <div>
              <h1 style={headingStyle}>Pricing Calculation</h1>
              <p style={paragraphStyle}>
                Understanding how the final price is calculated helps you set competitive and profitable prices.
              </p>

              <h2 style={subheadingStyle}>Price Formula</h2>
              <div style={{ ...stepBoxStyle, backgroundColor: "#e8f4fd" }}>
                <code style={{ fontSize: "0.95rem", color: "#0066cc" }}>
                  Total = (Fabric Cost + Fill Cost + Add-ons) x (1 + Additional %) - Fabric Discount
                </code>
              </div>

              <h2 style={subheadingStyle}>Component Breakdown</h2>

              <div style={stepBoxStyle}>
                <strong>1. Fabric Cost</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Surface Area (sq in) x Fabric Price ($/sq in)<br />
                  <em>Example: 800 sq in x $0.08 = $64.00</em>
                </p>
              </div>

              <div style={stepBoxStyle}>
                <strong>2. Fill Cost</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Volume (cu in) x Fill Price ($/cu in)<br />
                  <em>Example: 1,440 cu in x $0.05 = $72.00</em>
                </p>
              </div>

              <div style={stepBoxStyle}>
                <strong>3. Add-on Costs</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Sum of all selected add-on prices (piping, buttons, ties, etc.)<br />
                  <em>Example: Piping ($15) + Ties ($8) = $23.00</em>
                </p>
              </div>

              <div style={stepBoxStyle}>
                <strong>4. Additional Percentage</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Profile markup applied to subtotal<br />
                  <em>Example: $159.00 x 15% = $23.85 markup</em>
                </p>
              </div>

              <div style={stepBoxStyle}>
                <strong>5. Fabric Discount (if enabled)</strong>
                <p style={{ margin: "8px 0 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Percentage discount applied to final total<br />
                  <em>Example: $182.85 - 10% = $164.57 final</em>
                </p>
              </div>

              <h2 style={subheadingStyle}>Example Calculation</h2>
              <div style={{ ...stepBoxStyle, backgroundColor: "#f0f9ff" }}>
                <table style={{ width: "100%", fontSize: "0.9rem" }}>
                  <tbody>
                    <tr><td style={{ padding: "4px 0", color: "#6d7175" }}>Rectangle: 20" x 18" x 4"</td><td></td></tr>
                    <tr><td style={{ padding: "4px 0" }}>Surface Area:</td><td style={{ textAlign: "right" }}>800 sq in</td></tr>
                    <tr><td style={{ padding: "4px 0" }}>Volume:</td><td style={{ textAlign: "right" }}>1,440 cu in</td></tr>
                    <tr style={{ borderTop: "1px solid #ddd" }}><td style={{ padding: "8px 0 4px" }}>Fabric ($0.08/sq in):</td><td style={{ textAlign: "right" }}>$64.00</td></tr>
                    <tr><td style={{ padding: "4px 0" }}>Fill ($0.05/cu in):</td><td style={{ textAlign: "right" }}>$72.00</td></tr>
                    <tr><td style={{ padding: "4px 0" }}>Piping:</td><td style={{ textAlign: "right" }}>$15.00</td></tr>
                    <tr><td style={{ padding: "4px 0" }}>Ties:</td><td style={{ textAlign: "right" }}>$8.00</td></tr>
                    <tr style={{ borderTop: "1px solid #ddd" }}><td style={{ padding: "8px 0 4px" }}><strong>Subtotal:</strong></td><td style={{ textAlign: "right" }}><strong>$159.00</strong></td></tr>
                    <tr><td style={{ padding: "4px 0" }}>Additional 15%:</td><td style={{ textAlign: "right" }}>$23.85</td></tr>
                    <tr style={{ borderTop: "2px solid #008060" }}><td style={{ padding: "8px 0 4px" }}><strong style={{ color: "#008060" }}>Total:</strong></td><td style={{ textAlign: "right" }}><strong style={{ color: "#008060" }}>$182.85</strong></td></tr>
                  </tbody>
                </table>
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
        </div>
      </div>
    </s-page>
  );
}
