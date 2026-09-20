import json

with open('src/data/en/2014_equipments.json', 'r') as f:
    data = json.load(f)

MANUAL = {
    "Abacus": "Rangkaian manik-manik pada batang yang digunakan untuk menghitung dan perhitungan. Penting untuk pedagang, bankir, dan siapa pun yang perlu menjaga catatan yang tepat saat bepergian.",
    "Acid (vial)": "Sebagai Action, kamu dapat menyiramkan isi vial ini ke creature dalam 5 feet darimu atau melempar vial hingga 20 feet. Saat melempar, setiap creatures dalam 5 feet dari target harus melakukan DC 10 DEX saving throw. Kegagalan = 1d6 acid damage, Keberhasilan = setengah damage.",
    "Alchemist's fire (flask)": "Cairan lengket dan mengadhesif yang menyala saat terpapar udara. Sebagai Action, kamu dapat melempar flask ini hingga 20 feet, menghancurkannya saat menghantam permukaan. Setiap creatures dalam 5 feet dari area harus melakukan DC 10 DEX saving throw. Kegagalan = 1d4 fire damage saat awal dan 1d4 fire damage di akhir setiap giliranmu selama 1 minute. Keberhasilan = setengah damage saat awal, tanpa damage berkelanjutan.",
    "Alchemist's Supplies": "Alat-alat khusus ini mencakup item-item yang diperlukan untuk mengejar kerajinan atau perdagangan. Tabel menunjukkan contoh jenis kerajinan yang paling umum.",
    "Alms box": "Kotak kecil untuk sedekah, biasanya ditemukan dalam priest's pack.",
    "Amulet": "Sebuah holy symbol adalah representasi dari seorang god atau pantheon. Bisa menjadi amulet, reliquary, atau item lainnya.",
    "Animal Feed (1 day)": "Satu hari pakan untuk tunggal mount atau beast of burden. Biasanya campuran dari biji-bijian, sayuran kering, dan hay.",
    "Antitoxin (vial)": "Creature yang meminum vial cairan ini mendapatkan advantage pada saving throws terhadap poison selama 1 hour. Tidak memberikan manfaat jika creature sedang terkena poison.",
    "Arrow": "Proyektil bertangkah yang dirancang untuk digunakan dengan bow. Setiap arrow terdiri dari shaft kayu, fletching, dan kepala arrow logam.",
    "Backpack": "Kantong kulit yang kuat dengan tali bahu, dirancang untuk membawa peralatan di punggung. Memiliki banyak kompartemen dan dapat menampung hingga 30 pounds.",
    "Bagpipes": "Beberapa jenis paling umum dari musical instruments ditunjukkan pada tabel. Bagi banyak races, penyediaan ini hanya mencakup instrument yang paling umum untuk race tersebut.",
    "Ball bearings (bag of 1,000)": "Sebagai Action, kamu dapat menuangkan bola-bola logam kecil ini dari kantongnya untuk menutupi area 10 feet square. Setiap creatures yang bergerak melalui area ini harus melakukan DC 10 DEX saving throw atau terpeleset. Kegagalan = terjerat sampai beristirahat.",
    "Barding": "Barding adalah armor yang dirancang untuk melindungi kepala, leher, dada, dan badan binatang. Armor untuk binatang biasanya lebih mahal daripada armor untuk humanoid (2x harga).",
    "Barrel": "Tong kayu yang kuat, sering digunakan untuk menyimpan cairan, makanan, atau barang lainnya. Beratnya sekitar 40 pounds ketika kosong.",
    "Basket": "Keranjang anyaman dari bambu atau rotan, digunakan untuk membawa barang-barang ringan.",
    "Bedroll": "Selimut tebal yang dilipat, digunakan untuk tidur di luar. Memberikan comfort dan kehangatan saat beristirahat di alam liar.",
    "Bell": "Bel kecil yang menghasilkan suara nyaring saat diketuk. Sering digunakan untuk penandaan atau peringatan.",
    "Blanket": "Kain tebal yang ditenun, digunakan untuk kehangatan saat tidur atau sebagai tirai, pembungkus, atau pelapis.",
    "Block and Tackle": "Perangkat katrol yang digunakan untuk mengangkat beban berat. Memungkinkan kamu mengangkat benda yang beratnya hingga 4 kali STR score-mu.",
    "Block of incense": "Batang wewangian, biasanya ditemukan dalam priest's pack. Digunakan untuk ritual keagamaan.",
    "Book": "Buku yang berisi pengetahuan, cerita, atau catatan. Bisa menjadi sumber informasi berharga.",
    "Bottle, glass": "Botol kaca yang digunakan untuk menyimpan cairan. Rapuh dan bisa pecah jika jatuh.",
    "Bucket": "Ember yang digunakan untuk membawa air atau barang lainnya. Bisa terbuat dari kayu, logam, atau plastik.",
    "Caltrops": "Jejak-jejak logam dengan paku-paku tajam yang ditempatkan di tanah. Setiap creatures yang bergerak melalui area caltrops harus melakukan DC 10 DEX saving throw. Kegagalan = 1 piercing damage dan speed berkurang 10 feet sampai beristirahat.",
    "Candle": "Selama 1 hour, candle menyala terang dalam radius 5 feet dan cahaya remang untuk tambahan 5 feet.",
    "Case, crossbow bolt": "Kotak kayu ini dapat menampung hingga dua puluh crossbow bolts.",
    "Case, map or scroll": "Kotak kayu atau pipa logam yang digunakan untuk melindungi peta atau scroll dari kerusakan dan kelembaban.",
    "Censer": "Dispenser wewangian, biasanya ditemukan dalam priest's pack. Digunakan untuk ritual keagamaan.",
    "Chain (10 feet)": "Rantai memiliki 10 hit points. Bisa dipatahkan dengan successful DC 20 STR check.",
    "Chalk (1 piece)": "Batu kapur kecil, biasanya digunakan untuk menandai atau menulis di permukaan keras.",
    "Chest": "Peti kayu yang kuat dengan kunci, digunakan untuk menyimpan barang berharga. Beratnya sekitar 25 pounds ketika kosong.",
    "Climber's Kit": "Perkakas panjat yang termasuk tali, karabiner, dan pijak. Memungkinkan kamu memanjat permukaan yang sulit dengan advantage pada STR (Athletics) checks.",
    "Clothes, common": "Pakaian sehari-hari yang sederhana dan fungsional. Cocok untuk kebanyakan situasi.",
    "Clothes, costume": "Pakaian kostum yang dirancang untuk penampilan atau peran tertentu. Bisa digunakan untuk menyamar atau panggung.",
    "Clothes, fine": "Pakaian halus yang terbuat dari bahan berkualitas tinggi. Memberikan kesan status sosial tinggi.",
    "Clothes, traveler's": "Pakaian bepergian yang tahan lama dan nyaman. Dirancang untuk perjalanan panjang dan kondisi alam liar.",
    "Component pouch": "Kantong kecil yang berisi komponen-komponen material yang dibutuhkan untuk mencatat spell. Menggantikan material components yang tidak memiliki cost.",
    "Crowbar": "Menggunakan crowbar memberikan advantage pada STR checks dimana leverage crowbar dapat diterapkan.",
    "Fishing tackle": "Peralatan pancing yang termasuk pancing, umpan, dan joran. Digunakan untuk menangkap ikan di sungai atau danau.",
    "Flask or tankard": "Botol atau gelas yang digunakan untuk menyimpan dan minum cairan.",
    "Forgery kit": "Kit pemalsuan yang termasuk materials untuk meniru tulisan, tanda tangan, atau dokumen. Memberikan advantage pada checks untuk memalsui dokumen.",
    "Grappling hook": "Kait baja yang digunakan untuk memanjat dinding atau menambatkan kapal. Bisa dilempar hingga 30 feet.",
    "Hammer": "Palu kecil yang digunakan untuk memukul benda atau menaruh paku.",
    "Hammer, sledge": "Palu besar yang digunakan untuk memukul benda dengan kekuatan besar.",
    "Healer's kit": "Kit penyembuh yang termasuk perban, obat, dan peralatan medis dasar. Memungkinkan kamu menggunakan Wisdom (Medicine) skill tanpa peralatan medis.",
    "Holy symbol": "Simbol ilahi yang mewakili dewa atau keyakinan. Digunakan oleh cleric dan paladin untuk mencatat spell dan channel divinity.",
    "Holy water (flask)": "Air suci yang dikuduskan oleh cleric. Sebagai Action, kamu dapat melempar flask ini hingga 20 feet atau menyiramkannya ke undead. Undead yang terkena harus melakukan DC 10 WIS saving throw. Kegagalan = 2d6 radiant damage, Keberhasilan = setengah damage.",
    "Hourglass": "Pasir yang mengalir melalui lapisan-lapisan kaca, digunakan untuk mengukur waktu.",
    "Hunting trap": "Jebak yang digunakan untuk menangkap hewan. Membutuhkan 1 minute untuk dipasang. Ketika activated, makhluk yang memijaknya harus melakukan DC 13 DEX saving throw atau terjebak. Terjebak = 1d4 piercing damage dan speed berkurang 10 feet hingga beristirahat.",
    "Ink (1 ounce bottle)": "Botol tinta 1 ons, digunakan untuk menulis atau melukis. Tinta hitam adalah yang paling umum.",
    "Ink pen": "Pena tinta yang digunakan untuk menulis dengan tinta. Bisa digunakan untuk menandatangani dokumen atau menulis surat.",
    "Jug or pitcher": "Buyung atau kendi yang digunakan untuk menyimpan dan menuang cairan. Bisa menampung hingga 1 gallon.",
    "Ladder (10-foot)": "Tangga kayu 10 feet yang digunakan untuk memanjat ke tempat yang lebih tinggi.",
    "Lamp": "Lampu yang menyala dengan minyak atau lilin. Menyediakan cahaya terang dalam radius 15 feet dan cahaya remang untuk tambahan 15 feet.",
    "Lantern, bullseye": "Lentera dengan lensa yang memfokuskan cahaya menjadi sinar terang. Menyediakan cahaya terang 60 feet di depan dan cahaya remang 30 feet di sekitarnya.",
    "Lantern, hooded": "Lentera dengan tudung yang dapat ditutup atau dibuka. Menyediakan cahaya terang dalam radius 30 feet. Bisa ditutup untuk menyembunyikan cahaya.",
    "Little bag of sand": "Kantong pasir kecil, biasanya ditemukan dalam scholar's pack. Digunakan untuk menimbu atau mensterilkan.",
    "Lock": "Kunci yang digunakan untuk mengamankan peti, pintu, atau petak. Memerlukan thieves' tools untuk dibuka.",
    "Magnifying glass": "Kaca pembesar yang digunakan untuk melihat objek kecil dengan lebih jelas. Memberikan advantage pada checks yang memerlukan pemeriksaan detail.",
    "Manacles": "Besi belintang yang digunakan untuk membelenggu creature. Memerlukan DC 20 DEX check untuk dibuka dengan thieves' tools, atau DC 15 STR check untuk mematahkannya.",
    "Mess kit": "Set peralatan makan yang termasuk mangkuk, sendok, garpu, dan piring. Sering digunakan oleh pejuang yang bepergian.",
    "Mirror, steel": "Cermin baja yang digunakan untuk melihat sekitar sudut, memeriksa kondisi, atau sebagai sinyal.",
    "Oil (flask)": "Minyak yang bisa digunakan sebagai bahan bakar. Sebagai Action, kamu dapat menuangkan minyak ini ke ground dalam 5 feet. Sebagai Action, kamu dapat menerangkan minyak dengan api, menciptakan area cahaya 10 feet untuk 1 minute. Jika dilempar pada creature, harus melakukan DC 10 DEX saving throw. Kegagalan = 1 fire damage dari api.",
    "Paper (one sheet)": "Sepotong kertas yang digunakan untuk menulis, melukis, atau melipat menjadi origami.",
    "Parchment (one sheet)": "Sepotong parchment yang terbuat dari kulit hewan, digunakan untuk menulis dokumen penting atau spell.",
    "Perfume (vial)": "Botol wewangian yang digunakan untuk menutupi bau atau membuat aroma yang menyenangkan.",
    "Pick, miner's": "Batu akik yang digunakan oleh penambang untuk memecahkan batu. Bisa digunakan sebagai senjata.",
    "Piton": "Paku baja yang ditanam ke dinding atau tebing untuk memanjat atau mengamankan tali.",
    "Playing card set": "Set kartu main yang digunakan untuk bermain game atau bertaruh.",
    "Poison, basic (vial)": "Racun dasar yang bisa ditambahkan ke senjata. Sebagai bonus action, kamu dapat menerapkan racun ini ke senjata atau amunisi. Creature yang terkena serangan dengan senjata ini harus melakukan DC 10 CON saving throw. Kegagalan = 1d4 poison damage.",
    "Pole (10-foot)": "Tongkat 10 feet yang digunakan untuk memeriksa lantai, menyeimbangkan, atau menolak benda dari jarak jauh.",
    "Pot, iron": "Panci besi yang digunakan untuk memasak makanan di api unggun.",
    "Potion of healing": "Minuman ajaib yang memulihkan 2d4 + 2 HP saat diminum.",
    "Pouch": "Kantong kecil yang digunakan untuk menyimpan item kecil seperti koin atau bolt.",
    "Quiver": "Tabung yang dapat menampung hingga 20 arrows.",
    "Rations (1 day)": "Makanan sehari yang terdiri dari daging kering, roti keras, dan makanan tahan lama. Cukup untuk 1 hari.",
    "Robes": "Jubah panjang yang dikenakan oleh cleric, druid, atau wizard. Nyaman dan tidak menghalangi gerakan.",
    "Rope, hemp (50 feet)": "Tali hemp 50 feet yang kuat dan tahan lama. Bisa menampung hingga 3,000 pounds.",
    "Rope, silk (50 feet)": "Tali sutra 50 feet yang ringan dan kuat. Bisa menampung hingga 600 pounds.",
    "Sack": "Kantong besar yang digunakan untuk menyimpan barang-barang. Bisa menampung hingga 30 pounds.",
    "Scale, merchant's": "Timbangan pedagang yang digunakan untuk menimbang barang dagangan. Memungkinkan kamu menentukan berat item dengan akurat.",
    "Sealing wax": "Lilin segel yang dilebur dan diterapkan pada amplop atau dokumen untuk menutupnya dengan aman.",
    "Shovel": "Sekop yang digunakan untuk menggali tanah, pasir, atau salju.",
    "Signal whistle": "Peluit yang digunakan untuk mengirim sinyal. Suaranya bisa terdengar hingga 600 feet.",
    "Signet ring": "Cincin dengan segi yang ditanam, digunakan untuk menandatangani dokumen dengan cap.",
    "Soap": "Sabun yang digunakan untuk membersihkan diri atau pakaian.",
    "Spellbook": "Buku yang berisi catatan spell yang dipelajari oleh wizard. Diperlukan untuk mempersiapkan dan mencatat spell.",
    "Spikes, iron (10)": "Paku baja 10 buah yang digunakan untuk mengamankan tenda, menandai wilayah, atau sebagai perangkap.",
    "Spyglass": "Teropong yang digunakan untuk melihat objek dari jarak jauh. Memungkinkan kamu melihat detail hingga 10 kali lipat lebih jauh.",
    "Tent, two-person": "Tenda yang cukup untuk dua orang. Memberikan perlindungan dari cuaca ekstrem.",
    "Tinderbox": "Kotak yang berisi batu api, baja, dan korek api. Digunakan untuk menyalakan api.",
    "Torch": "Tongkat yang dilapisi bahan mudah terbakar. Menyediakan cahaya terang dalam radius 20 feet dan cahaya remang untuk tambahan 20 feet. Dapat dilemparkan untuk menyerang (1 fire damage).",
    "Vial": "Botol kecil yang digunakan untuk menyimpan cairan atau racun.",
    "Waterskin": "Kantong kulit yang digunakan untuk menyimpan air atau minuman lainnya. Bisa menampung hingga 4 pounds cairan.",
    "Whetstone": "Batu asahan yang digunakan untuk menajamkan senjata tajam.",
}

translated = []
for item in data['equipments']:
    translated_item = dict(item)
    name = item['name']
    
    if name in MANUAL:
        translated_item['description'] = MANUAL[name]
    
    translated.append(translated_item)

id_data = {'equipments': translated}
with open('src/data/id/2014_equipments.json', 'w') as f:
    json.dump(id_data, f, indent=2, ensure_ascii=False)

print('Translated 2014_equipments.json')
print(f'Total items: {len(translated)}')
print(f'Manually translated: {len(MANUAL)}')
