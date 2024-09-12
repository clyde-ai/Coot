const tiles = [
    {
        tileNumber: 1,
        description: 'Something Dragon From A Dragon',
        image: 'src/images/1.png',
        imagesNeeded: 1,
        dropMessage: 'Dragon'
    },
    {
        tileNumber: 2,
        description: 'Any Demonic Gorilla Unique',
        image: 'src/images/2.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 3,
        description: "Scurrius' Spine",
        image: 'src/images/3.png',
        imagesNeeded: 1,
        dropMessage: 'spine'
    },
    {
        tileNumber: 4,
        description: 'Abyssal Whip',
        image: 'src/images/4.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 5,
        description: 'Ladder 1',
        image: 'src/images/5.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 6,
        description: 'Vial of Blood',
        image: 'src/images/6.png',
        imagesNeeded: 1,
        dropMessage: 'Vial of blood'
    },
    {
        tileNumber: 7,
        description: 'Any DKs Ring',
        image: 'src/images/7.png',
        imagesNeeded: 1,
        dropMessage: 'ring'
    },
    {
        tileNumber: 8,
        description: 'Any Champion Scroll',
        image: 'src/images/8.png',
        imagesNeeded: 1,
        dropMessage: 'champion scroll'
    },
    {
        tileNumber: 9,
        description: 'Brimstone Key',
        image: 'src/images/9.png',
        imagesNeeded: 1,
        dropMessage: 'Brimstone key'
    },
    {
        tileNumber: 10,
        description: 'Ladder 2',
        image: 'src/images/10.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 11,
        description: 'Any Barrows Armour',
        image: 'src/images/11.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 12,
        description: 'King Black Dragon Head',
        image: 'src/images/12.png',
        imagesNeeded: 1,
        dropMessage: 'head'
    },
    {
        tileNumber: 13,
        description: 'Any Tzhaar Unique',
        image: 'src/images/13.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 14,
        description: 'Snake 1',
        image: 'src/images/14.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 15,
        description: "5x Fire Cape",
        image: 'src/images/15.png',
        imagesNeeded: 5,
        dropMessage: 'Fire cape'
    },
    {
        tileNumber: 16,
        description: 'Awakener\'s Orb',
        image: 'src/images/16.png',
        imagesNeeded: 1,
        dropMessage: 'orb'
    },
    {
        tileNumber: 17,
        description: 'Vorkath Head',
        image: 'src/images/17.png',
        imagesNeeded: 1,
        dropMessage: 'head'
    },
    {
        tileNumber: 18,
        description: 'Any Elder Chaos Robe Piece',
        image: 'src/images/18.png',
        imagesNeeded: 1,
        dropMessage: 'Elder chaos'
    },
    {
        tileNumber: 19,
        description: '2x Dizana\'s Quiver',
        image: 'src/images/19.png',
        imagesNeeded: 2,
        dropMessage: 'quiver'
    },
    {
        tileNumber: 20,
        description: 'Any Moon Armour',
        image: 'src/images/20.png',
        imagesNeeded: 1,
        dropMessage: 'moon'
    },
    {
        tileNumber: 21,
        description: 'Any Grotesque Guardians Unique',
        image: 'src/images/21.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 22,
        description: 'Ancient Icon',
        image: 'src/images/22.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 23,
        description: 'Any Cerberus Unique',
        image: 'src/images/23.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 24,
        description: 'Kraken Tentacle or Trident',
        image: 'src/images/24.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 25,
        description: 'Unsired',
        image: 'src/images/25.png',
        imagesNeeded: 1,
        dropMessage: 'Unsired'
    },
    {
        tileNumber: 26,
        description: 'Occult Necklace',
        image: 'src/images/26.png',
        imagesNeeded: 1,
        dropMessage: 'Occult necklace'
    },
    {
        tileNumber: 27,
        description: 'Dark Bow',
        image: 'src/images/27.png',
        imagesNeeded: 1,
        dropMessage: 'Dark bow'
    },
    {
        tileNumber: 28,
        description: 'Snake 2',
        image: 'src/images/28.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 29,
        description: 'Any Zulrah Unique',
        image: 'src/images/29.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 30,
        description: 'Any Unique from Vet\'ion',
        image: 'src/images/30.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 31,
        description: 'Any Unique from Venenatis',
        image: 'src/images/31.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 32,
        description: 'Any Unique from Callisto',
        image: 'src/images/32.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 33,
        description: 'Ladder 3',
        image: 'src/images/33.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 34,
        description: 'Any Odium Shard',
        image: 'src/images/34.png',
        imagesNeeded: 1,
        dropMessage: 'Odium'
    },
    {
        tileNumber: 35,
        description: 'Any Malediction Shard',
        image: 'src/images/35.png',
        imagesNeeded: 1,
        dropMessage: 'Malediction'
    },
    {
        tileNumber: 36,
        description: 'Any Vardorvis Unique',
        image: 'src/images/36.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 37,
        description: 'Any Duke Unique',
        image: 'src/images/37.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 38,
        description: 'Snake 3',
        image: 'src/images/38.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 39,
        description: 'Any Leviathan Unique',
        image: 'src/images/39.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 40,
        description: 'Challenge Mode Chambers of Xeric\n Finish with 100k Points\n Any Size, Must be in your team',
        image: 'src/images/40.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 41,
        description: 'Any Whisperer Unique',
        image: 'src/images/41.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 42,
        description: 'Any Colosseum Unique',
        image: 'src/images/42.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 43,
        description: 'Kalphite Queen Head',
        image: 'src/images/43.png',
        imagesNeeded: 1,
        dropMessage: 'head'
    },
    {
        tileNumber: 44,
        description: 'Ladder 4',
        image: 'src/images/44.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 45,
        description: 'Any Armadyl Unique',
        image: 'src/images/45.png',
        imagesNeeded: 1,
        dropMessage: 'Armadyl'
    },
    {
        tileNumber: 46,
        description: 'Any Bandos Unique',
        image: 'src/images/46.png',
        imagesNeeded: 1,
        dropMessage: 'Bandos'
    },
    {
        tileNumber: 47,
        description: 'Any Zulrah Unique',
        image: 'src/images/47.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 48,
        description: 'Saradomin Sword',
        image: 'src/images/48.png',
        imagesNeeded: 1,
        dropMessage: 'Saradomin sword'
    },
    {
        tileNumber: 49,
        description: 'Zamorakian Spear',
        image: 'src/images/49.png',
        imagesNeeded: 1,
        dropMessage: 'Zamorakian spear'
    },
    {
        tileNumber: 50,
        description: 'Any Corrupted Gauntlet Seed',
        image: 'src/images/50.png',
        imagesNeeded: 1,
        dropMessage: 'seed'
    },
    {
        tileNumber: 51,
        description: 'Tombs of Amascut 500 Invocation Raid\n Any Size, Must be in your team',
        image: 'src/images/51.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 52,
        description: 'Any Tormented Demons Unique',
        image: 'src/images/52.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 53,
        description: 'Snake 4',
        image: 'src/images/53.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 54,
        description: 'Venator Shard',
        image: 'src/images/54.png',
        imagesNeeded: 1,
        dropMessage: 'Venator'
    },
    {
        tileNumber: 55,
        description: 'Dragon Chainbody from Kalphite Queen',
        image: 'src/images/55.png',
        imagesNeeded: 1,
        dropMessage: 'Dragon chainbody'
    },
    {
        tileNumber: 56,
        description: 'Any Corporeal Beast Unique',
        image: 'src/images/56.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 57,
        description: 'Steam Battlestaff',
        image: 'src/images/57.png',
        imagesNeeded: 1,
        dropMessage: 'Steam battlestaff'
    },
    {
        tileNumber: 58,
        description: '2x Zenyte Shards',
        image: 'src/images/58.png',
        imagesNeeded: 2,
        dropMessage: 'Zenyte'
    },
    {
        tileNumber: 59,
        description: '3x Noxious Halberd Pieces',
        image: 'src/images/59.png',
        imagesNeeded: 3,
        dropMessage: 'Noxious'
    },
    {
        tileNumber: 60,
        description: 'Any Wilderness Weapon Attachment',
        image: 'src/images/60.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 61,
        description: 'Pet Chaos Elemental',
        image: 'src/images/61.png',
        imagesNeeded: 1,
        dropMessage: 'Pet chaos elemental'
    },
    {
        tileNumber: 62,
        description: '2x Barrows Weapons',
        image: 'src/images/62.png',
        imagesNeeded: 2,
        dropMessage: ''
    },
    {
        tileNumber: 63,
        description: 'Sarachnis Cudgel',
        image: 'src/images/63.png',
        imagesNeeded: 1,
        dropMessage: 'cudgel'
    },
    {
        tileNumber: 64,
        description: 'Snake 5',
        image: 'src/images/64.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 65,
        description: 'Any Sunfire Piece',
        image: 'src/images/65.png',
        imagesNeeded: 1,
        dropMessage: 'Sunfire'
    },
    {
        tileNumber: 66,
        description: 'Any Quartz',
        image: 'src/images/66.png',
        imagesNeeded: 1,
        dropMessage: 'quartz'
    },
    {
        tileNumber: 67,
        description: 'Onyx or Serpentine Visage',
        image: 'src/images/67.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 68,
        description: 'Ladder 5',
        image: 'src/images/68.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 69,
        description: 'Any Godsword Shard',
        image: 'src/images/69.png',
        imagesNeeded: 1,
        dropMessage: 'shard'
    },
    {
        tileNumber: 70,
        description: 'Armadyl Crossbow or Saradomin\'s Hilt',
        image: 'src/images/70.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 71,
        description: 'Any Tombs of Amascut Purple',
        image: 'src/images/71.png',
        imagesNeeded: 1,
        dropMessage: 'found something special'
    },
    {
        tileNumber: 72,
        description: 'Any Chambers of Xeric Purple',
        image: 'src/images/72.png',
        imagesNeeded: 1,
        dropMessage: 'found something special'
    },
    {
        tileNumber: 73,
        description: 'Any Theatre of Blood Purple',
        image: 'src/images/73.png',
        imagesNeeded: 1,
        dropMessage: 'found something special'
    },
    {
        tileNumber: 74,
        description: '~~Sub 48~~ Infernal Cape\n See what I did there?',
        image: 'src/images/74.png',
        imagesNeeded: 1,
        dropMessage: 'Infernal cape'
    },
    {
        tileNumber: 75,
        description: 'Snake 6',
        image: 'src/images/75.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 76,
        description: 'Any Nex Unique',
        image: 'src/images/76.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 77,
        description: 'Fang or Lightbearer',
        image: 'src/images/77.png',
        imagesNeeded: 1,
        dropMessage: 'found something special'
    },
    {
        tileNumber: 78,
        description: 'Dex or Arcane Prayer Scroll',
        image: 'src/images/78.png',
        imagesNeeded: 1,
        dropMessage: 'found something special'
    },
    {
        tileNumber: 79,
        description: 'Avernic Defender Hilt',
        image: 'src/images/79.png',
        imagesNeeded: 1,
        dropMessage: 'Avernic'
    },
    {
        tileNumber: 80,
        description: 'Any Dist or Kit (ToB or CoX)',
        image: 'src/images/80.png',
        imagesNeeded: 1,
        dropMessage: 'found something special'
    },
    {
        tileNumber: 81,
        description: 'Any Masori Piece',
        image: 'src/images/81.png',
        imagesNeeded: 1,
        dropMessage: 'Masori'
    },
    {
        tileNumber: 82,
        description: 'Any Justiciar Piece',
        image: 'src/images/82.png',
        imagesNeeded: 1,
        dropMessage: 'Justiciar'
    },
    {
        tileNumber: 83,
        description: 'Any Nightmare Unique',
        image: 'src/images/83.png',
        imagesNeeded: 1,
        dropMessage: ''
    }
];

module.exports = tiles;
