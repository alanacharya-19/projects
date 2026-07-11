export interface Article {
  id: string;
  title: string;
  source: string;
  category: string;
  time: string;
  reads: string;
  image?: string;
  images?: string[];
  body: string;
  sourceId?: string;
  byline?: string;
  standfirst?: string;
  wordcount?: number;
  shortUrl?: string;
}

export const ARTICLES: Article[] = [
  {
    id: '1',
    title: 'Global Markets Rally as Tech Sector Posts Record Earnings',
    source: 'Reuters',
    category: 'Finance',
    time: '2h ago',
    reads: '1.2k',
    body: 'Global stock markets surged today as technology companies reported unprecedented quarterly earnings, driven by strong demand in artificial intelligence and cloud computing sectors. The S&P 500 reached a new all-time high, with the tech-heavy NASDAQ leading the charge with a 3.2% gain.\n\nAnalysts attribute the rally to better-than-expected earnings from major tech firms, which have been investing heavily in AI infrastructure. "This is a watershed moment for the industry," said Mark Henderson, chief market strategist at Global Investments. "The earnings beat expectations across the board, signaling that the tech sector\'s growth trajectory remains strong despite global economic headwinds."\n\nInvestors also reacted positively to news of potential interest rate cuts later this year, which could further fuel market growth. The rally was broad-based, with financial, healthcare, and industrial sectors also posting significant gains.',
  },
  {
    id: '2',
    title: 'Revolutionary Battery Technology Could Double EV Range',
    source: 'TechCrunch',
    category: 'Technology',
    time: '4h ago',
    reads: '3.4k',
    body: 'A team of researchers at Stanford University has unveiled a new solid-state battery technology that promises to double the range of electric vehicles while reducing charging time to under 15 minutes. The breakthrough, published in the journal Nature, addresses key limitations of current lithium-ion batteries.\n\nThe new battery uses a solid ceramic electrolyte instead of the liquid electrolyte found in conventional batteries. This not only increases energy density but also significantly improves safety by eliminating the risk of thermal runaway. "Our solid-state design achieves an energy density of 500 Wh/kg, more than double that of current EV batteries," said Dr. Sarah Chen, lead researcher on the project.\n\nIndustry experts believe this technology could accelerate EV adoption by addressing range anxiety, one of the primary barriers to widespread electric vehicle adoption. Major automakers have already expressed interest in licensing the technology, with production timelines estimated within 3-5 years.',
  },
  {
    id: '3',
    title: 'Health Officials Announce Breakthrough in Cancer Research',
    source: 'BBC News',
    category: 'Health',
    time: '5h ago',
    reads: '2.8k',
    body: 'The National Institutes of Health has announced a landmark breakthrough in cancer treatment, with a new immunotherapy approach showing a 90% success rate in late-stage clinical trials. The treatment, which harnesses the body\'s own immune system to target cancer cells, has been described as "revolutionary" by oncologists.\n\nThe therapy involves reprogramming a patient\'s T-cells to recognize and attack specific cancer markers. In the trial of 500 patients with previously treatment-resistant cancers, 450 showed significant tumor reduction within six months. "This is not an exaggeration — this changes everything," said Dr. James Wilson, director of the NIH\'s Cancer Research Center.\n\nThe FDA has granted the treatment breakthrough therapy designation, fast-tracking its approval process. Patient advocacy groups have welcomed the news, though they caution that the treatment\'s current cost may limit accessibility. Insurance coverage discussions are expected to begin later this year.',
  },
  {
    id: '4',
    title: 'New Climate Policy Framework Gains International Support',
    source: 'The Guardian',
    category: 'Politics',
    time: '7h ago',
    reads: '956',
    body: 'A landmark international climate policy framework has secured support from 120 nations at the ongoing Global Climate Summit in Geneva. The accord, which sets binding carbon reduction targets for signatory countries, represents the most ambitious climate agreement since the Paris Accords.\n\nThe framework requires developed nations to reduce carbon emissions by 60% by 2035 and achieve net-zero by 2045, with developing nations given extended timelines. A $500 billion climate fund has been established to help poorer nations transition to renewable energy. "This is our generation\'s moonshot," said UN Secretary-General during the signing ceremony.\n\nEnvironmental groups have cautiously praised the agreement while emphasizing that implementation will be key. Critics, however, argue that the targets are still insufficient to limit global warming to 1.5°C. The agreement now moves to individual nations for ratification, a process expected to take several months.',
  },
  {
    id: '5',
    title: 'Professional Soccer League Announces Expansion to 32 Teams',
    source: 'ESPN',
    category: 'Sports',
    time: '8h ago',
    reads: '4.1k',
    body: 'Major League Soccer has announced a historic expansion to 32 teams, adding four new franchises in cities including Las Vegas, Phoenix, San Diego, and Sacramento. The expansion, valued at over $2 billion, marks the league\'s largest growth phase since its founding in 1993.\n\nThe new teams are expected to begin play by the 2028 season, with each franchise paying an estimated $500 million expansion fee. "This is a transformative moment for soccer in North America," said MLS Commissioner. "The interest in our league has never been higher, and these new markets will help us continue to grow the sport."\n\nThe announcement comes amid surging interest in soccer following the successful 2026 World Cup hosted jointly by the US, Canada, and Mexico. The league also announced plans to increase the salary cap and invest in youth academies across all 32 teams.',
  },
  {
    id: '6',
    title: 'Quantum Computing Milestone Achieved by Research Team',
    source: 'Nature',
    category: 'Science',
    time: '10h ago',
    reads: '2.2k',
    body: 'A team of physicists at MIT and Google Quantum AI have achieved a major milestone in quantum computing, successfully demonstrating a 1000-qubit processor that maintains coherence for over 10 seconds. The breakthrough, published in Nature Physics, overcomes one of the biggest challenges in quantum computing: qubit stability.\n\nThe new processor uses a novel error-correction technique that actively stabilizes qubits against environmental interference. "This is the first time a quantum system of this size has maintained coherence long enough to perform meaningful computations," said Professor Maria Rodriguez, lead author of the study.\n\nThe achievement brings practical quantum computing closer to reality, with potential applications in drug discovery, climate modeling, and cryptography. Google\'s quantum team estimates that commercially relevant quantum computers could be available within the next five to seven years.',
  },
  {
    id: '7',
    title: 'Housing Market Shows Signs of Recovery After Rate Cuts',
    source: 'Bloomberg',
    category: 'Finance',
    time: '12h ago',
    reads: '1.8k',
    body: 'The housing market is showing early signs of recovery following three consecutive interest rate cuts by the Federal Reserve. Home sales increased by 12% in the last quarter, marking the first significant uptick in over two years. The median home price has stabilized at around $380,000.\n\n"The combination of lower mortgage rates and increased inventory is bringing buyers back into the market," said Lisa Park, chief economist at National Realty Association. First-time homebuyers, who had been priced out of the market, are leading the recovery. Mortgage applications have surged 25% since the rate cuts began.\n\nHowever, affordability remains a concern in major metropolitan areas. Experts caution that the recovery may be uneven, with some markets recovering faster than others. Builders are also facing higher material costs, which could constrain new construction.',
  },
  {
    id: '8',
    title: 'Streaming Platform Announces Major Original Content Slate',
    source: 'Variety',
    category: 'Entertainment',
    time: '14h ago',
    reads: '5.6k',
    body: 'Leading streaming service StreamMax has announced its largest-ever slate of original programming, committing $15 billion to produce 50 new series, 30 films, and 20 documentaries over the next two years. The announcement sent shockwaves through the entertainment industry.\n\nThe slate includes high-profile projects from Oscar-winning directors, including a sci-fi epic from Christopher Nolan and a historical drama from Ava DuVernay. "We are doubling down on quality storytelling," said StreamMax\'s Chief Content Officer. "Our subscribers demand the best, and we\'re delivering."\n\nThe investment represents a 40% increase over the company\'s previous content budget and signals an intensifying streaming war. Competitors have responded with announcements of their own content expansions. Industry analysts expect the total streaming content spend to exceed $200 billion industry-wide by 2027.',
  },
  {
    id: '9',
    title: 'NASA Reveals Plans for Permanent Lunar Base by 2035',
    source: 'Space News',
    category: 'Science',
    time: '16h ago',
    reads: '7.2k',
    body: 'NASA has unveiled detailed plans for establishing a permanent human presence on the Moon by 2035. The Artemis Base Camp, to be located at the lunar south pole, will initially house up to 12 astronauts and include living quarters, laboratories, and a power generation facility.\n\nThe base will utilize in-situ resource utilization technology to extract water ice from lunar craters, which can be converted into drinking water, breathable oxygen, and rocket fuel. "We are going to stay this time," said NASA Administrator. "Unlike the Apollo missions, Artemis is about building a sustainable presence."\n\nThe project is a collaboration with the European Space Agency, JAXA, and private partners including SpaceX. The total estimated cost is $50 billion over 15 years, with construction expected to begin in 2030 following the successful return of astronauts to the Moon in 2027.',
  },
  {
    id: '10',
    title: 'New AI Tool Could Revolutionize Medical Diagnostics',
    source: 'Wired',
    category: 'Technology',
    time: '18h ago',
    reads: '3.9k',
    body: 'A groundbreaking AI diagnostic tool developed by DeepMind Health has demonstrated the ability to detect over 50 medical conditions from a single blood test with 98% accuracy. The system, called MedScan, uses deep learning to analyze patterns in blood biomarkers that are imperceptible to human doctors.\n\nIn clinical trials involving 50,000 patients, MedScan successfully identified early-stage cancers, autoimmune disorders, and cardiovascular diseases months or even years before conventional diagnostic methods. "This could fundamentally change how we approach preventative medicine," said Dr. Alan Turing, chief medical officer at DeepMind Health.\n\nThe tool has received FDA breakthrough device designation and is expected to begin rolling out to major hospitals by early 2027. Privacy advocates have raised concerns about data security and the potential for algorithmic bias, which the company says it is actively addressing.',
  },
  {
    id: '11',
    title: 'Global Trade Agreement Reached After Months of Negotiations',
    source: 'Reuters',
    category: 'Politics',
    time: '20h ago',
    reads: '1.5k',
    body: 'World leaders have finalized the Global Trade and Economic Partnership (GTEP), a comprehensive trade agreement covering 85% of global commerce. The agreement, reached after six months of intensive negotiations, reduces tariffs, standardizes regulations, and establishes new frameworks for digital trade.\n\nThe pact includes provisions for data privacy, intellectual property protection, and environmental standards that all signatory nations must adhere to. "This agreement levels the playing field for businesses of all sizes," said the WTO Director-General. "It creates a more predictable and fair trading system."\n\nAnalysts project the agreement could add $3 trillion to global GDP over the next decade. The deal now requires ratification by each participating nation\'s legislative body, a process expected to be completed by mid-2027. Some opposition has emerged from protectionist groups in several countries.',
  },
  {
    id: '12',
    title: 'Electric Vehicle Sales Surge Past 50% Market Share',
    source: 'Bloomberg',
    category: 'Finance',
    time: '22h ago',
    reads: '2.6k',
    body: 'Electric vehicles have surpassed 50% of new car sales for the first time in history, marking a pivotal moment in the automotive industry\'s transition away from fossil fuels. According to industry data, EVs accounted for 52% of all new vehicle registrations in the first quarter of 2026.\n\nThe milestone comes as major automakers have dramatically expanded their EV lineups and battery prices have fallen by 40% over the past three years. "We\'ve crossed the tipping point," said industry analyst James Carter. "EVs are no longer a niche product — they\'re mainstream."\n\nCharging infrastructure has also expanded rapidly, with over 500,000 public charging stations now available nationwide. The average price of an EV has dropped to within 5% of comparable gasoline vehicles, making them increasingly accessible to average consumers. Government incentives continue to play a role in accelerating adoption.',
  },
];

export const CATEGORIES = ['All', 'Technology', 'Politics', 'Sports', 'Finance', 'Science', 'Health', 'Entertainment'];

export function getArticleById(id: string): Article | undefined {
  return ARTICLES.find((a) => a.id === id);
}

export function getArticlesByCategory(category: string): Article[] {
  if (category === 'All') return ARTICLES;
  return ARTICLES.filter((a) => a.category === category);
}

export function getRelatedArticles(article: Article, count = 3): Article[] {
  return ARTICLES.filter(
    (a) => a.id !== article.id && a.category === article.category
  ).slice(0, count);
}
