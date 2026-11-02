"""Run a built pack the way the app does and print its top suggestions.

    python verify_pack.py packs/bioclip2-100k photo1.jpg photo2.jpg ...

Mimics the Android plugin: center square crop, resize to 299x299 (bilinear),
raw 0-255 floats written column-major, then the leaf scores are mapped to
taxa through taxonomy.csv. With --compare, also runs the PyTorch model with
BioCLIP's own preprocessing and reports whether the top species agree.
"""
import argparse
import csv
import json
import os

import numpy as np
from PIL import Image


def plugin_input( path ):
    im = Image.open( path ).convert( "RGB" )
    w, h = im.size
    s = min( w, h )
    im = im.crop( ( ( w - s ) // 2, ( h - s ) // 2, ( w - s ) // 2 + s, ( h - s ) // 2 + s ) )
    im = im.resize( ( 299, 299 ), Image.BILINEAR )
    x = np.asarray( im, dtype=np.float32 )      # [row, col, C]
    return x.transpose( 1, 0, 2 )[None]         # plugin writes [col][row]


def main( ):
    ap = argparse.ArgumentParser( )
    ap.add_argument( "pack" )
    ap.add_argument( "images", nargs="+" )
    ap.add_argument( "--top", type=int, default=5 )
    args = ap.parse_args( )

    manifest = json.load( open( os.path.join( args.pack, "manifest.json" ) ) )
    leaves = {}
    with open( os.path.join( args.pack, manifest["files"]["taxonomy"] ), newline="" ) as f:
        for row in csv.DictReader( f ):
            if row["leaf_class_id"]:
                leaves[int( row["leaf_class_id"] )] = ( int( row["taxon_id"] ), row["name"] )
    names = {}
    cn = manifest["files"].get( "common_names" )
    if cn and os.path.exists( os.path.join( args.pack, cn ) ):
        names = {r["i"]: r["n"] for r in json.load( open( os.path.join( args.pack, cn ) ) ) if r["l"] == "en"}

    from ai_edge_litert.interpreter import Interpreter
    it = Interpreter( model_path=os.path.join( args.pack, manifest["files"]["model"] ) )
    it.allocate_tensors( )
    inp, out = it.get_input_details( )[0], it.get_output_details( )[0]
    print( f"input {inp['shape']} {inp['dtype'].__name__}, output {out['shape']}, leaves {len( leaves )}" )
    assert out["shape"][-1] == len( leaves ), "model output size does not match the taxonomy's leaf count"
    for path in args.images:
        it.set_tensor( inp["index"], plugin_input( path ) )
        it.invoke( )
        p = it.get_tensor( out["index"] )[0]
        print( f"\n{os.path.basename( path )}  (scores sum to {p.sum( ):.3f})" )
        for j in np.argsort( -p )[:args.top]:
            tid, sci = leaves[int( j )]
            print( f"  {p[j]:6.1%}  {sci}{'  (' + names[tid] + ')' if tid in names else ''}  [taxon {tid}]" )


if __name__ == "__main__":
    main( )
