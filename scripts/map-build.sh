#!/bin/sh
# Rebuild public/data/india.topo.json from the DataMeet copy of the Survey of India state boundaries.
# usage: scripts/map-build.sh <dir containing India-States.shp/.dbf/.prj/.shx>
set -e
npx mapshaper -i "$1/India-States.shp" -rename-layers states -filter-fields ST_NM -rename-fields name=ST_NM \
  -simplify weighted ${SIMPLIFY:-3%} keep-shapes -o format=topojson quantization=8000 public/data/india.topo.json
