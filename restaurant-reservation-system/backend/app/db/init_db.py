from app.db.session import Base, engine, get_db
from app.core.security import get_password_hash
from sqlalchemy.orm import Session


def init_db():
    from app.models import location, restaurant, table, reservation, table_block, admin_user
    Base.metadata.create_all(bind=engine)


def seed_db():
    """Seed the database with initial data."""
    from app.models.admin_user import AdminUser
    from app.models.location import Location
    from app.models.restaurant import Restaurant
    from app.models.table import Table

    db = next(get_db())
    try:
        # Create default admin if none exists
        admin = db.query(AdminUser).filter(AdminUser.email == "admin@admin.com").first()
        if not admin:
            admin = AdminUser(
                email="admin@admin.com",
                password_hash=get_password_hash("admin123"),
                role="admin",
            )
            db.add(admin)
            db.commit()

        # Seed locations
        if db.query(Location).count() == 0:
            location_names = [
                "Sahil", "Icherisheher", "Yasamal", "Nasimi",
                "Narimanov", "Sabail", "Khatai", "Ahmadli",
                "28 May", "Elmler Akademiyasi", "Genclik", "Fountain Square",
                "Nizami", "Boulevard",
            ]
            locations = [Location(name=n) for n in location_names]
            db.add_all(locations)
            db.commit()

            # Fetch locations for FK references
            loc = {}
            for l in db.query(Location).all():
                loc[l.name] = l.id

            # ── Restaurant data: (name, location_key, address, phone) ──
            restaurant_data = [
                # Firuze Restaurant — Fountain Square + Sahil
                ("Firuze Restaurant — Fountain Square", "Fountain Square", "Nizami St 15, Fountain Square", "+994-12-404-8585"),
                ("Firuze Restaurant — Sahil", "Sahil", "Neftchilar Ave 24, Sahil", "+994-12-404-8586"),
                # Dolma Restaurant — Fountain Square + Sahil
                ("Dolma Restaurant — Fountain Square", "Fountain Square", "Boyuk Gala St 19, Fountain Square", "+994-12-492-5151"),
                ("Dolma Restaurant — Sahil", "Sahil", "Neftchilar Ave 91, Sahil", "+994-12-492-5152"),
                # Caravan Baku — Fountain Square + Nizami
                ("Caravan Baku — Fountain Square", "Fountain Square", "Istiglaliyyat St 18, Baku", "+994-12-505-7676"),
                ("Caravan Baku — Nizami", "Nizami", "Nizami St 88, Baku", "+994-12-505-7677"),
                # Mari Vanna — Sahil
                ("Mari Vanna — Sahil", "Sahil", "Neftchilar Ave 105, Sahil", "+994-12-437-3737"),
                # SAHiL Bar & Restaurant — Sahil + Boulevard
                ("SAHiL Bar & Restaurant — Sahil", "Sahil", "Neftchilar Ave 2, Sahil", "+994-12-498-2020"),
                ("SAHiL Bar & Restaurant — Boulevard", "Boulevard", "National Park Seaside Blvd, Baku", "+994-12-498-2021"),
                # Anadolu Restaurant — 28 May + Nasimi
                ("Anadolu Restaurant — 28 May", "28 May", "28 May St 32, Baku", "+994-12-440-1010"),
                ("Anadolu Restaurant — Nasimi", "Nasimi", "Tbilisi Ave 55, Nasimi", "+994-12-440-1011"),
                # Matbakh Restaurant — 28 May
                ("Matbakh Restaurant — 28 May", "28 May", "Ahmad Javad St 12, Baku", "+994-12-598-1818"),
                # Bashkent Restoran — 28 May
                ("Bashkent Restoran — 28 May", "28 May", "28 May St 50, Baku", "+994-12-493-0909"),
                # Marani Restaurant — 28 May + Nasimi
                ("Marani Restaurant — 28 May", "28 May", "Rashid Behbudov St 7, Baku", "+994-12-437-5050"),
                ("Marani Restaurant — Nasimi", "Nasimi", "Inshaatchilar Ave 21, Nasimi", "+994-12-437-5051"),
                # Sumakh Restaurant — Narimanov + Genclik
                ("Sumakh Restaurant — Narimanov", "Narimanov", "Fatali Khan Khoyski 90, Baku", "+994-12-465-1212"),
                ("Sumakh Restaurant — Genclik", "Genclik", "Heydar Aliyev Ave 40, Baku", "+994-12-465-1213"),
                # Megobari Restaurant — Sahil + Nasimi
                ("Megobari Restaurant — Sahil", "Sahil", "Neftchilar Ave 50, Sahil", "+994-12-437-0077"),
                ("Megobari Restaurant — Nasimi", "Nasimi", "Tbilisi Ave 90, Nasimi", "+994-12-437-0078"),
                # Mama Nakormila — Sahil
                ("Mama Nakormila — Sahil", "Sahil", "Neftchilar Ave 68, Sahil", "+994-12-498-2525"),
                # Maaya Indian Restaurant — Sahil + Nasimi
                ("Maaya Indian Restaurant — Sahil", "Sahil", "Uzeyir Hajibeyov St 4, Sahil", "+994-12-437-3838"),
                ("Maaya Indian Restaurant — Nasimi", "Nasimi", "Tbilisi Ave 12, Nasimi", "+994-12-437-3839"),
                # Shirvanshah Museum Restaurant — Icherisheher
                ("Shirvanshah Museum Restaurant", "Icherisheher", "Boyuk Gala St 86, Old City", "+994-12-492-1020"),
                # Fisincan Restaurant — Icherisheher
                ("Fisincan Restaurant", "Icherisheher", "Kichik Gala St 8, Old City", "+994-12-492-3030"),
                # Cafe City — 28 May
                ("Cafe City — 28 May", "28 May", "28 May St 14, Baku", "+994-12-493-2020"),
                # Nakhchivan Restaurant — Narimanov
                ("Nakhchivan Restaurant", "Narimanov", "Tabriz Chalabi St 6, Baku", "+994-12-465-4040"),
                # Chinar Restaurant — Fountain Square
                ("Chinar Restaurant", "Fountain Square", "Nizami St 35, Fountain Square", "+994-12-498-6060"),
                # Scalini Italian Restaurant — Genclik
                ("Scalini Italian Restaurant", "Genclik", "Heydar Aliyev Ave 65, Baku", "+994-12-465-9090"),
                # Zafferano Restaurant — Narimanov
                ("Zafferano Restaurant", "Narimanov", "Ataturk Ave 15, Baku", "+994-12-465-7070"),
                # Art Club Restaurant — Icherisheher
                ("Art Club Restaurant", "Icherisheher", "Asaf Zeynalli St 11, Old City", "+994-12-492-4040"),
                # Qaynana Restaurant — Yasamal + Elmler
                ("Qaynana Restaurant — Yasamal", "Yasamal", "Murtuza Mukhtarov 110, Baku", "+994-12-440-5050"),
                ("Qaynana Restaurant — Elmler", "Elmler Akademiyasi", "H. Javid Ave 30, Baku", "+994-12-440-5051"),
                # Sehrli Tendir — Yasamal
                ("Sehrli Tendir — Yasamal", "Yasamal", "Sharifzade St 44, Baku", "+994-12-440-6060"),
                # Baku Cafe — Ahmadli
                ("Baku Cafe — Ahmadli", "Ahmadli", "Ziya Bunyadov Ave 34, Baku", "+994-12-455-1010"),
                # Mangal Steak House — Genclik + Narimanov
                ("Mangal Steak House — Genclik", "Genclik", "Heydar Aliyev Ave 52, Baku", "+994-12-465-8080"),
                ("Mangal Steak House — Narimanov", "Narimanov", "Fatali Khan Khoyski 60, Baku", "+994-12-465-8081"),
                # Starbucks — 7 branches
                ("Starbucks — 28 May", "28 May", "28 May St 22, Baku", "+994-12-310-0101"),
                ("Starbucks — Sahil", "Sahil", "Neftchilar Ave 35, Sahil", "+994-12-310-0102"),
                ("Starbucks — Fountain Square", "Fountain Square", "Nizami St 10, Fountain Square", "+994-12-310-0103"),
                ("Starbucks — Genclik", "Genclik", "Ganjlik Mall, Heydar Aliyev Ave 60, Baku", "+994-12-310-0104"),
                ("Starbucks — Narimanov", "Narimanov", "Fatali Khan Khoyski 44, Baku", "+994-12-310-0105"),
                ("Starbucks — Yasamal", "Yasamal", "Baku Mall, Murtuza Mukhtarov 75, Baku", "+994-12-310-0106"),
                ("Starbucks — Icherisheher", "Icherisheher", "Boyuk Gala St 3, Old City", "+994-12-310-0107"),
                # Gloria Jean's Coffees — 6 branches
                ("Gloria Jean's Coffees — 28 May", "28 May", "28 May St 40, Baku", "+994-12-320-0201"),
                ("Gloria Jean's Coffees — Sahil", "Sahil", "Deniz Mall, Neftchilar Ave 80, Sahil", "+994-12-320-0202"),
                ("Gloria Jean's Coffees — Fountain Square", "Fountain Square", "Nizami St 25, Fountain Square", "+994-12-320-0203"),
                ("Gloria Jean's Coffees — Genclik", "Genclik", "Ganjlik Mall, Heydar Aliyev Ave 60, Baku", "+994-12-320-0204"),
                ("Gloria Jean's Coffees — Narimanov", "Narimanov", "Ataturk Ave 8, Baku", "+994-12-320-0205"),
                ("Gloria Jean's Coffees — Yasamal", "Yasamal", "Baku Mall, Murtuza Mukhtarov 75, Baku", "+994-12-320-0206"),
            ]

            restaurants = [
                Restaurant(name=name, location_id=loc[loc_key], address=addr, phone=phone)
                for name, loc_key, addr, phone in restaurant_data
            ]
            db.add_all(restaurants)
            db.commit()

            # ── Unique table layouts per restaurant ──
            all_restaurants = db.query(Restaurant).all()

            # fmt: off
            table_layouts = {
                # ─── Firuze Restaurant ───
                "Firuze Restaurant — Fountain Square": [
                    Table(name="Window 1",  capacity=2,  position_x=30,  position_y=30,  width=90,  height=90,  shape="circle", zone="Window"),
                    Table(name="Window 2",  capacity=2,  position_x=160, position_y=30,  width=90,  height=90,  shape="circle", zone="Window"),
                    Table(name="Hall A",    capacity=4,  position_x=300, position_y=30,  width=130, height=80,  shape="rect",   zone="Center"),
                    Table(name="Hall B",    capacity=6,  position_x=470, position_y=30,  width=140, height=90,  shape="rect",   zone="Center"),
                    Table(name="Terrace 1", capacity=2,  position_x=30,  position_y=180, width=90,  height=90,  shape="circle", zone="Terrace"),
                    Table(name="Terrace 2", capacity=4,  position_x=160, position_y=180, width=130, height=80,  shape="rect",   zone="Terrace"),
                    Table(name="VIP Room",  capacity=10, position_x=340, position_y=180, width=200, height=120, shape="rect",   zone="VIP"),
                    Table(name="Bar 1",     capacity=2,  position_x=30,  position_y=350, width=80,  height=80,  shape="circle", zone="Bar"),
                    Table(name="Bar 2",     capacity=2,  position_x=150, position_y=350, width=80,  height=80,  shape="circle", zone="Bar"),
                ],
                "Firuze Restaurant — Sahil": [
                    Table(name="Sea View 1", capacity=2, position_x=30,  position_y=30,  width=90,  height=90,  shape="circle", zone="Terrace"),
                    Table(name="Sea View 2", capacity=2, position_x=160, position_y=30,  width=90,  height=90,  shape="circle", zone="Terrace"),
                    Table(name="Sea View 3", capacity=4, position_x=300, position_y=30,  width=130, height=80,  shape="rect",   zone="Terrace"),
                    Table(name="Indoor 1",   capacity=4, position_x=30,  position_y=180, width=130, height=80,  shape="rect",   zone="Center"),
                    Table(name="Indoor 2",   capacity=6, position_x=210, position_y=180, width=150, height=100, shape="rect",   zone="Center"),
                    Table(name="Private",    capacity=8, position_x=410, position_y=180, width=180, height=110, shape="rect",   zone="VIP"),
                    Table(name="Lounge 1",   capacity=2, position_x=30,  position_y=350, width=80,  height=80,  shape="circle", zone="Lounge"),
                    Table(name="Lounge 2",   capacity=2, position_x=150, position_y=350, width=80,  height=80,  shape="circle", zone="Lounge"),
                ],
                # ─── Dolma Restaurant ───
                "Dolma Restaurant — Fountain Square": [
                    Table(name="Arch 1",    capacity=2, position_x=40,  position_y=30,  width=80,  height=80,  shape="circle", zone="Front"),
                    Table(name="Arch 2",    capacity=2, position_x=160, position_y=30,  width=80,  height=80,  shape="circle", zone="Front"),
                    Table(name="Arch 3",    capacity=4, position_x=290, position_y=30,  width=130, height=80,  shape="rect",   zone="Front"),
                    Table(name="Main 1",    capacity=6, position_x=470, position_y=30,  width=140, height=90,  shape="rect",   zone="Center"),
                    Table(name="Main 2",    capacity=4, position_x=40,  position_y=180, width=130, height=80,  shape="rect",   zone="Center"),
                    Table(name="Main 3",    capacity=4, position_x=220, position_y=180, width=130, height=80,  shape="rect",   zone="Center"),
                    Table(name="VIP Dolma", capacity=10, position_x=400, position_y=180, width=200, height=120, shape="rect",  zone="VIP"),
                    Table(name="Garden 1",  capacity=2, position_x=40,  position_y=360, width=80,  height=80,  shape="circle", zone="Garden"),
                    Table(name="Garden 2",  capacity=4, position_x=170, position_y=350, width=120, height=80,  shape="rect",   zone="Garden"),
                ],
                "Dolma Restaurant — Sahil": [
                    Table(name="Patio 1",  capacity=2, position_x=30,  position_y=40,  width=90,  height=90,  shape="circle", zone="Patio"),
                    Table(name="Patio 2",  capacity=2, position_x=160, position_y=40,  width=90,  height=90,  shape="circle", zone="Patio"),
                    Table(name="Inside A", capacity=4, position_x=300, position_y=40,  width=130, height=80,  shape="rect",   zone="Center"),
                    Table(name="Inside B", capacity=4, position_x=470, position_y=40,  width=130, height=80,  shape="rect",   zone="Center"),
                    Table(name="Family",   capacity=8, position_x=30,  position_y=190, width=180, height=110, shape="rect",   zone="VIP"),
                    Table(name="Cozy 1",   capacity=2, position_x=260, position_y=190, width=80,  height=80,  shape="circle", zone="Corner"),
                    Table(name="Cozy 2",   capacity=2, position_x=380, position_y=190, width=80,  height=80,  shape="circle", zone="Corner"),
                    Table(name="Bar",      capacity=3, position_x=510, position_y=190, width=100, height=70,  shape="rect",   zone="Bar"),
                ],
                # ─── Caravan Baku ───
                "Caravan Baku — Fountain Square": [
                    Table(name="Silk Road 1", capacity=2, position_x=30,  position_y=30,  width=90,  height=90,  shape="circle", zone="Window"),
                    Table(name="Silk Road 2", capacity=2, position_x=160, position_y=30,  width=90,  height=90,  shape="circle", zone="Window"),
                    Table(name="Camel 1",     capacity=4, position_x=300, position_y=30,  width=130, height=80,  shape="rect",   zone="Center"),
                    Table(name="Camel 2",     capacity=4, position_x=470, position_y=30,  width=130, height=80,  shape="rect",   zone="Center"),
                    Table(name="Oasis",       capacity=8, position_x=30,  position_y=180, width=180, height=110, shape="rect",   zone="VIP"),
                    Table(name="Desert 1",    capacity=4, position_x=260, position_y=180, width=120, height=80,  shape="rect",   zone="Lounge"),
                    Table(name="Desert 2",    capacity=6, position_x=430, position_y=180, width=150, height=100, shape="rect",   zone="Lounge"),
                    Table(name="Tent",        capacity=2, position_x=30,  position_y=360, width=80,  height=80,  shape="circle", zone="Corner"),
                ],
                "Caravan Baku — Nizami": [
                    Table(name="Bazaar 1",  capacity=2, position_x=40,  position_y=40,  width=80,  height=80,  shape="circle", zone="Front"),
                    Table(name="Bazaar 2",  capacity=2, position_x=160, position_y=40,  width=80,  height=80,  shape="circle", zone="Front"),
                    Table(name="Bazaar 3",  capacity=2, position_x=280, position_y=40,  width=80,  height=80,  shape="circle", zone="Front"),
                    Table(name="Trader A",  capacity=4, position_x=420, position_y=40,  width=120, height=80,  shape="rect",   zone="Center"),
                    Table(name="Trader B",  capacity=6, position_x=40,  position_y=190, width=150, height=100, shape="rect",   zone="Center"),
                    Table(name="Merchant",  capacity=8, position_x=240, position_y=190, width=180, height=110, shape="rect",   zone="VIP"),
                    Table(name="Spice Bar", capacity=3, position_x=470, position_y=190, width=100, height=70,  shape="rect",   zone="Bar"),
                ],
                # ─── Mari Vanna ───
                "Mari Vanna — Sahil": [
                    Table(name="Samovar 1",  capacity=2, position_x=30,  position_y=30,  width=90,  height=90,  shape="circle", zone="Window"),
                    Table(name="Samovar 2",  capacity=2, position_x=160, position_y=30,  width=90,  height=90,  shape="circle", zone="Window"),
                    Table(name="Dacha A",    capacity=4, position_x=300, position_y=30,  width=130, height=80,  shape="rect",   zone="Front"),
                    Table(name="Dacha B",    capacity=4, position_x=470, position_y=30,  width=130, height=80,  shape="rect",   zone="Front"),
                    Table(name="Kitchen",    capacity=6, position_x=30,  position_y=180, width=150, height=100, shape="rect",   zone="Center"),
                    Table(name="Parlor",     capacity=6, position_x=230, position_y=180, width=150, height=100, shape="rect",   zone="Center"),
                    Table(name="Grand",      capacity=10, position_x=430, position_y=180, width=180, height=110, shape="rect",  zone="VIP"),
                    Table(name="Nook 1",     capacity=2, position_x=30,  position_y=350, width=80,  height=80,  shape="circle", zone="Corner"),
                    Table(name="Nook 2",     capacity=2, position_x=150, position_y=350, width=80,  height=80,  shape="circle", zone="Corner"),
                ],
                # ─── SAHiL Bar & Restaurant ───
                "SAHiL Bar & Restaurant — Sahil": [
                    Table(name="Deck 1",    capacity=2, position_x=30,  position_y=30,  width=90,  height=90,  shape="circle", zone="Terrace"),
                    Table(name="Deck 2",    capacity=2, position_x=160, position_y=30,  width=90,  height=90,  shape="circle", zone="Terrace"),
                    Table(name="Deck 3",    capacity=4, position_x=300, position_y=30,  width=130, height=80,  shape="rect",   zone="Terrace"),
                    Table(name="Anchor A",  capacity=4, position_x=470, position_y=30,  width=130, height=80,  shape="rect",   zone="Center"),
                    Table(name="Anchor B",  capacity=6, position_x=30,  position_y=180, width=150, height=100, shape="rect",   zone="Center"),
                    Table(name="Captain",   capacity=8, position_x=230, position_y=180, width=180, height=110, shape="rect",   zone="VIP"),
                    Table(name="Bar Stool 1", capacity=2, position_x=460, position_y=180, width=80,  height=80, shape="circle", zone="Bar"),
                    Table(name="Bar Stool 2", capacity=2, position_x=560, position_y=180, width=80,  height=80, shape="circle", zone="Bar"),
                ],
                "SAHiL Bar & Restaurant — Boulevard": [
                    Table(name="Promenade 1", capacity=2, position_x=30,  position_y=30,  width=90,  height=90,  shape="circle", zone="Patio"),
                    Table(name="Promenade 2", capacity=2, position_x=160, position_y=30,  width=90,  height=90,  shape="circle", zone="Patio"),
                    Table(name="Promenade 3", capacity=2, position_x=290, position_y=30,  width=90,  height=90,  shape="circle", zone="Patio"),
                    Table(name="Seaside A",   capacity=4, position_x=430, position_y=30,  width=130, height=80,  shape="rect",   zone="Terrace"),
                    Table(name="Seaside B",   capacity=6, position_x=30,  position_y=180, width=150, height=100, shape="rect",   zone="Terrace"),
                    Table(name="Lighthouse",  capacity=10, position_x=230, position_y=180, width=200, height=120, shape="rect",  zone="VIP"),
                    Table(name="Sunset Bar",  capacity=3, position_x=480, position_y=180, width=100, height=70,  shape="rect",   zone="Bar"),
                ],
                # ─── Anadolu Restaurant ───
                "Anadolu Restaurant — 28 May": [
                    Table(name="Kebab 1",   capacity=2, position_x=40,  position_y=40,  width=80,  height=80,  shape="circle", zone="Window"),
                    Table(name="Kebab 2",   capacity=2, position_x=160, position_y=40,  width=80,  height=80,  shape="circle", zone="Window"),
                    Table(name="Sultan A",  capacity=4, position_x=300, position_y=40,  width=130, height=80,  shape="rect",   zone="Center"),
                    Table(name="Sultan B",  capacity=4, position_x=470, position_y=40,  width=130, height=80,  shape="rect",   zone="Center"),
                    Table(name="Pasha",     capacity=8, position_x=40,  position_y=190, width=180, height=110, shape="rect",   zone="VIP"),
                    Table(name="Ottoman 1", capacity=4, position_x=270, position_y=190, width=120, height=80,  shape="rect",   zone="Front"),
                    Table(name="Ottoman 2", capacity=6, position_x=440, position_y=190, width=150, height=100, shape="rect",   zone="Front"),
                ],
                "Anadolu Restaurant — Nasimi": [
                    Table(name="Turk 1",    capacity=2, position_x=30,  position_y=30,  width=90,  height=90,  shape="circle", zone="Front"),
                    Table(name="Turk 2",    capacity=2, position_x=160, position_y=30,  width=90,  height=90,  shape="circle", zone="Front"),
                    Table(name="Anatolia",  capacity=6, position_x=300, position_y=30,  width=150, height=90,  shape="rect",   zone="Center"),
                    Table(name="Bosporus",  capacity=4, position_x=500, position_y=30,  width=120, height=80,  shape="rect",   zone="Center"),
                    Table(name="Grand Turk",capacity=10, position_x=30,  position_y=190, width=200, height=120, shape="rect",  zone="VIP"),
                    Table(name="Pide 1",    capacity=2, position_x=280, position_y=190, width=80,  height=80,  shape="circle", zone="Corner"),
                    Table(name="Pide 2",    capacity=4, position_x=410, position_y=190, width=120, height=80,  shape="rect",   zone="Corner"),
                ],
                # ─── Matbakh Restaurant ───
                "Matbakh Restaurant — 28 May": [
                    Table(name="Chef 1",    capacity=2, position_x=30,  position_y=30,  width=90,  height=90,  shape="circle", zone="Window"),
                    Table(name="Chef 2",    capacity=2, position_x=160, position_y=30,  width=90,  height=90,  shape="circle", zone="Window"),
                    Table(name="Oven A",    capacity=4, position_x=300, position_y=30,  width=130, height=80,  shape="rect",   zone="Front"),
                    Table(name="Oven B",    capacity=4, position_x=470, position_y=30,  width=130, height=80,  shape="rect",   zone="Front"),
                    Table(name="Feast",     capacity=8, position_x=30,  position_y=180, width=180, height=110, shape="rect",   zone="VIP"),
                    Table(name="Hearth 1",  capacity=4, position_x=260, position_y=180, width=120, height=80,  shape="rect",   zone="Center"),
                    Table(name="Hearth 2",  capacity=6, position_x=430, position_y=180, width=150, height=100, shape="rect",   zone="Center"),
                    Table(name="Counter",   capacity=3, position_x=30,  position_y=360, width=100, height=70,  shape="rect",   zone="Bar"),
                ],
                # ─── Bashkent Restoran ───
                "Bashkent Restoran — 28 May": [
                    Table(name="Ankara 1",  capacity=2, position_x=40,  position_y=40,  width=80,  height=80,  shape="circle", zone="Front"),
                    Table(name="Ankara 2",  capacity=2, position_x=160, position_y=40,  width=80,  height=80,  shape="circle", zone="Front"),
                    Table(name="Capital A", capacity=4, position_x=290, position_y=40,  width=130, height=80,  shape="rect",   zone="Center"),
                    Table(name="Capital B", capacity=6, position_x=460, position_y=40,  width=150, height=90,  shape="rect",   zone="Center"),
                    Table(name="Diplomat",  capacity=8, position_x=40,  position_y=190, width=180, height=110, shape="rect",   zone="VIP"),
                    Table(name="Embassy",   capacity=4, position_x=270, position_y=190, width=120, height=80,  shape="rect",   zone="Lounge"),
                    Table(name="Garden",    capacity=2, position_x=440, position_y=190, width=80,  height=80,  shape="circle", zone="Garden"),
                    Table(name="Garden 2",  capacity=4, position_x=560, position_y=190, width=120, height=80,  shape="rect",   zone="Garden"),
                ],
                # ─── Marani Restaurant ───
                "Marani Restaurant — 28 May": [
                    Table(name="Wine 1",    capacity=2, position_x=30,  position_y=30,  width=90,  height=90,  shape="circle", zone="Window"),
                    Table(name="Wine 2",    capacity=2, position_x=160, position_y=30,  width=90,  height=90,  shape="circle", zone="Window"),
                    Table(name="Cellar A",  capacity=4, position_x=300, position_y=30,  width=130, height=80,  shape="rect",   zone="Center"),
                    Table(name="Cellar B",  capacity=6, position_x=470, position_y=30,  width=150, height=90,  shape="rect",   zone="Center"),
                    Table(name="Khvanchkara",capacity=8, position_x=30,  position_y=180, width=180, height=110, shape="rect",  zone="VIP"),
                    Table(name="Barrel 1",  capacity=4, position_x=260, position_y=180, width=120, height=80,  shape="rect",   zone="Lounge"),
                    Table(name="Barrel 2",  capacity=2, position_x=430, position_y=180, width=80,  height=80,  shape="circle", zone="Bar"),
                    Table(name="Barrel 3",  capacity=2, position_x=550, position_y=180, width=80,  height=80,  shape="circle", zone="Bar"),
                ],
                "Marani Restaurant — Nasimi": [
                    Table(name="Grape 1",    capacity=2, position_x=30,  position_y=30,  width=90,  height=90,  shape="circle", zone="Front"),
                    Table(name="Grape 2",    capacity=2, position_x=160, position_y=30,  width=90,  height=90,  shape="circle", zone="Front"),
                    Table(name="Vineyard A", capacity=4, position_x=300, position_y=30,  width=130, height=80,  shape="rect",   zone="Center"),
                    Table(name="Vineyard B", capacity=4, position_x=470, position_y=30,  width=130, height=80,  shape="rect",   zone="Center"),
                    Table(name="Supra",      capacity=10, position_x=30,  position_y=180, width=200, height=120, shape="rect",  zone="VIP"),
                    Table(name="Tamada",     capacity=6, position_x=280, position_y=180, width=150, height=100, shape="rect",   zone="Lounge"),
                    Table(name="Wine Bar",   capacity=3, position_x=480, position_y=180, width=100, height=70,  shape="rect",   zone="Bar"),
                ],
                # ─── Sumakh Restaurant ───
                "Sumakh Restaurant — Narimanov": [
                    Table(name="Spice 1",   capacity=2, position_x=30,  position_y=30,  width=90,  height=90,  shape="circle", zone="Window"),
                    Table(name="Spice 2",   capacity=2, position_x=160, position_y=30,  width=90,  height=90,  shape="circle", zone="Window"),
                    Table(name="Herb A",    capacity=4, position_x=300, position_y=30,  width=130, height=80,  shape="rect",   zone="Center"),
                    Table(name="Herb B",    capacity=6, position_x=470, position_y=30,  width=150, height=90,  shape="rect",   zone="Center"),
                    Table(name="Saffron",   capacity=8, position_x=30,  position_y=180, width=180, height=110, shape="rect",   zone="VIP"),
                    Table(name="Cumin",     capacity=4, position_x=260, position_y=180, width=120, height=80,  shape="rect",   zone="Front"),
                    Table(name="Terrace 1", capacity=2, position_x=430, position_y=180, width=80,  height=80,  shape="circle", zone="Terrace"),
                    Table(name="Terrace 2", capacity=2, position_x=550, position_y=180, width=80,  height=80,  shape="circle", zone="Terrace"),
                ],
                "Sumakh Restaurant — Genclik": [
                    Table(name="S1",      capacity=2, position_x=40,  position_y=40,  width=80,  height=80,  shape="circle", zone="Front"),
                    Table(name="S2",      capacity=2, position_x=160, position_y=40,  width=80,  height=80,  shape="circle", zone="Front"),
                    Table(name="S3",      capacity=4, position_x=290, position_y=40,  width=130, height=80,  shape="rect",   zone="Center"),
                    Table(name="S4",      capacity=4, position_x=460, position_y=40,  width=130, height=80,  shape="rect",   zone="Center"),
                    Table(name="S5",      capacity=6, position_x=40,  position_y=190, width=150, height=100, shape="rect",   zone="Center"),
                    Table(name="Premium", capacity=10, position_x=240, position_y=190, width=200, height=120, shape="rect",  zone="VIP"),
                    Table(name="Patio 1", capacity=2, position_x=490, position_y=190, width=80,  height=80,  shape="circle", zone="Patio"),
                ],
                # ─── Megobari Restaurant ───
                "Megobari Restaurant — Sahil": [
                    Table(name="Tbilisi 1",  capacity=2, position_x=30,  position_y=30,  width=90,  height=90,  shape="circle", zone="Window"),
                    Table(name="Tbilisi 2",  capacity=2, position_x=160, position_y=30,  width=90,  height=90,  shape="circle", zone="Window"),
                    Table(name="Batumi A",   capacity=4, position_x=300, position_y=30,  width=130, height=80,  shape="rect",   zone="Front"),
                    Table(name="Batumi B",   capacity=6, position_x=470, position_y=30,  width=150, height=90,  shape="rect",   zone="Front"),
                    Table(name="Caucasus",   capacity=8, position_x=30,  position_y=180, width=180, height=110, shape="rect",   zone="VIP"),
                    Table(name="Kakheti 1",  capacity=4, position_x=260, position_y=180, width=120, height=80,  shape="rect",   zone="Center"),
                    Table(name="Kakheti 2",  capacity=4, position_x=430, position_y=180, width=120, height=80,  shape="rect",   zone="Center"),
                    Table(name="Wine Bar",   capacity=3, position_x=30,  position_y=360, width=100, height=70,  shape="rect",   zone="Bar"),
                ],
                "Megobari Restaurant — Nasimi": [
                    Table(name="M1",       capacity=2, position_x=40,  position_y=40,  width=80,  height=80,  shape="circle", zone="Window"),
                    Table(name="M2",       capacity=2, position_x=160, position_y=40,  width=80,  height=80,  shape="circle", zone="Window"),
                    Table(name="M3",       capacity=4, position_x=290, position_y=40,  width=130, height=80,  shape="rect",   zone="Center"),
                    Table(name="M4",       capacity=4, position_x=460, position_y=40,  width=130, height=80,  shape="rect",   zone="Center"),
                    Table(name="Georgian", capacity=10, position_x=40,  position_y=190, width=200, height=120, shape="rect",  zone="VIP"),
                    Table(name="Balcony 1",capacity=2, position_x=290, position_y=190, width=80,  height=80,  shape="circle", zone="Terrace"),
                    Table(name="Balcony 2",capacity=4, position_x=420, position_y=190, width=120, height=80,  shape="rect",   zone="Terrace"),
                ],
                # ─── Mama Nakormila ───
                "Mama Nakormila — Sahil": [
                    Table(name="Mama 1",    capacity=2, position_x=30,  position_y=30,  width=90,  height=90,  shape="circle", zone="Window"),
                    Table(name="Mama 2",    capacity=2, position_x=160, position_y=30,  width=90,  height=90,  shape="circle", zone="Window"),
                    Table(name="Family A",  capacity=6, position_x=300, position_y=30,  width=150, height=90,  shape="rect",   zone="Center"),
                    Table(name="Family B",  capacity=6, position_x=490, position_y=30,  width=150, height=90,  shape="rect",   zone="Center"),
                    Table(name="Home",      capacity=8, position_x=30,  position_y=180, width=180, height=110, shape="rect",   zone="VIP"),
                    Table(name="Kitchen 1", capacity=4, position_x=260, position_y=180, width=120, height=80,  shape="rect",   zone="Front"),
                    Table(name="Kitchen 2", capacity=4, position_x=430, position_y=180, width=120, height=80,  shape="rect",   zone="Front"),
                    Table(name="Cozy",      capacity=2, position_x=30,  position_y=360, width=80,  height=80,  shape="circle", zone="Corner"),
                    Table(name="Porch",     capacity=2, position_x=150, position_y=360, width=80,  height=80,  shape="circle", zone="Garden"),
                ],
                # ─── Maaya Indian Restaurant ───
                "Maaya Indian Restaurant — Sahil": [
                    Table(name="Tandoor 1", capacity=2, position_x=30,  position_y=30,  width=90,  height=90,  shape="circle", zone="Window"),
                    Table(name="Tandoor 2", capacity=2, position_x=160, position_y=30,  width=90,  height=90,  shape="circle", zone="Window"),
                    Table(name="Curry A",   capacity=4, position_x=300, position_y=30,  width=130, height=80,  shape="rect",   zone="Center"),
                    Table(name="Curry B",   capacity=4, position_x=470, position_y=30,  width=130, height=80,  shape="rect",   zone="Center"),
                    Table(name="Maharaja",  capacity=8, position_x=30,  position_y=180, width=180, height=110, shape="rect",   zone="VIP"),
                    Table(name="Masala 1",  capacity=4, position_x=260, position_y=180, width=120, height=80,  shape="rect",   zone="Lounge"),
                    Table(name="Masala 2",  capacity=6, position_x=430, position_y=180, width=150, height=100, shape="rect",   zone="Lounge"),
                ],
                "Maaya Indian Restaurant — Nasimi": [
                    Table(name="Spice 1",  capacity=2, position_x=40,  position_y=40,  width=80,  height=80,  shape="circle", zone="Front"),
                    Table(name="Spice 2",  capacity=2, position_x=160, position_y=40,  width=80,  height=80,  shape="circle", zone="Front"),
                    Table(name="Naan A",   capacity=4, position_x=290, position_y=40,  width=130, height=80,  shape="rect",   zone="Center"),
                    Table(name="Naan B",   capacity=6, position_x=460, position_y=40,  width=150, height=90,  shape="rect",   zone="Center"),
                    Table(name="Taj",      capacity=10, position_x=40,  position_y=190, width=200, height=120, shape="rect",  zone="VIP"),
                    Table(name="Chai 1",   capacity=2, position_x=290, position_y=190, width=80,  height=80,  shape="circle", zone="Bar"),
                    Table(name="Chai 2",   capacity=2, position_x=410, position_y=190, width=80,  height=80,  shape="circle", zone="Bar"),
                    Table(name="Terrace",  capacity=4, position_x=540, position_y=190, width=120, height=80,  shape="rect",   zone="Terrace"),
                ],
                # ─── Shirvanshah Museum Restaurant ───
                "Shirvanshah Museum Restaurant": [
                    Table(name="Palace 1",  capacity=2, position_x=50,  position_y=40,  width=80,  height=80,  shape="circle", zone="Front"),
                    Table(name="Palace 2",  capacity=2, position_x=180, position_y=40,  width=80,  height=80,  shape="circle", zone="Front"),
                    Table(name="Stone 1",   capacity=4, position_x=320, position_y=40,  width=130, height=80,  shape="rect",   zone="Center"),
                    Table(name="Stone 2",   capacity=4, position_x=500, position_y=40,  width=130, height=80,  shape="rect",   zone="Center"),
                    Table(name="Museum",    capacity=8, position_x=50,  position_y=190, width=180, height=110, shape="rect",   zone="VIP"),
                    Table(name="Courtyard 1", capacity=4, position_x=280, position_y=190, width=120, height=80, shape="rect",  zone="Garden"),
                    Table(name="Courtyard 2", capacity=2, position_x=450, position_y=190, width=80,  height=80, shape="circle", zone="Garden"),
                    Table(name="Tower",     capacity=6, position_x=570, position_y=190, width=130, height=90,  shape="rect",   zone="Corner"),
                ],
                # ─── Fisincan Restaurant ───
                "Fisincan Restaurant": [
                    Table(name="Arch 1",   capacity=2, position_x=30,  position_y=30,  width=90,  height=90,  shape="circle", zone="Front"),
                    Table(name="Arch 2",   capacity=2, position_x=160, position_y=30,  width=90,  height=90,  shape="circle", zone="Front"),
                    Table(name="Old City A", capacity=4, position_x=300, position_y=30,  width=130, height=80, shape="rect",  zone="Center"),
                    Table(name="Old City B", capacity=6, position_x=470, position_y=30,  width=150, height=90, shape="rect",  zone="Center"),
                    Table(name="Maiden",   capacity=8, position_x=30,  position_y=180, width=180, height=110, shape="rect",   zone="VIP"),
                    Table(name="Wall 1",   capacity=4, position_x=260, position_y=180, width=120, height=80,  shape="rect",   zone="Corner"),
                    Table(name="Wall 2",   capacity=2, position_x=430, position_y=180, width=80,  height=80,  shape="circle", zone="Corner"),
                    Table(name="Carpet",   capacity=4, position_x=550, position_y=180, width=120, height=80,  shape="rect",   zone="Lounge"),
                ],
                # ─── Cafe City ───
                "Cafe City — 28 May": [
                    Table(name="City 1",   capacity=2, position_x=40,  position_y=40,  width=80,  height=80,  shape="circle", zone="Window"),
                    Table(name="City 2",   capacity=2, position_x=160, position_y=40,  width=80,  height=80,  shape="circle", zone="Window"),
                    Table(name="City 3",   capacity=2, position_x=280, position_y=40,  width=80,  height=80,  shape="circle", zone="Window"),
                    Table(name="Urban A",  capacity=4, position_x=420, position_y=40,  width=120, height=80,  shape="rect",   zone="Front"),
                    Table(name="Urban B",  capacity=4, position_x=40,  position_y=190, width=120, height=80,  shape="rect",   zone="Center"),
                    Table(name="Metro",    capacity=6, position_x=210, position_y=190, width=150, height=100, shape="rect",   zone="Center"),
                    Table(name="Loft",     capacity=8, position_x=410, position_y=190, width=180, height=110, shape="rect",   zone="VIP"),
                ],
                # ─── Nakhchivan Restaurant ───
                "Nakhchivan Restaurant": [
                    Table(name="Bazaar 1", capacity=2, position_x=30,  position_y=30,  width=90,  height=90,  shape="circle", zone="Front"),
                    Table(name="Bazaar 2", capacity=2, position_x=160, position_y=30,  width=90,  height=90,  shape="circle", zone="Front"),
                    Table(name="Alinja A", capacity=4, position_x=300, position_y=30,  width=130, height=80,  shape="rect",   zone="Center"),
                    Table(name="Alinja B", capacity=4, position_x=470, position_y=30,  width=130, height=80,  shape="rect",   zone="Center"),
                    Table(name="Fortress", capacity=8, position_x=30,  position_y=180, width=180, height=110, shape="rect",   zone="VIP"),
                    Table(name="Spring 1", capacity=4, position_x=260, position_y=180, width=120, height=80,  shape="rect",   zone="Garden"),
                    Table(name="Spring 2", capacity=2, position_x=430, position_y=180, width=80,  height=80,  shape="circle", zone="Garden"),
                    Table(name="Terrace",  capacity=6, position_x=550, position_y=180, width=130, height=90,  shape="rect",   zone="Terrace"),
                ],
                # ─── Chinar Restaurant ───
                "Chinar Restaurant": [
                    Table(name="Tree 1",     capacity=2, position_x=30,  position_y=30,  width=90,  height=90,  shape="circle", zone="Patio"),
                    Table(name="Tree 2",     capacity=2, position_x=160, position_y=30,  width=90,  height=90,  shape="circle", zone="Patio"),
                    Table(name="Shade A",    capacity=4, position_x=300, position_y=30,  width=130, height=80,  shape="rect",   zone="Patio"),
                    Table(name="Branch A",   capacity=4, position_x=470, position_y=30,  width=130, height=80,  shape="rect",   zone="Center"),
                    Table(name="Branch B",   capacity=6, position_x=30,  position_y=180, width=150, height=100, shape="rect",   zone="Center"),
                    Table(name="Root",       capacity=10, position_x=230, position_y=180, width=200, height=120, shape="rect",  zone="VIP"),
                    Table(name="Leaf 1",     capacity=2, position_x=480, position_y=180, width=80,  height=80,  shape="circle", zone="Garden"),
                    Table(name="Leaf 2",     capacity=2, position_x=580, position_y=180, width=80,  height=80,  shape="circle", zone="Garden"),
                ],
                # ─── Scalini Italian Restaurant ───
                "Scalini Italian Restaurant": [
                    Table(name="Roma 1",    capacity=2, position_x=30,  position_y=30,  width=90,  height=90,  shape="circle", zone="Window"),
                    Table(name="Roma 2",    capacity=2, position_x=160, position_y=30,  width=90,  height=90,  shape="circle", zone="Window"),
                    Table(name="Milano A",  capacity=4, position_x=300, position_y=30,  width=130, height=80,  shape="rect",   zone="Front"),
                    Table(name="Milano B",  capacity=4, position_x=470, position_y=30,  width=130, height=80,  shape="rect",   zone="Front"),
                    Table(name="Toscana",   capacity=8, position_x=30,  position_y=180, width=180, height=110, shape="rect",   zone="VIP"),
                    Table(name="Napoli 1",  capacity=4, position_x=260, position_y=180, width=120, height=80,  shape="rect",   zone="Center"),
                    Table(name="Napoli 2",  capacity=6, position_x=430, position_y=180, width=150, height=100, shape="rect",   zone="Center"),
                    Table(name="Espresso",  capacity=2, position_x=30,  position_y=360, width=80,  height=80,  shape="circle", zone="Bar"),
                    Table(name="Gelato",    capacity=2, position_x=150, position_y=360, width=80,  height=80,  shape="circle", zone="Bar"),
                ],
                # ─── Zafferano Restaurant ───
                "Zafferano Restaurant": [
                    Table(name="Gold 1",    capacity=2, position_x=30,  position_y=30,  width=90,  height=90,  shape="circle", zone="Window"),
                    Table(name="Gold 2",    capacity=2, position_x=160, position_y=30,  width=90,  height=90,  shape="circle", zone="Window"),
                    Table(name="Amber A",   capacity=4, position_x=300, position_y=30,  width=130, height=80,  shape="rect",   zone="Center"),
                    Table(name="Amber B",   capacity=6, position_x=470, position_y=30,  width=150, height=90,  shape="rect",   zone="Center"),
                    Table(name="Saffron Executive", capacity=10, position_x=30,  position_y=180, width=210, height=120, shape="rect", zone="VIP"),
                    Table(name="Crocus 1",  capacity=4, position_x=290, position_y=180, width=120, height=80,  shape="rect",   zone="Lounge"),
                    Table(name="Crocus 2",  capacity=4, position_x=460, position_y=180, width=120, height=80,  shape="rect",   zone="Lounge"),
                    Table(name="Bar",       capacity=3, position_x=30,  position_y=370, width=100, height=70,  shape="rect",   zone="Bar"),
                ],
                # ─── Art Club Restaurant ───
                "Art Club Restaurant": [
                    Table(name="Canvas 1",  capacity=2, position_x=30,  position_y=30,  width=90,  height=90,  shape="circle", zone="Front"),
                    Table(name="Canvas 2",  capacity=2, position_x=160, position_y=30,  width=90,  height=90,  shape="circle", zone="Front"),
                    Table(name="Palette A", capacity=4, position_x=300, position_y=30,  width=130, height=80,  shape="rect",   zone="Center"),
                    Table(name="Palette B", capacity=4, position_x=470, position_y=30,  width=130, height=80,  shape="rect",   zone="Center"),
                    Table(name="Gallery",   capacity=8, position_x=30,  position_y=180, width=180, height=110, shape="rect",   zone="VIP"),
                    Table(name="Studio 1",  capacity=4, position_x=260, position_y=180, width=120, height=80,  shape="rect",   zone="Lounge"),
                    Table(name="Studio 2",  capacity=2, position_x=430, position_y=180, width=80,  height=80,  shape="circle", zone="Corner"),
                    Table(name="Sketch",    capacity=2, position_x=550, position_y=180, width=80,  height=80,  shape="circle", zone="Corner"),
                ],
                # ─── Qaynana Restaurant ───
                "Qaynana Restaurant — Yasamal": [
                    Table(name="Grandma 1", capacity=2, position_x=30,  position_y=30,  width=90,  height=90,  shape="circle", zone="Window"),
                    Table(name="Grandma 2", capacity=2, position_x=160, position_y=30,  width=90,  height=90,  shape="circle", zone="Window"),
                    Table(name="Home A",    capacity=4, position_x=300, position_y=30,  width=130, height=80,  shape="rect",   zone="Center"),
                    Table(name="Home B",    capacity=6, position_x=470, position_y=30,  width=150, height=90,  shape="rect",   zone="Center"),
                    Table(name="Feast",     capacity=8, position_x=30,  position_y=180, width=180, height=110, shape="rect",   zone="VIP"),
                    Table(name="Hearth 1",  capacity=4, position_x=260, position_y=180, width=120, height=80,  shape="rect",   zone="Front"),
                    Table(name="Hearth 2",  capacity=4, position_x=430, position_y=180, width=120, height=80,  shape="rect",   zone="Front"),
                    Table(name="Porch",     capacity=2, position_x=30,  position_y=360, width=80,  height=80,  shape="circle", zone="Garden"),
                    Table(name="Yard",      capacity=2, position_x=150, position_y=360, width=80,  height=80,  shape="circle", zone="Garden"),
                ],
                "Qaynana Restaurant — Elmler": [
                    Table(name="Q1",       capacity=2, position_x=40,  position_y=40,  width=80,  height=80,  shape="circle", zone="Window"),
                    Table(name="Q2",       capacity=2, position_x=160, position_y=40,  width=80,  height=80,  shape="circle", zone="Window"),
                    Table(name="Q3",       capacity=4, position_x=290, position_y=40,  width=130, height=80,  shape="rect",   zone="Center"),
                    Table(name="Q4",       capacity=4, position_x=460, position_y=40,  width=130, height=80,  shape="rect",   zone="Center"),
                    Table(name="Q5",       capacity=6, position_x=40,  position_y=190, width=150, height=100, shape="rect",   zone="Front"),
                    Table(name="Q-VIP",    capacity=10, position_x=240, position_y=190, width=200, height=120, shape="rect",  zone="VIP"),
                    Table(name="Q-Bar",    capacity=3, position_x=490, position_y=190, width=100, height=70,  shape="rect",   zone="Bar"),
                ],
                # ─── Sehrli Tendir ───
                "Sehrli Tendir — Yasamal": [
                    Table(name="Tendir 1",  capacity=2, position_x=30,  position_y=30,  width=90,  height=90,  shape="circle", zone="Front"),
                    Table(name="Tendir 2",  capacity=2, position_x=160, position_y=30,  width=90,  height=90,  shape="circle", zone="Front"),
                    Table(name="Bread A",   capacity=4, position_x=300, position_y=30,  width=130, height=80,  shape="rect",   zone="Center"),
                    Table(name="Bread B",   capacity=4, position_x=470, position_y=30,  width=130, height=80,  shape="rect",   zone="Center"),
                    Table(name="Bakery",    capacity=6, position_x=30,  position_y=180, width=150, height=100, shape="rect",   zone="Center"),
                    Table(name="Oven Room", capacity=8, position_x=230, position_y=180, width=180, height=110, shape="rect",   zone="VIP"),
                    Table(name="Corner 1",  capacity=2, position_x=460, position_y=180, width=80,  height=80,  shape="circle", zone="Corner"),
                    Table(name="Corner 2",  capacity=2, position_x=570, position_y=180, width=80,  height=80,  shape="circle", zone="Corner"),
                ],
                # ─── Baku Cafe ───
                "Baku Cafe — Ahmadli": [
                    Table(name="Flame 1",  capacity=2, position_x=30,  position_y=30,  width=90,  height=90,  shape="circle", zone="Window"),
                    Table(name="Flame 2",  capacity=2, position_x=160, position_y=30,  width=90,  height=90,  shape="circle", zone="Window"),
                    Table(name="Tower A",  capacity=4, position_x=300, position_y=30,  width=130, height=80,  shape="rect",   zone="Front"),
                    Table(name="Tower B",  capacity=4, position_x=470, position_y=30,  width=130, height=80,  shape="rect",   zone="Front"),
                    Table(name="Maiden",   capacity=6, position_x=30,  position_y=180, width=150, height=100, shape="rect",   zone="Center"),
                    Table(name="Caspian",  capacity=8, position_x=230, position_y=180, width=180, height=110, shape="rect",   zone="VIP"),
                    Table(name="Tea 1",    capacity=2, position_x=460, position_y=180, width=80,  height=80,  shape="circle", zone="Bar"),
                    Table(name="Tea 2",    capacity=2, position_x=570, position_y=180, width=80,  height=80,  shape="circle", zone="Bar"),
                    Table(name="Garden",   capacity=4, position_x=30,  position_y=360, width=120, height=80,  shape="rect",   zone="Garden"),
                ],
                # ─── Mangal Steak House ───
                "Mangal Steak House — Genclik": [
                    Table(name="Grill 1",   capacity=2, position_x=30,  position_y=30,  width=90,  height=90,  shape="circle", zone="Window"),
                    Table(name="Grill 2",   capacity=2, position_x=160, position_y=30,  width=90,  height=90,  shape="circle", zone="Window"),
                    Table(name="Smoke A",   capacity=4, position_x=300, position_y=30,  width=130, height=80,  shape="rect",   zone="Front"),
                    Table(name="Smoke B",   capacity=4, position_x=470, position_y=30,  width=130, height=80,  shape="rect",   zone="Front"),
                    Table(name="Butcher",   capacity=8, position_x=30,  position_y=180, width=180, height=110, shape="rect",   zone="VIP"),
                    Table(name="Char 1",    capacity=4, position_x=260, position_y=180, width=120, height=80,  shape="rect",   zone="Center"),
                    Table(name="Char 2",    capacity=6, position_x=430, position_y=180, width=150, height=100, shape="rect",   zone="Center"),
                    Table(name="Fire Pit",  capacity=2, position_x=30,  position_y=360, width=80,  height=80,  shape="circle", zone="Patio"),
                    Table(name="Ember",     capacity=2, position_x=150, position_y=360, width=80,  height=80,  shape="circle", zone="Patio"),
                ],
                "Mangal Steak House — Narimanov": [
                    Table(name="Steak 1",   capacity=2, position_x=40,  position_y=40,  width=80,  height=80,  shape="circle", zone="Front"),
                    Table(name="Steak 2",   capacity=2, position_x=160, position_y=40,  width=80,  height=80,  shape="circle", zone="Front"),
                    Table(name="Ribeye A",  capacity=4, position_x=290, position_y=40,  width=130, height=80,  shape="rect",   zone="Center"),
                    Table(name="Ribeye B",  capacity=6, position_x=460, position_y=40,  width=150, height=90,  shape="rect",   zone="Center"),
                    Table(name="T-Bone",    capacity=10, position_x=40,  position_y=190, width=200, height=120, shape="rect",  zone="VIP"),
                    Table(name="Sirloin 1", capacity=4, position_x=290, position_y=190, width=120, height=80,  shape="rect",   zone="Lounge"),
                    Table(name="Sirloin 2", capacity=2, position_x=460, position_y=190, width=80,  height=80,  shape="circle", zone="Bar"),
                    Table(name="Grill Bar", capacity=3, position_x=570, position_y=190, width=100, height=70,  shape="rect",   zone="Bar"),
                ],
                # ─── Starbucks ───
                "Starbucks — 28 May": [
                    Table(name="Espresso 1",  capacity=2, position_x=30,  position_y=30,  width=70,  height=70,  shape="circle", zone="Window"),
                    Table(name="Espresso 2",  capacity=2, position_x=130, position_y=30,  width=70,  height=70,  shape="circle", zone="Window"),
                    Table(name="Latte 1",     capacity=2, position_x=230, position_y=30,  width=70,  height=70,  shape="circle", zone="Window"),
                    Table(name="Mocha A",     capacity=4, position_x=350, position_y=30,  width=120, height=80,  shape="rect",   zone="Center"),
                    Table(name="Mocha B",     capacity=4, position_x=510, position_y=30,  width=120, height=80,  shape="rect",   zone="Center"),
                    Table(name="Frappuccino", capacity=6, position_x=30,  position_y=170, width=150, height=90,  shape="rect",   zone="Lounge"),
                    Table(name="Reserve",     capacity=6, position_x=230, position_y=170, width=150, height=90,  shape="rect",   zone="Lounge"),
                    Table(name="Siren",       capacity=8, position_x=430, position_y=170, width=180, height=110, shape="rect",   zone="VIP"),
                ],
                "Starbucks — Sahil": [
                    Table(name="Shore 1",   capacity=2, position_x=40,  position_y=40,  width=70,  height=70,  shape="circle", zone="Terrace"),
                    Table(name="Shore 2",   capacity=2, position_x=140, position_y=40,  width=70,  height=70,  shape="circle", zone="Terrace"),
                    Table(name="Shore 3",   capacity=2, position_x=240, position_y=40,  width=70,  height=70,  shape="circle", zone="Terrace"),
                    Table(name="Brew A",    capacity=4, position_x=360, position_y=40,  width=120, height=80,  shape="rect",   zone="Center"),
                    Table(name="Brew B",    capacity=4, position_x=520, position_y=40,  width=120, height=80,  shape="rect",   zone="Center"),
                    Table(name="Coastal",   capacity=6, position_x=40,  position_y=180, width=150, height=90,  shape="rect",   zone="Lounge"),
                    Table(name="Mermaid",   capacity=8, position_x=240, position_y=180, width=180, height=110, shape="rect",   zone="VIP"),
                    Table(name="Cold Brew", capacity=2, position_x=470, position_y=180, width=70,  height=70,  shape="circle", zone="Bar"),
                    Table(name="Nitro",     capacity=2, position_x=570, position_y=180, width=70,  height=70,  shape="circle", zone="Bar"),
                ],
                "Starbucks — Fountain Square": [
                    Table(name="Nizami 1",   capacity=2, position_x=30,  position_y=30,  width=70,  height=70,  shape="circle", zone="Window"),
                    Table(name="Nizami 2",   capacity=2, position_x=130, position_y=30,  width=70,  height=70,  shape="circle", zone="Window"),
                    Table(name="Square A",   capacity=4, position_x=250, position_y=30,  width=120, height=80,  shape="rect",   zone="Front"),
                    Table(name="Square B",   capacity=4, position_x=410, position_y=30,  width=120, height=80,  shape="rect",   zone="Front"),
                    Table(name="Fountain",   capacity=6, position_x=30,  position_y=170, width=150, height=90,  shape="rect",   zone="Center"),
                    Table(name="Plaza",      capacity=6, position_x=230, position_y=170, width=150, height=90,  shape="rect",   zone="Center"),
                    Table(name="Premium",    capacity=8, position_x=430, position_y=170, width=180, height=110, shape="rect",   zone="VIP"),
                    Table(name="Drip Bar",   capacity=3, position_x=30,  position_y=340, width=100, height=70,  shape="rect",   zone="Bar"),
                ],
                "Starbucks — Genclik": [
                    Table(name="Mall 1",    capacity=2, position_x=30,  position_y=30,  width=70,  height=70,  shape="circle", zone="Front"),
                    Table(name="Mall 2",    capacity=2, position_x=130, position_y=30,  width=70,  height=70,  shape="circle", zone="Front"),
                    Table(name="Mall 3",    capacity=2, position_x=230, position_y=30,  width=70,  height=70,  shape="circle", zone="Front"),
                    Table(name="Ganjlik A", capacity=4, position_x=350, position_y=30,  width=120, height=80,  shape="rect",   zone="Center"),
                    Table(name="Ganjlik B", capacity=4, position_x=510, position_y=30,  width=120, height=80,  shape="rect",   zone="Center"),
                    Table(name="Atrium",    capacity=6, position_x=30,  position_y=170, width=150, height=90,  shape="rect",   zone="Lounge"),
                    Table(name="Skylight",  capacity=8, position_x=230, position_y=170, width=180, height=110, shape="rect",   zone="VIP"),
                ],
                "Starbucks — Narimanov": [
                    Table(name="Drip 1",     capacity=2, position_x=40,  position_y=40,  width=70,  height=70,  shape="circle", zone="Window"),
                    Table(name="Drip 2",     capacity=2, position_x=140, position_y=40,  width=70,  height=70,  shape="circle", zone="Window"),
                    Table(name="Pour Over A",capacity=4, position_x=260, position_y=40,  width=120, height=80,  shape="rect",   zone="Center"),
                    Table(name="Pour Over B",capacity=4, position_x=420, position_y=40,  width=120, height=80,  shape="rect",   zone="Center"),
                    Table(name="Roast",      capacity=6, position_x=40,  position_y=180, width=150, height=90,  shape="rect",   zone="Lounge"),
                    Table(name="Blend",      capacity=6, position_x=240, position_y=180, width=150, height=90,  shape="rect",   zone="Lounge"),
                    Table(name="Barista",    capacity=8, position_x=440, position_y=180, width=170, height=100, shape="rect",   zone="VIP"),
                    Table(name="Counter",    capacity=2, position_x=40,  position_y=340, width=80,  height=60,  shape="rect",   zone="Bar"),
                ],
                "Starbucks — Yasamal": [
                    Table(name="Baku Mall 1", capacity=2, position_x=30,  position_y=30,  width=70,  height=70,  shape="circle", zone="Front"),
                    Table(name="Baku Mall 2", capacity=2, position_x=130, position_y=30,  width=70,  height=70,  shape="circle", zone="Front"),
                    Table(name="Aroma A",     capacity=4, position_x=250, position_y=30,  width=120, height=80,  shape="rect",   zone="Center"),
                    Table(name="Aroma B",     capacity=4, position_x=410, position_y=30,  width=120, height=80,  shape="rect",   zone="Center"),
                    Table(name="Bean",        capacity=6, position_x=30,  position_y=170, width=150, height=90,  shape="rect",   zone="Center"),
                    Table(name="Grind",       capacity=6, position_x=230, position_y=170, width=150, height=90,  shape="rect",   zone="Lounge"),
                    Table(name="Toffee Nut",  capacity=8, position_x=430, position_y=170, width=180, height=110, shape="rect",   zone="VIP"),
                ],
                "Starbucks — Icherisheher": [
                    Table(name="Old City 1",  capacity=2, position_x=40,  position_y=40,  width=70,  height=70,  shape="circle", zone="Front"),
                    Table(name="Old City 2",  capacity=2, position_x=140, position_y=40,  width=70,  height=70,  shape="circle", zone="Front"),
                    Table(name="Maiden 1",    capacity=2, position_x=240, position_y=40,  width=70,  height=70,  shape="circle", zone="Window"),
                    Table(name="Gate A",      capacity=4, position_x=360, position_y=40,  width=120, height=80,  shape="rect",   zone="Center"),
                    Table(name="Gate B",      capacity=4, position_x=520, position_y=40,  width=120, height=80,  shape="rect",   zone="Center"),
                    Table(name="Fortress",    capacity=6, position_x=40,  position_y=180, width=150, height=90,  shape="rect",   zone="Lounge"),
                    Table(name="Heritage",    capacity=8, position_x=240, position_y=180, width=180, height=110, shape="rect",   zone="VIP"),
                    Table(name="Cobblestone", capacity=2, position_x=470, position_y=180, width=80,  height=70,  shape="circle", zone="Patio"),
                ],
                # ─── Gloria Jean's Coffees ───
                "Gloria Jean's Coffees — 28 May": [
                    Table(name="Gloria 1",   capacity=2, position_x=30,  position_y=30,  width=70,  height=70,  shape="circle", zone="Window"),
                    Table(name="Gloria 2",   capacity=2, position_x=130, position_y=30,  width=70,  height=70,  shape="circle", zone="Window"),
                    Table(name="Gloria 3",   capacity=2, position_x=230, position_y=30,  width=70,  height=70,  shape="circle", zone="Window"),
                    Table(name="Chiller A",  capacity=4, position_x=350, position_y=30,  width=120, height=80,  shape="rect",   zone="Front"),
                    Table(name="Chiller B",  capacity=4, position_x=510, position_y=30,  width=120, height=80,  shape="rect",   zone="Front"),
                    Table(name="Iced A",     capacity=6, position_x=30,  position_y=170, width=150, height=90,  shape="rect",   zone="Center"),
                    Table(name="Iced B",     capacity=6, position_x=230, position_y=170, width=150, height=90,  shape="rect",   zone="Center"),
                    Table(name="Grand G",    capacity=8, position_x=430, position_y=170, width=180, height=110, shape="rect",   zone="VIP"),
                ],
                "Gloria Jean's Coffees — Sahil": [
                    Table(name="Deniz 1",  capacity=2, position_x=40,  position_y=40,  width=70,  height=70,  shape="circle", zone="Front"),
                    Table(name="Deniz 2",  capacity=2, position_x=140, position_y=40,  width=70,  height=70,  shape="circle", zone="Front"),
                    Table(name="Deniz 3",  capacity=2, position_x=240, position_y=40,  width=70,  height=70,  shape="circle", zone="Front"),
                    Table(name="Wave A",   capacity=4, position_x=360, position_y=40,  width=120, height=80,  shape="rect",   zone="Center"),
                    Table(name="Wave B",   capacity=4, position_x=520, position_y=40,  width=120, height=80,  shape="rect",   zone="Center"),
                    Table(name="Horizon",  capacity=6, position_x=40,  position_y=180, width=150, height=90,  shape="rect",   zone="Lounge"),
                    Table(name="Sunset",   capacity=8, position_x=240, position_y=180, width=180, height=110, shape="rect",   zone="VIP"),
                    Table(name="Latte Bar",capacity=3, position_x=470, position_y=180, width=100, height=70,  shape="rect",   zone="Bar"),
                ],
                "Gloria Jean's Coffees — Fountain Square": [
                    Table(name="Fountain 1",  capacity=2, position_x=30,  position_y=30,  width=70,  height=70,  shape="circle", zone="Terrace"),
                    Table(name="Fountain 2",  capacity=2, position_x=130, position_y=30,  width=70,  height=70,  shape="circle", zone="Terrace"),
                    Table(name="Nizami A",    capacity=4, position_x=250, position_y=30,  width=120, height=80,  shape="rect",   zone="Window"),
                    Table(name="Nizami B",    capacity=4, position_x=410, position_y=30,  width=120, height=80,  shape="rect",   zone="Window"),
                    Table(name="Cappuccino",  capacity=6, position_x=30,  position_y=170, width=150, height=90,  shape="rect",   zone="Center"),
                    Table(name="Macchiato",   capacity=6, position_x=230, position_y=170, width=150, height=90,  shape="rect",   zone="Center"),
                    Table(name="Premium GJ",  capacity=8, position_x=430, position_y=170, width=180, height=110, shape="rect",   zone="VIP"),
                    Table(name="Pastry",      capacity=2, position_x=30,  position_y=340, width=70,  height=70,  shape="circle", zone="Corner"),
                    Table(name="Muffin",      capacity=2, position_x=130, position_y=340, width=70,  height=70,  shape="circle", zone="Corner"),
                ],
                "Gloria Jean's Coffees — Genclik": [
                    Table(name="Ganjlik 1",  capacity=2, position_x=30,  position_y=30,  width=70,  height=70,  shape="circle", zone="Front"),
                    Table(name="Ganjlik 2",  capacity=2, position_x=130, position_y=30,  width=70,  height=70,  shape="circle", zone="Front"),
                    Table(name="Ganjlik 3",  capacity=2, position_x=230, position_y=30,  width=70,  height=70,  shape="circle", zone="Front"),
                    Table(name="Hazelnut A", capacity=4, position_x=350, position_y=30,  width=120, height=80,  shape="rect",   zone="Center"),
                    Table(name="Hazelnut B", capacity=4, position_x=510, position_y=30,  width=120, height=80,  shape="rect",   zone="Center"),
                    Table(name="Vanilla",    capacity=6, position_x=30,  position_y=170, width=150, height=90,  shape="rect",   zone="Lounge"),
                    Table(name="Caramel",    capacity=8, position_x=230, position_y=170, width=180, height=110, shape="rect",   zone="VIP"),
                ],
                "Gloria Jean's Coffees — Narimanov": [
                    Table(name="Khoyski 1",  capacity=2, position_x=40,  position_y=40,  width=70,  height=70,  shape="circle", zone="Window"),
                    Table(name="Khoyski 2",  capacity=2, position_x=140, position_y=40,  width=70,  height=70,  shape="circle", zone="Window"),
                    Table(name="Mocha A",    capacity=4, position_x=260, position_y=40,  width=120, height=80,  shape="rect",   zone="Center"),
                    Table(name="Mocha B",    capacity=4, position_x=420, position_y=40,  width=120, height=80,  shape="rect",   zone="Center"),
                    Table(name="Affogato",   capacity=6, position_x=40,  position_y=180, width=150, height=90,  shape="rect",   zone="Center"),
                    Table(name="Cortado",    capacity=6, position_x=240, position_y=180, width=150, height=90,  shape="rect",   zone="Lounge"),
                    Table(name="VIP GJ",     capacity=8, position_x=440, position_y=180, width=170, height=100, shape="rect",   zone="VIP"),
                    Table(name="Express",    capacity=2, position_x=40,  position_y=340, width=80,  height=60,  shape="rect",   zone="Bar"),
                ],
                "Gloria Jean's Coffees — Yasamal": [
                    Table(name="BM 1",      capacity=2, position_x=30,  position_y=30,  width=70,  height=70,  shape="circle", zone="Front"),
                    Table(name="BM 2",      capacity=2, position_x=130, position_y=30,  width=70,  height=70,  shape="circle", zone="Front"),
                    Table(name="BM 3",      capacity=2, position_x=230, position_y=30,  width=70,  height=70,  shape="circle", zone="Front"),
                    Table(name="Frappe A",  capacity=4, position_x=350, position_y=30,  width=120, height=80,  shape="rect",   zone="Center"),
                    Table(name="Frappe B",  capacity=4, position_x=510, position_y=30,  width=120, height=80,  shape="rect",   zone="Center"),
                    Table(name="Smoothie",  capacity=6, position_x=30,  position_y=170, width=150, height=90,  shape="rect",   zone="Lounge"),
                    Table(name="Blended",   capacity=6, position_x=230, position_y=170, width=150, height=90,  shape="rect",   zone="Lounge"),
                    Table(name="Gold GJ",   capacity=8, position_x=430, position_y=170, width=180, height=110, shape="rect",   zone="VIP"),
                ],
            }
            # fmt: on

            for rest in all_restaurants:
                if rest.name in table_layouts:
                    for t in table_layouts[rest.name]:
                        t.restaurant_id = rest.id
                    db.add_all(table_layouts[rest.name])
            db.commit()

    except Exception as e:
        db.rollback()
        print(f"Seed error: {e}")
    finally:
        db.close()
