const tiles = [
    {
        tileNumber: 1,
        description: 'Something dragon from a dragon',
        image: 'src/images/1.png',
        imagesNeeded: 1,
        dropMessage: 'Dragon'
    },
    {
        tileNumber: 2,
        description: 'Any Demonic gorilla unique',
        image: 'src/images/2.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 3,
        description: "Scurrius' spine", // Snake #1 tail
        image: 'src/images/3.png',
        imagesNeeded: 1,
        dropMessage: 'spine'
    },
    {
        tileNumber: 4,
        description: 'Abyssal whip',
        image: 'src/images/4.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 5,
        description: 'Ladder 1 Bottom',
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
        description: 'Any DKs ring',
        image: 'src/images/7.png',
        imagesNeeded: 1,
        dropMessage: 'ring'
    },
    {
        tileNumber: 8,
        description: 'Any champion scroll',
        image: 'src/images/8.png',
        imagesNeeded: 1,
        dropMessage: 'champion scroll'
    },
    {
        tileNumber: 9,
        description: 'Brimstone key',
        image: 'src/images/9.png',
        imagesNeeded: 1,
        dropMessage: 'Brimstone key'
    },
    {
        tileNumber: 10,
        description: 'Ladder 2 Bottom',
        image: 'src/images/10.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 11,
        description: 'Any Barrows armour',
        image: 'src/images/11.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 12,
        description: 'Any Tzhaar unique',
        image: 'src/images/12.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 13,
        description: 'Snake 1 Head',
        image: 'src/images/13.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 14,
        description: '5x Fire Cape',
        image: 'src/images/14.png',
        imagesNeeded: 5,
        dropMessage: 'Fire cape'
    },
    {
        tileNumber: 15,
        description: "Awakener's orb",
        image: 'src/images/15.png',
        imagesNeeded: 1,
        dropMessage: 'orb'
    },
    {
        tileNumber: 16,
        description: 'Vorkath head',
        image: 'src/images/16.png',
        imagesNeeded: 1,
        dropMessage: 'head'
    },
    {
        tileNumber: 17,
        description: 'Any elder chaos robe piece',
        image: 'src/images/17.png',
        imagesNeeded: 1,
        dropMessage: 'Elder chaos'
    },
    {
        tileNumber: 18,
        description: '2x Dizana\'s quiver',
        image: 'src/images/18.png',
        imagesNeeded: 2,
        dropMessage: 'quiver'
    },
    {
        tileNumber: 19,
        description: 'Any Moon armour',
        image: 'src/images/19.png',
        imagesNeeded: 1,
        dropMessage: 'moon'
    },
    {
        tileNumber: 20,
        description: 'Any Grotesque Guardians Unique',
        image: 'src/images/20.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 21,
        description: 'Ancient icon', // Snake tail #2
        image: 'src/images/21.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 22,
        description: 'Any Cerberus Unique',
        image: 'src/images/22.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 23,
        description: 'Kraken tentacle or Trident',
        image: 'src/images/23.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 24,
        description: 'Unsired',
        image: 'src/images/24.png',
        imagesNeeded: 1,
        dropMessage: 'Unsired'
    },
    {
        tileNumber: 25,
        description: 'Occult necklace',
        image: 'src/images/25.png',
        imagesNeeded: 1,
        dropMessage: 'Occult necklace'
    },
    {
        tileNumber: 26,
        description: 'Dark bow',
        image: 'src/images/26.png',
        imagesNeeded: 1,
        dropMessage: 'Dark bow'
    },
    {
        tileNumber: 27,
        description: 'Snake 2 Head',
        image: 'src/images/27.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 28,
        description: 'Any Zulrah unique',
        image: 'src/images/28.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 29,
        description: 'Any unique from Vet\'ion',
        image: 'src/images/29.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 30,
        description: 'Ladder 3 Bottom',
        image: 'src/images/30.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 31,
        description: 'Any unique from Venenatis',
        image: 'src/images/31.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 32,
        description: 'Any unique from Callisto',
        image: 'src/images/32.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 33,
        description: 'Any Odium shard',
        image: 'src/images/33.png',
        imagesNeeded: 1,
        dropMessage: 'Odium'
    },
    {
        tileNumber: 34,
        description: 'Any Malediction shard',
        image: 'src/images/34.png',
        imagesNeeded: 1,
        dropMessage: 'Malediction'
    },
    {
        tileNumber: 35,
        description: 'Snake 3 Head',
        image: 'src/images/35.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 36,
        description: 'Any Vardorvis unique',
        image: 'src/images/36.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 37,
        description: 'Any Duke unique',
        image: 'src/images/37.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 38,
        description: 'Challenge 3',
        image: 'src/images/38.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 39,
        description: 'Any Leviathan unique',
        image: 'src/images/39.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 40,
        description: 'Ladder 4 Bottom',
        image: 'src/images/40.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 41,
        description: 'Any Whisperer unique',
        image: 'src/images/41.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 42,
        description: 'Any Armadyl unique',
        image: 'src/images/42.png',
        imagesNeeded: 1,
        dropMessage: 'Armadyl'
    },
    {
        tileNumber: 43,
        description: 'Any Bandos Unique',
        image: 'src/images/43.png',
        imagesNeeded: 1,
        dropMessage: 'Bandos'
    },
    {
        tileNumber: 44,
        description: 'Saradomin sword',
        image: 'src/images/44.png',
        imagesNeeded: 1,
        dropMessage: 'Saradomin sword'
    },
    {
        tileNumber: 45,
        description: 'Zamorakian spear',
        image: 'src/images/45.png',
        imagesNeeded: 1,
        dropMessage: 'Zamorakian spear'
    },
    {
        tileNumber: 46,
        description: 'Any CG seed',
        image: 'src/images/46.png',
        imagesNeeded: 1,
        dropMessage: 'seed'
    },
    {
        tileNumber: 47,
        description: 'TOA 500 Any Size',
        image: 'src/images/47.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 48,
        description: 'Any Colosseum unique',
        image: 'src/images/48.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 49,
        description: 'Any Tormented Demon Unique',
        image: 'src/images/49.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 50,
        description: 'Venator Shard',
        image: 'src/images/50.png',
        imagesNeeded: 1,
        dropMessage: 'Venator'
    },
    {
        tileNumber: 51,
        description: 'KQ Head',
        image: 'src/images/51.png',
        imagesNeeded: 1,
        dropMessage: 'head'
    },
    {
        tileNumber: 52,
        description: 'Any Corporeal Beast unique',
        image: 'src/images/52.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 53,
        description: 'Steam Battlestaff',
        image: 'src/images/53.png',
        imagesNeeded: 1,
        dropMessage: 'Steam battlestaff'
    },
    {
        tileNumber: 54,
        description: '2x Zenyte Shards',
        image: 'src/images/54.png',
        imagesNeeded: 2,
        dropMessage: 'Zenyte'
    },
    {
        tileNumber: 55,
        description: 'Any CoX Scroll',
        image: 'src/images/55.png',
        imagesNeeded: 1,
        dropMessage: 'scroll'
    },
    {
        tileNumber: 56,
        description: 'Pet Chaos Elemental',
        image: 'src/images/56.png',
        imagesNeeded: 1,
        dropMessage: 'Pet chaos elemental'
    },
    {
        tileNumber: 57,
        description: '2x Barrows Weapons',
        image: 'src/images/57.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 58,
        description: 'Sarachnis cudgel',
        image: 'src/images/58.png',
        imagesNeeded: 1,
        dropMessage: 'cudgel'
    },
    {
        tileNumber: 59,
        description: 'Snake 4',
        image: 'src/images/59.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 60,
        description: 'Any Sunfire Piece',
        image: 'src/images/60.png',
        imagesNeeded: 1,
        dropMessage: 'Sunfire'
    },
    {
        tileNumber: 61,
        description: '3x Noxious Halberd Pieces',
        image: 'src/images/60.png',
        imagesNeeded: 3,
        dropMessage: 'Noxious'
    },
    {
        tileNumber: 62,
        description: 'Ladder 5',
        image: 'src/images/60.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 63,
        description: 'Any Godsword Shard',
        image: 'src/images/60.png',
        imagesNeeded: 1,
        dropMessage: 'shard'
    },
    {
        tileNumber: 64,
        description: 'Onyx or Serpentine Visage',
        image: 'src/images/60.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 65,
        description: 'Armadyl Crossbow or Saradomin Hilt',
        image: 'src/images/60.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 66,
        description: 'Any ToA Unique',
        image: 'src/images/60.png',
        imagesNeeded: 1,
        dropMessage: 'found something special'
    },
    {
        tileNumber: 67,
        description: 'Any ToB Unique',
        image: 'src/images/60.png',
        imagesNeeded: 1,
        dropMessage: 'found something special'
    },
    {
        tileNumber: 68,
        description: 'Any CoX Unique',
        image: 'src/images/60.png',
        imagesNeeded: 1,
        dropMessage: 'found something special'
    },
    {
        tileNumber: 69,
        description: 'Infernal Cape',
        image: 'src/images/60.png',
        imagesNeeded: 1,
        dropMessage: 'Infernal cape'
    },
    {
        tileNumber: 70,
        description: 'Snake 5',
        image: 'src/images/60.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 71,
        description: 'Any Nex Unique',
        image: 'src/images/60.png',
        imagesNeeded: 1,
        dropMessage: ''
    },
    {
        tileNumber: 72,
        description: 'Fang or Lightbearer',
        image: 'src/images/60.png',
        imagesNeeded: 1,
        dropMessage: 'found something special'
    },
    {
        tileNumber: 73,
        description: 'Dex or Arcane Prayer Scroll',
        image: 'src/images/60.png',
        imagesNeeded: 1,
        dropMessage: 'prayer scroll'
    },
    {
        tileNumber: 74,
        description: 'Avernic Defender Hilt',
        image: 'src/images/60.png',
        imagesNeeded: 1,
        dropMessage: 'Avernic'
    },
    {
        tileNumber: 75,
        description: 'Any Dust or Kit from ToB/CoX',
        image: 'src/images/60.png',
        imagesNeeded: 1,
        dropMessage: 'found something special'
    },
    {
        tileNumber: 76,
        description: 'Any Masori Piece',
        image: 'src/images/60.png',
        imagesNeeded: 1,
        dropMessage: 'Masori'
    },
    {
        tileNumber: 77,
        description: 'Any Nightmare Unique',
        image: 'src/images/60.png',
        imagesNeeded: 1,
        dropMessage: ''
    }
];

module.exports = tiles;
