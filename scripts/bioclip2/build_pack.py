"""Build a Seek model pack from BioCLIP 2.

    python build_pack.py --out packs/bioclip2-100k            # everything, 100k species
    python build_pack.py --out packs/eu --species 30000       # smaller pack
    python build_pack.py --out packs/x --skip-model           # taxonomy/names only (fast)

Outputs, in --out:
  model.tflite        BioCLIP 2 image encoder + a 100k-way species head, taking the
                      vision plugin's input as-is: float32 [1, 299, 299, 3], raw 0-255
                      RGB, written column-major (the plugin fills the buffer x-outer,
                      y-inner). Inside the model: undo that transpose, resize to 224,
                      CLIP-normalize, encode, cosine against every species' text
                      embedding (x100, BioCLIP's logit scale), add a popularity prior
                      gamma * log(observation count), softmax -> [1, N].
  taxonomy.csv        the plugin's taxonomy format with every ancestor from iNat's
                      taxonomy, so predictions carry real iNat taxon/ancestor ids
                      (iconic taxa, badges and challenges keep working).
  common_names.json   [{i, l, n}] rows like utility/commonNames (English by default;
                      --locales de,fr adds more through the iNat API).
  manifest.json       what the app reads (utility/modelPacks.ts).

A GPU makes the text encoding (100k prompts) take minutes instead of hours.
The species list comes from fetch_species.py.
"""
import argparse
import csv
import json
import os
import sys
import time
from datetime import date

import numpy as np

HERE = os.path.dirname( os.path.abspath( __file__ ) )
RANKS = ["kingdom", "phylum", "class", "order", "family", "genus"]
LIFE = 48460  # the plugin creates the Life root itself
TAXA_URL = "https://inaturalist-open-data.s3.amazonaws.com/taxa.csv.gz"


def load_taxa( path ):
    """iNat open-data taxa.csv: taxon_id, ancestry, rank_level, rank, name, active."""
    if not os.path.exists( path ):
        import requests
        print( f"downloading {TAXA_URL}", flush=True )
        r = requests.get( TAXA_URL, timeout=600 )
        r.raise_for_status( )
        open( path, "wb" ).write( r.content )  # requests already undoes the gzip transfer encoding
    taxa = {}
    with open( path, newline="", encoding="utf8" ) as f:
        for row in csv.DictReader( f, delimiter="\t" ):
            taxa[int( row["taxon_id"] )] = {
                "ancestry": [int( a ) for a in ( row["ancestry"] or "" ).split( "/" ) if a],
                "rank_level": float( row["rank_level"] or 0 ),
                "rank": row["rank"],
                "name": row["name"],
            }
    return taxa


def species_list( path, limit ):
    rows = json.load( open( path ) )
    # leaves must be species-level: a genus/complex in the list could also be an
    # ancestor of another leaf, which the plugin's rollup can't represent
    rows = [r for r in rows if r["rank"] in ( "species", "hybrid" )]
    return rows[:limit]


def prompt( sp, taxa ):
    lineage = {}
    for a in taxa.get( sp["id"], {} ).get( "ancestry", [] ):
        t = taxa.get( a )
        if t and t["rank"] in RANKS:
            lineage[t["rank"]] = t["name"]
    words = " ".join( lineage[r] for r in RANKS if r in lineage )
    epithet = sp["name"].split( " ", 1 )[1] if " " in sp["name"] else sp["name"]
    text = f"a photo of {words} {epithet}".strip( ) if words else f"a photo of {sp['name']}"
    if sp.get( "common" ):
        text += f" with common name {sp['common']}"
    return text + "."


def write_taxonomy( species, taxa, path ):
    leaf_of = {sp["id"]: i for i, sp in enumerate( species )}
    nodes = {}
    for sp in species:
        chain = [a for a in taxa.get( sp["id"], {} ).get( "ancestry", [] ) if a != LIFE] + [sp["id"]]
        for depth, tid in enumerate( chain ):
            if tid in nodes:
                continue
            parent = chain[depth - 1] if depth > 0 else ""
            t = taxa.get( tid, {"rank_level": 10.0, "name": sp["name"]} )
            nodes[tid] = ( parent, t["rank_level"], t["name"] )
    with open( path, "w", newline="", encoding="utf8" ) as f:
        w = csv.writer( f, lineterminator="\n" )
        w.writerow( ["parent_taxon_id", "taxon_id", "rank_level", "leaf_class_id", "iconic_class_id",
                     "spatial_class_id", "geo_threshold", "name"] )
        for tid, ( parent, rank_level, name ) in nodes.items( ):
            level = int( rank_level ) if float( rank_level ).is_integer( ) else rank_level
            w.writerow( [parent, tid, level, leaf_of.get( tid, "" ), "", "", "", name.replace( ",", " " )] )
    return len( nodes )


