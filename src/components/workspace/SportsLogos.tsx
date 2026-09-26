import React from 'react';

interface TeamLogoProps {
  className?: string;
  size?: number;
}

/**
 * Denver Broncos Official NFL Football Logo (Scalable Vector SVG)
 * Authentic NFL design: Forward-charging white stallion head in profile facing RIGHT,
 * with flowing fiery orange mane plumes (#FB4F14), deep midnight navy outline (#002244),
 * snow peak white head & neck (#FFFFFF), flared nostril, open mouth, and fierce orange eye.
 */
export const DenverBroncosLogo: React.FC<TeamLogoProps> = ({ className = '', size = 64 }) => (
  <svg
    viewBox="0 0 200 130"
    width={size}
    height={(size * 130) / 200}
    className={`drop-shadow-md select-none ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Denver Broncos Official NFL Football Logo"
  >
    <g transform="translate(200, 0) scale(-1, 1)">
      {/* Midnight Navy Outer Contour / Foundation */}
      <path
        d="M178 72 C186 64 192 53 194 42 C189 44 182 46 175 46 C183 38 187 28 187 18 C180 23 171 27 162 29 C168 20 169 11 168 3 C159 10 148 16 137 20 C140 13 140 6 137 0 C128 7 117 14 107 19 C100 22 93 25 86 29 C70 37 54 49 42 62 C33 72 26 84 18 97 C13 105 8 114 2 123 C10 120 18 117 26 115 C20 120 14 125 7 130 C19 127 30 124 41 120 C49 117 56 112 62 106 C69 99 74 91 80 83 C86 75 93 68 101 62 C108 57 116 53 124 50 C122 55 119 61 115 66 C124 61 133 56 142 50 C140 56 137 62 133 68 C143 62 153 56 162 49 C161 57 157 65 152 72 C162 67 171 61 178 72 Z"
        fill="#002244"
      />

      {/* Sunset Orange Flowing Mane Spikes */}
      <path
        d="M185 41 C177 43 170 45 162 45 C172 37 177 26 176 15 C168 21 159 25 149 27 C156 18 157 9 154 1 C144 9 133 16 121 21 C124 13 123 6 119 0 C110 8 99 15 89 21 C81 25 73 29 65 34 C50 43 36 55 25 69 C17 79 11 91 5 103 C12 101 19 99 26 97 C19 103 13 108 6 114 C17 111 27 108 37 105 C46 102 54 96 61 89 C69 81 75 72 82 63 C89 54 98 47 107 41 C115 36 124 32 133 30 C129 37 124 44 118 50 C129 44 140 38 150 31 C146 39 141 46 135 53 C147 46 158 39 168 31 C165 41 160 50 154 58 C166 52 176 45 185 41 Z"
        fill="#FB4F14"
      />

      {/* Midnight Navy Contrast Cutouts inside Mane */}
      <path
        d="M148 27 C138 34 126 40 114 45 C121 38 127 30 131 22 C137 24 143 25 148 27 Z"
        fill="#002244"
      />
      <path
        d="M165 31 C154 39 142 46 129 52 C137 45 143 37 148 29 C154 30 160 30 165 31 Z"
        fill="#002244"
      />
      <path
        d="M174 41 C164 47 153 54 141 60 C149 53 156 45 161 36 C166 38 170 39 174 41 Z"
        fill="#002244"
      />

      {/* White Bronco Stallion Head & Muzzle */}
      <path
        d="M112 36 C100 42 88 50 78 59 C68 68 59 79 50 91 C43 100 35 109 26 117 C35 114 43 110 50 105 C57 99 63 92 68 85 C73 78 79 72 85 66 C87 68 89 71 90 75 C85 81 79 88 72 95 C67 100 62 106 56 111 C65 107 73 102 80 96 C86 90 92 84 96 77 C98 80 100 84 101 88 C94 96 86 103 77 110 C86 106 94 100 101 94 C106 89 110 83 114 77 C116 80 118 84 120 88 C112 96 102 103 92 110 C102 105 111 99 119 92 C125 86 130 79 134 71 C138 64 142 56 144 47 C133 45 122 41 112 36 Z"
        fill="#FFFFFF"
      />

      {/* Main Bronco Forehead, Nostril & Jaw (Summit White) */}
      <path
        d="M128 32 C116 33 104 38 94 44 C84 50 75 58 68 67 C63 73 58 80 53 87 C48 94 42 101 35 107 C30 112 24 116 17 119 C28 116 38 110 47 103 C54 97 60 90 66 82 C71 75 76 68 82 62 C85 64 87 67 89 71 C82 78 75 86 67 93 C76 89 84 84 91 77 C96 72 100 66 104 60 C107 63 110 67 112 71 C105 78 97 85 88 92 C97 88 105 82 112 76 C117 71 121 65 125 58 C131 49 135 39 136 29 C133 30 130 31 128 32 Z"
        fill="#FFFFFF"
      />

      {/* Eye Socket & Nostril Details in Midnight Navy */}
      <ellipse cx="114" cy="46" rx="6" ry="3.5" transform="rotate(-25 114 46)" fill="#002244" />
      <circle cx="115" cy="45.5" r="2.2" fill="#FB4F14" />
      <path
        d="M82 63 C80 67 76 70 72 73 C75 70 78 66 80 62 C81 62 82 62 82 63 Z"
        fill="#002244"
      />
      {/* Muzzle Snout Flare */}
      <path
        d="M48 94 C44 98 39 102 33 105 C38 101 43 97 47 92 L48 94 Z"
        fill="#002244"
      />
    </g>
  </svg>
);

/**
 * Pittsburgh Steelers Official NFL Football Logo (Scalable Vector SVG)
 * Features the famous Steelmark emblem: circular boundary with "Steelers" wordmark
 * and the three iconic hypocycloids: Yellow (coal), Red (iron ore), Blue (scrap steel).
 */
export const PittsburghSteelersLogo: React.FC<TeamLogoProps> = ({ className = '', size = 64 }) => (
  <svg
    viewBox="0 0 140 140"
    width={size}
    height={size}
    className={`drop-shadow-md select-none ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Pittsburgh Steelers Football Logo"
  >
    {/* Outer Silver / Metallic Gray Ring */}
    <circle cx="70" cy="70" r="67" fill="#C5C8C9" stroke="#101820" strokeWidth="4" />
    {/* Inner White Field */}
    <circle cx="70" cy="70" r="58" fill="#FFFFFF" />

    {/* Steelers Stencil Wordmark */}
    <g transform="translate(18, 54)">
      <text
        x="0"
        y="18"
        fontFamily="'Arial Black', Impact, sans-serif"
        fontSize="17"
        fontWeight="900"
        fontStyle="italic"
        letterSpacing="-0.5"
        fill="#101820"
      >
        Steelers
      </text>
    </g>

    {/* 1. Top-Right Hypocycloid (Yellow / Gold #FFB612) */}
    <path
      d="M 92,26 C 92,38 98,44 110,44 C 98,44 92,50 92,62 C 92,50 86,44 74,44 C 86,44 92,38 92,26 Z"
      fill="#FFB612"
      stroke="#101820"
      strokeWidth="0.8"
    />

    {/* 2. Top-Left / Middle Hypocycloid (Red #C60C30) */}
    <path
      d="M 74,58 C 74,70 80,76 92,76 C 80,76 74,82 74,94 C 74,82 68,76 56,76 C 68,76 74,70 74,58 Z"
      fill="#C60C30"
      stroke="#101820"
      strokeWidth="0.8"
    />

    {/* 3. Bottom-Right Hypocycloid (Blue #003087) */}
    <path
      d="M 92,86 C 92,98 98,104 110,104 C 98,104 92,110 92,122 C 92,110 86,104 74,104 C 86,104 92,98 92,86 Z"
      fill="#003087"
      stroke="#101820"
      strokeWidth="0.8"
    />
  </svg>
);

/**
 * Kansas City Chiefs Arrowhead Logo
 */
export const KansasCityChiefsLogo: React.FC<TeamLogoProps> = ({ className = '', size = 64 }) => (
  <svg
    viewBox="0 0 140 100"
    width={size}
    height={(size * 100) / 140}
    className={`drop-shadow-md select-none ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Kansas City Chiefs Logo"
  >
    <polygon
      points="70,5 135,50 115,92 25,92 5,50"
      fill="#E31837"
      stroke="#FFB81C"
      strokeWidth="5"
      strokeLinejoin="round"
    />
    <polygon
      points="70,12 126,50 108,86 32,86 14,50"
      fill="#FFFFFF"
    />
    <text
      x="70"
      y="62"
      textAnchor="middle"
      fontFamily="'Arial Black', Impact, sans-serif"
      fontSize="36"
      fontWeight="900"
      fill="#E31837"
      stroke="#000000"
      strokeWidth="1.5"
    >
      KC
    </text>
  </svg>
);

/**
 * Dallas Cowboys Star Logo
 */
export const DallasCowboysLogo: React.FC<TeamLogoProps> = ({ className = '', size = 64 }) => (
  <svg
    viewBox="0 0 120 120"
    width={size}
    height={size}
    className={`drop-shadow-md select-none ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Dallas Cowboys Logo"
  >
    <polygon
      points="60,6 76,42 116,42 84,66 96,104 60,80 24,104 36,66 4,42 44,42"
      fill="#003594"
      stroke="#FFFFFF"
      strokeWidth="4"
    />
    <polygon
      points="60,18 73,46 104,46 79,64 88,94 60,75 32,94 41,64 16,46 47,46"
      fill="#003594"
      stroke="#869397"
      strokeWidth="2"
    />
  </svg>
);

/**
 * Philadelphia Eagles Logo
 */
export const PhiladelphiaEaglesLogo: React.FC<TeamLogoProps> = ({ className = '', size = 64 }) => (
  <svg
    viewBox="0 0 140 100"
    width={size}
    height={(size * 100) / 140}
    className={`drop-shadow-md select-none ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Philadelphia Eagles Logo"
  >
    <path
      d="M130 50 C110 30 80 15 45 20 C25 22 10 35 5 45 C15 43 30 46 40 52 C25 55 12 65 10 75 C25 70 40 70 50 78 C38 82 25 90 20 98 C45 92 70 85 95 72 C115 62 128 55 130 50 Z"
      fill="#004C54"
      stroke="#000000"
      strokeWidth="2"
    />
    <path
      d="M45 22 C75 18 105 32 122 48 C105 52 85 58 70 68 C55 60 40 54 28 50 C38 42 48 30 45 22 Z"
      fill="#A5ACAF"
    />
    <polygon points="5,45 20,40 25,50" fill="#FFFFFF" />
    <circle cx="35" cy="40" r="3.5" fill="#FFFFFF" />
    <circle cx="35" cy="40" r="1.8" fill="#000000" />
  </svg>
);

/**
 * San Francisco 49ers Oval Logo
 */
export const SanFrancisco49ersLogo: React.FC<TeamLogoProps> = ({ className = '', size = 64 }) => (
  <svg
    viewBox="0 0 140 90"
    width={size}
    height={(size * 90) / 140}
    className={`drop-shadow-md select-none ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="San Francisco 49ers Logo"
  >
    <ellipse cx="70" cy="45" rx="66" ry="41" fill="#AA0000" stroke="#B3995D" strokeWidth="5" />
    <ellipse cx="70" cy="45" rx="60" ry="35" fill="#AA0000" stroke="#000000" strokeWidth="1.5" />
    <text
      x="70"
      y="55"
      textAnchor="middle"
      fontFamily="'Georgia', serif"
      fontSize="34"
      fontWeight="900"
      fontStyle="italic"
      fill="#FFFFFF"
      stroke="#000000"
      strokeWidth="1.2"
    >
      SF
    </text>
  </svg>
);

/**
 * Green Bay Packers 'G' Logo
 */
export const GreenBayPackersLogo: React.FC<TeamLogoProps> = ({ className = '', size = 64 }) => (
  <svg
    viewBox="0 0 130 90"
    width={size}
    height={(size * 90) / 130}
    className={`drop-shadow-md select-none ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Green Bay Packers Logo"
  >
    <ellipse cx="65" cy="45" rx="60" ry="40" fill="#203731" stroke="#FFB612" strokeWidth="6" />
    <ellipse cx="65" cy="45" rx="53" ry="33" fill="#203731" stroke="#FFFFFF" strokeWidth="2" />
    <text
      x="65"
      y="58"
      textAnchor="middle"
      fontFamily="'Arial Black', Impact, sans-serif"
      fontSize="42"
      fontWeight="900"
      fill="#FFFFFF"
    >
      G
    </text>
  </svg>
);

/**
 * Buffalo Bills Charging Buffalo Logo
 */
export const BuffaloBillsLogo: React.FC<TeamLogoProps> = ({ className = '', size = 64 }) => (
  <svg
    viewBox="0 0 140 90"
    width={size}
    height={(size * 90) / 140}
    className={`drop-shadow-md select-none ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Buffalo Bills Logo"
  >
    {/* Buffalo Silhouette in Royal Blue */}
    <path
      d="M15 45 C20 30 40 22 65 24 C85 26 110 32 125 45 C115 50 100 55 85 58 C90 68 85 78 75 80 C68 82 60 75 55 68 C45 74 35 76 25 72 C18 68 12 58 15 45 Z"
      fill="#00338D"
    />
    {/* Red Charging Laser Streak */}
    <polygon points="10,48 135,32 135,37 10,53" fill="#C60C30" />
    {/* Horn in White */}
    <path d="M110 30 C116 22 125 24 126 28 C122 30 118 32 110 30 Z" fill="#FFFFFF" />
  </svg>
);

/**
 * Colorado Avalanche Mountain 'A' Logo
 */
export const ColoradoAvalancheLogo: React.FC<TeamLogoProps> = ({ className = '', size = 64 }) => (
  <svg
    viewBox="0 0 120 120"
    width={size}
    height={size}
    className={`drop-shadow-md select-none ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Colorado Avalanche Logo"
  >
    <path
      d="M60 10 L102 96 L80 96 L68 70 L52 70 L40 96 L18 96 Z"
      fill="#6F263D"
      stroke="#000000"
      strokeWidth="3"
    />
    <polygon points="60,35 72,60 48,60" fill="#FFFFFF" />
    <path
      d="M10 88 C35 75 75 80 110 55 C90 75 55 95 15 102 Z"
      fill="#236192"
      stroke="#FFFFFF"
      strokeWidth="2"
    />
    <ellipse cx="100" cy="52" rx="10" ry="7" fill="#101820" stroke="#FFFFFF" strokeWidth="2" />
  </svg>
);

/**
 * Los Angeles Lakers Purple & Gold Emblem
 */
export const LosAngelesLakersLogo: React.FC<TeamLogoProps> = ({ className = '', size = 64 }) => (
  <svg
    viewBox="0 0 130 90"
    width={size}
    height={(size * 90) / 130}
    className={`drop-shadow-md select-none ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Los Angeles Lakers Logo"
  >
    <circle cx="65" cy="45" r="38" fill="#FDB927" stroke="#552583" strokeWidth="3" />
    <path d="M30 45 Q65 20 100 45" stroke="#552583" strokeWidth="2.5" fill="none" />
    <path d="M30 45 Q65 70 100 45" stroke="#552583" strokeWidth="2.5" fill="none" />
    <path d="M65 7 L65 83" stroke="#552583" strokeWidth="2.5" />
    <rect x="15" y="32" width="100" height="26" rx="4" fill="#552583" />
    <text
      x="65"
      y="50"
      textAnchor="middle"
      fontFamily="'Arial Black', Impact, sans-serif"
      fontSize="17"
      fontWeight="900"
      fontStyle="italic"
      fill="#FDB927"
    >
      LAKERS
    </text>
  </svg>
);

/**
 * Boston Celtics Shamrock Logo
 */
export const BostonCelticsLogo: React.FC<TeamLogoProps> = ({ className = '', size = 64 }) => (
  <svg
    viewBox="0 0 110 110"
    width={size}
    height={size}
    className={`drop-shadow-md select-none ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Boston Celtics Logo"
  >
    <circle cx="55" cy="55" r="50" fill="#007A33" stroke="#BA9653" strokeWidth="4" />
    <g fill="#FFFFFF" stroke="#007A33" strokeWidth="1">
      <circle cx="55" cy="38" r="15" />
      <circle cx="40" cy="58" r="15" />
      <circle cx="70" cy="58" r="15" />
      <path d="M52 65 Q55 90 45 96 Q56 86 58 65 Z" fill="#BA9653" />
    </g>
  </svg>
);

/**
 * Chicago Bulls Head Logo
 */
export const ChicagoBullsLogo: React.FC<TeamLogoProps> = ({ className = '', size = 64 }) => (
  <svg
    viewBox="0 0 120 110"
    width={size}
    height={(size * 110) / 120}
    className={`drop-shadow-md select-none ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Chicago Bulls Logo"
  >
    {/* Horns */}
    <path d="M20 20 C25 45 40 55 45 60 C38 52 28 35 20 20 Z" fill="#FFFFFF" stroke="#CE1141" strokeWidth="2" />
    <path d="M100 20 C95 45 80 55 75 60 C82 52 92 35 100 20 Z" fill="#FFFFFF" stroke="#CE1141" strokeWidth="2" />
    {/* Bull Face Body */}
    <polygon points="45,45 75,45 85,75 60,105 35,75" fill="#CE1141" stroke="#000000" strokeWidth="2" />
    <ellipse cx="60" cy="85" rx="16" ry="10" fill="#000000" />
    <circle cx="50" cy="62" r="4" fill="#FFFFFF" />
    <circle cx="50" cy="62" r="2" fill="#000000" />
    <circle cx="70" cy="62" r="4" fill="#FFFFFF" />
    <circle cx="70" cy="62" r="2" fill="#000000" />
  </svg>
);

/**
 * Golden State Warriors Bay Bridge Logo
 */
export const GoldenStateWarriorsLogo: React.FC<TeamLogoProps> = ({ className = '', size = 64 }) => (
  <svg
    viewBox="0 0 110 110"
    width={size}
    height={size}
    className={`drop-shadow-md select-none ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Golden State Warriors Logo"
  >
    <circle cx="55" cy="55" r="50" fill="#1D428A" stroke="#FFC72C" strokeWidth="4" />
    {/* Bay Bridge Span */}
    <path
      d="M20 80 L90 80 M55 35 L55 80 M35 50 L35 80 M75 50 L75 80"
      stroke="#FFC72C"
      strokeWidth="4"
      strokeLinecap="round"
    />
    <path d="M20 75 Q55 45 90 75" stroke="#FFC72C" strokeWidth="3" fill="none" />
  </svg>
);

/**
 * Denver Nuggets Logo
 */
export const DenverNuggetsLogo: React.FC<TeamLogoProps> = ({ className = '', size = 64 }) => (
  <svg
    viewBox="0 0 110 110"
    width={size}
    height={size}
    className={`drop-shadow-md select-none ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Denver Nuggets Logo"
  >
    <circle cx="55" cy="55" r="50" fill="#0E2240" stroke="#FEC524" strokeWidth="4" />
    {/* Mountain Peaks & Crossed Pickaxes */}
    <polygon points="55,30 75,65 35,65" fill="#FEC524" />
    <polygon points="55,30 65,48 45,48" fill="#FFFFFF" />
    <line x1="28" y1="35" x2="82" y2="85" stroke="#8B2131" strokeWidth="4" strokeLinecap="round" />
    <line x1="82" y1="35" x2="28" y2="85" stroke="#8B2131" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

/**
 * New York Yankees Interlocking NY Logo
 */
export const NewYorkYankeesLogo: React.FC<TeamLogoProps> = ({ className = '', size = 64 }) => (
  <svg
    viewBox="0 0 100 110"
    width={size}
    height={(size * 110) / 100}
    className={`drop-shadow-md select-none ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="New York Yankees Logo"
  >
    <rect width="100" height="110" rx="18" fill="#003087" />
    <path
      d="M24 30 L36 30 L46 64 L56 30 L68 30 L68 80 L56 80 L56 46 L44 80 L34 80 L24 46 L24 80 L14 80 L14 30 Z"
      fill="#FFFFFF"
    />
    <path
      d="M48 24 L62 24 L74 54 L86 24 L100 24 L82 66 L82 86 L68 86 L68 66 Z"
      fill="#FFFFFF"
      opacity="0.9"
    />
  </svg>
);

/**
 * Los Angeles Dodgers Interlocking LA Logo
 */
export const LosAngelesDodgersLogo: React.FC<TeamLogoProps> = ({ className = '', size = 64 }) => (
  <svg
    viewBox="0 0 100 100"
    width={size}
    height={size}
    className={`drop-shadow-md select-none ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Los Angeles Dodgers Logo"
  >
    <circle cx="50" cy="50" r="48" fill="#005A9C" />
    <text
      x="50"
      y="64"
      textAnchor="middle"
      fontFamily="'Arial Black', Impact, sans-serif"
      fontSize="42"
      fontWeight="900"
      fontStyle="italic"
      fill="#FFFFFF"
    >
      LA
    </text>
  </svg>
);

/**
 * Boston Red Sox Hanging Socks Logo
 */
export const BostonRedSoxLogo: React.FC<TeamLogoProps> = ({ className = '', size = 64 }) => (
  <svg
    viewBox="0 0 100 100"
    width={size}
    height={size}
    className={`drop-shadow-md select-none ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Boston Red Sox Logo"
  >
    <circle cx="50" cy="50" r="48" fill="#FFFFFF" stroke="#0C2340" strokeWidth="4" />
    {/* Hanging Red Socks */}
    <path
      d="M32 25 L45 25 L43 55 L55 65 L48 75 L30 60 Z"
      fill="#BD3039"
      stroke="#0C2340"
      strokeWidth="2"
    />
    <path
      d="M52 25 L65 25 L63 55 L75 65 L68 75 L50 60 Z"
      fill="#BD3039"
      stroke="#0C2340"
      strokeWidth="2"
    />
  </svg>
);

/**
 * Pittsburgh Penguins Skating Penguin Logo
 */
export const PittsburghPenguinsLogo: React.FC<TeamLogoProps> = ({ className = '', size = 64 }) => (
  <svg
    viewBox="0 0 110 110"
    width={size}
    height={size}
    className={`drop-shadow-md select-none ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Pittsburgh Penguins Logo"
  >
    {/* Gold Inverted Triangle */}
    <polygon points="55,95 100,20 10,20" fill="#FCB514" stroke="#101820" strokeWidth="3" />
    {/* Penguin Body */}
    <ellipse cx="55" cy="52" rx="18" ry="24" fill="#101820" />
    <ellipse cx="55" cy="54" rx="12" ry="18" fill="#FFFFFF" />
    <polygon points="46,40 55,44 46,48" fill="#FCB514" />
  </svg>
);

/**
 * Inter Miami CF Herons Crest
 */
export const InterMiamiLogo: React.FC<TeamLogoProps> = ({ className = '', size = 64 }) => (
  <svg
    viewBox="0 0 110 110"
    width={size}
    height={size}
    className={`drop-shadow-md select-none ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Inter Miami CF Logo"
  >
    <circle cx="55" cy="55" r="50" fill="#231F20" stroke="#F7B5CD" strokeWidth="4" />
    {/* Twin Interlocking Herons */}
    <path
      d="M40 75 C45 50 65 40 70 30 C65 45 55 55 50 75 Z"
      fill="#F7B5CD"
    />
    <path
      d="M70 75 C65 50 45 40 40 30 C45 45 55 55 60 75 Z"
      fill="#F7B5CD"
    />
    <circle cx="55" cy="35" r="4" fill="#F7B5CD" />
  </svg>
);

/**
 * Real Madrid Crowned Crest
 */
export const RealMadridLogo: React.FC<TeamLogoProps> = ({ className = '', size = 64 }) => (
  <svg
    viewBox="0 0 110 120"
    width={size}
    height={(size * 120) / 110}
    className={`drop-shadow-md select-none ${className}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Real Madrid Logo"
  >
    {/* Crown */}
    <path d="M35 25 L42 12 L55 22 L68 12 L75 25 Z" fill="#FEBE10" stroke="#00529F" strokeWidth="2" />
    <circle cx="55" cy="10" r="3" fill="#FEBE10" />
    {/* Round Crest */}
    <circle cx="55" cy="65" r="42" fill="#FFFFFF" stroke="#FEBE10" strokeWidth="4" />
    {/* Diagonal Sash */}
    <polygon points="25,50 85,85 75,95 15,60" fill="#00529F" />
    {/* Monogram */}
    <text
      x="55"
      y="74"
      textAnchor="middle"
      fontFamily="'Georgia', serif"
      fontSize="24"
      fontWeight="900"
      fill="#FEBE10"
    >
      MCF
    </text>
  </svg>
);

/**
 * Universal Team Logo Switcher
 * Resolves authentic vector logos for sports teams, falling back to stylish emblem
 */
export const UniversalTeamLogo: React.FC<{
  teamNameOrId: string;
  size?: number;
  className?: string;
  fallbackEmoji?: string;
  primaryColor?: string;
  secondaryColor?: string;
}> = ({
  teamNameOrId,
  size = 64,
  className = '',
  fallbackEmoji = '🏆',
  primaryColor = '#002244',
  secondaryColor = '#FB4F14',
}) => {
  const norm = (teamNameOrId || '').toLowerCase();

  // NFL Football Teams
  if (norm.includes('broncos') || norm.includes('denver broncos')) {
    return <DenverBroncosLogo size={size} className={className} />;
  }

  if (norm.includes('steelers') || norm.includes('pittsburgh steelers')) {
    return <PittsburghSteelersLogo size={size} className={className} />;
  }

  if (norm.includes('chiefs') || norm.includes('kansas city')) {
    return <KansasCityChiefsLogo size={size} className={className} />;
  }

  if (norm.includes('cowboys') || norm.includes('dallas')) {
    return <DallasCowboysLogo size={size} className={className} />;
  }

  if (norm.includes('eagles') || norm.includes('philadelphia')) {
    return <PhiladelphiaEaglesLogo size={size} className={className} />;
  }

  if (norm.includes('49ers') || norm.includes('niners') || norm.includes('san francisco')) {
    return <SanFrancisco49ersLogo size={size} className={className} />;
  }

  if (norm.includes('packers') || norm.includes('green bay')) {
    return <GreenBayPackersLogo size={size} className={className} />;
  }

  if (norm.includes('bills') || norm.includes('buffalo')) {
    return <BuffaloBillsLogo size={size} className={className} />;
  }

  // MLB Baseball Teams
  if (norm.includes('yankees') || norm.includes('new york yankees')) {
    return <NewYorkYankeesLogo size={size} className={className} />;
  }

  if (norm.includes('dodgers') || norm.includes('los angeles dodgers')) {
    return <LosAngelesDodgersLogo size={size} className={className} />;
  }

  if (norm.includes('red sox') || norm.includes('redsox') || norm.includes('boston red sox')) {
    return <BostonRedSoxLogo size={size} className={className} />;
  }

  // NBA Basketball Teams
  if (norm.includes('lakers') || norm.includes('la lakers') || norm.includes('los angeles lakers')) {
    return <LosAngelesLakersLogo size={size} className={className} />;
  }

  if (norm.includes('celtics') || norm.includes('boston celtics')) {
    return <BostonCelticsLogo size={size} className={className} />;
  }

  if (norm.includes('warriors') || norm.includes('golden state')) {
    return <GoldenStateWarriorsLogo size={size} className={className} />;
  }

  if (norm.includes('bulls') || norm.includes('chicago bulls')) {
    return <ChicagoBullsLogo size={size} className={className} />;
  }

  if (norm.includes('nuggets') || norm.includes('denver nuggets')) {
    return <DenverNuggetsLogo size={size} className={className} />;
  }

  // NHL Hockey Teams
  if (norm.includes('avalanche') || norm.includes('colorado avalanche')) {
    return <ColoradoAvalancheLogo size={size} className={className} />;
  }

  if (norm.includes('penguins') || norm.includes('pittsburgh penguins')) {
    return <PittsburghPenguinsLogo size={size} className={className} />;
  }

  // Soccer Teams
  if (norm.includes('inter miami') || norm.includes('miami cf')) {
    return <InterMiamiLogo size={size} className={className} />;
  }

  if (norm.includes('real madrid') || norm.includes('madrid')) {
    return <RealMadridLogo size={size} className={className} />;
  }

  // Generic Styled Team Roundel
  return (
    <div
      className={`relative flex items-center justify-center rounded-2xl border shadow-lg ${className}`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        borderColor: `${secondaryColor}80`,
      }}
    >
      <span style={{ fontSize: size * 0.45 }} className="drop-shadow-md">
        {fallbackEmoji}
      </span>
    </div>
  );
};
