/*
  GrantRadar beta: program database.

  Every program here was checked against its official page on the date in
  `checked`. Before changing a program, re-read the official page in `source`
  and update `checked`. Researchers should re-check every program monthly.

  How a program decides who fits:
    goals    The plans (from the questionnaire) this program helps with.
             A program only shows up if the owner picked at least one.
    check(p) Looks at the owner's profile `p` and calls:
               no(reason)    the business clearly doesn't qualify (hidden,
                             listed under "Programs you don't qualify for")
               maybe(reason) we can't tell yet; the owner should confirm
               yes(reason)   a requirement the business clearly meets
    status   'open' (fixed deadline in `closes`), 'rolling' (no deadline),
             'upcoming' (announced, not open yet), 'closed' (watch for the
             next intake). A program whose `closes` date has passed is
             treated as closed automatically.
    help     How GrantRadar can help: 'draft' (we write the application,
             for `fee`), or a short note when the owner gets it another way
             (claimed on taxes, applied by a supplier, a loan).

  Profile fields (see app.js):
    inBC 'yes'|'no'
    industry 'food_service'|'food_maker'|'retail'|'trades'|'tech'|'manufacturing'|'services'|'other'
    ftEmployees number of full-time employees (0 if just the owner)
    revenue 'lt30k'|'30k_300k'|'300k_1m'|'1m_plus'
    years 'prelaunch'|'lt2'|'2to5'|'5plus'
    incorporated 'yes'|'no'|'unsure'
    youngOwner 'yes'|'no'
    utilities array of 'bchydro'|'fortis_gas'|'fortis_elec'|'unsure'
    goals array of goal ids (GOALS below)
*/

const CHECKED = '2026-11-21';

const GOALS = [
  { id: 'summer_youth', label: 'Hire a student or young person (15 to 30) for the summer' },
  { id: 'student', label: 'Hire a college or university student (co-op, internship or practicum)' },
  { id: 'young_grad', label: 'Hire a recent graduate (30 or younger) for an innovation project' },
  { id: 'jobseeker', label: "Hire someone who's currently looking for work" },
  { id: 'apprentice', label: 'Hire or keep an apprentice in a trade' },
  { id: 'train', label: 'Pay for training for my staff' },
  { id: 'energy', label: 'Upgrade lighting, refrigeration or heating to cut energy bills' },
  { id: 'kitchen', label: 'Buy commercial kitchen equipment (ovens, fryers, fridges)' },
  { id: 'export', label: 'Start or grow sales outside Canada' },
  { id: 'tariffs', label: 'My business has been hurt by U.S. tariffs' },
  { id: 'rnd', label: 'Develop a new product, technology or process' },
  { id: 'bc_food_marketing', label: 'Market the B.C. food or drinks I make' },
  { id: 'startup_loan', label: 'Get start-up financing' }
];

