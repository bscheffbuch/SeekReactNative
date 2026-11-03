"""Top-1 species accuracy of pack models on the benchmark photos, fed exactly like the
Android plugin (centre square crop, 299x299 bilinear, raw 0-255, column-major).

    python eval_tflite.py --pack packs/bioclip2-100k --images images/ \\
        model_fp32.tflite model.tflite model_npu.tflite

The first model is the reference: every other model also reports how often its top-1
matches the reference's. --per-group 40 gives the 400-photo set used in HANDOFF.md.
"""
import argparse
import csv
import json
import os
import random
import time

import numpy as np
from PIL import Image
from ai_edge_litert.interpreter import Interpreter

HERE = os.path.dirname( os.path.abspath( __file__ ) )


def plugin_input( path ):
    im = Image.open( path ).convert( "RGB" )
    w, h = im.size
    s = min( w, h )
    im = im.crop( ( ( w - s ) // 2, ( h - s ) // 2, ( w - s ) // 2 + s, ( h - s ) // 2 + s ) )
    im = im.resize( ( 299, 299 ), Image.BILINEAR )
    return np.asarray( im, dtype=np.float32 ).transpose( 1, 0, 2 )[None]


def leaf_ids( pack ):
    """Model output index -> taxon id, from the pack's taxonomy.csv (leaf rows in order)."""
    with open( os.path.join( pack, "taxonomy.csv" ), newline="", encoding="utf8" ) as f:
        rows = list( csv.DictReader( f ) )
    leaves = sorted( ( r for r in rows if r.get( "leaf_class_id" ) not in ( None, "" ) ),
                     key=lambda r: int( r["leaf_class_id"] ) )
    return np.array( [int( r["taxon_id"] ) for r in leaves] )


def main( ):
    ap = argparse.ArgumentParser( description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter )
    ap.add_argument( "models", nargs="+" )
    ap.add_argument( "--pack", required=True, help="pack folder with taxonomy.csv" )
    ap.add_argument( "--images", default=os.path.join( HERE, "images" ) )
    ap.add_argument( "--per-group", type=int, default=40 )
    ap.add_argument( "--threads", type=int, default=4 )
    args = ap.parse_args( )

    ids = leaf_ids( args.pack )
    groups = json.load( open( os.path.join( HERE, "observations_random.json" ) ) )
    random.seed( 0 )
    sample = []
    for rows in groups.values( ):
        rows = [o for o in rows if o.get( "species_id" )
                and os.path.exists( os.path.join( args.images, f"{o['obs_id']}.jpg" ) )]
        sample += random.sample( rows, min( args.per_group, len( rows ) ) )
    res = {}
    for m in args.models:
        it = Interpreter( model_path=m, num_threads=args.threads )
        it.allocate_tensors( )
        inp = it.get_input_details( )[0]["index"]
        out = it.get_output_details( )[0]["index"]
        preds = []
        t0 = time.time( )
        for o in sample:
            it.set_tensor( inp, plugin_input( os.path.join( args.images, f"{o['obs_id']}.jpg" ) ) )
            it.invoke( )
            preds.append( int( ids[int( np.argmax( it.get_tensor( out )[0] ) )] ) )
        acc = np.mean( [p == o["species_id"] for p, o in zip( preds, sample )] )
        res[m] = preds
        print( f"{os.path.basename( m )}: top-1 {acc:.3f} on {len( sample )} photos, "
               f"{( time.time( ) - t0 ) / len( sample ):.2f} s/photo, {os.path.getsize( m ) / 1e6:.0f} MB", flush=True )
    ref = res[args.models[0]]
    for m in args.models[1:]:
        same = np.mean( [x == y for x, y in zip( ref, res[m] )] )
        print( f"same top-1 as {os.path.basename( args.models[0] )}: {os.path.basename( m )} {same:.3f}", flush=True )


if __name__ == "__main__":
    main( )
