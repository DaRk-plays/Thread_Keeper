export interface SceneInfo {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  startFrame: number;
  endFrame: number;
  durationInFrames: number;
  timestampRange: string;
  narrationText: string;
  visualCue: string;
}

export const SCENES: SceneInfo[] = [
  {
    id: 1,
    slug: 'context-lost',
    title: 'Context Lost',
    subtitle: 'Every developer knows this feeling',
    startFrame: 0,
    endFrame: 420,
    durationInFrames: 420,
    timestampRange: '0:00 - 0:14',
    narrationText:
      "You're deep in flow. Three terminal tabs open, two PR discussions in flight, five files uncommitted, and a delicate mental map of edge cases balanced in your head. Then someone taps your shoulder. Or a critical meeting starts. Or you go to lunch. When you come back twenty minutes later... your train of thought is gone.",
    visualCue:
      'Stick figure coding at desk with glowing mental map; sudden interruption; cognitive network shatters into floating fragments.',
  },
  {
    id: 2,
    slug: 'threadkeeper-reveal',
    title: 'ThreadKeeper',
    subtitle: 'Never lose your train of thought',
    startFrame: 420,
    endFrame: 750,
    durationInFrames: 330,
    timestampRange: '0:14 - 0:25',
    narrationText:
      "This is ThreadKeeper. It's an Alexa Plus continuity agent that captures your cognitive state before you walk away, and reconstructs exactly what changed, what became stale, and what to do next when you return.",
    visualCue:
      'Dark canvas lights up with glowing neon blue continuity thread knitting thought fragments back together. Alexa+ and AWS Bedrock badges emerge.',
  },
  {
    id: 3,
    slug: 'park-this',
    title: 'Alexa, Park This',
    subtitle: 'One phrase parks your train of thought',
    startFrame: 750,
    endFrame: 1410,
    durationInFrames: 660,
    timestampRange: '0:25 - 0:47',
    narrationText:
      "Before you leave, you don't write manual notes. You just speak: 'Alexa, park this.' In under three seconds, ThreadKeeper inspects your live Git repository, indexes uncommitted changes, captures your active hypothesis, and saves a cryptographically grounded checkpoint into Amazon Bedrock AgentCore Memory. It works over ambient voice or inside VS Code through the Model Context Protocol.",
    visualCue:
      'Voice waveform ripples; split-screen with real CLI demo and web console slot; structured checkpoint cards slide in showing goal, uncommitted diffs, and assumption IDs.',
  },
  {
    id: 4,
    slug: 'the-drift',
    title: 'The Interruption & The Drift',
    subtitle: 'src/payment.ts changes while the developer is away',
    startFrame: 1410,
    endFrame: 1830,
    durationInFrames: 420,
    timestampRange: '0:47 - 1:01',
    narrationText:
      "While you're away, the working tree doesn't stay frozen. src/payment.ts changes while the developer is away. When you sit back down, the hardest part isn't remembering what you were doing. It's knowing whether your assumptions are still true.",
    visualCue:
      'Clock ticks; desk is empty; working tree changes and file hash updates for src/payment.ts; previous assumptions turn amber and caution symbols appear.',
  },
  {
    id: 5,
    slug: 'where-was-i',
    title: 'Alexa, Where Was I?',
    subtitle: 'Grounded re-entry with zero friction',
    startFrame: 1830,
    endFrame: 2580,
    durationInFrames: 750,
    timestampRange: '1:01 - 1:26',
    narrationText:
      "You sit back down at your desk and simply ask: 'Alexa, where was I?' ThreadKeeper doesn't just read back an old todo note. It retrieves your previous checkpoint from AWS AgentCore, checks your live Git working directory right now, compares THEN versus NOW, and reasons over the delta using Amazon Nova Lite.",
    visualCue:
      'Developer returns to desk; glowing voice pulse responds; split-screen real demo slot displaying the 5-sentence spoken response highlighting the stale payment.ts assumption.',
  },
  {
    id: 6,
    slug: 'continuity-diff',
    title: 'Continuity Diff',
    subtitle: 'Rigorous 4-tier epistemic separation',
    startFrame: 2580,
    endFrame: 3240,
    durationInFrames: 660,
    timestampRange: '1:26 - 1:48',
    narrationText:
      "This is Continuity Diff. Git tells ThreadKeeper what actually changed. AgentCore remembers what I believed before I left. ThreadKeeper separates what is observed, what can be derived, what is only inferred, and what is still unknown. So when the evidence moves, ThreadKeeper knows exactly what needs another look.",
    visualCue:
      'Side-by-side THEN vs NOW card comparison. Epistemic badges highlight OBSERVED (White), DERIVED (Mint), INFERRED (Amber), UNKNOWN (Violet), and STALE ASSUMPTION (Coral).',
  },
  {
    id: 7,
    slug: 'under-the-hood',
    title: 'Under The Hood',
    subtitle: 'Amazon Bedrock + AgentCore Memory + MCP Protocol',
    startFrame: 3240,
    endFrame: 4050,
    durationInFrames: 810,
    timestampRange: '1:48 - 2:15',
    narrationText:
      "Under the hood, the Alexa-style interface connects through a self-hosted M C P server over Streamable H T T P. The continuity engine brings together three things: Git as authoritative workspace truth, AgentCore as persistent memory, and Amazon Nova Lite for grounded interpretation. Six verified tools power the workflow, with eighty-seven automated tests protecting the product logic.",
    visualCue:
      'Interactive architecture topology: Git Repo -> MCP Server (Streamable HTTP, 6 tools) -> AWS AgentCore Memory -> Bedrock Nova Lite -> Alexa Voice Dispatcher. 87/87 passing tests badge.',
  },
  {
    id: 8,
    slug: 'the-payoff',
    title: 'Continuity Restored',
    subtitle: 'From 20 minutes of archaeology to 15 seconds of flow',
    startFrame: 4050,
    endFrame: 4530,
    durationInFrames: 480,
    timestampRange: '2:15 - 2:31',
    narrationText:
      "Instead of twenty minutes of archaeology, you're back in flow in fifteen seconds. Context preserved. Assumptions verified. Zero hallucinations. ThreadKeeper: Never lose your train of thought.",
    visualCue:
      'Developer happily in flow; neon thread pulses into infinity; ThreadKeeper brand card, Alexa+ track banner, Amazon Build Ship Shape 2026 badge, and GitHub link.',
  },
];

export const TOTAL_FRAMES = 4530; // 151 seconds @ 30fps (2:31)
export const VIDEO_FPS = 30;
export const VIDEO_WIDTH = 1920;
export const VIDEO_HEIGHT = 1080;

export const COLOR_PALETTE = {
  background: '#080B12',
  cardBackground: '#111625',
  cardBorder: '#1F2942',
  continuityThread: '#5B8CFF', // Neon Blue
  memorySaved: '#40E0B5', // Mint
  staleAlert: '#FF5C7A', // Coral Red
  inference: '#FFB547', // Amber
  unknown: '#8E8BAF', // Violet-Gray
  textPrimary: '#F6F7FB',
  textSecondary: '#AEB6C5',
  textMuted: '#6B768E',
  observedWhite: '#FFFFFF',
};