const PROGRAMS = [
  {
    id: 'csj',
    name: 'Canada Summer Jobs 2027',
    funder: 'Government of Canada',
    level: 'Federal',
    type: 'Wage subsidy',
    amount: '50% of B.C. minimum wage for each summer job',
    amountNote: 'Covers 6 to 16 weeks of full-time work per job.',
    goals: ['summer_youth'],
    status: 'open',
    closes: '2026-12-03',
    closesNote: 'Closes December 3, 2026 at 11:59 p.m. Pacific',
    source: 'https://www.canada.ca/en/employment-social-development/news/2026/10/canada-summer-jobs-2027-application-period-for-employers-open-now-until-december-3-2026.html',
    checked: CHECKED,
    check(p, { yes, no, maybe }) {
      if (p.ftEmployees > 50) no('Private businesses need 50 or fewer full-time employees.');
      else yes(`You have ${p.ftEmployees} full-time employees, within the limit of 50.`);
      if (p.years === 'prelaunch') maybe("You'll need a CRA business number and payroll account before you hire.");
    },
    caveats: [
      'Jobs must be full-time (30 to 40 hours a week) for 6 to 16 weeks in a row, between April 19 and August 28, 2027.',
      'Hires must be 15 to 30 years old.',
      "Funding isn't guaranteed. More businesses apply than the program can fund."
    ],
    help: 'draft',
    fee: 399
  },
  {
    id: 'swpp',
    name: 'Student Work Placement Program',
    funder: 'Government of Canada, through industry partners',
    level: 'Federal',
    type: 'Wage subsidy',
    amount: 'Up to $5,000 per student placement',
    goals: ['student'],
    status: 'rolling',
    statusNote: 'Employers can apply year-round',
    source: 'https://www.canada.ca/en/employment-social-development/services/student-work-placements-wage-subsidies.html',
    checked: CHECKED,
    check(p, { yes, maybe }) {
      yes('Businesses of any size can apply.');
      const partner = {
        tech: 'TECHNATION or ICTC',
        food_maker: 'Food Processing Skills Canada',
        food_service: 'Tourism HR Canada',
        manufacturing: 'Excellence in Manufacturing Consortium',
        trades: 'the partner for your trade'
      }[p.industry];
      maybe(`You apply through a delivery partner for your industry${partner ? `, likely ${partner}` : ', such as Magnet or Venture for Canada'}. Each partner has its own rules.`);
    },
    caveats: [
      'The student must be enrolled at a Canadian college or university, and the work should relate to their studies.',
      'Each partner sets its own intake dates. Apply before the student starts.'
    ],
    help: 'draft',
    fee: 399
  },
  {
    id: 'workbc_wage',
    name: 'WorkBC Wage Subsidy',
    funder: 'Province of B.C. (WorkBC)',
    level: 'B.C.',
    type: 'Wage subsidy',
    amount: '50% of wages, up to $12.50 an hour for up to 800 hours',
    amountNote: 'Up to $10,000 per hire.',
    goals: ['jobseeker'],
    status: 'rolling',
    statusNote: 'Available year-round through WorkBC Centres',
    source: 'https://www.workbc.ca/employers-industry/wage-subsidy',
    checked: CHECKED,
    check(p, { yes, no }) {
      if (p.inBC !== 'yes') no('The job must be based in B.C.');
      else yes('The job is in B.C.');
    },
    caveats: [
      'The person you hire must be a WorkBC client: an eligible job seeker matched through WorkBC.',
      'Talk to your local WorkBC Centre before the person starts work.',
      "You can't let go of other staff to make room for a subsidized hire."
    ],
    help: 'draft',
    fee: 399
  },
  {
    id: 'etg',
    name: 'B.C. Employer Training Grant',
    funder: 'Province of B.C. (WorkBC)',
    level: 'B.C.',
    type: 'Grant',
    amount: '80% of training costs, up to $10,000 per employee',
    amountNote: 'Up to $300,000 per employer each year (April to March).',
    goals: ['train'],
    status: 'rolling',
    statusNote: 'Open for 2026/27 while funding lasts',
    source: 'https://www.workbc.ca/find-loans-and-grants/industry-and-employers/bc-employer-training-grant',
    checked: CHECKED,
    check(p, { yes }) {
      yes('Small, medium and large businesses can apply.');
      if (p.ftEmployees < 50) yes('Small businesses get a priority point when funding is tight.');
    },
    caveats: [
      'Trainees must be Canadian citizens, permanent residents or protected persons.',
      "Apply before training starts. If training starts and you're turned down, you pay the full cost.",
      "Diploma and degree programs aren't covered, and training can't run longer than 52 weeks.",
      'You pay the training costs first, then claim 80% back within 30 days.',
      "Funding is limited each year. Check that it's still open before you count on it."
    ],
    help: 'draft',
    fee: 399
  },
  {
    id: 'bcas',
    name: 'Build Canada Apprenticeship Service',
    funder: 'Government of Canada',
    level: 'Federal',
    type: 'Grant',
    amount: 'Up to $10,000 per first-year apprentice',
    goals: ['apprentice'],
    status: 'upcoming',
    statusNote: "Announced for fall 2026. It wasn't taking applications when we last checked",
    source: 'https://www.canada.ca/en/employment-social-development/news/2026/09/minister-hajdu-outlines-progress-in-implementing-team-canada-strong-to-recruit-train-and-hire-the-next-generation-of-skilled-trades-workers.html',
    checked: CHECKED,
    check(p, { yes, no, maybe }) {
      if (p.ftEmployees >= 500) no('This is for small and medium-sized employers.');
      else yes('It\'s for small and medium-sized employers like yours.');
      if (p.industry !== 'trades') maybe('Only apprentices in eligible Red Seal trades count.');
      else yes('Your apprentice must be in an eligible Red Seal trade.');
    },
    caveats: [
      "Rules and dates will be confirmed when it opens. We'll update this listing."
    ],
    help: 'draft',
    fee: 899
  },
  {
    id: 'ajctc',
    name: 'Apprenticeship Job Creation Tax Credit',
    funder: 'Canada Revenue Agency',
    level: 'Federal',
    type: 'Tax credit',
    amount: '10% of an apprentice\'s wages, up to $2,000 a year per apprentice',
    goals: ['apprentice'],
    status: 'rolling',
    statusNote: 'Claimed on your tax return',
    source: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/corporations/business-tax-credits.html',
    checked: CHECKED,
    check(p, { yes, maybe }) {
      if (p.industry !== 'trades') maybe('Only apprentices in Red Seal trades count.');
      else yes('It covers apprentices in Red Seal trades.');
    },
    caveats: [
      'Covers the first two years of the apprenticeship.',
      'It lowers the tax you owe. It isn\'t paid out as cash if you owe no tax.'
    ],
    help: 'Your accountant claims this on your tax return. No application needed.'
  },
  {
    id: 'bc_ttc',
    name: 'B.C. Training Tax Credit for Employers',
    funder: 'Province of B.C.',
    level: 'B.C.',
    type: 'Tax credit',
    amount: 'Up to $4,000 per apprentice, plus up to $2,500 or $3,000 when they finish level 3 or 4',
    goals: ['apprentice'],
    status: 'rolling',
    statusNote: 'For wages paid before January 1, 2028',
    source: 'https://www2.gov.bc.ca/gov/content/taxes/income-taxes/corporate/credits/training/employer',
    checked: CHECKED,
    check(p, { yes, no }) {
      if (p.inBC !== 'yes') no('This is a B.C. tax credit.');
      else yes('Your business is in B.C.');
    },
    caveats: [
      'The $4,000 basic credit (20% of wages) is only for non-Red Seal programs, in the first 24 months.',
      'The completion credits (15% of wages) cover both Red Seal and non-Red Seal apprentices.',
      'The apprentice must be registered in a B.C. apprenticeship program.'
    ],
    help: 'Your accountant claims this on your tax return. No application needed.'
  },
  {
    id: 'irap',
    name: 'NRC Industrial Research Assistance Program (IRAP)',
    funder: 'National Research Council of Canada',
    level: 'Federal',
    type: 'Grant',
    amount: 'Advice and funding for innovation projects. Amounts vary by project.',
    goals: ['rnd'],
    status: 'rolling',
    statusNote: 'No deadline. Start by talking to an IRAP advisor',
    source: 'https://nrc.canada.ca/en/support-technology-innovation/financial-support-technology-innovation',
    checked: CHECKED,
    check(p, { yes, no, maybe }) {
      if (p.incorporated === 'no') no('IRAP funds incorporated businesses only.');
      else if (p.incorporated === 'unsure') maybe('Your business must be incorporated in Canada.');
      else yes('Your business is incorporated.');
      if (p.ftEmployees > 500) no('IRAP is for businesses with up to 500 employees.');
      if (!['tech', 'manufacturing', 'food_maker'].includes(p.industry)) maybe('IRAP funds technology-driven products, processes or services.');
      else yes('Your industry often develops the kind of technology IRAP funds.');
    },
    caveats: [
      'Meeting the basic rules doesn\'t guarantee funding. An advisor first decides whether your project fits.'
    ],
    help: 'draft',
    fee: 1799
  },
  {
    id: 'irap_yep',
    name: 'IRAP Youth Employment Program',
    funder: 'National Research Council of Canada',
    level: 'Federal',
    type: 'Wage subsidy',
    amount: 'Covers part of a young graduate\'s salary for 6 to 12 months',
    amountNote: 'Recent agreements were often around $30,000.',
    goals: ['young_grad'],
    status: 'rolling',
    statusNote: "Check with IRAP. We couldn't confirm current funding",
    source: 'https://nrc.canada.ca/en/support-technology-innovation/nrc-irap-funding-hire-young-graduates',
    checked: CHECKED,
    check(p, { yes, no, maybe }) {
      if (p.ftEmployees > 500) no('This is for small and medium-sized businesses.');
      else yes('It\'s for small and medium-sized businesses.');
      if (p.incorporated === 'no') maybe('IRAP usually funds incorporated businesses only.');
      if (!['tech', 'manufacturing', 'food_maker'].includes(p.industry)) maybe('The graduate must work on an innovation or technology project.');
    },
    caveats: [
      'The graduate must be 15 to 30 and have finished college or university.',
      "You pay the rest of their salary, plus benefits and overhead."
    ],
    help: 'draft',
    fee: 899
  },
  {
    id: 'sred',
    name: 'SR&ED Tax Credit (Scientific Research and Experimental Development)',
    funder: 'Canada Revenue Agency',
    level: 'Federal',
    type: 'Tax credit',
    amount: 'Up to 35% back on eligible R&D costs, paid in cash for small corporations',
    goals: ['rnd'],
    status: 'rolling',
    statusNote: 'Claimed with your tax return, within 18 months of year end',
    source: 'https://www.canada.ca/en/revenue-agency/services/scientific-research-experimental-development-tax-incentive-program.html',
    checked: CHECKED,
    check(p, { yes, maybe }) {
      if (p.incorporated === 'yes') yes('Canadian-controlled private corporations get the 35% refundable rate.');
      else maybe('The 35% cash refund is for Canadian-controlled private corporations. Other businesses get a smaller credit.');
    },
    caveats: [
      'The work must try to solve a technical problem whose answer isn\'t already known. Routine development doesn\'t count.',
      'Keep records of your work as you go: notes, test results and timesheets.'
    ],
    help: 'Claimed with your tax return. Many accountants and SR&ED specialists prepare these claims.'
  },
  {
    id: 'rtri',
    name: 'Regional Tariff Response Initiative (B.C.)',
    funder: 'PacifiCan (Government of Canada)',
    level: 'Federal',
    type: 'Grant',
    amount: 'Non-repayable funding up to $1 million for projects (50% of costs), or cash-flow support up to 50% of payroll',
    goals: ['tariffs', 'export'],
    status: 'rolling',
    statusNote: 'Accepting applications. No deadline listed',
    source: 'https://www.canada.ca/en/pacific-economic-development/services/funding/regional-tariff-response-initiative.html',
    checked: CHECKED,
    check(p, { yes, no, maybe }) {
      if (p.inBC !== 'yes') no('This stream is for businesses in B.C.');
      if (p.incorporated === 'no') no('Your business must be incorporated.');
      else if (p.incorporated === 'unsure') maybe('Your business must be incorporated.');
      else yes('Your business is incorporated.');
      if (p.revenue !== '1m_plus') no('You need at least $1 million in yearly revenue in one of the last two years.');
      else yes('Your revenue is over $1 million.');
      if (['food_service', 'retail', 'trades'].includes(p.industry)) no('Retail, restaurants and construction services aren\'t eligible.');
      else if (['manufacturing', 'food_maker'].includes(p.industry)) yes('It\'s for manufacturers, suppliers and value-added businesses.');
      else maybe('It\'s mainly for manufacturers, suppliers and value-added businesses in tariff-hit sectors.');
    },
    caveats: [
      'You must sell at least 25% into the markets hit by tariffs, or show the tariffs have hurt your business.',
      'Funding is limited.'
    ],
    help: 'draft',
    fee: 1799
  },
  {
    id: 'canexport',
    name: 'CanExport SMEs',
    funder: 'Trade Commissioner Service (Government of Canada)',
    level: 'Federal',
    type: 'Grant',
    amount: '$10,000 to $50,000 per export project, covering 50% of costs',
    goals: ['export'],
    status: 'closed',
    statusNote: 'Closed for 2026/27. The next intake hasn\'t been announced',
    source: 'https://www.tradecommissioner.gc.ca/en/our-solutions/funding-financing-international-business/canexport-smes.html',
    checked: CHECKED,
    check(p, { yes, no, maybe }) {
      if (p.incorporated === 'no') no('Your business must be incorporated (or an LLP or co-op).');
      else if (p.incorporated === 'unsure') maybe('Your business must be incorporated (or an LLP or co-op).');
      else yes('Your business is incorporated.');
      if (p.ftEmployees < 3) no('You need at least 3 full-time employees.');
      else if (p.ftEmployees > 500) no('It\'s for businesses with up to 500 full-time employees.');
      else yes(`You have ${p.ftEmployees} full-time employees, within the 3 to 500 range.`);
      if (['lt30k', '30k_300k'].includes(p.revenue)) no('You need at least $300,000 in yearly revenue.');
      else yes('Your revenue is over $300,000.');
    },
    caveats: ['Last year\'s rules. They may change when the next intake opens.'],
    help: 'draft',
    fee: 899
  },
  {
    id: 'bchydro',
    name: 'BC Hydro Business Energy-Saving Incentives',
    funder: 'BC Hydro',
    level: 'Utility',
    type: 'Rebate',
    amount: 'Covers part of the cost of new lighting, refrigeration and heating add-ons',
    amountNote: 'Past projects got about 40% of upfront costs back on average. There\'s a 30% bonus right now.',
    goals: ['energy'],
    status: 'rolling',
    statusNote: '30% bonus for projects submitted by February 11, 2027',
    deadline: '2027-02-11',
    deadlineLabel: '30% bonus ends',
    source: 'https://www.bchydro.com/powersmart/business/programs/buy-upgrade-equipment/energy-saving-incentives.html',
    checked: CHECKED,
    check(p, { yes, no, maybe }) {
      const u = p.utilities || [];
      if (u.includes('bchydro')) yes('You\'re a BC Hydro business customer.');
      else if (u.includes('fortis_elec') && !u.includes('unsure')) no('This is for BC Hydro electricity customers.');
      else maybe('You must be a BC Hydro business customer.');
    },
    caveats: [
      'Register and get pre-approval before you buy anything or start work.',
      'Simple one-for-one replacements and add-ons qualify. Projects with the bonus must be finished by March 14, 2028.'
    ],
    help: 'Apply online with BC Hydro, or have a BC Hydro Alliance contractor apply for you.'
  },
  {
    id: 'fortis_food',
    name: 'FortisBC Foodservice Equipment Rebates',
    funder: 'FortisBC',
    level: 'Utility',
    type: 'Rebate',
    amount: 'Instant discounts on energy-efficient ovens, fryers, griddles, dishwashers, fridges and more',
    goals: ['kitchen', 'energy'],
    status: 'rolling',
    statusNote: 'Ongoing',
    source: 'https://www.fortisbc.com/rebates/business/foodservice-equipment-rebates',
    checked: CHECKED,
    check(p, { yes, no, maybe }) {
      const u = p.utilities || [];
      if (u.includes('fortis_gas') || u.includes('fortis_elec')) yes('You\'re a FortisBC customer.');
      else maybe('You must be a FortisBC commercial customer (gas or electricity).');
      if (['food_service', 'food_maker'].includes(p.industry)) yes('It\'s for commercial kitchens and food businesses.');
      else if (p.industry === 'retail') maybe('Food retail businesses qualify. Other shops don\'t.');
      else no('It\'s for commercial kitchens, food retail and foodservice businesses.');
    },
    caveats: ['Buy from a participating supplier. They take the discount off right away, with no paperwork.'],
    help: 'Your supplier applies the discount when you buy. No application needed.'
  },
  {
    id: 'buybc',
    name: 'Buy BC Partnership Program',
    funder: 'Province of B.C. (Ministry of Agriculture and Food)',
    level: 'B.C.',
    type: 'Grant',
    amount: '$5,000 to $30,000 a year for marketing B.C. food and drinks, covering 50% of costs for first-time recipients',
    goals: ['bc_food_marketing'],
    status: 'closed',
    statusNote: 'The last intake closed February 20, 2026. The next hasn\'t been announced',
    source: 'https://buybcpartnershipprogram.ca/',
    checked: CHECKED,
    check(p, { yes, no, maybe }) {
      if (p.industry === 'food_maker') yes('It\'s for B.C. food and drink producers and processors.');
      else if (p.industry === 'food_service') maybe('It\'s for producers and processors of packaged B.C. food and drinks, not restaurants or cafés.');
      else no('It\'s for B.C. food and drink producers and processors.');
      if (p.revenue === 'lt30k') no('You need at least $30,000 in yearly revenue for the past two years.');
      if (p.years === 'prelaunch' || p.years === 'lt2') maybe('You need two years of revenue over $30,000.');
    },
    caveats: [
      'You need a Buy BC logo licence first. It\'s free.',
      'The cap is $15,000 a year if your revenue is under $250,000, and $30,000 if it\'s over.',
      'You pay the full cost first and get reimbursed.'
    ],
    help: 'draft',
    fee: 899
  },
  {
    id: 'futurpreneur',
    name: 'Futurpreneur Startup Program',
    funder: 'Futurpreneur Canada, with BDC',
    level: 'National non-profit',
    type: 'Loan',
    amount: 'Loans up to $75,000, plus a volunteer mentor',
    goals: ['startup_loan'],
    status: 'rolling',
    statusNote: 'Ongoing',
    source: 'https://futurpreneur.ca/en/eligibility/',
    checked: CHECKED,
    check(p, { yes, no }) {
      if (p.youngOwner !== 'yes') no('The owner applying must be 18 to 39.');
      else yes('An owner is 18 to 39.');
      if (p.years === '2to5' || p.years === '5plus') no('Your business must be pre-launch or running full-time for 24 months or less.');
      else yes('Your business is new enough (24 months or less).');
    },
    caveats: [
      'This is a loan, so it has to be paid back.',
      'You need a business plan and cash flow forecast, and a credit check is required.',
      'The applicant must own more than 50% of the business and work in it full-time.'
    ],
    help: 'You apply directly with Futurpreneur.'
  }
];

const MORE_PROGRAMS_URL = 'https://innovation.ised-isde.canada.ca/s/?language=en_CA';
