/**
 * What the church says about itself, transcribed from its printed brochure.
 *
 * This is the church's own wording and should only change when the church
 * changes it. Spelling and punctuation are lightly corrected; nothing is added.
 */
export const churchInfo = {
  name: 'TwainMan Ministry International',
  tagline: 'Proclaiming the Lordship of Jesus Christ and discipling the nations.',
  motto: 'It’s Life Transforming…',

  whoWeAre: [
    'We are a nondenominational prayer and prophetic army with an apostolic mandate to proclaim and manifest the Lordship of Jesus the Christ and to make disciples of nations everywhere.',
  ],
  whoWeAreLines: [
    'Our passion for God is deep,',
    'our vision is clear,',
    'our goal is Christ in power and in principles.',
  ],
  whoWeAreCreed: [
    'Our experience with God is real and personal.',
    'We grow in Christ in all things.',
    'We live as a family.',
    'We work as a team.',
    'We are the circumcision who worship God in Spirit and have no confidence in the flesh.',
  ],

  worshipDays: [
    { day: 'Mondays', what: 'School of Prayer', time: '5 pm' },
    { day: 'Tuesdays', what: 'School of Discipleship', time: '5 pm – 6:30 pm' },
    { day: 'Sundays', what: 'Leadership and Discipleship Class', time: '8 pm' },
    { day: 'Sundays', what: 'Wells of the Spirit', time: '9 pm' },
  ],

  specialFeatures: [
    { name: 'Seven Days of the Supernatural', when: '1st – 7th of the month' },
    { name: 'Equipping the Saints Conference', when: null },
    { name: 'Prevailing Prayer Conference', when: null },
    { name: 'Gethsemane Prayer Camp Retreat', when: 'August' },
    { name: 'Week of Incense', when: 'First week of every quarter' },
  ],

  beliefs: [
    'We believe in the Bible as the infallible Word of God and final authority over all matters of life, time and eternity, and hold the same as the foundation upon which we build all things.',
    'We believe in the efficacy of prayer and all dimensions of prayer as revealed in the Word of God by the Holy Ghost, and hold the same as the very life of this ministry.',
    'We believe in all the doctrines of Christ, the Captain of our salvation and High Priest of our profession — that is, Holy Communion, Feet Washing, and Anointing with oil.',
    'We believe in modesty, moderacy and decency, and all such things that pertain to an exemplary lifestyle of the believer as instructed in God’s Word.',
    'We believe in Jesus Christ as the first begotten of the Father and as the foundation upon which we build.',
    'We believe in the Baptism of Water by immersion and the Baptism of and in the Holy Ghost.',
    'We believe in the supernatural as a demonstration of the infallible proofs that Jesus Christ is alive, and for a confirmation of the gospel which we preach.',
  ],

  invitation:
    'Join a group: invest your life in the Kingdom of God and experience God’s power for change.',

  social: [
    { network: 'Facebook', handle: 'Twainman Ministry Int’l' },
    { network: 'Instagram', handle: 'twainmanministryint’l' },
    { network: 'TikTok', handle: 'twainmanministryint' },
    { network: 'YouTube', handle: 'Twainman Ministry International' },
  ],
} as const;
