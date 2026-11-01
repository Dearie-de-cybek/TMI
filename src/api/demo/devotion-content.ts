/**
 * The prophetic decree and the daily devotionals.
 *
 * The November decree is the ministry's own text, from the desk of the Lead
 * Pastor. It is reproduced here so the reading, praying and progress features
 * can be built against real content; in production it is published through the
 * API and edited by the church, never by the app.
 */

const DAY = 86_400_000;

function at(offsetDays: number, hour = 6): string {
  const date = new Date(Date.now() + offsetDays * DAY);
  date.setUTCHours(hour, 0, 0, 0);
  return date.toISOString();
}

/** The date, as `YYYY-MM-DD`, offset from today. */
function dayKey(offsetDays: number): string {
  return new Date(Date.now() + offsetDays * DAY).toISOString().slice(0, 10);
}

export const demoDecree = {
  id: 'dec-2026-11',
  period: '2026-11',
  month_label: 'November 2026',
  theme: 'The Month of Taking Captivity Captive',
  subtitle: 'Prophetic decree and prayers',
  author: 'Pastor Patrick Evbomoen',
  author_role: 'Head Pastor & Founder',
  artwork_url: 'asset:prayerHandsRaised',
  published_at: at(-1),
  year_theme: { year: 2026, theme: 'Proclaiming the Lordship of Jesus Christ and discipling nations' },
  scriptural_foundation: [
    'Ephesians 4:8',
    'Psalm 126:1–3',
    'Isaiah 49:24–25',
    'Zechariah 9:11–12',
    'Psalm 91:1–16',
  ],
  introduction: [
    'November shall not be a month of captivity, but a month of conquest; not a season of bondage, but a season of breakthrough; not a period of tears, but a testimony of triumph!',
    'Beloved, in the name of Jesus Christ, I stand in the authority of God’s Word and, as a shepherd over this flock, I declare these prophetic blessings over TwainMan Ministry International, every family, every member, every household and everyone connected to this ministry.',
    'The God who turns captivity shall visit us with His mighty hand. The God who breaks bars of iron shall shatter every ancient limitation. The God who brings His people out of darkness shall lead us into the brightness of His marvellous light.',
    'This November, we are not merely escaping captivity; we are taking captivity captive!',
    'Receive these declarations by faith, in the mighty name of Jesus!',
  ],
  sections: [
    {
      id: 'dec-2026-11-1',
      position: 1,
      title: 'Supernatural liberation and total deliverance',
      scriptures: ['Ephesians 4:8', 'Isaiah 49:24–25', 'Psalm 107:14'],
      body: [
        'I decree that every captivity assigned against my life, my family, my destiny and my divine purpose is terminated by the power of the Holy Ghost!',
        'I declare that every chain of ancestral affliction, every yoke of satanic oppression, every bondage of stagnation and every limitation resisting my advancement is broken in the name of Jesus!',
        'I shall no longer be held hostage by battles I did not initiate, burdens I did not create or limitations I did not choose.',
        'Every power that has held my blessings in captivity shall lose its grip! Every gate that has resisted my entrance into God’s ordained inheritance shall be lifted by the King of Glory!',
        'I decree that what was lost shall be restored, what was stolen shall be recovered, what was delayed shall receive divine attention, and what was imprisoned shall be released!',
        'I am not a prisoner of yesterday. I am a partaker of God’s liberty, a possessor of His promises and an inheritor of His covenant!',
        'In November, I move from bondage to boldness, from limitation to liberty, from captivity to conquest, in Jesus’ name!',
      ],
    },
    {
      id: 'dec-2026-11-2',
      position: 2,
      title: 'Divine protection and preservation',
      scriptures: ['Psalm 91:1–11', 'Isaiah 54:17', 'Psalm 121:7–8'],
      body: [
        'I decree over every member of TwainMan Ministry International: The Lord shall preserve your going out and your coming in, from this time forth and even forevermore!',
        'I declare that the Keeper of Israel shall neither slumber nor sleep concerning you. No evil shall befall you, and no plague shall come near your dwelling.',
        'I decree that the blood of Jesus speaks preservation over your life, protection over your household and covering over everything committed into your hands.',
        'I declare that you shall not become a victim of evil circumstances, a casualty of wicked conspiracies or a statistic of untimely tragedy.',
        'Every arrow that flies by day and every terror that stalks by night shall be rendered powerless against you.',
        'May the Lord preserve your children, your spouse, your parents, your businesses, your journeys, your possessions and your destinies.',
        'I decree that your feet shall not slip, your crown shall not be stolen, your glory shall not be exchanged and your portion shall not be diverted.',
        'You shall be preserved in the storm, protected in the struggle and sustained in the season of uncertainty! In the name of Jesus Christ!',
      ],
    },
    {
      id: 'dec-2026-11-3',
      position: 3,
      title: 'Restoration and recovery',
      scriptures: ['Joel 2:25–27', '1 Samuel 30:8, 18–19', 'Zechariah 9:12'],
      body: [
        'I decree that November shall become a month of divine recovery!',
        'Every good thing that has suffered loss through ignorance, affliction, oppression, delay or adverse circumstances shall receive the intervention of the God of restoration.',
        'Like David at Ziklag, I receive divine strength to pursue, overtake and recover all!',
        'I declare that wasted years shall not define my future. Lost opportunities shall not terminate my testimony. Past disappointments shall not dictate my possibilities.',
        'I recover my spiritual fire, my prophetic sensitivity, my courage, my confidence, my peace and my passion for the things of God!',
        'I decree that families experiencing prolonged battles shall receive restoration; marriages under pressure shall receive divine help; businesses experiencing setbacks shall encounter fresh opportunities.',
        'Where there has been shame, let honour arise. Where there has been reproach, let restoration speak. Where there has been weeping, let rejoicing break forth!',
        'My testimony shall not be a record of what the enemy took, but a revelation of what my God restored!',
      ],
    },
    {
      id: 'dec-2026-11-4',
      position: 4,
      title: 'Divine direction and supernatural clarity',
      scriptures: ['Isaiah 30:21', 'Psalm 32:8', 'Proverbs 3:5–6'],
      body: [
        'I decree that confusion shall not be my counsellor, uncertainty shall not be my compass and fear shall not be my guide.',
        'I receive divine direction for every decision, divine discernment for every relationship and divine wisdom for every assignment.',
        'The Lord shall instruct me and teach me in the way I should go. His eyes shall guide me.',
        'I shall not walk into prepared traps, enter destructive alliances or pursue opportunities outside the boundaries of God’s will.',
        'Every veil covering my understanding is lifted! Every fog of confusion is dispelled! Every voice contradicting the counsel of God is silenced!',
        'I receive clarity concerning my purpose, my assignment, my relationships, my finances, my family and my next season.',
        'I decree that I shall not mistake movement for progress, noise for direction or opportunity for divine ordination.',
        'My ears shall hear the Shepherd’s voice, my eyes shall perceive His pathway and my heart shall remain sensitive to His Spirit.',
      ],
    },
    {
      id: 'dec-2026-11-5',
      position: 5,
      title: 'Divine health, healing and wholeness',
      scriptures: ['Jeremiah 30:17', 'Isaiah 53:5', 'Psalm 103:2–5'],
      body: [
        'I decree that the healing virtue of Jesus Christ shall find expression in the lives and bodies of God’s people.',
        'I pray for everyone battling sickness, disease, infirmity, pain, weakness or prolonged medical challenges: May the Lord visit you with His healing mercy and sustaining grace!',
        'I declare that the Lord is your Healer, your Strength and your Life.',
        'Let every affliction receive the touch of divine mercy. Let every weary body receive strength. Let every troubled soul receive peace.',
        'I decree healing in our homes, health in our bodies, soundness in our minds and strength in our spirits.',
        'Every family carrying the burden of prolonged illness, may the Lord grant you comfort, wisdom, provision and favourable outcomes.',
        'We shall not be consumed by affliction; we shall be sustained by grace, strengthened by His Spirit and established in His peace!',
      ],
    },
    {
      id: 'dec-2026-11-6',
      position: 6,
      title: 'Open doors, favour and supernatural advancement',
      scriptures: ['Revelation 3:8', 'Isaiah 45:1–3', 'Psalm 5:12'],
      body: [
        'I decree that doors ordained by God shall open before me! Every legitimate opportunity assigned to my destiny shall find expression in this season.',
        'I receive favour before God and before men.',
        'I decree that the Lord shall cause my name to be remembered for good, my gifts to make room for me and my labour to yield fruitful results.',
        'Every limitation at the threshold of advancement shall give way to divine intervention.',
        'I shall not be stranded where God has ordained provision. I shall not be forgotten where God has ordained remembrance. I shall not be rejected where God has ordained acceptance.',
        'I declare supernatural connections, strategic relationships, timely helpers and divinely orchestrated encounters.',
        'I shall advance without compromise, prosper without pride and increase without losing my devotion to God.',
        'My doors shall open, my path shall brighten, my hands shall prosper and my testimony shall multiply!',
      ],
    },
    {
      id: 'dec-2026-11-7',
      position: 7,
      title: 'Over children, youths and destinies',
      scriptures: ['Isaiah 54:13', 'Jeremiah 29:11', 'Psalm 127:3–5'],
      body: [
        'I decree over every child, teenager and young adult connected to TwainMan Ministry International: You shall fulfil God’s purpose for your life!',
        'Your destiny shall not be truncated, your gifts shall not be buried and your future shall not be sacrificed on the altar of destructive influences.',
        'I declare that the Lord shall give you wisdom beyond your years, understanding beyond your education and discernment beyond your exposure.',
        'You shall not become prey to the deception of this generation.',
        'Your minds shall be guarded, your values shall be preserved and your spiritual foundations shall be established in Christ.',
        'I decree that our children shall become arrows of righteousness, instruments of transformation and vessels of kingdom influence.',
        'Our children shall not inherit our battles; they shall inherit the promises of God and become testimonies of His faithfulness!',
      ],
    },
    {
      id: 'dec-2026-11-8',
      position: 8,
      title: 'Over families and households',
      scriptures: ['Joshua 24:15', 'Isaiah 8:18', 'Psalm 128:1–6'],
      body: [
        'I decree peace over every household represented in this ministry. Every home under pressure shall encounter divine intervention.',
        'Every marriage facing misunderstanding shall receive grace for reconciliation, patience, wisdom and renewed affection.',
        'I declare that the spirit of strife, bitterness, division and destructive contention shall not establish its throne in our homes.',
        'I pray for parents carrying heavy responsibilities: May the Lord renew your strength, supply your needs and establish the works of your hands.',
        'I decree that no family shall be abandoned to despair. No household shall be left without the mercy and sustaining help of God.',
        'May the Lord raise godly fathers, wise mothers, obedient children and spiritually vibrant households.',
        'Our homes shall become sanctuaries of peace, altars of prayer, schools of righteousness and dwelling places of God’s presence!',
      ],
    },
    {
      id: 'dec-2026-11-9',
      position: 9,
      title: 'Over TwainMan Ministry International',
      scriptures: ['Isaiah 60:1–3', 'Matthew 16:18', 'Acts 12:24', 'Zechariah 4:6–7'],
      body: [
        'I decree over TwainMan Ministry International: Arise and shine, for your light has come and the glory of the Lord is risen upon you!',
        'I declare that this ministry shall not be weakened by opposition, distracted by criticism or diverted by the devices of the enemy. The counsel of God concerning this ministry shall stand!',
        'I decree fresh fire upon our altar, fresh oil upon our leadership, fresh grace upon our workers and fresh hunger for righteousness upon every member.',
        'May the Word of God grow mightily among us. May the power of the Holy Spirit be evident in our gatherings. May the sick receive healing, the oppressed experience freedom, the weary receive strength and the lost encounter salvation.',
        'I decree that our prayer altars shall not become cold, our spiritual wells shall not run dry and our discipleship mandate shall not be abandoned.',
        'May Kingdom Heralds arise as agents of transformation. May Saviours Arise Africa fulfil its mandate. May every kingdom initiative committed to this ministry receive divine wisdom, provision and strategic partnerships.',
        'No weapon formed against the vision shall prosper. No contrary counsel shall overthrow God’s purpose.',
      ],
    },
    {
      id: 'dec-2026-11-10',
      position: 10,
      title: 'Spiritual authority and victory',
      scriptures: ['Luke 10:19', 'Romans 8:37', '2 Corinthians 2:14'],
      body: [
        'I decree that I shall not surrender my spiritual authority to fear, intimidation or satanic opposition.',
        'I stand in the victory of Jesus Christ, whose death destroyed the power of the enemy and whose resurrection established our eternal triumph.',
        'I declare that I am more than a conqueror through Christ who loves me.',
        'I shall overcome temptation, withstand deception, resist the devil and remain steadfast in faith.',
        'Every battle designed to weaken my devotion shall become an occasion for deeper consecration.',
        'Every trial intended to break my faith shall become a platform for the manifestation of God’s sustaining grace.',
        'I am empowered by the Spirit, established in the Word, covered by the blood and secured in the victory of Christ!',
      ],
    },
    {
      id: 'dec-2026-11-11',
      position: 11,
      title: 'The pastoral benediction: prayer over God’s people',
      scriptures: ['Numbers 6:24–26', 'Ephesians 3:20–21'],
      body: [
        'Father, in the mighty name of Jesus Christ, I lift every member of TwainMan Ministry International before Your throne of grace. Lord, these are Your people, the sheep of Your pasture and the heritage of Your kingdom.',
        'I pray that Your hand of preservation shall rest upon them. May Your mercy surround them, Your wisdom guide them and Your power sustain them.',
        'For everyone who has cried silently, Lord, remember them. For everyone who has carried burdens without knowing whom to tell, Lord, strengthen them.',
        'For everyone standing at a crossroads, Lord, illuminate their pathway. For everyone experiencing prolonged battles, Lord, arise as their mighty Deliverer.',
        'For everyone who has become weary in waiting, Lord, renew their strength. For everyone whose faith has been shaken by the storms of life, Lord, establish their hearts in Your unfailing Word.',
        'I speak peace over troubled minds, hope over discouraged hearts, strength over weakened hands and restoration over broken places.',
        'I decree that before this month is over, there shall be testimonies of divine intervention, undeniable deliverance, supernatural preservation, healing, restoration and answers to prayers.',
        'Father, let November become a month that our families will remember, a month that our testimonies will celebrate and a month that our adversaries will recognise as a season of divine intervention. In Jesus’ mighty and matchless name, Amen!',
      ],
    },
  ],
  confession: {
    title: 'Our corporate prophetic confession',
    lead: 'NOVEMBER: MY MONTH OF TAKING CAPTIVITY CAPTIVE!',
    lines: [
      'I AM NOT A CAPTIVE; I AM A CONQUEROR!',
      'I shall not be stranded; I shall be strategically positioned.',
      'I shall not be defeated; I shall be divinely defended.',
      'I shall not be confused; I shall be divinely directed.',
      'I shall not be consumed; I shall be supernaturally preserved.',
      'I shall not be buried in affliction; I shall rise in the strength of Christ.',
      'I shall not lose my inheritance; I shall possess my possession.',
      'I shall not end this month in tears; I shall end it with testimonies!',
      'My family is preserved! My destiny is secured! My health is under God’s care!',
      'My steps are ordered! My gates are open! My captivity is terminated! My restoration is established!',
      'I TAKE CAPTIVITY CAPTIVE, BY THE POWER OF THE HOLY GHOST, IN THE MIGHTY NAME OF JESUS! AMEN!',
    ],
  },
  closing_word:
    'You will not merely survive November; you will see the goodness of God in the land of the living. The hand that preserved you through previous battles shall establish you in new victories. Your captivity shall not have the final word; Jesus Christ, the Author and Finisher of your faith, shall have the final say!',
};

