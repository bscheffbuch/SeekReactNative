"""List the N species with the most Research Grade observations on iNaturalist.

    python fetch_species.py --n 100000          # writes species.json (~4 min per 10k species)

Each row: {id, name, rank, common, count}. Uses /v1/observations/species_counts
at iNat's requested pace of about one request per second.
"""
import argparse
import json
import os
import time

import requests

HERE = os.path.dirname( os.path.abspath( __file__ ) )


def main( ):
    ap = argparse.ArgumentParser( )
    ap.add_argument( "--n", type=int, default=100_000 )
    ap.add_argument( "--out", default=os.path.join( HERE, "species.json" ) )
    ap.add_argument( "--place-id", type=int, help="limit to an iNat place (e.g. a continent) for a regional pack" )
    args = ap.parse_args( )
    rows = json.load( open( args.out ) ) if os.path.exists( args.out ) else []
    s = requests.Session( )
    s.headers["User-Agent"] = "seek-model-pack-builder"
    page = len( rows ) // 500 + 1
    while len( rows ) < args.n:
        t0 = time.time( )
        params = {"quality_grade": "research", "per_page": 500, "page": page}
        if args.place_id:
            params["place_id"] = args.place_id
        for attempt in range( 6 ):
            try:
                r = s.get( "https://api.inaturalist.org/v1/observations/species_counts", params=params, timeout=120 )
                if r.ok:
                    break
            except requests.RequestException:
                pass
            time.sleep( 5 * ( attempt + 1 ) )
        results = r.json( )["results"]
        if not results:
            break
        rows += [{"id": x["taxon"]["id"], "name": x["taxon"]["name"], "rank": x["taxon"]["rank"],
                  "common": x["taxon"].get( "preferred_common_name" ), "count": x["count"]} for x in results]
        page += 1
        if page % 20 == 0:
            json.dump( rows, open( args.out, "w" ) )
            print( f"{len( rows )} species, last count {rows[-1]['count']}", flush=True )
        time.sleep( max( 0, 1.05 - ( time.time( ) - t0 ) ) )
    json.dump( rows[:args.n], open( args.out, "w" ) )
    print( f"wrote {min( len( rows ), args.n )} species to {args.out}" )


if __name__ == "__main__":
    main( )