def write_common_names( species, locales, path ):
    rows = [{"i": sp["id"], "l": "en", "n": sp["common"]} for sp in species if sp.get( "common" )]
    extra = [loc for loc in locales if loc != "en"]
    if extra:
        import requests
        s = requests.Session( )
        s.headers["User-Agent"] = "seek-model-pack-builder"
        ids = [sp["id"] for sp in species]
        for loc in extra:
            seek_locale = loc.replace( "-", "" )
            for i in range( 0, len( ids ), 30 ):
                t0 = time.time( )
                r = s.get( f"https://api.inaturalist.org/v1/taxa/{','.join( map( str, ids[i:i + 30] ) )}",
                           params={"locale": loc}, timeout=60 )
                if r.ok:
                    rows += [{"i": t["id"], "l": seek_locale, "n": t["preferred_common_name"]}
                             for t in r.json( )["results"] if t.get( "preferred_common_name" )]
                time.sleep( max( 0, 1.05 - ( time.time( ) - t0 ) ) )  # iNat asks for <= 1 request/second
                if i % 3000 == 0:
                    print( f"  names {loc}: {i}/{len( ids )}", flush=True )
    json.dump( rows, open( path, "w", encoding="utf8" ), ensure_ascii=False )
    return len( rows )


def build_model( species, taxa, args ):
    import torch
    import torch.nn.functional as F
    import open_clip

    device = args.device
    model, _, _ = open_clip.create_model_and_transforms( "hf-hub:imageomics/bioclip-2" )
    model.eval( ).to( device )

    if args.text_embeddings:
        text = np.load( args.text_embeddings ).astype( np.float32 )
        if args.text_ids:
            row = {int( t ): i for i, t in enumerate( json.load( open( args.text_ids ) ) )}
            missing = [sp["id"] for sp in species if sp["id"] not in row]
            assert not missing, f"{len( missing )} species have no text embedding"
            text = text[[row[sp["id"]] for sp in species]]
        else:
            assert len( text ) >= len( species ), "text embeddings don't cover the species list"
            text = text[:len( species )]
    else:
        tok = open_clip.get_tokenizer( "hf-hub:imageomics/bioclip-2" )
        prompts = [prompt( sp, taxa ) for sp in species]
        out = []
        with torch.no_grad( ):
            for i in range( 0, len( prompts ), 512 ):
                e = model.encode_text( tok( prompts[i:i + 512] ).to( device ) )
                out.append( F.normalize( e, dim=-1 ).float( ).cpu( ).numpy( ) )
                if i % 10240 == 0:
                    print( f"  text {i}/{len( prompts )}", flush=True )
        text = np.concatenate( out )
        np.save( os.path.join( args.out, "text_embeddings.npy" ), text.astype( np.float16 ) )

    log_count = np.log( np.array( [max( 1, sp["count"] ) for sp in species], dtype=np.float32 ) )

    class SeekBioclip( torch.nn.Module ):
        def __init__( self ):
            super( ).__init__( )
            self.visual = model.visual.float( ).cpu( )
            self.register_buffer( "head", torch.tensor( text.T * 100.0 ) )  # [D, N]
            self.register_buffer( "bias", torch.tensor( args.gamma * log_count ) )  # [N]
            self.register_buffer( "mean", torch.tensor( [0.48145466, 0.4578275, 0.40821073] ).view( 1, 3, 1, 1 ) )
            self.register_buffer( "std", torch.tensor( [0.26862954, 0.26130258, 0.27577711] ).view( 1, 3, 1, 1 ) )

        def forward( self, x ):
            # plugin buffer is [1, x(col), y(row), C]; the image is [1, C, row, col]
            x = x.permute( 0, 3, 2, 1 ) / 255.0
            x = F.interpolate( x, size=( 224, 224 ), mode="bilinear", align_corners=False )
            x = ( x - self.mean ) / self.std
            e = self.visual( x )
            e = e / e.norm( dim=-1, keepdim=True )
            return torch.softmax( e @ self.head + self.bias, dim=-1 )

    wrapper = SeekBioclip( ).eval( )
    sample = ( torch.rand( 1, 299, 299, 3 ) * 255, )
    torch.save( {"gamma": args.gamma}, os.path.join( args.out, "build_info.pt" ) )
    if args.export == "none":
        return wrapper
    import ai_edge_torch
    flags = {}
    if args.precision == "fp16":
        import tensorflow as tf
        flags = {"optimizations": [tf.lite.Optimize.DEFAULT], "target_spec": {"supported_types": [tf.float16]}}
    elif args.precision == "int8-weights":
        import tensorflow as tf
        flags = {"optimizations": [tf.lite.Optimize.DEFAULT]}
    print( f"converting to TFLite ({args.precision})", flush=True )
    edge = ai_edge_torch.convert( wrapper, sample, _ai_edge_converter_flags=flags ) if flags else \
        ai_edge_torch.convert( wrapper, sample )
    edge.export( os.path.join( args.out, "model.tflite" ) )
    return wrapper


