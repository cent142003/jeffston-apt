#!/usr/bin/env python3
"""Create static local SEO guides without changing the Vercel apartment booking application."""
from pathlib import Path
from html import escape
import json
R=Path(__file__).resolve().parent
OUT=R/"vercel-seo-overlay"
OUT.mkdir(exist_ok=True)
BASE="https://jeffston-court-apartments.vercel.app"
ORIGIN="https://jeffston-court-apartments.cent142003.chatgpt.site"
(OUT/"vercel.json").write_text(json.dumps({
  "version":2,
  "routes":[
    {"handle":"filesystem"},
    {"src":"/(.*)","dest":ORIGIN+"/$1"}
  ]
},indent=2)+"\n")
(OUT/"robots.txt").write_text(f"""User-agent: *
Allow: /

Sitemap: {BASE}/sitemap.xml
Sitemap: {BASE}/sitemap-seo.xml
""")
routes=["corporate-stays-north-kaneshie.html","short-stay-apartments-accra.html"]
(OUT/"sitemap-seo.xml").write_text("""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
"""+''.join(f"  <url><loc>{BASE}/{r}</loc><lastmod>2026-10-09</lastmod></url>\n" for r in routes)+"</urlset>\n")

def page(filename,title,desc,h1,kicker,intro,sections,faqs):
    url=f"{BASE}/{filename}"
    schema={"@context":"https://schema.org","@graph":[
      {"@type":"WebPage","@id":url+"#webpage","name":title,"url":url,"description":desc,"inLanguage":"en-GH",
        "about":{"@id":BASE+"/#business"}},
      {"@type":"BreadcrumbList","itemListElement":[
        {"@type":"ListItem","position":1,"name":"Jeffston Court Apartments","item":BASE+"/"},
        {"@type":"ListItem","position":2,"name":title,"item":url}
      ]},
      {"@type":"FAQPage","mainEntity":[{"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}} for q,a in faqs]}
    ]}
    subsections="\n".join("<section class='section'><h2>{}</h2><p>{}</p></section>".format(escape(a),escape(b)) for a,b in sections)
    faq_content="\n".join("<details><summary>{}</summary><p>{}</p></details>".format(escape(a),escape(b)) for a,b in faqs)
    content=f'''<!doctype html>
<html lang="en-GH">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{escape(title)}</title>
<meta name="description" content="{escape(desc,quote=True)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="{url}">
<meta property="og:type" content="article">
<meta property="og:locale" content="en_GH">
<meta property="og:site_name" content="Jeffston Court Apartments">
<meta property="og:title" content="{escape(title,quote=True)}">
<meta property="og:description" content="{escape(desc,quote=True)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{BASE}/assets/apartment/web-ready/jeffston-court-hero-banner-hero.jpg">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">{json.dumps(schema,indent=2,ensure_ascii=False)}</script>
<style>
:root{{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#1a2633;background:#f8fafc;line-height:1.65}}
*{{box-sizing:border-box}}body{{margin:0}}a{{color:#0d6473}}a:focus-visible{{outline:3px solid #0d6473;outline-offset:3px}}
header,footer{{background:#152932;color:#fff;padding:1.1rem max(1rem,calc((100% - 1100px)/2))}}
header a,footer a{{color:#e4fbff}}header nav{{display:flex;gap:1rem;flex-wrap:wrap;align-items:center}}header strong{{margin-right:auto}}
main{{max-width:940px;margin:auto;padding:1.25rem 1rem 3rem}}
.hero{{background:linear-gradient(135deg,#e5f4ee,#fff);padding:clamp(1.5rem,5vw,3rem);border-radius:20px;margin:1rem 0 2rem}}
.hero p{{max-width:62ch}}h1{{font-size:clamp(2rem,4.5vw,3.5rem);line-height:1.16}}
h2{{font-size:1.4rem;line-height:1.3}}.muted{{color:#526575;font-weight:600}}
.section{{padding:1rem 0;border-bottom:1px solid #d7e1e6}}
.pills{{display:flex;gap:.75rem;flex-wrap:wrap}}.btn{{display:inline-block;background:#126b61;color:white;text-decoration:none;padding:.8rem 1.2rem;border-radius:9px;font-weight:700}}
.btn.secondary{{background:#e4eeed;color:#173a3a}}details{{border:1px solid #d3dce1;border-radius:9px;margin:.7rem 0;padding:1rem;background:white}}summary{{font-weight:700;cursor:pointer}}
@media(min-width:650px){{.pills{{margin-top:1.5rem}}}}
</style>
</head>
<body>
<a href="#main" style="position:absolute;top:-5rem;left:0">Skip to main content</a>
<header><nav aria-label="Primary"><strong>Jeffston Court Apartments</strong><a href="/">Home &amp; booking</a><a href="/2-bedroom-furnished-apartment-accra.html">Two-bedroom</a><a href="/3-bedroom-furnished-apartment-accra.html">Three-bedroom</a><a href="/location-north-kaneshie-accra.html">Location</a></nav></header>
<main id="main">
<section class="hero"><p class="muted">{escape(kicker)}</p><h1>{escape(h1)}</h1><p>{escape(intro)}</p><div class="pills"><a class="btn" href="/#booking">Check availability &amp; enquire</a><a class="btn secondary" href="/#apartments">Explore apartment options</a></div></section>
{subsections}
<section class="section"><h2>Compare the actual apartments before you choose</h2><p>Jeffston Court Apartments is listed at <strong>12 Nii Darko Street, North Kaneshie, Accra</strong>. Visitors can review the <a href="/2-bedroom-furnished-apartment-accra.html">2-bedroom furnished apartment</a>, the <a href="/luxury-2-bedroom-apartment-accra.html">premium 2-bedroom option</a>, and the <a href="/3-bedroom-furnished-apartment-accra.html">3-bedroom furnished apartment</a>. Review images and amenities for each specific unit: not every unit necessarily includes the same facilities or rate.</p><p>Submit your travel dates, guest count and contact information through the main website. A completed enquiry does not automatically reserve dates: the booking process requires availability confirmation and the required deposit before dates are held. Do not pay using an unverified contact or presume a rate shown elsewhere remains current.</p></section>
<section aria-label="Related guides" class="section"><h2>More ways to plan your stay</h2><p><a href="/location-north-kaneshie-accra.html">North Kaneshie location and travel information</a> · <a href="/corporate-stays-north-kaneshie.html">Corporate accommodation</a> · <a href="/short-stay-apartments-accra.html">Short-stay planning</a></p></section>
<section class="section"><h2>Frequently asked questions</h2>{faq_content}</section>
<div class="pills"><a class="btn" href="/#booking">Enquire about your dates</a><a class="btn secondary" href="tel:+233201349321">Call +233 20 134 9321</a></div>
</main>
<footer><p>Jeffston Court Apartments · 12 Nii Darko Street, North Kaneshie, Accra · <a href="tel:+233201349321">+233 20 134 9321</a>.</p><p><a href="/">Return to the main website</a></p></footer>
</body></html>'''
    (OUT/filename).write_text(content)

page("corporate-stays-north-kaneshie.html",
"Corporate Furnished Apartments in North Kaneshie, Accra | Jeffston Court",
"Explore furnished 2- and 3-bedroom corporate accommodation at 12 Nii Darko Street, North Kaneshie. Compare layouts, terms and deposit-secured direct booking.",
"Corporate Furnished Apartments in North Kaneshie, Accra",
"Business stays · North Kaneshie",
"Professionals visiting Accra for projects, meetings or relocation often need more than a room. Jeffston Court Apartments offers furnished 2- and 3-bedroom options that can be compared against the needs of a work trip, a family visit or an extended assignment.",
[
("A working base for assignments and longer visits",
"Before choosing corporate accommodation, consider how many colleagues or family members are travelling, whether you need to prepare meals and whether a shared living room is important. The listed apartments offer furnished living space with kitchen facilities. Check the particular unit's amenities, photos and rules rather than assuming every apartment has an identical layout."),
("North Kaneshie as a location to assess",
"The property is at 12 Nii Darko Street in North Kaneshie, Accra. It may suit business visitors with work in the Kaneshie area or other parts of Accra, but travel time depends on destination and traffic. Use the location page and your meeting addresses to evaluate the commute before you commit to a longer stay."),
("Protect company budgets with clear confirmations",
"For corporate travel, request a dated quote and confirm the included services, check-in instructions, occupancy and cancellation terms. The public property site explains that an enquiry alone does not reserve dates; management confirms availability and requires a verified deposit before dates are held. Avoid treating the first displayed nightly figure as a final quote for long or group stays.")
],
[
("Are these apartments suitable for business travel?",
"Guests can enquire about furnished two- and three-bedroom accommodation for business or extended stays. Confirm the specific apartment, number of guests and dates."),
("Where is the property?",
"12 Nii Darko Street, North Kaneshie, Accra, Ghana. Check the location page and your work destination before booking."),
("Does a booking enquiry reserve the apartment?",
"No. Dates must be confirmed and the required deposit verified before the apartment is held."),
("Can a company request a longer stay?",
"Yes, enquire with the proposed dates and guest count; management will confirm availability, pricing and applicable terms.")
])
page("short-stay-apartments-accra.html",
"Short-Stay Furnished Apartments in Accra | Jeffston Court",
"Plan a short stay in Accra with furnished two- and three-bedroom apartments in North Kaneshie. Review photos, amenities, deposit terms and confirmed booking availability.",
"Short-Stay Furnished Apartments in Accra",
"Family visits · short breaks · relocations",
"Whether travelling for a family visit, returning from abroad or staying briefly between homes, it helps to compare the living space and the booking terms before choosing accommodation. Jeffston Court Apartments in North Kaneshie has furnished two- and three-bedroom options to review.",
[
("Choose the layout that fits your group",
"Two-bedroom and three-bedroom options are advertised at Jeffston Court Apartments. Look through the actual photos, room descriptions and available amenities for each unit. A family may prioritise bedroom count and kitchen space, while a couple or travelling professional may place greater emphasis on a smaller layout and privacy."),
("Plan arrival and local travel",
"The property is listed at 12 Nii Darko Street in North Kaneshie, Accra. Guests visiting family or travelling for an appointment should confirm how they will reach their destination and whether arrival times fit the property's check-in procedure. Traffic and travel times vary, so no fixed journey time is promised here."),
("Confirm booking conditions before paying",
"Use the main website's enquiry process with your arrival and departure dates and guest count. The property states that dates are not held simply by submitting the form. Ask for an up-to-date quote and written confirmation of the required deposit, cancellation conditions and the exact apartment before sending any payment.")
],
[
("Are there short-stay apartments in North Kaneshie?",
"Jeffston Court Apartments advertises furnished apartments in North Kaneshie for short visits, subject to availability and booking confirmation."),
("Can families enquire about three bedrooms?",
"Yes. A three-bedroom apartment is listed on the main website; confirm guest capacity, facilities, rates and dates with the property."),
("What happens after I send the enquiry?",
"Management must verify availability and the required deposit before the dates are confirmed."),
("How can I contact Jeffston Court Apartments?",
"Use the booking section on the main website or call +233 20 134 9321 to ask about the current apartment options.")
])
print("Generated Vercel SEO overlay with two unique guides; live index and booking remain upstream.")
