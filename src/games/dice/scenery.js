// Vector scenery stays crisp on tablets; decorations sit between the trail's rows.
const trail = 'M44 414Q44 380 80 380H520C576 380 576 300 520 300H80C24 300 24 220 80 220H520C576 220 576 140 520 140H80C24 140 24 60 80 60H520';
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 440" fill="none">
<defs>
  <linearGradient id="grass" x2="0" y2="1"><stop stop-color="#d7e7ca"/><stop offset="1" stop-color="#edf0d8"/></linearGradient>
  <g id="tree"><ellipse cy="14" rx="18" ry="5" fill="#608750" opacity=".16"/><path d="M0-8V12" stroke="#a68058" stroke-width="5" stroke-linecap="round"/><path d="m0 1-7-6m7 2 8-7" stroke="#a68058" stroke-width="3"/><circle cx="-9" cy="-15" r="12" fill="#86ac73"/><circle cx="9" cy="-18" r="13" fill="#6f9d68"/><circle cy="-28" r="14" fill="#93b981"/><circle cx="-4" cy="-31" r="5" fill="#b6cf97" opacity=".7"/></g>
  <g id="shrub"><ellipse cy="4" rx="20" ry="7" fill="#b6ce95"/><circle cx="-10" r="8" fill="#91b47f"/><circle cy="-4" r="11" fill="#a8c58b"/><circle cx="12" cy="1" r="8" fill="#81a975"/><circle cx="-4" cy="-7" r="2" fill="#e8c0b2"/><circle cx="9" cy="-1" r="2" fill="#f4d68b"/></g>
  <g id="mushroom"><path d="M-3 0-4 12Q0 15 4 12L3 0" fill="#fff3d5"/><path d="M-12 1Q-10-15 0-14Q10-15 12 1Z" fill="#ce8063"/><circle cx="-5" cy="-5" r="2.4" fill="#fff2d7"/><circle cx="4" cy="-8" r="2" fill="#fff2d7"/><path d="M-10 2H10" stroke="#a75e4a" stroke-width="2" stroke-linecap="round"/></g>
  <g id="flower"><path d="M0 0V10" stroke="#80a46a" stroke-width="2"/><g fill="#f3cc9b"><circle cx="-4" r="3.6"/><circle cx="4" r="3.6"/><circle cy="-4" r="3.6"/><circle cy="4" r="3.6"/></g><circle r="2.7" fill="#dba860"/></g>
  <g id="butterfly"><ellipse cx="-5" cy="-3" rx="5" ry="7" transform="rotate(-25)" fill="#ddad9e"/><ellipse cx="5" cy="-3" rx="5" ry="7" transform="rotate(25)" fill="#efd0a7"/><path d="M0-6V5" stroke="#aa846c" stroke-width="2" stroke-linecap="round"/></g>
</defs>
<rect width="600" height="440" rx="32" fill="url(#grass)"/>
<path d="M0 0H600V48Q490 20 410 47T200 42T0 50Z" fill="#bed5ae" opacity=".6"/>
<path d="M0 365Q100 330 190 389T400 396T600 358V440H0Z" fill="#d9e5bf"/>
<ellipse cx="180" cy="261" rx="42" ry="15" fill="#bdd7c6"/><ellipse cx="180" cy="259" rx="35" ry="10" fill="#cce5d9"/><path d="M165 258h16m7 5h10" stroke="#eff6e4" stroke-width="2" stroke-linecap="round"/>
<path d="${trail}" stroke="#b2c59e" stroke-width="44" stroke-linecap="round"/>
<path d="${trail}" stroke="#fff1cd" stroke-width="35" stroke-linecap="round"/>
<path d="${trail}" stroke="#ddc79b" stroke-width="2" stroke-dasharray="3 9" stroke-linecap="round"/>
<g opacity=".95">
<use href="#tree" transform="translate(85 30) scale(.75)"/><use href="#tree" transform="translate(125 34) scale(.55)"/>
<use href="#tree" transform="translate(223 116) scale(.78)"/><use href="#tree" transform="translate(257 115) scale(.57)"/>
<use href="#tree" transform="translate(422 195) scale(.8)"/><use href="#tree" transform="translate(458 194) scale(.58)"/>
<use href="#tree" transform="translate(337 277) scale(.82)"/><use href="#tree" transform="translate(373 277) scale(.62)"/>
<use href="#tree" transform="translate(168 355) scale(.75)"/><use href="#tree" transform="translate(202 354) scale(.55)"/>
<use href="#tree" transform="translate(490 432) scale(.68)"/><use href="#tree" transform="translate(523 430) scale(.5)"/>
</g>
<use href="#shrub" transform="translate(134 106)"/><use href="#shrub" transform="translate(345 190) scale(.8)"/><use href="#shrub" transform="translate(463 269)"/><use href="#shrub" transform="translate(411 346)"/><use href="#shrub" transform="translate(290 422)"/>
<use href="#mushroom" transform="translate(378 106) scale(.8)"/><use href="#mushroom" transform="translate(396 111) scale(.5)"/>
<use href="#mushroom" transform="translate(111 188) scale(.7)"/><use href="#mushroom" transform="translate(283 350) scale(.8)"/>
<use href="#flower" transform="translate(305 107) scale(.8)"/><use href="#flower" transform="translate(319 109) scale(.6)"/><use href="#flower" transform="translate(480 108) scale(.7)"/>
<use href="#flower" transform="translate(247 190) scale(.7)"/><use href="#flower" transform="translate(262 193) scale(.5)"/><use href="#flower" transform="translate(95 271) scale(.8)"/>
<use href="#flower" transform="translate(352 348) scale(.8)"/><use href="#flower" transform="translate(367 350) scale(.6)"/>
<use href="#butterfly" transform="translate(186 184) rotate(-15) scale(.7)"/><use href="#butterfly" transform="translate(445 100) rotate(15) scale(.65)"/>
<g transform="translate(410 25)"><path d="M-17-7H17V14H-17Z" fill="#dfbd88"/><path d="m-24-7 24-18 24 18Z" fill="#b47760"/><path d="M-5 14V1a5 5 0 0 1 10 0v13" fill="#876d51"/><circle cx="-11" cy="1" r="3" fill="#fff1bf"/></g>
</svg>`;

export const forestBackground = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
