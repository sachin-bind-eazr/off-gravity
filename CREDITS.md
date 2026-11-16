# Credits

## India map boundary (`public/data/india.topo.json`)
- Source: DataMeet "maps" repository, `Survey-of-India-Index-Maps/Boundaries/India-States` (state boundaries compiled from Survey of India / Census of India data).
  https://github.com/datameet/maps/tree/master/Survey-of-India-Index-Maps/Boundaries
- Licence: CC BY-SA 2.5 / ODbL (see https://github.com/datameet/maps). Attribution required; derived data (the simplified TopoJSON) is shared under the same terms.
- The outline follows India's official depiction (Jammu & Kashmir, Ladakh and Arunachal Pradesh shown in full). Natural Earth / world-atlas data is deliberately NOT used.
- Processing: `scripts/map-build.sh` (mapshaper: simplify, quantize, TopoJSON). Rebuild: download the four `India-States.*` files into a folder and run `sh scripts/map-build.sh <folder>`.
