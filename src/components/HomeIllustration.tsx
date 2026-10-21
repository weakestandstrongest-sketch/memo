/**
 * The picture at the top of the memo list: a desk by the window at night — an open
 * notebook under the lamp, a mug, a sleeping cat, and a constellation outside.
 * Bold black lines and fills only, so it sits in the monochrome design.
 * (An original drawing for this app.)
 */
export function HomeIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 360 320"
      role="img"
      aria-label="夜の窓辺の机。窓の外に星座、机の上にノートとランプとマグカップ、黒い猫が丸くなって眠っている。"
      fill="none"
      stroke="#111"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* garland of paper stars */}
      <path d="M4 12 Q 78 44 156 14" strokeWidth="1.6" />
      <g strokeWidth="1.4">
        <path d="M40 27 V 40" />
        <path d="M80 31 V 50" />
        <path d="M120 25 V 30" />
      </g>
      <path d="M40 40 C 40.6 44 42 45.4 46 46 C 42 46.6 40.6 48 40 52 C 39.4 48 38 46.6 34 46 C 38 45.4 39.4 44 40 40 Z" fill="#111" />
      <path d="M80 50 C 80.7 54.6 82.4 56.3 87 57 C 82.4 57.7 80.7 59.4 80 64 C 79.3 59.4 77.6 57.7 73 57 C 77.6 56.3 79.3 54.6 80 50 Z" fill="#fff" />
      <path d="M120 30 C 120.6 34 122 35.4 126 36 C 122 36.6 120.6 38 120 42 C 119.4 38 118 36.6 114 36 C 118 35.4 119.4 34 120 30 Z" fill="#111" />

      {/* window with the night sky */}
      <rect x="184" y="10" width="150" height="140" rx="3" fill="#fff" />
      <rect x="192" y="18" width="134" height="124" fill="#111" stroke="none" />
      <g fill="#fff" stroke="none">
        <circle cx="300" cy="40" r="11" />
      </g>
      <circle cx="305" cy="36" r="9.5" fill="#111" stroke="none" />
      <g fill="#fff" stroke="none">
        <path d="M214 30 C 214.5 33.5 215.5 34.5 219 35 C 215.5 35.5 214.5 36.5 214 40 C 213.5 36.5 212.5 35.5 209 35 C 212.5 34.5 213.5 33.5 214 30 Z" />
        <path d="M240 50 C 240.4 52.6 241.4 53.6 244 54 C 241.4 54.4 240.4 55.4 240 58 C 239.6 55.4 238.6 54.4 236 54 C 238.6 53.6 239.6 52.6 240 50 Z" />
        <circle cx="274" cy="32" r="1.4" />
        <circle cx="228" cy="66" r="1.2" />
        <circle cx="314" cy="66" r="1.3" />
        <circle cx="206" cy="92" r="1.1" />
        <circle cx="296" cy="88" r="1.2" />
      </g>
      {/* a constellation: memos joined by lines */}
      <path d="M204 128 L 224 104 L 247 116 L 283 98 L 312 122" stroke="#fff" strokeWidth="1.3" />
      <path d="M247 116 L 252 136" stroke="#fff" strokeWidth="1.3" />
      <g fill="#fff" stroke="none">
        <circle cx="204" cy="128" r="2.6" />
        <circle cx="224" cy="104" r="2.2" />
        <circle cx="247" cy="116" r="3" />
        <circle cx="283" cy="98" r="2.4" />
        <circle cx="312" cy="122" r="2.8" />
        <circle cx="252" cy="136" r="2" />
      </g>
      {/* window bars and sill */}
      <rect x="257" y="18" width="4" height="124" fill="#fff" stroke="none" />
      <rect x="192" y="78" width="134" height="4" fill="#fff" stroke="none" />
      <rect x="178" y="150" width="162" height="8" rx="2" fill="#fff" />

      {/* curtains */}
      <path
        d="M160 4 L 196 4 C 191 40 197 70 188 98 C 184 112 192 132 198 160 L 168 160 C 172 132 160 112 166 98 C 172 70 158 40 160 4 Z"
        fill="#fff"
      />
      <path d="M176 10 C 174 40 180 70 176 96 M 184 112 C 186 128 188 142 190 156" strokeWidth="1.6" />
      <path d="M165 99 L 191 103" strokeWidth="3.2" />
      <path d="M330 4 L 356 4 C 352 50 358 92 350 124 C 348 136 352 148 356 160 L 336 160 C 338 146 334 134 336 124 C 340 92 334 50 330 4 Z" fill="#fff" />
      <path d="M344 12 C 342 50 346 90 342 120" strokeWidth="1.6" />

      {/* shelf with books and a plant */}
      <path d="M22 98 H 148" strokeWidth="3" />
      <path d="M34 98 V 106 M 136 98 V 106" />
      <rect x="30" y="64" width="11" height="34" rx="1.5" fill="#fff" />
      <rect x="43" y="58" width="13" height="40" rx="1.5" fill="#111" />
      <rect x="58" y="68" width="9" height="30" rx="1.5" fill="#fff" />
      <path d="M70 98 L 78 70 L 87 72 L 79 98 Z" fill="#fff" />
      <path d="M104 80 H 132 L 128 98 H 108 Z" fill="#111" />
      <path d="M118 80 C 108 70 104 58 110 48 C 119 57 121 69 118 80 Z" fill="#fff" />
      <path d="M118 80 C 124 66 132 60 142 60 C 139 71 130 78 118 80 Z" fill="#fff" />
      <path d="M117 80 C 110 76 100 76 94 82" />

      {/* desk */}
      <rect x="8" y="226" width="344" height="9" rx="2" fill="#fff" />
      <rect x="20" y="235" width="8" height="80" fill="#fff" />
      <rect x="332" y="235" width="8" height="80" fill="#fff" />
      <rect x="234" y="235" width="98" height="26" fill="#fff" />
      <path d="M273 248 H 293" strokeWidth="3" />

      {/* chair back, seen from behind */}
      <rect x="112" y="252" width="96" height="66" rx="14" fill="#111" />
      <path d="M126 262 H 194" stroke="#fff" strokeWidth="1.6" />

      {/* lamp and its light */}
      <path d="M100 182 L 122 218 M 128 170 L 168 206" strokeWidth="1.3" strokeDasharray="2 5" />
      <ellipse cx="54" cy="223" rx="18" ry="4" fill="#111" />
      <path d="M54 220 L 66 178 L 98 158" strokeWidth="3" />
      <circle cx="66" cy="178" r="3.2" fill="#fff" />
      <path d="M88 152 L 110 140 L 130 168 L 100 184 Z" fill="#111" />

      {/* open notebook with a pencil */}
      <path d="M112 224 L 172 218 L 170 194 L 118 200 Z" fill="#fff" />
      <path d="M172 218 L 232 224 L 226 200 L 170 194 Z" fill="#fff" />
      <g strokeWidth="1.4">
        <path d="M124 207 L 162 203 M 125 213 L 163 209 M 126 219 L 150 216.5" />
        <path d="M180 202 L 218 206 M 181 208 L 219 212" />
      </g>
      <path d="M190 220 L 230 205 L 233 211 L 193 226 Z" fill="#fff" strokeWidth="2" />
      <path d="M190 220 L 183 225.5 L 193 226 Z" fill="#111" strokeWidth="1.6" />

      {/* mug with steam */}
      <path d="M254 186 C 249 180 258 177 253 170 M 264 188 C 259 182 268 179 263 172" strokeWidth="1.8" />
      <rect x="246" y="194" width="27" height="31" rx="5" fill="#fff" />
      <rect x="246" y="203" width="27" height="8" fill="#111" />
      <path d="M273 200 C 284 200 284 216 273 216" />

      {/* sleeping black cat */}
      <path
        d="M286 226 C 280 214 288 198 306 196 C 328 194 350 202 350 216 C 350 224 344 226 336 226 Z"
        fill="#111"
      />
      <path d="M346 214 C 358 228 330 234 300 227" stroke="#111" strokeWidth="7" />
      <circle cx="295" cy="206" r="11" fill="#111" />
      <path d="M287 199 L 288 186 L 296 196 Z M 298 195 L 305 185 L 306 199 Z" fill="#111" />
      <path d="M289 206 Q 292 208.5 295 206 M 297.5 205 Q 300.5 207.5 303.5 205" stroke="#fff" strokeWidth="1.4" />

      {/* floor */}
      <path d="M2 316 H 112 M 208 316 H 358" strokeWidth="1.6" />
    </svg>
  );
}
