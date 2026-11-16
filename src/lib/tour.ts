/** Static tour definition used by the seed and as a typed fallback for UI. Source: ref-02. */
export type CityKey = "mumbai"|"bengaluru"|"delhi"|"chandigarh"|"jaipur"|"satara";
export const TOUR = [
 {slug:"mumbai",city:"Mumbai",code:"MUM",season:1,start:"2027-01-30",end:"2027-01-31",tag:"Tour opener",colour:"mint",lat:19.076,lng:72.8777},
 {slug:"bengaluru",city:"Bengaluru",code:"BLR",season:1,start:"2027-02-20",end:"2027-02-21",tag:null,colour:"lilac",lat:12.9716,lng:77.5946},
 {slug:"delhi",city:"Delhi",code:"DEL",season:1,start:"2027-03-06",end:"2027-03-07",tag:null,colour:"cobalt",lat:28.6139,lng:77.209},
 {slug:"chandigarh",city:"Chandigarh",code:"CHD",season:2,start:"2027-04-03",end:"2027-04-04",tag:null,colour:"white",lat:30.7333,lng:76.7794},
 {slug:"jaipur",city:"Jaipur",code:"JAI",season:2,start:"2027-04-10",end:"2027-04-11",tag:"Evening edition",colour:"night",lat:26.9124,lng:75.7873},
 {slug:"satara",city:"Satara",code:"STR",season:2,start:"2027-04-24",end:"2027-04-25",tag:"Season finale",colour:"ink",lat:17.6805,lng:74.0183},
] as const;
export const DISCLAIMER = "Dates are provisional, subject to venue and permission confirmations.";
export const EXPERIENCES = ["race","movement","recovery","bazaar","family","glow"] as const;
