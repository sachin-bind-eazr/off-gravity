# Credits

## India map boundary (`public/data/india.topo.json`)
- Source: DataMeet "maps" repository, `Survey-of-India-Index-Maps/Boundaries/India-States` (state boundaries compiled from Survey of India / Census of India data).
  https://github.com/datameet/maps/tree/master/Survey-of-India-Index-Maps/Boundaries
- Licence: CC BY-SA 2.5 / ODbL (see https://github.com/datameet/maps). Attribution required; derived data (the simplified TopoJSON) is shared under the same terms.
- The outline follows India's official depiction (Jammu & Kashmir, Ladakh and Arunachal Pradesh shown in full). Natural Earth / world-atlas data is deliberately NOT used.
- Processing: `scripts/map-build.sh` (mapshaper: simplify, quantize, TopoJSON). Rebuild: download the four `India-States.*` files into a folder and run `sh scripts/map-build.sh <folder>`.

## Story panels 01-03 ("What is OFF GRAVITY")
All photos: Pexels Licence (free to use, no attribution required; credited here anyway). Edits for all: cropped to 16:10, resized to 2000x1250 (no upscaling), mild warm-daylight channel grade + 3% saturation, no tint/duotone; script `scripts/story-photos.mjs`. Shown with an "Illustrative image" caption.
- `public/images/story/01-timed-racing.jpg` (+ `-sm.jpg`): "Strong sportsmen ready for running on stadium" (Pexels photo 3764011), photographer: Andrea Piacquadio, https://www.pexels.com/photo/strong-sportsmen-ready-for-running-on-stadium-3764011/ . Panel 01 Timed racing. Cropped to 16:10 from 2400x1645 (top offset 120), same grade. Replaces Pexels 19787364 (visible FeiLu logo on lane boxes, Nike marks).
- `public/images/story/02-live-leaderboards.jpg` (+ `-sm.jpg`): "Professional athletes watching video on smartphone" (Pexels photo 3763870), photographer: Andrea Piacquadio, https://www.pexels.com/photo/professional-athletes-watching-video-on-smartphone-3763870/ . Panel 02 Live leaderboards (athletes checking times on a phone; stand-in, no results screen).
- `public/images/story/03-family-wave.jpg` (+ `-sm.jpg`): "Joyful Mother Lifting Happy Child Outdoors" (Pexels photo 32575092), photographer: Bhola Chourasia, https://www.pexels.com/photo/joyful-mother-lifting-happy-child-outdoors-32575092/ . Panel 03 Family wave. Cropped to 16:10 from the 4000x6000 portrait original (top offset 1150), same grade. Replaces Pexels 34081285 (third-party shirt text/adidas marks).

## Story panels 04-06 (public/images/story/)
Pexels licence (free to use, no attribution required; credited anyway). All stock, shown with "Illustrative image" caption.
- 04 Glow Night (`04-glow-night.jpg`): "People Raising Hands in Front of the Stage" (Pexels photo 8448579), photographer Daniel Nouri, https://www.pexels.com/photo/people-raising-hands-in-front-of-the-stage-8448579/ . Replaces the earlier Jeremy Li photo (30169355). Edits: cropped to 16:10 from 5184x3456 original, resized to 2000x1250, no colour grade (night colours kept); `scripts/story-photos.mjs` (last block).
- 05 Recovery village (`05-recovery-village.jpg`): "A large group stretching exercise outdoors in a sunny park", photographer Yazid N, https://www.pexels.com/photo/40139106/ . Edits: cropped to 16:10, resized to 2000px wide, mild warm-daylight grade (+3% saturation, slight warm channel balance).
- 06 Game layer (`06-game-layer.jpg`): "Focused man tackling outdoor obstacle course with wooden rings in action", photographer Cristian Camilo Estrada, https://www.pexels.com/photo/33610895/ . Edits: cropped to 16:10 from portrait original, resized to 2000px wide, same mild warm-daylight grade as 05.
