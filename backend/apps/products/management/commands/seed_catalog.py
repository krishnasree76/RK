"""
Load the starter catalogue that the website previously shipped as static data.

    python manage.py seed_catalog

Safe to run repeatedly: existing categories/products (matched by slug) are
left untouched. Prices are seeded as 0.00 because no real prices were
provided — set real prices in the admin. The content is placeholder copy to
be replaced with the client's real catalogue.
"""

from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.categories.models import Category
from apps.products.models import Product

CATEGORIES = [
    ("Wheels & Tyres", "wheels-tyres", "Inflators, wheel covers, repair kits and fitment essentials."),
    ("Car Lighting", "car-lighting", "LED headlight bulbs, fog lamps and interior lighting."),
    ("Interior Accessories", "interior-accessories", "Seat covers, floor mats, steering covers and more."),
    ("Exterior Accessories", "exterior-accessories", "Visors, body covers, guards and styling parts."),
    ("Car Electronics", "car-electronics", "Stereos, cameras, chargers and in-car tech."),
    ("Car Care", "car-care", "Cleaning, polishing and detailing supplies."),
]

# (slug, name, category slug, featured, description, features, specifications)
PRODUCTS = [
    ("tyre-inflator", "Portable Digital Tyre Inflator", "wheels-tyres", True,
     "Compact 12V tyre inflator with a digital pressure display and auto cut-off at the preset pressure. Runs from the car socket and suits cars, bikes and sports equipment.",
     ["Digital pressure display", "Auto cut-off at preset pressure", "Built-in LED work light", "Multiple nozzle adaptors included"],
     [("Power", "12V car socket"), ("Display", "Digital, PSI / BAR"), ("Compatibility", "Cars, bikes, cycles")]),
    ("wheel-covers", "Universal Wheel Covers", "wheels-tyres", False,
     "Durable ABS wheel covers with a sporty finish that clip on over steel rims. Available in popular rim sizes for hatchbacks and sedans.",
     ["Impact-resistant ABS", "Secure clip-on fitment", "Multiple designs and finishes", "Sold in sets of four"],
     [("Material", "ABS plastic"), ("Sizes", '13", 14", 15"'), ("Set", "4 covers")]),
    ("tubeless-repair-kit", "Tubeless Tyre Puncture Repair Kit", "wheels-tyres", False,
     "Complete roadside puncture repair kit for tubeless tyres, with T-handle tools and repair strips packed in a compact case.",
     ["T-handle reamer and insert tools", "Self-vulcanising repair strips", "Compact carry case", "No wheel removal needed"],
     [("Tyre type", "Tubeless"), ("Contents", "Tools, strips, lubricant"), ("Case", "Hard plastic")]),
    ("led-headlight-bulbs", "LED Headlight Bulbs", "car-lighting", True,
     "High-output LED conversion bulbs with a built-in cooling fan for a bright, white beam. Available in the most common fitments.",
     ["Bright white output", "Built-in cooling fan", "Plug-and-play installation", "Long service life"],
     [("Fitments", "H4, H7, H11, HB3"), ("Colour", "Cool white"), ("Voltage", "12V")]),
    ("led-fog-lamps", "LED Fog Lamps", "car-lighting", False,
     "Weather-resistant LED fog lamps with a wide beam for low-visibility conditions. Supplied with mounting hardware and wiring.",
     ["Wide, low beam pattern", "Weather-resistant housing", "Mounting kit included", "Universal and model-specific options"],
     [("Type", "LED"), ("Housing", "Aluminium / ABS"), ("Voltage", "12V")]),
    ("ambient-led-strip", "Interior Ambient LED Strip", "car-lighting", False,
     "Multi-colour ambient lighting strips for footwells and dashboards, with remote and app control options.",
     ["Multiple colour modes", "Remote / app control", "Flexible adhesive strips", "USB or 12V power"],
     [("Power", "USB / 12V"), ("Control", "Remote, app"), ("Fitment", "Universal")]),
    ("premium-seat-covers", "Premium Leatherette Seat Covers", "interior-accessories", True,
     "Custom-fit leatherette seat covers with double stitching and foam padding. Available for popular hatchbacks, sedans and SUVs.",
     ["Model-specific fit", "Double-stitched seams", "Foam-padded comfort", "Easy to clean surface"],
     [("Material", "Leatherette"), ("Fitment", "Model-specific"), ("Set", "Full car set")]),
    ("7d-floor-mats", "7D Floor Mats", "interior-accessories", True,
     "Full-coverage, waterproof 7D floor mats with anti-slip backing that protect the original flooring and are easy to clean.",
     ["Edge-to-edge coverage", "Waterproof surface", "Anti-slip backing", "Model-specific moulding"],
     [("Type", "7D moulded"), ("Fitment", "Model-specific"), ("Set", "Front and rear")]),
    ("steering-wheel-cover", "Steering Wheel Cover", "interior-accessories", False,
     "Breathable, sweat-resistant steering wheel covers with a firm grip, in multiple colours and universal sizes.",
     ["Anti-slip grip", "Breathable material", "Universal stretch fit", "Multiple colours"],
     [("Size", "Universal (37–38 cm)"), ("Material", "Leatherette / suede"), ("Fitment", "Universal")]),
    ("chrome-door-visors", "Chrome-Line Door Visors", "exterior-accessories", False,
     "Impact-resistant rain visors with a chrome strip finish that let you keep windows slightly open in the rain. Model-specific fitment.",
     ["Chrome strip finish", "Impact-resistant acrylic", "Adhesive tape fitment", "Set of four"],
     [("Material", "Acrylic"), ("Fitment", "Model-specific"), ("Set", "4 visors")]),
    ("body-cover", "Waterproof Car Body Cover", "exterior-accessories", False,
     "Triple-layer, UV-protected car body covers with an elastic hem and mirror pockets for a snug fit.",
     ["Water-resistant fabric", "UV protection", "Elastic hem", "Mirror pockets"],
     [("Material", "Triple-layer fabric"), ("Fitment", "Model-specific sizes"), ("Includes", "Storage bag")]),
    ("door-edge-guards", "Door Edge Guards", "exterior-accessories", False,
     "Flexible door edge guards that protect paint from chips and scratches when doors are opened in tight spaces.",
     ["Protects door edges", "Flexible, easy fitment", "Clear and coloured options", "Weather-resistant"],
     [("Material", "Rubber / PVC"), ("Fitment", "Universal"), ("Set", "4 guards")]),
    ("android-stereo", "Android Touchscreen Stereo", "car-electronics", True,
     "Android head units with a large touchscreen, GPS navigation, Bluetooth and support for Apple CarPlay and Android Auto.",
     ["Large touchscreen display", "GPS navigation", "Bluetooth calling and music", "CarPlay / Android Auto support"],
     [("Screen", '9" / 10"'), ("Connectivity", "Bluetooth, Wi-Fi, USB"), ("Fitment", "Model-specific frames")]),
    ("reverse-camera", "HD Reverse Parking Camera", "car-electronics", True,
     "Night-vision reverse parking camera with guidelines for safer parking. Universal mounting kit included.",
     ["HD night vision", "Parking guidelines", "Wide viewing angle", "Universal mounting kit"],
     [("Resolution", "HD"), ("Mount", "Universal"), ("Weatherproofing", "Water-resistant")]),
    ("fast-car-charger", "Dual-Port Fast Car Charger", "car-electronics", False,
     "Compact car charger with USB-A and USB-C fast-charging ports, suitable for phones and tablets.",
     ["USB-A and USB-C ports", "Fast charging support", "Compact metal body", "Overcharge protection"],
     [("Ports", "USB-A + USB-C"), ("Input", "12V / 24V"), ("Body", "Metal")]),
    ("microfiber-kit", "Microfiber Cleaning Kit", "car-care", False,
     "Lint-free microfiber cloths, wash mitts and applicators that are safe on paint, glass and interior surfaces.",
     ["Lint-free microfiber", "Scratch-safe on paint", "Reusable and washable", "Multi-piece kit"],
     [("Material", "Microfiber"), ("Contents", "Cloths, mitt, applicators"), ("Use", "Exterior and interior")]),
    ("car-wash-shampoo", "Car Wash Shampoo", "car-care", False,
     "pH-balanced, high-foam car wash shampoo that lifts dirt without stripping wax or protection.",
     ["High-foam formula", "pH-balanced", "Safe on wax and coatings", "Concentrated"],
     [("Type", "Concentrate"), ("Use", "Bucket / foam wash"), ("Sizes", "Multiple pack sizes")]),
    ("dashboard-polish", "Dashboard & Tyre Polish", "car-care", False,
     "Restores shine to dashboards, trims and tyres with a non-greasy, dust-resistant finish.",
     ["Non-greasy finish", "Dust-resistant", "For dashboards, trims and tyres", "Easy spray application"],
     [("Type", "Spray polish"), ("Finish", "Satin shine"), ("Use", "Interior trims, tyres")]),
]


class Command(BaseCommand):
    help = "Seed the starter categories and products (skips anything that already exists)."

    @transaction.atomic
    def handle(self, *args, **options):
        categories, created_categories = {}, 0
        for order, (name, slug, description) in enumerate(CATEGORIES, start=1):
            category, created = Category.objects.get_or_create(
                slug=slug, defaults={"name": name, "description": description, "sort_order": order}
            )
            categories[slug] = category
            created_categories += created

        created_products = 0
        for slug, name, category_slug, featured, description, features, specs in PRODUCTS:
            _, created = Product.objects.get_or_create(
                slug=slug,
                defaults={
                    "name": name,
                    "category": categories[category_slug],
                    "is_featured": featured,
                    "price_per_piece": Decimal("0.00"),
                    "description": description,
                    "features": "\n".join(features),
                    "specifications": "\n".join(f"{label}: {value}" for label, value in specs),
                },
            )
            created_products += created

        self.stdout.write(
            self.style.SUCCESS(
                f"Categories created: {created_categories} (of {len(CATEGORIES)}). "
                f"Products created: {created_products} (of {len(PRODUCTS)})."
            )
        )
        if created_products:
            self.stdout.write(self.style.WARNING("Seeded prices are 0.00 — set real prices in the admin."))
