#!/usr/bin/env python3
"""Convert SRS Markdown to PDF with embedded SVG diagrams."""

import markdown
from weasyprint import HTML
import os

SRS_DIR = os.path.dirname(os.path.abspath(__file__))
MD_FILE = os.path.join(SRS_DIR, "SRS-Trading-Journal.md")
PDF_FILE = os.path.join(SRS_DIR, "SRS-Trading-Journal.pdf")

# Read markdown
with open(MD_FILE, "r", encoding="utf-8") as f:
    md_content = f.read()

# Convert markdown to HTML
html_body = markdown.markdown(
    md_content,
    extensions=["tables", "fenced_code", "toc", "attr_list"],
)

# Build full HTML with professional styling
html_full = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  @page {{
    size: A4;
    margin: 2cm 2.5cm;
    @top-center {{
      content: "SRS — Trading Journal & Risk Analysis System";
      font-size: 8pt;
      color: #888;
    }}
    @bottom-center {{
      content: "Page " counter(page) " of " counter(pages);
      font-size: 8pt;
      color: #888;
    }}
  }}

  body {{
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #1a1a1a;
    max-width: 100%;
  }}

  h1 {{
    font-size: 22pt;
    color: #0d1b2a;
    border-bottom: 3px solid #1b4965;
    padding-bottom: 8px;
    margin-top: 30px;
    page-break-after: avoid;
  }}

  h2 {{
    font-size: 16pt;
    color: #1b4965;
    border-bottom: 1.5px solid #bee9e8;
    padding-bottom: 5px;
    margin-top: 25px;
    page-break-after: avoid;
  }}

  h3 {{
    font-size: 13pt;
    color: #2c6e8a;
    margin-top: 18px;
    page-break-after: avoid;
  }}

  h4 {{
    font-size: 11pt;
    color: #3a8fb7;
    margin-top: 14px;
  }}

  p {{
    margin: 6px 0;
    text-align: justify;
  }}

  table {{
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 10pt;
    page-break-inside: auto;
  }}

  th {{
    background-color: #1b4965;
    color: white;
    padding: 8px 10px;
    text-align: left;
    font-weight: 600;
  }}

  td {{
    padding: 7px 10px;
    border-bottom: 1px solid #ddd;
    vertical-align: top;
  }}

  tr:nth-child(even) {{
    background-color: #f8f9fa;
  }}

  tr {{
    page-break-inside: avoid;
  }}

  code {{
    background-color: #f4f4f4;
    padding: 2px 5px;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
    font-size: 9.5pt;
  }}

  pre {{
    background-color: #f4f4f4;
    padding: 12px 15px;
    border-radius: 5px;
    border-left: 4px solid #1b4965;
    overflow-x: auto;
    font-size: 9pt;
    line-height: 1.4;
    page-break-inside: avoid;
  }}

  pre code {{
    background: none;
    padding: 0;
  }}

  img {{
    max-width: 100%;
    height: auto;
    display: block;
    margin: 15px auto;
    page-break-inside: avoid;
  }}

  blockquote {{
    border-left: 4px solid #bee9e8;
    margin: 10px 0;
    padding: 8px 15px;
    background-color: #f0f9f8;
    color: #333;
  }}

  strong {{
    color: #0d1b2a;
  }}

  hr {{
    border: none;
    border-top: 2px solid #bee9e8;
    margin: 20px 0;
  }}

  ul, ol {{
    margin: 6px 0;
    padding-left: 25px;
  }}

  li {{
    margin: 3px 0;
  }}
</style>
</head>
<body>
{html_body}
</body>
</html>"""

# Generate PDF
HTML(string=html_full, base_url=SRS_DIR).write_pdf(PDF_FILE)
print(f"PDF generated: {PDF_FILE}")