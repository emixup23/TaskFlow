import { AdventurePathDefinition } from '../types';

export const ADVENTURE_PATHS: AdventurePathDefinition[] = [
  {
    id: 'system_admin',
    roleName: 'System Administrator',
    sagaTitle: "The Server Keeper's Path",
    tagline: 'Guard the uptime, lock down permissions, and achieve zero-downtime nirvana.',
    lore: 'From the silent whirring of cloud clusters to the bastion walls of zero-trust networks, the Server Keeper ensures digital infrastructure stands resilient against chaos and outage.',
    themeColor: {
      text: 'text-sky-400',
      border: 'border-sky-500/40',
      bg: 'bg-sky-500/10',
      gradient: 'from-sky-500/20 to-blue-600/10',
      badgeBg: 'bg-sky-950/60',
      badgeText: 'text-sky-300',
      glow: 'shadow-sky-500/20'
    },
    stages: [
      {
        id: 'sysadmin-stage-1',
        stageNumber: 1,
        title: 'Terminal Novice',
        subtitle: 'Shell Fundamentals & The Command Line Rite',
        lore: 'In the glow of the green phosphor CRT, the novice sysadmin takes their first steps. Armed with wand, manual, and the venerable "$ _" prompt, the arcane rites of the terminal begin.',
        objective: 'Execute foundational shell commands, inspect system status, and verify access logs.',
        targetCount: 2,
        xpReward: 150,
        badgeTitle: 'Terminal Novice',
        badgeIcon: '💻',
        imageUrl: '/images/level-1-terminal-novice.jpg'
      },
      {
        id: 'sysadmin-stage-2',
        stageNumber: 2,
        title: 'Root Seeker',
        subtitle: 'Privilege Elevation & The Sudo Staff',
        lore: 'Ascending the crags of the operating system, the seeker grasps the legendary staff of "sudo" and unlocks root authority. With immense power comes the sacred duty of least privilege.',
        objective: 'Configure role permissions, establish multi-user privileges, and safeguard cryptographic root keys.',
        targetCount: 4,
        xpReward: 300,
        badgeTitle: 'Root Seeker',
        badgeIcon: '🗝️',
        imageUrl: '/images/level-2-root-seeker.jpg'
      },
      {
        id: 'sysadmin-stage-3',
        stageNumber: 3,
        title: 'Guardian of the Uptime',
        subtitle: 'The 100% Citadel & The Five-Nines Hammer',
        lore: 'Clad in heavy armor bearing the golden 100% seal and wielding the formidable 99.999% warhammer, the Guardian raises the telemetry pulse shield against downtime, latency spikes, and chaos.',
        objective: 'Defend uninterrupted service SLAs, maintain active health checks, and eliminate system bottlenecks.',
        targetCount: 6,
        xpReward: 500,
        badgeTitle: 'Guardian of the Uptime',
        badgeIcon: '🛡️',
        imageUrl: '/images/level-3-Guardian_of_the_uptime.jpg'
      },
      {
        id: 'sysadmin-stage-4',
        stageNumber: 4,
        title: 'Warden of the Network Realm',
        subtitle: 'Distributed Topologies & Packet Sorcery',
        lore: 'Flanked by monolithic rackmount servers with blinking status lights, the hooded archmage commands the luminous constellation of network nodes, subnets, and zero-trust conduits.',
        objective: 'Orchestrate resilient network meshes, configure redundant reverse proxies, and balance high concurrency loads.',
        targetCount: 8,
        xpReward: 750,
        badgeTitle: 'Warden of the Network Realm',
        badgeIcon: '🌐',
        imageUrl: '/images/level-4-warden-of-the-network-realm.jpg'
      },
      {
        id: 'sysadmin-stage-5',
        stageNumber: 5,
        title: 'Sysadmin Sovereign',
        subtitle: 'Throne of the Iron Core & Master of All Clusters',
        lore: 'Enthroned amidst server monoliths and thick fiber conduits, the ruby-crowned Sovereign reigns supreme over planetary cloud infrastructure. Five-nines uptime is guaranteed by royal decree.',
        objective: 'Attain absolute high-availability perfection, execute seamless disaster recovery failovers, and rule the server kingdom.',
        targetCount: 10,
        xpReward: 1200,
        badgeTitle: 'Sysadmin Sovereign',
        badgeIcon: '👑',
        imageUrl: '/images/level-5-sysadmin-sovereign.jpg'
      }
    ]
  },
  {
    id: 'customer_support',
    roleName: 'Customer Support',
    sagaTitle: "The Diplomat's Quest",
    tagline: 'Turn user friction into delight through active listening, clarity, and rapid resolution.',
    lore: 'Standing at the threshold where real people meet complex software, the Diplomat wields empathy as a shield and reassurance as a beacon, turning frustration into lifelong trust.',
    themeColor: {
      text: 'text-amber-400',
      border: 'border-amber-500/40',
      bg: 'bg-amber-500/10',
      gradient: 'from-amber-500/20 to-orange-600/10',
      badgeBg: 'bg-amber-950/60',
      badgeText: 'text-amber-300',
      glow: 'shadow-amber-500/20'
    },
    stages: [
      {
        id: 'support-stage-1',
        stageNumber: 1,
        title: 'First Empathy Bridge',
        subtitle: 'Rapid First-Touch Resolution',
        lore: 'The first minute sets the tone for the entire relationship. Greet user difficulties with patience and immediate structure.',
        objective: 'Answer incoming customer questions with tailored, helpful guidance and warm courtesy.',
        targetCount: 3,
        xpReward: 150,
        badgeTitle: 'First Responder',
        badgeIcon: '🤝'
      },
      {
        id: 'support-stage-2',
        stageNumber: 2,
        title: 'De-escalation Sorcery',
        subtitle: 'Transforming Conflict into Calm',
        lore: 'When tension peaks and deadlines loom, a true diplomat deconstructs anger into solvable technical steps.',
        objective: 'Resolve high-priority escalated tickets and restore stakeholder confidence before deadline.',
        targetCount: 5,
        xpReward: 300,
        badgeTitle: 'Crisis Mediator',
        badgeIcon: '🕊️'
      },
      {
        id: 'support-stage-3',
        stageNumber: 3,
        title: 'Customer Champion Odyssey',
        subtitle: 'Voice of the User',
        lore: 'Support is the greatest market research engine. Channel raw user feedback into high-impact product roadmaps.',
        objective: 'Synthesize recurring user pain points into 3 concrete feature enhancement proposals.',
        targetCount: 7,
        xpReward: 500,
        badgeTitle: 'Empathy Oracle',
        badgeIcon: '💎'
      },
      {
        id: 'support-stage-4',
        stageNumber: 4,
        title: 'Envoy of Perpetual Harmony',
        subtitle: 'Legendary CSAT & Advocacy',
        lore: 'Attain the fabled 100% satisfaction benchmark, cementing the guild as a beacon of warmth and responsiveness.',
        objective: 'Deliver an uninterrupted streak of five-star satisfaction ratings across the entire sprint.',
        targetCount: 10,
        xpReward: 1000,
        badgeTitle: 'Grand Ambassador',
        badgeIcon: '🌟'
      }
    ]
  },
  {
    id: 'developer',
    roleName: 'Developer',
    sagaTitle: "The Codeforge Saga",
    tagline: 'Forge clean algorithms, slay cryptic runtime bugs, and architect elegant software at scale.',
    lore: 'In the illuminated sanctuaries of terminal emulators, lines of code weave real-world machinery. The Developer turns imagination into performant, reliable computation.',
    themeColor: {
      text: 'text-emerald-400',
      border: 'border-emerald-500/40',
      bg: 'bg-emerald-500/10',
      gradient: 'from-emerald-500/20 to-teal-600/10',
      badgeBg: 'bg-emerald-950/60',
      badgeText: 'text-emerald-300',
      glow: 'shadow-emerald-500/20'
    },
    stages: [
      {
        id: 'dev-stage-1',
        stageNumber: 1,
        title: 'The Hello World Rite',
        subtitle: 'Pristine Syntax & Structure',
        lore: 'Every great software empire began with a humble entry point. Craft clean interfaces with strict types.',
        objective: 'Implement modular TypeScript components with zero compiler warnings and strict lint compliance.',
        targetCount: 3,
        xpReward: 150,
        badgeTitle: 'Code Initiate',
        badgeIcon: '💻'
      },
      {
        id: 'dev-stage-2',
        stageNumber: 2,
        title: 'Crucible of Refactoring',
        subtitle: 'Purging Technical Debt',
        lore: 'Code is read ten times more often than it is written. Polish clumsy routines into razor-sharp composable hooks.',
        objective: 'Deconstruct complex views into isolated subcomponents and eliminate redundant network calls.',
        targetCount: 5,
        xpReward: 300,
        badgeTitle: 'Syntax Alchemist',
        badgeIcon: '🔮'
      },
      {
        id: 'dev-stage-3',
        stageNumber: 3,
        title: "Bug Exterminator's Gauntlet",
        subtitle: 'Root Cause Annihilation',
        lore: 'Race conditions and memory leaks tremble before deep instrumentation and defensive exception guards.',
        objective: 'Diagnose and squash 3 elusive edge-case defects with defensive boundaries and regression coverage.',
        targetCount: 7,
        xpReward: 500,
        badgeTitle: 'Bug Slayer',
        badgeIcon: '⚔️'
      },
      {
        id: 'dev-stage-4',
        stageNumber: 4,
        title: 'Arch-Engineer of the Codeforge',
        subtitle: 'Full-Stack Distributed Triumph',
        lore: 'Ascend to the pantheon of master builders. Ship resilient full-stack systems that thrive under high concurrency.',
        objective: 'Deploy a complete end-to-end full-stack feature with sub-second response times and audit compliance.',
        targetCount: 10,
        xpReward: 1000,
        badgeTitle: 'Codeforge Paragon',
        badgeIcon: '🏆'
      }
    ]
  },
  {
    id: 'hr',
    roleName: 'HR',
    sagaTitle: "The Guild Master's Journey",
    tagline: 'Assemble diverse talent, nurture psychological safety, and champion the human spirit.',
    lore: 'A guild is not merely lines of code or server racks—it is the collective heart of its people. The Guild Master weaves connection, resolves dissonance, and guides each member toward their highest potential.',
    themeColor: {
      text: 'text-purple-400',
      border: 'border-purple-500/40',
      bg: 'bg-purple-500/10',
      gradient: 'from-purple-500/20 to-pink-600/10',
      badgeBg: 'bg-purple-950/60',
      badgeText: 'text-purple-300',
      glow: 'shadow-purple-500/20'
    },
    stages: [
      {
        id: 'hr-stage-1',
        stageNumber: 1,
        title: 'The Welcome Hearth',
        subtitle: 'Recruit Onboarding & Belonging',
        lore: 'First impressions shape a career. Ensure every new adventurer feels welcomed, supported, and equipped.',
        objective: 'Orchestrate seamless newcomer orientation, configure team access, and conduct first-week check-ins.',
        targetCount: 2,
        xpReward: 150,
        badgeTitle: 'Fellowship Guide',
        badgeIcon: '🏕️'
      },
      {
        id: 'hr-stage-2',
        stageNumber: 2,
        title: 'Culture Alchemist',
        subtitle: 'Morale & Team Recognition',
        lore: 'Gratitude fuels enduring momentum. Celebrate quiet contributions and cultivate an atmosphere of praise.',
        objective: 'Facilitate peer recognition, organize collaborative team rituals, and distribute well-deserved kudos.',
        targetCount: 5,
        xpReward: 300,
        badgeTitle: 'Morale Weaver',
        badgeIcon: '✨'
      },
      {
        id: 'hr-stage-3',
        stageNumber: 3,
        title: 'Talent Harmonizer',
        subtitle: 'Career Mentorship & Growth',
        lore: 'Align individual aspirations with the guild’s grand missions. Cultivate leadership from within.',
        objective: 'Conduct constructive 1-on-1 career progression sessions and build customized skill milestones.',
        targetCount: 7,
        xpReward: 500,
        badgeTitle: 'Master Mentor',
        badgeIcon: '🌱'
      },
      {
        id: 'hr-stage-4',
        stageNumber: 4,
        title: 'Supreme Guild Sovereign',
        subtitle: 'Collective Flourishing & Unity',
        lore: 'The guild thrives as an unstoppable sanctuary of creativity, psychological safety, and shared accomplishment.',
        objective: 'Achieve peak engagement across all departments with zero regrettable turnover and stellar morale.',
        targetCount: 10,
        xpReward: 1000,
        badgeTitle: 'High Guild Sovereign',
        badgeIcon: '👑'
      }
    ]
  }
];