def main( ):
    ap = argparse.ArgumentParser( description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter )
    ap.add_argument( "--out", required=True )
    ap.add_argument( "--species-json", default=os.path.join( HERE, "species.json" ),
                     help="from fetch_species.py" )
    ap.add_argument( "--taxa-csv", default=os.path.join( HERE, "taxa.csv" ) )
    ap.add_argument( "--species", type=int, default=100_000, help="keep the N most-observed species" )
    ap.add_argument( "--gamma", type=float, default=0.1,
                     help="popularity prior weight; 0.1 was best in the benchmark's cross-validation" )
    ap.add_argument( "--precision", choices=["fp32", "fp16", "int8-weights"], default="fp16" )
    ap.add_argument( "--export", choices=["tflite", "none"], default="tflite" )
    ap.add_argument( "--skip-model", action="store_true", help="only taxonomy, names and manifest" )
    ap.add_argument( "--text-embeddings", help="reuse a .npy of normalized text embeddings" )
    ap.add_argument( "--text-ids", help="taxon ids (.json list) for the rows of --text-embeddings; "
                                        "without it the rows must already be in species order" )
    ap.add_argument( "--locales", default="en", help="comma list of common-name locales, e.g. en,de,fr" )
    ap.add_argument( "--device", default="cuda", help="falls back to cpu when CUDA is unavailable" )
    ap.add_argument( "--pack-id", default=None )
    ap.add_argument( "--name", default=None )
    args = ap.parse_args( )
    try:
        import torch
        if args.device == "cuda" and not torch.cuda.is_available( ):
            args.device = "cpu"
    except ImportError:
        args.device = "cpu"

    os.makedirs( args.out, exist_ok=True )
    taxa = load_taxa( args.taxa_csv )
    species = species_list( args.species_json, args.species )
    print( f"{len( species )} species", flush=True )
    n_nodes = write_taxonomy( species, taxa, os.path.join( args.out, "taxonomy.csv" ) )
    n_names = write_common_names( species, [x.strip( ) for x in args.locales.split( "," ) if x.strip( )],
                                  os.path.join( args.out, "common_names.json" ) )
    print( f"taxonomy: {n_nodes} nodes; common names: {n_names}", flush=True )
    if not args.skip_model:
        build_model( species, taxa, args )
    pack_id = args.pack_id or f"bioclip2-{len( species ) // 1000}k"
    manifest = {
        "id": pack_id,
        "name": args.name or "BioCLIP 2",
        "version": "2.13",
        "revision": date.today( ).isoformat( ),
        "platform": "android",
        "taxa": len( species ),
        "files": {"model": "model.tflite", "taxonomy": "taxonomy.csv", "common_names": "common_names.json"},
        "source": {"model": "imageomics/bioclip-2 (MIT)", "gamma": args.gamma, "precision": args.precision},
    }
    json.dump( manifest, open( os.path.join( args.out, "manifest.json" ), "w" ), indent=2 )
    print( f"pack written to {args.out}", flush=True )


if __name__ == "__main__":
    main( )