/**
 * Daily devotionals. The church publishes one each morning; the app shows the
 * one for today and keeps the recent ones so a member can catch up.
 */
export const demoDevotionals = [
  {
    id: `dev-${dayKey(0)}`,
    date: at(0),
    title: 'Enough for Today',
    scripture_reference: 'Matthew 6:11',
    scripture_text: 'Give us this day our daily bread.',
    body: 'The prayer is for today. Not for the quarter, not for the five-year plan. Daily bread is a discipline of trust as much as a request for provision, it asks us to come back tomorrow.\n\nAsk the Father for what today needs. Then come back in the morning and ask again. That returning is the point.',
    author: null,
    artwork_url: 'asset:prayerQuiet',
    reflection: 'What is the one thing today needs that you have been trying to secure for the whole year?',
  },
  {
    id: `dev-${dayKey(-1)}`,
    date: at(-1),
    title: 'He Led Captivity Captive',
    scripture_reference: 'Ephesians 4:8',
    scripture_text:
      'When he ascended on high, he led captivity captive, and gave gifts unto men.',
    body: 'Notice the order. The ascent came first, then the captives were led, then the gifts were given. What held you did not simply lose its grip, it was taken.\n\nThis month, do not only pray to be free. Pray as one whose freedom has already been purchased, and who is now being handed gifts.',
    author: null,
    artwork_url: 'asset:praiseShout',
    reflection: 'Name one thing you have been asking to escape. Thank God for it as something already taken captive.',
  },
  {
    id: `dev-${dayKey(-2)}`,
    date: at(-2),
    title: 'The Keeper Who Does Not Sleep',
    scripture_reference: 'Psalm 121:4',
    scripture_text: 'Behold, he that keepeth Israel shall neither slumber nor sleep.',
    body: 'There is a watch being kept over your life that does not pause when you do. You will sleep tonight; He will not.\n\nThat is why rest is an act of faith. You are not the one holding it all together.',
    author: null,
    artwork_url: 'asset:prayerClasped',
    reflection: 'What are you staying awake over that He is already watching?',
  },
  {
    id: `dev-${dayKey(-3)}`,
    date: at(-3),
    title: 'Pursue, Overtake, Recover All',
    scripture_reference: '1 Samuel 30:8',
    scripture_text: 'Pursue: for thou shalt surely overtake them, and without fail recover all.',
    body: 'David asked before he moved. The strength to pursue came with the instruction to pursue.\n\nRecovery is rarely passive. But it is never unaccompanied.',
    author: null,
    artwork_url: 'asset:prayerHandsRaised',
    reflection: 'What have you stopped pursuing because the loss felt final?',
  },
];

export const demoDevotionalArchiveCount = demoDevotionals.length;
