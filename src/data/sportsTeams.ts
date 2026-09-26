/**
 * Single source of truth for sports leagues & teams catalog in Carol Ann OS.
 * Covers Football (NFL), Baseball (MLB), Basketball (NBA), Hockey (NHL), and Soccer (MLS / Global).
 */

export type SportType = 'football' | 'baseball' | 'basketball' | 'hockey' | 'soccer';

export interface SportLeague {
  id: SportType;
  label: string;
  leagueCode: string;
  iconEmoji: string;
}

export const SPORT_LEAGUES: SportLeague[] = [
  { id: 'football', label: 'Football (NFL)', leagueCode: 'NFL', iconEmoji: '🏈' },
  { id: 'baseball', label: 'Baseball (MLB)', leagueCode: 'MLB', iconEmoji: '⚾' },
  { id: 'basketball', label: 'Basketball (NBA)', leagueCode: 'NBA', iconEmoji: '🏀' },
  { id: 'hockey', label: 'Hockey (NHL)', leagueCode: 'NHL', iconEmoji: '🏒' },
  { id: 'soccer', label: 'Soccer (MLS / Global)', leagueCode: 'MLS', iconEmoji: '⚽' },
];

export interface SportsTeam {
  id: string;
  name: string;
  shortName: string;
  city: string;
  sport: SportType;
  league: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  badgeEmoji: string;
  defaultPosition: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
}

