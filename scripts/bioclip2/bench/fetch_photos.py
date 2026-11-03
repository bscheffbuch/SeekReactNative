"""Download the benchmark photos listed in observations_random.json.

1,000 random research-grade iNaturalist observations created July-October 2026 (after
every training cutoff we use), stratified by iconic group. Photos are openly licensed
(the license is in each row). Downloads are throttled to 1 request/second.

    python fetch_photos.py --out images/
"""
import argparse
import json
import os
import time

import requests

HERE = os.path.dirname( os.path.abspath( __file__ ) )


def main( ):
    ap = argparse.ArgumentParser( description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter )
    ap.add_argument( "--out", default=os.path.join( HERE, "images" ) )
    args = ap.parse_args( )
    os.makedirs( args.out, exist_ok=True )
    groups = json.load( open( os.path.join( HERE, "observations_random.json" ) ) )
    rows = [o for g in groups.values( ) for o in g if o.get( "photo_url" )]
    session = requests.Session( )
    session.headers["User-Agent"] = "seek-model-benchmark (photo fetch)"
    for n, o in enumerate( rows ):
        path = os.path.join( args.out, f"{o['obs_id']}.jpg" )
        if os.path.exists( path ):
            continue
        t0 = time.time( )
        url = o["photo_url"].replace( "square", "medium" )
        for attempt in range( 4 ):
            try:
                r = session.get( url, timeout=60 )
                r.raise_for_status( )
                open( path, "wb" ).write( r.content )
                break
            except requests.RequestException as e:
                print( f"retry {attempt + 1} {o['obs_id']}: {e}", flush=True )
                time.sleep( 2 ** attempt )
        if n % 100 == 0:
            print( f"{n}/{len( rows )}", flush=True )
        time.sleep( max( 0, 1.0 - ( time.time( ) - t0 ) ) )


if __name__ == "__main__":
    main( )
