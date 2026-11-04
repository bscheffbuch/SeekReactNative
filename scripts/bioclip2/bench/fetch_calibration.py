"""Download calibration photos for static (activation) quantization.

Research-grade iNaturalist observations observed before 2026-06-30, spread over the
same ten iconic groups as the benchmark, one photo per observation and at most one
observation per species. Benchmark observations are excluded, so calibration never
sees a test photo. API calls and downloads are throttled to 1 request/second.

    python fetch_calibration.py --per-group 30 --out calibration/
"""
import argparse
import json
import os
import random
import time

import requests

HERE = os.path.dirname( os.path.abspath( __file__ ) )
API = "https://api.inaturalist.org/v1/observations"


def throttle( t0 ):
    time.sleep( max( 0, 1.05 - ( time.time( ) - t0 ) ) )


def main( ):
    ap = argparse.ArgumentParser( description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter )
    ap.add_argument( "--out", default=os.path.join( HERE, "calibration" ) )
    ap.add_argument( "--per-group", type=int, default=30 )
    ap.add_argument( "--observed-before", default="2026-06-29", help="last observation date (inclusive)" )
    ap.add_argument( "--seed", type=int, default=1 )
    args = ap.parse_args( )
    os.makedirs( os.path.join( args.out, "images" ), exist_ok=True )
    bench = json.load( open( os.path.join( HERE, "observations_random.json" ) ) )
    bench_ids = {o["obs_id"] for g in bench.values( ) for o in g}
    list_path = os.path.join( args.out, "observations.json" )
    rows = json.load( open( list_path ) ) if os.path.exists( list_path ) else []
    rng = random.Random( args.seed )
    s = requests.Session( )
    s.headers["User-Agent"] = "seek-model-pack-builder (calibration photos)"

    for group in bench:
        have = [r for r in rows if r["group"] == group]
        species = {r["species_id"] for r in rows}
        tries = 0
        while len( have ) < args.per_group and tries < 12:
            tries += 1
            t0 = time.time( )
            # a random id ceiling spreads the picks over years of observations
            params = {"quality_grade": "research", "iconic_taxa": group, "d2": args.observed_before,
                      "photos": "true", "rank": "species", "per_page": 200, "order_by": "id",
                      "order": "desc", "id_below": rng.randint( 5_000_000, 330_000_000 )}
            try:
                r = s.get( API, params=params, timeout=60 )
            except requests.RequestException as e:
                # dropped connection or timeout: wait, then try another page
                print( f"{group}: {e}", flush=True )
                time.sleep( 10 )
                continue
            throttle( t0 )
            if r.status_code in ( 403, 429 ):
                raise SystemExit( f"iNaturalist refused the request (HTTP {r.status_code}); stopping" )
            if not r.ok:
                print( f"{group}: HTTP {r.status_code}", flush=True )
                continue
            results = r.json( )["results"]
            rng.shuffle( results )
            picked = 0
            for o in results:
                taxon = o.get( "taxon" ) or {}
                if o["id"] in bench_ids or taxon.get( "id" ) in species or not o.get( "photos" ):
                    continue
                rows.append( {"obs_id": o["id"], "group": group, "species_id": taxon["id"],
                              "photo_url": o["photos"][0]["url"], "observed_on": o.get( "observed_on" )} )
                species.add( taxon["id"] )
                have.append( rows[-1] )
                picked += 1
                if len( have ) >= args.per_group or picked >= 10:
                    break  # at most 10 picks per page, so photos come from several periods
        print( f"{group}: {len( have )}", flush=True )
        json.dump( rows, open( list_path, "w" ), indent=1 )

    for o in rows:
        path = os.path.join( args.out, "images", f"{o['obs_id']}.jpg" )
        if os.path.exists( path ):
            continue
        t0 = time.time( )
        try:
            r = s.get( o["photo_url"].replace( "square", "medium" ), timeout=60 )
            r.raise_for_status( )
            open( path, "wb" ).write( r.content )
        except requests.RequestException as e:
            print( f"skip {o['obs_id']}: {e}", flush=True )
        throttle( t0 )
    print( f"{len( rows )} calibration photos in {args.out}" )


if __name__ == "__main__":
    main( )
