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
              <p style={paragraphStyle}>
                Profiles are the core configuration that brings together all calculator options. Each profile defines what sections are visible, which options are available, and any pricing adjustments.
              </p>

              <h2 style={subheadingStyle}>Creating a Profile</h2>
              <ol style={listStyle}>
                <li style={listItemStyle}>Go to <strong>Profiles</strong> in the sidebar</li>
                <li style={listItemStyle}>Click <strong>Add Profile</strong></li>
                <li style={listItemStyle}>Enter a profile name (e.g., "Outdoor Cushions", "Bench Pads")</li>
                <li style={listItemStyle}>Configure section visibility and allowed options</li>
                <li style={listItemStyle}>Set the additional percentage if needed</li>
                <li style={listItemStyle}>Save the profile</li>
              </ol>

              <h2 style={subheadingStyle}>Profile Settings</h2>

              <h3 style={{ ...subheadingStyle, fontSize: "1rem" }}>Section Visibility</h3>
              <p style={paragraphStyle}>
                Toggle which sections appear in the calculator:
              </p>
              <ul style={listStyle}>
                <li style={listItemStyle}><strong>Shape Section:</strong> Allow customers to select cushion shapes</li>
                <li style={listItemStyle}><strong>Dimensions Section:</strong> Show dimension input fields</li>
                <li style={listItemStyle}><strong>Fill Section:</strong> Display fill type options</li>
                <li style={listItemStyle}><strong>Fabric Section:</strong> Show fabric selection</li>
                <li style={listItemStyle}><strong>Piping, Buttons, Ties, etc.:</strong> Show additional customization options</li>
              </ul>

              <h3 style={{ ...subheadingStyle, fontSize: "1rem" }}>Allowed vs Hidden Options</h3>
              <div style={tipBoxStyle}>
                <p style={{ margin: 0, color: "#108043" }}>
                  <strong>Allowed Options:</strong> Specify which shapes, fabrics, or fills appear in the calculator. Leave empty to show all active options.
                </p>
              </div>
              <div style={warningBoxStyle}>
                <p style={{ margin: 0, color: "#e65100" }}>
                  <strong>Hidden Options:</strong> Select a default option that will be used automatically without showing the selection to customers. Useful when you want to pre-set certain choices.
                </p>
              </div>

              <h3 style={{ ...subheadingStyle, fontSize: "1rem" }}>Additional Percentage</h3>
              <p style={paragraphStyle}>
                Add a markup percentage to the final calculated price. For example, entering <code style={codeStyle}>15</code> will add 15% to the total price.
              </p>

              <h3 style={{ ...subheadingStyle, fontSize: "1rem" }}>Multi-Piece Mode</h3>
              <p style={paragraphStyle}>
                Enable multi-piece mode for products that have multiple cushion pieces (e.g., a sofa with seat and back cushions). Each piece can have its own shape, dimensions, and options.
              </p>

              <h3 style={{ ...subheadingStyle, fontSize: "1rem" }}>Weatherproof Mode</h3>
              <p style={paragraphStyle}>
                When enabled, the calculator uses the "Surface Area Without Base" formula for fabric calculations, meaning the bottom of the cushion won't be covered with fabric.
              </p>

              <h2 style={subheadingStyle}>Setting a Default Profile</h2>
              <p style={paragraphStyle}>
                Mark one profile as "Default" to use it when no specific profile is assigned to a product. Click the "Set Default" button on any profile card.
              </p>
            </div>
          )}

          {/* Shapes */}
          {activeSection === "shapes" && (
            <div>
              <h1 style={headingStyle}>Shapes</h1>
              <p style={paragraphStyle}>
                Shapes define the geometry of cushions and the formulas used to calculate surface area and volume for pricing.
              </p>

              <h2 style={subheadingStyle}>Creating a Shape</h2>
              <ol style={listStyle}>
                <li style={listItemStyle}>Go to <strong>Shapes</strong> in the sidebar</li>
                <li style={listItemStyle}>Click <strong>Add Shape</strong></li>
                <li style={listItemStyle}>Enter the shape name</li>
                <li style={listItemStyle}>Define input fields (dimensions customers will enter)</li>
                <li style={listItemStyle}>Write formulas for surface area and volume</li>
                <li style={listItemStyle}>Save the shape</li>
              </ol>

              <h2 style={subheadingStyle}>Input Fields</h2>
              <p style={paragraphStyle}>
                Input fields are the measurements customers will enter. Each field has:
              </p>
              <ul style={listStyle}>
                <li style={listItemStyle}><strong>Label:</strong> What customers see (e.g., "Length", "Width")</li>
                <li style={listItemStyle}><strong>Key:</strong> Variable name used in formulas (e.g., <code style={codeStyle}>length</code>, <code style={codeStyle}>width</code>)</li>
                <li style={listItemStyle}><strong>Min/Max:</strong> Allowed range of values</li>
                <li style={listItemStyle}><strong>Default:</strong> Pre-filled value (optional)</li>
              </ul>

              <h2 style={subheadingStyle}>Writing Formulas</h2>
              <p style={paragraphStyle}>
                Use input field keys in your formulas. Supported operators: <code style={codeStyle}>+</code> <code style={codeStyle}>-</code> <code style={codeStyle}>*</code> <code style={codeStyle}>/</code> and parentheses.
              </p>

              <div style={stepBoxStyle}>
                <strong>Rectangle Example:</strong>
                <p style={{ margin: "8px 0 4px", color: "#6d7175", fontSize: "0.9rem" }}>
                  Input fields: <code style={codeStyle}>length</code>, <code style={codeStyle}>width</code>, <code style={codeStyle}>thickness</code>
                </p>
                <p style={{ margin: "4px 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Surface Area: <code style={codeStyle}>length*width*2 + length*thickness*2 + width*thickness*2</code>
                </p>
                <p style={{ margin: "4px 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Volume: <code style={codeStyle}>length*width*thickness</code>
                </p>
              </div>

              <div style={stepBoxStyle}>
                <strong>Circle Example:</strong>
                <p style={{ margin: "8px 0 4px", color: "#6d7175", fontSize: "0.9rem" }}>
                  Input fields: <code style={codeStyle}>radius</code>, <code style={codeStyle}>thickness</code>
                </p>
                <p style={{ margin: "4px 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Surface Area: <code style={codeStyle}>3.14159*radius*radius*2 + 3.14159*2*radius*thickness</code>
                </p>
                <p style={{ margin: "4px 0", color: "#6d7175", fontSize: "0.9rem" }}>
                  Volume: <code style={codeStyle}>3.14159*radius*radius*thickness</code>
                </p>
              </div>

              <h2 style={subheadingStyle}>Surface Area Without Base</h2>
              <p style={paragraphStyle}>
                This optional formula is used when Weatherproof mode is enabled in a profile. It calculates surface area excluding the bottom face.
              </p>

              <h2 style={subheadingStyle}>2D Shapes &amp; Panels</h2>
              <p style={paragraphStyle}>
                For flat items like curtains, enable "2D Shape" mode. You can also enable panel count, which multiplies the total by the number of panels ordered.
              </p>
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
