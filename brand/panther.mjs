// Generates every Panther SVG from shared parts. Run: node brand/panther.mjs
import { writeFileSync, mkdirSync } from 'node:fs';

const C = { ink: '#0E1330', inkLift: '#1A2160', indigo: '#4457E6', indigoDeep: '#2F3DB8', lav: '#C9CFFF', cyan: '#3DD9E8', white: '#EEF0FF', amber: '#FFB547' };

// Left half of the head, mirrored for the right. Ears are sharp, jaw has a soft cheek ruff.
const HALF = 'M512 322 Q462 322 416 338 L292 186 L222 458 Q212 630 322 748 Q418 850 512 850 Z';
const EAR_IN = 'M298 266 L378 346 L258 424 Z';
const mirror = (inner) => `<g>${inner}</g><g transform="translate(1024 0) scale(-1 1)">${inner}</g>`;
const head = (fill, inner = C.inkLift) => mirror(`<path d="${HALF}" fill="${fill}" stroke="${fill}" stroke-width="2"/><path d="${EAR_IN}" fill="${inner}"/>`);

// Eyes (left; mirrored). Outer corner raised for a calm, watchful look.
const rim = () => mirror(`<path d="${HALF}" fill="${C.lav}" stroke="${C.lav}" stroke-width="30" stroke-linejoin="round"/>`);
const eyesOpen = (col = C.cyan, hl = C.white) => mirror(`<path d="M298 534 Q392 468 486 574 Q382 618 298 534 Z" fill="${col}"/><ellipse cx="398" cy="550" rx="17" ry="38" fill="${C.ink}"/><circle cx="424" cy="526" r="12" fill="${hl}"/>`);
const eyesAlert = () => mirror(`<ellipse cx="392" cy="548" rx="78" ry="70" fill="${C.amber}"/><ellipse cx="392" cy="548" rx="17" ry="44" fill="${C.ink}"/><circle cx="420" cy="522" r="13" fill="${C.white}"/>`);
const eyesHappy = () => mirror(`<path d="M322 566 Q392 478 462 566" fill="none" stroke="${C.cyan}" stroke-width="34" stroke-linecap="round"/>`);
const eyesSleepy = () => mirror(`<path d="M322 534 Q392 590 462 534" fill="none" stroke="${C.cyan}" stroke-width="30" stroke-linecap="round" opacity="0.9"/>`);
const nose = (c = C.lav) => `<path d="M476 672 H548 L512 716 Z" fill="${c}"/><path d="M512 716 V742" stroke="${c}" stroke-width="14" stroke-linecap="round"/>` +
  mirror(`<path d="M512 742 Q492 768 462 756" fill="none" stroke="${c}" stroke-width="14" stroke-linecap="round"/>`);
const smile = () => nose() + '';

const grad = `<defs><linearGradient id="t" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5468F2"/><stop offset="1" stop-color="${C.indigoDeep}"/></linearGradient></defs>`;
const svg = (body, bg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">${grad}${bg ? `<rect width="1024" height="1024" fill="${bg}"/>` : ''}${body}</svg>\n`;
const head2 = (eyes) => head(C.ink) + eyes + nose();
const scaled = (s, body) => `<g transform="translate(512 512) scale(${s}) translate(-512 -540)">${body}</g>`;
const w = (p, s) => writeFileSync(p, s);

mkdirSync('brand/panther', { recursive: true });
w('brand/panther/icon.svg', svg(head2(eyesOpen()), 'url(#t)'));
// iOS dark: lifted head on a night tile so it doesn't vanish on a dark home screen.
w('brand/panther/icon-dark.svg', svg(head('#252E80', '#3A45AA') + eyesOpen() + nose(C.lav), '#0A0E26'));
// Android adaptive: scaled to stay inside the 66% safe zone, solid indigo layer behind.
w('brand/panther/adaptive-fg.svg', svg(scaled(0.7, head2(eyesOpen()))));
w('brand/panther/adaptive-bg.svg', svg('', C.indigo));
w('brand/panther/adaptive-preview.svg', svg(scaled(0.7, head2(eyesOpen())), C.indigo));
// Monochrome: alpha-only silhouette with eyes and nose cut out.
const monoMask = `<mask id="m"><rect width="1024" height="1024" fill="#000"/><g fill="#fff">${mirror(`<path d="${HALF}"/>`)}</g><g fill="#000">${mirror('<path d="M298 534 Q392 468 486 574 Q382 618 298 534 Z"/>')}<path d="M476 672 H548 L512 716 Z"/></g></mask>`;
w('brand/panther/mono.svg', svg(scaled(0.7, `${monoMask}<rect width="1024" height="1024" fill="#fff" mask="url(#m)"/>`)));
w('brand/panther/mono-preview.svg', svg(scaled(0.7, `${monoMask}<rect width="1024" height="1024" fill="#fff" mask="url(#m)"/>`), '#6B6F80'));
// Mascot poses: transparent background.
w('brand/panther/pose-neutral.svg', svg(rim() + head2(eyesOpen())));
w('brand/panther/pose-alert.svg', svg(rim() + head(C.ink) + eyesAlert() + nose()));
w('brand/panther/pose-happy.svg', svg(rim() + head(C.ink) + eyesHappy() + nose()));
w('brand/panther/pose-sleepy.svg', svg(rim() + head(C.ink) + eyesSleepy() + nose()));
console.log('ok');