export const SPORTS_TEAMS_CATALOG: SportsTeam[] = [
  // --------------------------------------------------------------------------
  // 1. FOOTBALL (NFL)
  // --------------------------------------------------------------------------
  {
    id: 'nfl-broncos',
    name: 'Denver Broncos',
    shortName: 'Broncos',
    city: 'Denver',
    sport: 'football',
    league: 'NFL',
    primaryColor: '#002244', // Midnight Navy
    secondaryColor: '#FB4F14', // Sunset Orange
    accentColor: '#FFFFFF', // Summit White
    badgeEmoji: '🐴',
    defaultPosition: 'top-right',
  },
  {
    id: 'nfl-steelers',
    name: 'Pittsburgh Steelers',
    shortName: 'Steelers',
    city: 'Pittsburgh',
    sport: 'football',
    league: 'NFL',
    primaryColor: '#101820', // Black
    secondaryColor: '#FFB612', // Steelers Gold
    accentColor: '#C60C30', // Red Hypocycloid
    badgeEmoji: '⚙️',
    defaultPosition: 'top-right',
  },
  {
    id: 'nfl-chiefs',
    name: 'Kansas City Chiefs',
    shortName: 'Chiefs',
    city: 'Kansas City',
    sport: 'football',
    league: 'NFL',
    primaryColor: '#E31837', // Red
    secondaryColor: '#FFB81C', // Gold
    accentColor: '#FFFFFF',
    badgeEmoji: '🏹',
    defaultPosition: 'top-right',
  },
  {
    id: 'nfl-cowboys',
    name: 'Dallas Cowboys',
    shortName: 'Cowboys',
    city: 'Dallas',
    sport: 'football',
    league: 'NFL',
    primaryColor: '#003594', // Navy
    secondaryColor: '#869397', // Silver
    accentColor: '#FFFFFF',
    badgeEmoji: '⭐',
    defaultPosition: 'top-right',
  },
  {
    id: 'nfl-eagles',
    name: 'Philadelphia Eagles',
    shortName: 'Eagles',
    city: 'Philadelphia',
    sport: 'football',
    league: 'NFL',
    primaryColor: '#004C54', // Midnight Green
    secondaryColor: '#A5ACAF', // Silver
    accentColor: '#ACC0C6',
    badgeEmoji: '🦅',
    defaultPosition: 'top-right',
  },
  {
    id: 'nfl-49ers',
    name: 'San Francisco 49ers',
    shortName: '49ers',
    city: 'San Francisco',
    sport: 'football',
    league: 'NFL',
    primaryColor: '#AA0000', // Red
    secondaryColor: '#B3995D', // Gold
    accentColor: '#FFFFFF',
    badgeEmoji: '⛏️',
    defaultPosition: 'top-right',
  },
  {
    id: 'nfl-packers',
    name: 'Green Bay Packers',
    shortName: 'Packers',
    city: 'Green Bay',
    sport: 'football',
    league: 'NFL',
    primaryColor: '#203731', // Dark Green
    secondaryColor: '#FFB612', // Gold
    accentColor: '#FFFFFF',
    badgeEmoji: '🧀',
    defaultPosition: 'top-right',
  },
  {
    id: 'nfl-bills',
    name: 'Buffalo Bills',
    shortName: 'Bills',
    city: 'Buffalo',
    sport: 'football',
    league: 'NFL',
    primaryColor: '#00338D', // Royal Blue
    secondaryColor: '#C60C30', // Red
    accentColor: '#FFFFFF',
    badgeEmoji: '🦬',
    defaultPosition: 'top-right',
  },

  // --------------------------------------------------------------------------
  // 2. BASEBALL (MLB)
  // --------------------------------------------------------------------------
  {
    id: 'mlb-yankees',
    name: 'New York Yankees',
    shortName: 'Yankees',
    city: 'New York',
    sport: 'baseball',
    league: 'MLB',
    primaryColor: '#003087', // Navy
    secondaryColor: '#C4CED4', // Gray
    accentColor: '#FFFFFF',
    badgeEmoji: '⚾',
    defaultPosition: 'top-right',
  },
  {
    id: 'mlb-dodgers',
    name: 'Los Angeles Dodgers',
    shortName: 'Dodgers',
    city: 'Los Angeles',
    sport: 'baseball',
    league: 'MLB',
    primaryColor: '#005A9C', // Dodger Blue
    secondaryColor: '#EF3E42', // Red
    accentColor: '#FFFFFF',
    badgeEmoji: '🧢',
    defaultPosition: 'top-right',
  },
  {
    id: 'mlb-redsox',
    name: 'Boston Red Sox',
    shortName: 'Red Sox',
    city: 'Boston',
    sport: 'baseball',
    league: 'MLB',
    primaryColor: '#BD3039', // Red
    secondaryColor: '#0C2340', // Navy
    accentColor: '#FFFFFF',
    badgeEmoji: '🧦',
    defaultPosition: 'top-right',
  },
  {
    id: 'mlb-cubs',
    name: 'Chicago Cubs',
    shortName: 'Cubs',
    city: 'Chicago',
    sport: 'baseball',
    league: 'MLB',
    primaryColor: '#0E3386', // Blue
    secondaryColor: '#CC3433', // Red
    accentColor: '#FFFFFF',
    badgeEmoji: '🐻',
    defaultPosition: 'top-right',
  },
  {
    id: 'mlb-braves',
    name: 'Atlanta Braves',
    shortName: 'Braves',
    city: 'Atlanta',
    sport: 'baseball',
    league: 'MLB',
    primaryColor: '#13274F', // Navy
    secondaryColor: '#CE1141', // Scarlet
    accentColor: '#EAAA00',
    badgeEmoji: '🪓',
    defaultPosition: 'top-right',
  },

  // --------------------------------------------------------------------------
  // 3. BASKETBALL (NBA)
  // --------------------------------------------------------------------------
  {
    id: 'nba-lakers',
    name: 'Los Angeles Lakers',
    shortName: 'Lakers',
    city: 'Los Angeles',
    sport: 'basketball',
    league: 'NBA',
    primaryColor: '#552583', // Forum Purple
    secondaryColor: '#FDB927', // Gold
    accentColor: '#000000',
    badgeEmoji: '💜',
    defaultPosition: 'top-right',
  },
  {
    id: 'nba-celtics',
    name: 'Boston Celtics',
    shortName: 'Celtics',
    city: 'Boston',
    sport: 'basketball',
    league: 'NBA',
    primaryColor: '#007A33', // Celtics Green
    secondaryColor: '#BA9653', // Gold
    accentColor: '#FFFFFF',
    badgeEmoji: '☘️',
    defaultPosition: 'top-right',
  },
  {
    id: 'nba-warriors',
    name: 'Golden State Warriors',
    shortName: 'Warriors',
    city: 'San Francisco',
    sport: 'basketball',
    league: 'NBA',
    primaryColor: '#1D428A', // Royal Blue
    secondaryColor: '#FFC72C', // Golden Yellow
    accentColor: '#FFFFFF',
    badgeEmoji: '🌉',
    defaultPosition: 'top-right',
  },
  {
    id: 'nba-bulls',
    name: 'Chicago Bulls',
    shortName: 'Bulls',
    city: 'Chicago',
    sport: 'basketball',
    league: 'NBA',
    primaryColor: '#CE1141', // Red
    secondaryColor: '#000000', // Black
    accentColor: '#FFFFFF',
    badgeEmoji: '🐂',
    defaultPosition: 'top-right',
  },
  {
    id: 'nba-nuggets',
    name: 'Denver Nuggets',
    shortName: 'Nuggets',
    city: 'Denver',
    sport: 'basketball',
    league: 'NBA',
    primaryColor: '#0E2240', // Midnight Navy
    secondaryColor: '#FEC524', // Sunshine Gold
    accentColor: '#8B2131', // Flatirons Red
    badgeEmoji: '🏔️',
    defaultPosition: 'top-right',
  },

  // --------------------------------------------------------------------------
  // 4. HOCKEY (NHL)
  // --------------------------------------------------------------------------
  {
    id: 'nhl-avalanche',
    name: 'Colorado Avalanche',
    shortName: 'Avalanche',
    city: 'Denver',
    sport: 'hockey',
    league: 'NHL',
    primaryColor: '#6F263D', // Burgundy
    secondaryColor: '#236192', // Blue
    accentColor: '#A2AAAD', // Silver
    badgeEmoji: '🏒',
    defaultPosition: 'top-right',
  },
  {
    id: 'nhl-penguins',
    name: 'Pittsburgh Penguins',
    shortName: 'Penguins',
    city: 'Pittsburgh',
    sport: 'hockey',
    league: 'NHL',
    primaryColor: '#101820', // Black
    secondaryColor: '#FCB514', // Gold
    accentColor: '#FFFFFF',
    badgeEmoji: '🐧',
    defaultPosition: 'top-right',
  },
  {
    id: 'nhl-knights',
    name: 'Vegas Golden Knights',
    shortName: 'Golden Knights',
    city: 'Las Vegas',
    sport: 'hockey',
    league: 'NHL',
    primaryColor: '#333F48', // Steel Grey
    secondaryColor: '#B4975A', // Gold
    accentColor: '#C8102E', // Red
    badgeEmoji: '⚔️',
    defaultPosition: 'top-right',
  },
  {
    id: 'nhl-bruins',
    name: 'Boston Bruins',
    shortName: 'Bruins',
    city: 'Boston',
    sport: 'hockey',
    league: 'NHL',
    primaryColor: '#000000', // Black
    secondaryColor: '#FFB81C', // Gold
    accentColor: '#FFFFFF',
    badgeEmoji: '🐻',
    defaultPosition: 'top-right',
  },
  {
    id: 'nhl-oilers',
    name: 'Edmonton Oilers',
    shortName: 'Oilers',
    city: 'Edmonton',
    sport: 'hockey',
    league: 'NHL',
    primaryColor: '#041E42', // Royal Blue
    secondaryColor: '#FF4C00', // Orange
    accentColor: '#FFFFFF',
    badgeEmoji: '🛢️',
    defaultPosition: 'top-right',
  },

  // --------------------------------------------------------------------------
  // 5. SOCCER (MLS / Global)
  // --------------------------------------------------------------------------
  {
    id: 'mls-miami',
    name: 'Inter Miami CF',
    shortName: 'Inter Miami',
    city: 'Miami',
    sport: 'soccer',
    league: 'MLS',
    primaryColor: '#F7B5CD', // Flamingo Pink
    secondaryColor: '#231F20', // Black
    accentColor: '#FFFFFF',
    badgeEmoji: '🦩',
    defaultPosition: 'top-right',
  },
  {
    id: 'mls-lafc',
    name: 'Los Angeles FC',
    shortName: 'LAFC',
    city: 'Los Angeles',
    sport: 'soccer',
    league: 'MLS',
    primaryColor: '#000000', // Black
    secondaryColor: '#C39E5C', // Gold
    accentColor: '#FFFFFF',
    badgeEmoji: '🦅',
    defaultPosition: 'top-right',
  },
  {
    id: 'nwsl-thorns',
    name: 'Portland Thorns FC',
    shortName: 'Thorns',
    city: 'Portland',
    sport: 'soccer',
    league: 'NWSL',
    primaryColor: '#990000', // Crimson
    secondaryColor: '#C4A006', // Gold
    accentColor: '#004812', // Green
    badgeEmoji: '🌹',
    defaultPosition: 'top-right',
  },
  {
    id: 'nwsl-angelcity',
    name: 'Angel City FC',
    shortName: 'Angel City',
    city: 'Los Angeles',
    sport: 'soccer',
    league: 'NWSL',
    primaryColor: '#FF8A7A', // Sol Rosa
    secondaryColor: '#1B1B1B', // Armour Grey
    accentColor: '#FFFFFF',
    badgeEmoji: '🪽',
    defaultPosition: 'top-right',
  },
  {
    id: 'soccer-realmadrid',
    name: 'Real Madrid',
    shortName: 'Real Madrid',
    city: 'Madrid',
    sport: 'soccer',
    league: 'La Liga',
    primaryColor: '#00529F', // Royal Blue
    secondaryColor: '#FEBE10', // Gold
    accentColor: '#FFFFFF',
    badgeEmoji: '👑',
    defaultPosition: 'top-right',
  },
];

export const getTeamById = (id: string): SportsTeam | undefined =>
  SPORTS_TEAMS_CATALOG.find((t) => t.id === id);

export const getTeamByName = (name: string): SportsTeam | undefined => {
  const norm = name.toLowerCase().trim();
  return SPORTS_TEAMS_CATALOG.find(
    (t) => t.name.toLowerCase() === norm || t.shortName.toLowerCase() === norm
  );
};
